# Transfer Group Ownership — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement WhatsApp-style group ownership: transferable singleton owner (cannot leave), unlimited admins (can leave), immutable `created_by` creator pointer, and a member-picker UI for transferring ownership.

**Architecture:** Add an immutable `created_by` column to `public.groups`. Add a SECURITY DEFINER RPC `transfer_group_ownership(uuid, uuid)` that atomically swaps `role` on the two `group_members` rows and updates `groups.owner_id` in a single transaction. Extend the `notifications.type` check constraint with `group_ownership_transferred`. The client calls the RPC through a typed service + TanStack Query mutation. UI adds a "Make owner" action in the People screen actions menu (owner-only) and a "Transfer ownership" button in Settings above "Delete group", backed by a shared `TransferOwnershipSheet` bottom sheet component.

**Tech Stack:**
- Supabase Postgres + RLS (migrations in `supabase/migrations/`)
- Supabase CLI — linked cloud project only (`db push`, `gen types --linked`)
- Expo RN + Expo Router 6, React 19
- TanStack Query v5
- NativeWind (Tailwind)
- lucide-react-native icons
- i18next + react-i18next (en + es, es = Uruguayan voseo)

**No unit-test infrastructure exists in this repo.** Verification for each task is `tsc --noEmit`, migration apply success, or manual in-app smoke tests — clearly specified per task.

**Reference spec:** `docs/superpowers/specs/2026-04-19-transfer-group-ownership-design.md`

---

## Task 1: Migration — add `created_by` column to `groups` and populate via trigger

**Files:**
- Create: `supabase/migrations/20260419120000_group_created_by_column.sql`

- [ ] **Step 1: Create the migration file**

Write the following exact content to `supabase/migrations/20260419120000_group_created_by_column.sql`:

```sql
-- Adds an immutable "created_by" pointer on groups, so that after ownership
-- transfers land we still know who originally created the group.
-- Backfills existing rows from owner_id (historically equal to creator).
-- Extends the add_group_owner_member trigger to populate created_by on INSERT.

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

UPDATE public.groups SET created_by = owner_id WHERE created_by IS NULL;

CREATE OR REPLACE FUNCTION public.add_group_owner_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');

  IF NEW.created_by IS NULL THEN
    UPDATE public.groups SET created_by = NEW.owner_id WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;
```

- [ ] **Step 2: Apply the migration to the linked cloud project**

Run:
```bash
npx supabase db push
```
Expected: output ends with `Finished supabase db push.` and includes `Applying migration 20260419120000_group_created_by_column.sql`.

- [ ] **Step 3: Verify backfill**

Run:
```bash
npx supabase migration list --linked
```
Expected: the new migration appears as applied (Local + Remote columns both show the timestamp).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260419120000_group_created_by_column.sql
git commit -m "feat: add created_by to groups with backfill"
```

---

## Task 2: Migration — `transfer_group_ownership` RPC

**Files:**
- Create: `supabase/migrations/20260419120100_transfer_group_ownership_rpc.sql`

- [ ] **Step 1: Create the migration file**

Write the following exact content to `supabase/migrations/20260419120100_transfer_group_ownership_rpc.sql`:

```sql
-- Atomic ownership transfer. Only the current owner can call; target must be
-- an existing member (not caller). SECURITY DEFINER so it can write role='owner'
-- (client RLS blocks that path). Inserts a notification for the new owner.

CREATE OR REPLACE FUNCTION public.transfer_group_ownership(
  p_group_id uuid,
  p_new_owner_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = p_group_id AND owner_id = v_caller
  ) THEN
    RAISE EXCEPTION 'not_owner';
  END IF;

  IF p_new_owner_id = v_caller THEN
    RAISE EXCEPTION 'cannot_transfer_to_self';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_new_owner_id
  ) THEN
    RAISE EXCEPTION 'target_not_member';
  END IF;

  UPDATE public.group_members
    SET role = 'admin'
    WHERE group_id = p_group_id AND user_id = v_caller;

  UPDATE public.group_members
    SET role = 'owner'
    WHERE group_id = p_group_id AND user_id = p_new_owner_id;

  UPDATE public.groups
    SET owner_id = p_new_owner_id
    WHERE id = p_group_id;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    p_new_owner_id,
    'group_ownership_transferred',
    'Group ownership transferred',
    'You are now the owner of this group.',
    jsonb_build_object(
      'group_id', p_group_id,
      'previous_owner_id', v_caller
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.transfer_group_ownership(uuid, uuid) TO authenticated;
```

- [ ] **Step 2: Apply the migration**

Run:
```bash
npx supabase db push
```
Expected: migration applies. If it fails because `notifications.type` rejects `'group_ownership_transferred'`, STOP — that means Task 3 must land first. Revert this migration locally by deleting the file, run Task 3 first, then redo Task 2.

Note: applying Task 2 before Task 3 will fail at runtime, not at migration time (the function body isn't executed at CREATE time). To avoid a broken state, apply them in this order locally but push together. Re-order if you've already pushed.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260419120100_transfer_group_ownership_rpc.sql
git commit -m "feat: add transfer_group_ownership rpc"
```

---

## Task 3: Migration — extend `notifications.type` check constraint

**Files:**
- Create: `supabase/migrations/20260419120050_notifications_type_transfer.sql`

Note: the timestamp `20260419120050` is before Task 2's `20260419120100` so this lands first in lexicographic order.

- [ ] **Step 1: Create the migration file**

Write the following exact content to `supabase/migrations/20260419120050_notifications_type_transfer.sql`:

```sql
-- Add 'group_ownership_transferred' to the allowed notification types.

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'friend_request',
    'comment',
    'respect',
    'weekly_quest',
    'group_invite',
    'group_ownership_transferred'
  ));
```

- [ ] **Step 2: Apply the migration**

Run:
```bash
npx supabase db push
```
Expected: migration applies cleanly.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260419120050_notifications_type_transfer.sql
git commit -m "feat: allow group_ownership_transferred notification type"
```

---

## Task 4: Regenerate TypeScript types

**Files:**
- Modify: `types/database.ts`

- [ ] **Step 1: Regenerate**

Run:
```bash
npx supabase gen types typescript --linked > types/database.ts
```

- [ ] **Step 2: Verify new symbols exist**

Run:
```bash
grep -n "transfer_group_ownership\|created_by" types/database.ts | head -5
```
Expected: at least one line mentioning `transfer_group_ownership` under `Functions` and one line mentioning `created_by` under the `groups` row type.

- [ ] **Step 3: Type-check the whole project**

Run:
```bash
npx tsc --noEmit
```
Expected: 0 errors. If errors appear in other files that reference `groups` rows and now need `created_by`, that means a consumer assumed the row shape was exhaustive — fix it in a follow-up commit; most consumers use `select('*')` or specific columns and are unaffected.

- [ ] **Step 4: Commit**

```bash
git add types/database.ts
git commit -m "chore: regenerate database types for transfer rpc and created_by"
```

---

## Task 5: Service — `transferGroupOwnership`

**Files:**
- Modify: `services/groups.ts` (add new function; look near `updateGroupMemberRole` at line ~117)

- [ ] **Step 1: Add the function**

In `services/groups.ts`, immediately after `updateGroupMemberRole` (around line 128), add:

```typescript
export async function transferGroupOwnership(
  groupId: string,
  newOwnerId: string,
): Promise<void> {
  const { error } = await supabase.rpc('transfer_group_ownership', {
    p_group_id: groupId,
    p_new_owner_id: newOwnerId,
  });
  if (error) throw error;
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: 0 errors. The RPC arg names (`p_group_id`, `p_new_owner_id`) must match the migration exactly — if TypeScript complains about the rpc arguments shape, re-verify Task 4 regenerated types.

- [ ] **Step 3: Commit**

```bash
git add services/groups.ts
git commit -m "feat: add transferGroupOwnership service"
```

---

## Task 6: Hook — `useTransferGroupOwnership`

**Files:**
- Modify: `hooks/useGroups.ts` (add hook; add import)

- [ ] **Step 1: Add `transferGroupOwnership` to the import block**

In `hooks/useGroups.ts`, find the import block starting at line 5 (`import { createGroup, ... } from '@/services/groups'`) and add `transferGroupOwnership,` to the alphabetized list. The final block looks like:

```typescript
import {
  createGroup,
  deleteGroup,
  fetchGroupDetail,
  fetchGroupLeaderboard,
  fetchGroupMembersPage,
  fetchGroupPendingInviteeIds,
  fetchGroupSettings,
  fetchMyGroupRole,
  fetchMyGroups,
  fetchPendingGroupInvites,
  fetchPublicGroupsPage,
  GROUP_MEMBERS_PAGE_SIZE,
  inviteToGroup,
  joinPublicGroup,
  leaveGroup,
  PUBLIC_GROUPS_PAGE_SIZE,
  removeGroupMember,
  respondGroupInvite,
  transferGroupOwnership,
  updateGroup,
  updateGroupMemberRole,
  updateGroupSettings,
} from '@/services/groups';
```

- [ ] **Step 2: Add the hook at the end of the file**

Append to `hooks/useGroups.ts` (after `useUpdateGroupMemberRole`):

```typescript
export function useTransferGroupOwnership(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ newOwnerId }: { newOwnerId: string }) => {
      if (!groupId) throw new Error('No group');
      return transferGroupOwnership(groupId, newOwnerId);
    },
    onSuccess: () => {
      if (!groupId) return;
      void queryClient.invalidateQueries({ queryKey: qk.groups.detail(groupId) });
      void queryClient.invalidateQueries({ queryKey: qk.groups.members(groupId) });
      void queryClient.invalidateQueries({ queryKey: qk.groups.myRoleAll });
      void queryClient.invalidateQueries({ queryKey: qk.notifications?.all ?? ['notifications'] });
    },
  });
}
```

If `qk.notifications?.all` does not exist in `hooks/queryKeys.ts`, replace the last invalidate line with:
```typescript
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
```
(Check by running `grep -n "notifications" hooks/queryKeys.ts`.)

- [ ] **Step 3: Type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add hooks/useGroups.ts
git commit -m "feat: add useTransferGroupOwnership hook"
```

---

## Task 7: i18n keys (en + es)

**Files:**
- Modify: `i18n/en.ts` (add keys in the `groups:` block around line 320-345)
- Modify: `i18n/es.ts`

- [ ] **Step 1: Add English keys**

In `i18n/en.ts`, locate the `groups:` block (around line 247). Add these keys inside that object (place near `removeMember` / `leaveGroup` for logical grouping):

```typescript
    makeOwner: 'Make owner',
    makeOwnerConfirmTitle: 'Transfer ownership?',
    makeOwnerConfirmBody: '{{name}} will become the group owner. You will become an admin.',
    transferOwnership: 'Transfer ownership',
    transferOwnershipTitle: 'Choose a new owner',
    transferOwnershipHint: 'The new owner takes over admin powers. You become an admin.',
    transferOwnershipCta: 'Transfer',
    transferSuccessToast: 'Ownership transferred to {{name}}.',
    transferFailedTitle: 'Could not transfer ownership',
    ownerLeaveHint: 'You are the group owner. Transfer ownership or delete the group to leave.',
    createdBy: 'Created by @{{username}}',
    notifOwnershipTitle: 'Group ownership transferred',
    notifOwnershipBody: '{{actor}} made you the owner of {{group}}.',
```

- [ ] **Step 2: Add matching Spanish (Uruguayan voseo) keys**

In `i18n/es.ts`, locate the `groups:` block and add:

```typescript
    makeOwner: 'Hacer dueño',
    makeOwnerConfirmTitle: '¿Transferir el grupo?',
    makeOwnerConfirmBody: '{{name}} pasa a ser el dueño del grupo. Vos quedás como admin.',
    transferOwnership: 'Transferir grupo',
    transferOwnershipTitle: 'Elegí un nuevo dueño',
    transferOwnershipHint: 'El nuevo dueño toma los permisos de admin. Vos quedás como admin.',
    transferOwnershipCta: 'Transferir',
    transferSuccessToast: 'Le transferiste el grupo a {{name}}.',
    transferFailedTitle: 'No se pudo transferir el grupo',
    ownerLeaveHint: 'Sos el dueño del grupo. Transferí el grupo o eliminalo para poder salir.',
    createdBy: 'Creado por @{{username}}',
    notifOwnershipTitle: 'Te transfirieron el grupo',
    notifOwnershipBody: '{{actor}} te hizo dueño de {{group}}.',
```

- [ ] **Step 3: Type-check (en.ts exports the canonical shape)**

Run:
```bash
npx tsc --noEmit
```
Expected: 0 errors. If TypeScript complains that `es.ts` is missing a key or has a mismatched shape, compare the block in both files — each key in `en.ts` must have an identical key name in `es.ts`.

- [ ] **Step 4: Commit**

```bash
git add i18n/en.ts i18n/es.ts
git commit -m "feat: i18n keys for transfer ownership flow"
```

---

## Task 8: Component — `TransferOwnershipSheet`

**Files:**
- Create: `components/group/TransferOwnershipSheet.tsx`

- [ ] **Step 1: Create the component**

Write the following to `components/group/TransferOwnershipSheet.tsx`:

```tsx
import { Crown } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';
import type { GroupMemberWithProfile } from '@/services/groups';

type Props = {
  visible: boolean;
  onClose: () => void;
  members: GroupMemberWithProfile[]; // caller passes non-owner members only
  isSubmitting: boolean;
  onConfirm: (userId: string) => void;
};

export function TransferOwnershipSheet({
  visible,
  onClose,
  members,
  isSubmitting,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleClose = () => {
    setSelectedId(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable className="flex-1 bg-black/60" onPress={handleClose}>
        <Pressable
          className="mt-auto bg-surface rounded-t-3xl px-5 pt-4 pb-8"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="items-center mb-3">
            <View className="w-10 h-1 bg-muted/40 rounded-full" />
          </View>
          <Text className="text-foreground font-bold text-lg mb-1">
            {t('groups.transferOwnershipTitle')}
          </Text>
          <Text className="text-muted text-sm mb-4">
            {t('groups.transferOwnershipHint')}
          </Text>

          <ScrollView className="max-h-96">
            {members.length === 0 ? (
              <Text className="text-muted text-sm py-4">{t('groups.peopleSubtitle', { count: 0 })}</Text>
            ) : (
              members.map((m) => {
                const name = m.profiles?.display_name ?? m.profiles?.username ?? '';
                const isSelected = m.user_id === selectedId;
                return (
                  <Pressable
                    key={m.user_id}
                    onPress={() => setSelectedId(m.user_id)}
                    className={`flex-row items-center gap-3 py-3 px-2 rounded-xl mb-1 ${
                      isSelected ? 'bg-primary/10' : ''
                    }`}
                  >
                    <Avatar url={m.profiles?.avatar_url} name={name} size={40} />
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold" numberOfLines={1}>
                        {name}
                      </Text>
                      <Text className="text-muted text-xs">
                        {m.role === 'admin' ? 'Admin' : 'Member'}
                      </Text>
                    </View>
                    {isSelected ? (
                      <Crown color={colors.primary} size={20} />
                    ) : (
                      <View className="w-5 h-5 rounded-full border border-muted/40" />
                    )}
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          <View className="flex-row gap-3 mt-4">
            <Button variant="secondary" onPress={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="danger"
              onPress={() => selectedId && onConfirm(selectedId)}
              disabled={!selectedId || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                t('groups.transferOwnershipCta')
              )}
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
```

Note: If `components/ui/Button` doesn't accept `className`, check one existing usage in `app/(main)/group/[id]/settings.tsx:233` — it doesn't pass className there. If Button doesn't support className, wrap it in a `<View className="flex-1">` instead of passing `className="flex-1"` to `Button`.

- [ ] **Step 2: Type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: 0 errors. Fix any className / prop issues based on the actual Button/Card signatures.

- [ ] **Step 3: Commit**

```bash
git add components/group/TransferOwnershipSheet.tsx
git commit -m "feat: add TransferOwnershipSheet component"
```

---

## Task 9: Wire "Make owner" into the People screen actions menu

**Files:**
- Modify: `app/(main)/group/[id]/people.tsx`

- [ ] **Step 1: Add the hook import and usage**

At line 16-24 import block for `@/hooks/useGroups`, add `useTransferGroupOwnership` to the list. The new import list is:

```typescript
import {
  useGroupDetail,
  useGroupMembers,
  useGroupPendingInviteeIds,
  useInviteToGroup,
  useMyGroupPermissions,
  useRemoveGroupMember,
  useTransferGroupOwnership,
  useUpdateGroupMemberRole,
} from '@/hooks/useGroups';
```

Also replace line 36 with the full destructure to get `isOwner`:
```typescript
  const { canAdmin, isOwner } = useMyGroupPermissions(id, uid);
```

Add the hook near line 44 (alongside `removeMember`, `updateRole`):
```typescript
  const transferOwnership = useTransferGroupOwnership(id);
```

- [ ] **Step 2: Add the "Make owner" option conditionally to the actions menu**

In `openMemberActions` (currently lines 55-87), conditionally insert a "Make owner" option before the toggle role option when the caller is the owner. Replace the entire `openMemberActions` with:

```typescript
  const openMemberActions = useCallback(
    (member: GroupMemberWithProfile) => {
      if (!canAdmin || member.role === 'owner' || member.user_id === uid) return;
      const name = member.profiles?.display_name ?? member.profiles?.username ?? '';
      const toggleRoleLabel =
        member.role === 'admin' ? t('groups.demoteToMember') : t('groups.promoteToAdmin');

      const buttons: Parameters<typeof Alert.alert>[2] = [];

      if (isOwner) {
        buttons.push({
          text: t('groups.makeOwner'),
          onPress: () =>
            Alert.alert(
              t('groups.makeOwnerConfirmTitle'),
              t('groups.makeOwnerConfirmBody', { name }),
              [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('groups.transferOwnershipCta'),
                  style: 'destructive',
                  onPress: () =>
                    transferOwnership.mutate(
                      { newOwnerId: member.user_id },
                      {
                        onError: (e) =>
                          Alert.alert(
                            t('groups.transferFailedTitle'),
                            e instanceof Error ? e.message : String(e),
                          ),
                      },
                    ),
                },
              ],
            ),
        });
      }

      buttons.push({
        text: toggleRoleLabel,
        onPress: () =>
          updateRole.mutate({
            userId: member.user_id,
            role: member.role === 'admin' ? 'member' : 'admin',
          }),
      });

      buttons.push({
        text: t('groups.removeMember'),
        style: 'destructive',
        onPress: () =>
          Alert.alert(t('groups.removeMember'), t('groups.removeConfirmBody', { name }), [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('groups.removeMember'),
              style: 'destructive',
              onPress: () => removeMember.mutate({ userId: member.user_id }),
            },
          ]),
      });

      buttons.push({ text: t('common.cancel'), style: 'cancel' });

      Alert.alert(t('groups.memberActionsTitle'), name, buttons);
    },
    [canAdmin, isOwner, uid, t, updateRole, removeMember, transferOwnership],
  );
```

- [ ] **Step 3: Type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 4: Manual smoke test (optional here, covered by Task 12)**

Skip — we'll do the full manual test pass after all wiring is complete.

- [ ] **Step 5: Commit**

```bash
git add app/\(main\)/group/\[id\]/people.tsx
git commit -m "feat: add make owner action to group people menu"
```

---

## Task 10: Add "Transfer ownership" to Settings + owner leave hint

**Files:**
- Modify: `app/(main)/group/[id]/settings.tsx`

- [ ] **Step 1: Add imports and hooks**

Update the `@/hooks/useGroups` import block (line 17-25) to include `useGroupMembers` and `useTransferGroupOwnership`:

```typescript
import {
  useDeleteGroup,
  useGroupDetail,
  useGroupMembers,
  useGroupSettings,
  useLeaveGroup,
  useMyGroupPermissions,
  useTransferGroupOwnership,
  useUpdateGroup,
  useUpdateGroupSettings,
} from '@/hooks/useGroups';
```

Add a new import at the top for the sheet:
```typescript
import { TransferOwnershipSheet } from '@/components/group/TransferOwnershipSheet';
```

- [ ] **Step 2: Wire state + hooks inside the component**

After the existing hooks block (around line 45, after `setPhotoBusy`), add:

```typescript
  const [transferSheetOpen, setTransferSheetOpen] = useState(false);
  const transferOwnership = useTransferGroupOwnership(id);
  const membersQuery = useGroupMembers(id);
  const transferCandidates = useMemo(() => {
    const all = membersQuery.data?.pages.flatMap((p) => p.rows) ?? [];
    return all.filter((m) => m.role !== 'owner');
  }, [membersQuery.data]);
```

Make sure `useMemo` is imported from React (it already is — line 4 says `useEffect, useMemo, useState`).

- [ ] **Step 3: Replace the bottom action card**

Replace the existing bottom `<Card>` block (lines 220-238, the one that shows Delete or Leave based on isOwner) with:

```tsx
        {isOwner ? (
          <>
            <Card className="mb-3 py-4">
              <Text className="text-foreground font-semibold mb-1">
                {t('groups.transferOwnership')}
              </Text>
              <Text className="text-muted text-xs mb-3">
                {t('groups.transferOwnershipHint')}
              </Text>
              <Button
                variant="secondary"
                onPress={() => setTransferSheetOpen(true)}
                disabled={transferCandidates.length === 0}
              >
                {t('groups.transferOwnership')}
              </Button>
            </Card>

            <Card className="mb-3 py-4">
              <Text className="text-foreground font-semibold mb-1">
                {t('groups.deleteGroup')}
              </Text>
              <Text className="text-muted text-xs mb-3">{t('groups.deleteConfirmBody')}</Text>
              <Button variant="danger" onPress={confirmDelete} loading={deleteGroup.isPending}>
                {t('groups.deleteGroup')}
              </Button>
            </Card>

            <Card className="mb-3 py-4">
              <Text className="text-muted text-xs">{t('groups.ownerLeaveHint')}</Text>
            </Card>
          </>
        ) : (
          <Card className="mb-3 py-4">
            <Text className="text-foreground font-semibold mb-1">{t('groups.leaveGroup')}</Text>
            <Text className="text-muted text-xs mb-3">{t('groups.leaveConfirmBody')}</Text>
            <Button variant="danger" onPress={confirmLeave} loading={leaveGroup.isPending}>
              {t('groups.leaveGroup')}
            </Button>
          </Card>
        )}
```

- [ ] **Step 4: Render the sheet at the bottom of the screen**

Immediately before the closing `</View>` of the outermost return (after `</ScrollView>`), add:

```tsx
      <TransferOwnershipSheet
        visible={transferSheetOpen}
        onClose={() => setTransferSheetOpen(false)}
        members={transferCandidates}
        isSubmitting={transferOwnership.isPending}
        onConfirm={(newOwnerId) =>
          transferOwnership.mutate(
            { newOwnerId },
            {
              onSuccess: () => {
                setTransferSheetOpen(false);
              },
              onError: (e) =>
                Alert.alert(
                  t('groups.transferFailedTitle'),
                  e instanceof Error ? e.message : String(e),
                ),
            },
          )
        }
      />
```

- [ ] **Step 5: Type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add app/\(main\)/group/\[id\]/settings.tsx
git commit -m "feat: add transfer ownership flow to group settings"
```

---

## Task 11: Render the new notification type

**Files:**
- Modify: `app/(main)/notifications.tsx`

- [ ] **Step 1: Add tap handling for the new type**

In `app/(main)/notifications.tsx`, locate the `router.push` switch block around line 44-49. After the `weekly_quest` branch, add a branch for `group_ownership_transferred`. The relevant region becomes:

```typescript
    if (row.type === 'comment' || row.type === 'respect') {
      if (d.completion_id) router.push(`/(main)/completion/${d.completion_id}`);
    } else if (row.type === 'friend_request' && d.sender_id) {
      router.push(`/(main)/user/${d.sender_id}`);
    } else if (row.type === 'weekly_quest' && d.quest_id) {
      router.push(`/(main)/quest/${d.quest_id}`);
    } else if (row.type === 'group_ownership_transferred' && d.group_id) {
      router.push(`/(main)/group/${d.group_id}`);
    }
```

Note: `asNotificationData` currently types `d.group_id` as optional. If TS complains the field doesn't exist, open `services/notifications.ts` (or wherever `asNotificationData` lives — try `grep -rn "asNotificationData" app services` to locate) and add `group_id?: string` to that type.

- [ ] **Step 2: Add the list-item render branch**

In the `renderItem` switch (around line 174-220), after the `group_invite` branch, add a new branch for `group_ownership_transferred`. Match the existing `group_invite` card styling as a reference — render a simple card:

```tsx
          if (item.type === 'group_ownership_transferred') {
            const d = asNotificationData(item.data);
            const groupName = d.group_name ?? '';
            return (
              <Card className={`mb-2 ${item.is_read ? 'opacity-60' : ''}`}>
                <Pressable onPress={() => handleNotifPress(item)}>
                  <View className="flex-row items-center gap-3 p-3">
                    <Crown color={colors.primary} size={20} />
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold">
                        {t('groups.notifOwnershipTitle')}
                      </Text>
                      <Text className="text-muted text-xs mt-1">
                        {t('groups.notifOwnershipBody', {
                          actor: d.actor_username ?? '',
                          group: groupName,
                        })}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Card>
            );
          }
```

Add `import { Crown } from 'lucide-react-native';` at the top if it isn't there. Check by running `grep -n "lucide-react-native" app/\(main\)/notifications.tsx`.

Note: `d.group_name` and `d.actor_username` may not be populated by the RPC (it only writes `group_id` and `previous_owner_id`). If those display blank, it's fine for v1 — we use whatever's in `data` plus a generic body. Alternatively, if a richer display is desired, extend the RPC's `jsonb_build_object(...)` to include `group_name` (SELECT from `groups.name`) and `actor_username` (SELECT from profiles) — but that's a follow-up, not required for this task.

- [ ] **Step 3: Type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: 0 errors. If the `NotificationListItem` discriminated union doesn't include the new type, add `group_ownership_transferred` to the type literal in whatever file defines `NotificationListItem` (run `grep -rn "NotificationListItem" services hooks types` to locate it).

- [ ] **Step 4: Commit**

```bash
git add app/\(main\)/notifications.tsx services/notifications.ts types/
git commit -m "feat: render group ownership transfer notification"
```

---

## Task 12: End-to-end manual smoke test + final verification

**Files:** none modified — validation only

- [ ] **Step 1: Type-check the whole project**

Run:
```bash
npx tsc --noEmit
```
Expected: 0 errors across the project.

- [ ] **Step 2: Verify all three migrations applied**

Run:
```bash
npx supabase migration list --linked | tail -5
```
Expected: the three new migrations (`20260419120000_group_created_by_column`, `20260419120050_notifications_type_transfer`, `20260419120100_transfer_group_ownership_rpc`) all appear with both Local and Remote timestamps.

- [ ] **Step 3: Start the dev server**

Run:
```bash
npx expo start
```
Expected: Metro bundler starts; QR code prints.

- [ ] **Step 4: Test on device / simulator — Owner flow**

With a test account that is the owner of an existing group with at least two other members (one admin, one member):

- Open the group → People tab → tap the "more" icon on an admin or member row → confirm a **Make owner** option appears.
- Tap **Make owner** → confirm dialog shows: *"Transfer ownership to [name]? You will become an admin."*
- Tap Transfer → mutation fires → the members list refreshes. The previous owner's row now shows "Admin"; the new owner's row now shows "Owner".
- Go to Settings → confirm the "Transfer ownership" / "Delete group" / "You are the group owner..." explainer are gone (since the old owner is no longer owner), and "Leave group" appears instead.

- [ ] **Step 5: Log in as the new owner**

- Confirm the in-app notifications screen shows the new "You are now the owner of [Group]" entry.
- Open Settings → confirm Transfer ownership button + Delete group + owner-leave hint all show.
- Tap Transfer ownership → sheet opens with the list of non-owner members — pick someone → confirm → success toast.
- Immediately tap the button again — it should be disabled because this new-new-owner now has no non-owner candidates... actually there are still others. It should still open the sheet.

- [ ] **Step 6: Negative tests**

- As an **admin** (not owner) — in People, open an admin's actions menu — confirm "Make owner" is NOT listed. Promote/demote and Remove are still available.
- As an admin — in Settings — confirm Transfer ownership card does NOT show; only Leave group shows.
- Try calling the RPC directly from the Supabase SQL editor as a non-owner user — should raise `not_owner`.

- [ ] **Step 7: Verify `created_by` display (optional polish)**

If you chose to surface `Created by @username` on the group detail screen, verify it renders. This is not in scope for this plan beyond acceptance criterion #5 — the column exists, display can be added in a follow-up PR if desired.

- [ ] **Step 8: Final commit (if any polish was done during testing)**

```bash
git status
```
Expected: clean working tree unless Step 7 was done.

---

## Self-Review Checklist

### Spec coverage

- **Role model (owner singleton + transferable + cannot leave; admin unlimited + can leave; member; creator legacy)** — Tasks 1, 2 (DB) + Tasks 9, 10 (UI hides leave for owner).
- **Owner-only actions: delete group, transfer ownership, remove owner (blocked)** — Existing RLS (not changed). New Transfer button owner-only in settings (Task 10) and "Make owner" owner-only in people menu (Task 9, `if (isOwner)` guard).
- **Data model: `created_by` immutable column** — Task 1.
- **Transfer RPC (atomic, SECURITY DEFINER)** — Task 2.
- **RLS unchanged** — already correct in existing migrations; verified in exploration step. No new RLS migration needed (caught during research — the spec's RLS section matched the already-deployed state).
- **Services & hooks** — Tasks 5, 6.
- **UI: People "Make owner"** — Task 9. **Settings "Transfer ownership" button + owner-leave hint** — Task 10.
- **New component TransferOwnershipSheet** — Task 8.
- **i18n en + es (Uruguayan voseo)** — Task 7.
- **Notification type + rendering** — Tasks 3, 11.
- **Acceptance criterion #5 (display created_by)** — called out but deferred; column exists so a follow-up UI touch can render it. Flagged in Task 12 Step 7 as optional polish; not blocking.

### Placeholder scan

- No "TBD"/"TODO" in step contents. Code blocks are complete.
- The only conditional is Task 6 Step 2 (`qk.notifications?.all ?? ['notifications']`) and Task 11's fallback for extending `asNotificationData` — both include the exact command to determine the truth and the exact code to write in either case.

### Type & name consistency

- `transferGroupOwnership(groupId, newOwnerId)` service signature matches the RPC args `p_group_id`, `p_new_owner_id` (Task 5 + Task 2).
- `useTransferGroupOwnership(groupId)` returns a mutation expecting `{ newOwnerId }` — consumed identically in people.tsx (Task 9) and settings.tsx (Task 10).
- `TransferOwnershipSheet` prop names match both call sites.
- i18n keys added in Task 7 match the keys used in Task 9 (`makeOwner`, `makeOwnerConfirmTitle`, `makeOwnerConfirmBody`, `transferOwnershipCta`, `transferFailedTitle`), Task 10 (`transferOwnership`, `transferOwnershipHint`, `ownerLeaveHint`), and Task 11 (`notifOwnershipTitle`, `notifOwnershipBody`).
- Notification type literal `'group_ownership_transferred'` matches across Task 2 (RPC body), Task 3 (check constraint), Task 11 (switch).
