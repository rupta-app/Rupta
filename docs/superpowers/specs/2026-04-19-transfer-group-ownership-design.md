# Transfer Group Ownership Flow — Design

**Date:** 2026-04-19
**Source:** Notion card "Transfer group ownership flow" (High priority)
**Status:** Approved, ready for implementation plan

## Problem

Today, groups have a singleton `owner` role enforced by RLS (owner cannot self-delete their membership), but there is no way to transfer ownership. The "Leave group" button in settings is shown to the owner, yet silently fails when tapped. There is also no record of who originally created the group separate from the current owner.

## Goal

Implement a WhatsApp-style ownership flow:

- **Owner** — singleton, transferable, cannot leave (must transfer or delete the group first).
- **Admin** — unlimited count, can leave freely.
- **Member** — regular.
- **Creator** — legacy display-only pointer (who originally created the group). Not a role.

## Role Powers

| Action | Owner | Admin | Member |
|---|:---:|:---:|:---:|
| Delete group | ✓ | | |
| Transfer ownership | ✓ | | |
| Remove the owner | | | |
| Remove other admins | ✓ | ✓ | |
| Remove members | ✓ | ✓ | |
| Promote member → admin | ✓ | ✓ | |
| Demote admin → member | ✓ | ✓ | |
| Edit group (name, description, photo, privacy, quest rule) | ✓ | ✓ | |
| Approve join / group-quest requests | ✓ | ✓ | |
| Leave group | ✗ (must transfer first) | ✓ | ✓ |

Admins can remove other admins but **cannot** remove the owner. The owner is removable only via transfer.

## Data Model

Add one column to `public.groups`:

```sql
alter table public.groups
  add column created_by uuid references public.profiles(id) on delete set null;

update public.groups set created_by = owner_id where created_by is null;
```

- `created_by` is written once at creation (extend the existing `add_group_owner_member` trigger to populate it) and never updated.
- `owner_id` continues to mean "current owner" and is mutated by the transfer RPC.
- `group_members.role` enum is unchanged: `'owner' | 'admin' | 'member'`.

## Transfer RPC

Atomic SECURITY DEFINER RPC — the only code path allowed to write `role = 'owner'`:

```sql
create or replace function public.transfer_group_ownership(
  p_group_id uuid,
  p_new_owner_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null then raise exception 'not_authenticated'; end if;
  if not exists (
    select 1 from public.groups
    where id = p_group_id and owner_id = v_caller
  ) then raise exception 'not_owner'; end if;
  if p_new_owner_id = v_caller then raise exception 'cannot_transfer_to_self'; end if;
  if not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_new_owner_id
  ) then raise exception 'target_not_member'; end if;

  update public.group_members
    set role = 'admin'
    where group_id = p_group_id and user_id = v_caller;

  update public.group_members
    set role = 'owner'
    where group_id = p_group_id and user_id = p_new_owner_id;

  update public.groups
    set owner_id = p_new_owner_id
    where id = p_group_id;

  -- Notify new owner
  insert into public.notifications (user_id, type, group_id, actor_id)
  values (p_new_owner_id, 'group_ownership_transferred', p_group_id, v_caller);
end;
$$;

grant execute on function public.transfer_group_ownership(uuid, uuid) to authenticated;
```

Rejected alternatives:

- Client-side three-step UPDATE (members table × 2 + groups table × 1): partial-state risk if any step fails or RLS rejects one write. The RPC is atomic.
- A trigger-based approach: harder to reason about which UPDATE is legitimate vs. rogue.

## RLS Changes

**`group_members` DELETE policy** — block any deletion of an `owner` row and allow admins to remove admins/members:

```sql
drop policy if exists "members can delete own, admins can delete non-owner"
  on public.group_members;

create policy "group_members_delete" on public.group_members
for delete to authenticated
using (
  role <> 'owner'
  and (
    user_id = auth.uid()
    or public.is_group_admin(group_id, auth.uid())
  )
);
```

**`group_members` UPDATE role policy** — keep admin↔member flips, prevent writing `'owner'` (handled by the RPC):

```sql
create policy "group_members_update_role" on public.group_members
for update to authenticated
using (
  public.is_group_admin(group_id, auth.uid())
  and role <> 'owner'
)
with check (
  role in ('admin', 'member')
);
```

Only the RPC (SECURITY DEFINER) can write `role = 'owner'`.

## Services & Hooks

**`services/groups.ts`**

```typescript
export async function transferGroupOwnership(groupId: string, newOwnerId: string) {
  const { error } = await supabase.rpc('transfer_group_ownership', {
    p_group_id: groupId,
    p_new_owner_id: newOwnerId,
  });
  if (error) throw error;
}
```

**`hooks/useGroups.ts`** — `useTransferGroupOwnership(groupId)`:

- On success invalidate: `['group', groupId]`, `['group-members', groupId]`, `['my-group-permissions', groupId, userId]`, `['notifications', newOwnerId]`.
- Show success toast: "Ownership transferred to @username."

`leaveGroup` / `useLeaveGroup` are unchanged — the UI simply never exposes the Leave action to owners.

## UI Changes

### `app/(main)/group/[id]/people.tsx`

In the action menu shown to the current **owner** on another member's row, add **"Make owner"** (above "Remove from group"). Tap opens a confirm dialog:
- Title: *"Transfer ownership to @username?"*
- Body: *"They'll become the group owner. You'll become an admin."*
- Primary action: "Transfer" (destructive/warning styling).

Admins viewing other admins/members: existing "Demote to member" + "Remove from group" remain. No "Make owner" option (owner-only).

Owner row: no action menu, unchanged.

### `app/(main)/group/[id]/settings.tsx`

When `isOwner`:

- **Transfer ownership** button (above **Delete group**) — opens the member-picker sheet.
- Replace the silently-broken "Leave group" row with an explainer row: *"You're the group owner. Transfer ownership or delete the group to leave."* — not a tap target.

When admin/member: unchanged.

### New component: `components/group/TransferOwnershipSheet.tsx`

Bottom sheet listing all non-owner members with avatar + username + role badge + radio select + confirm button.

- **Settings entry point** — opens with no pre-selection; user picks a member, then a confirm dialog.
- **People menu entry point** — skips the sheet, jumps straight to the confirm dialog for that specific user.

Both paths call `useTransferGroupOwnership`.

## i18n

Add under `groups` in both `i18n/en.ts` and `i18n/es.ts`:

```
makeOwner
makeOwnerConfirmTitle
makeOwnerConfirmBody
transferOwnership
transferOwnershipTitle
transferOwnershipHint
ownerCannotLeaveHint
transferSuccessToast
youAreNowOwnerNotification
```

Uruguayan voseo for `es` (*transferí*, *elegí*, *podés*).

`groups.memberOwner` already exists for the role badge.

## Notifications

New notification type: `group_ownership_transferred`.

- Recipient: the new owner.
- Actor: the previous owner.
- Payload: `group_id`.
- Rendered in `app/(main)/notifications` list and the bell badge: *"@username made you the owner of [Group Name]."*

Rendering is handled alongside existing notification types (join requests, group quest approvals) — the UI layer adds a new case in the notification-row switch.

## Out of Scope

- Multi-owner support (not requested; owner remains singleton).
- Reverting a transfer within a grace window (not requested).
- Admin-initiated transfer ("steal" ownership from an inactive owner) — transfer is owner-initiated only.
- Scheduled / automatic transfer on owner account deletion — current `on delete set null` / `on delete cascade` behavior on `groups.owner_id` is unchanged (separate concern).

## Risks

- **Migration safety on existing groups without a creator record** — backfilled from `owner_id` at migration time; accurate for today since ownership has never moved. After this feature ships, `created_by` stays pinned while `owner_id` drifts.
- **Concurrent transfer attempts** — guarded by the RPC's `owner_id = v_caller` check inside the transaction. A second caller will fail the check and raise.
- **Cached permissions UI lag** — mitigated by query-key invalidation on transfer success for both previous and new owner's `useMyGroupPermissions`.

## Acceptance Criteria

1. Owner can open group settings or People and transfer ownership to any existing member.
2. After transfer: new owner has owner role + `groups.owner_id` is updated; previous owner is now admin; new owner receives an in-app notification.
3. Owner attempting to leave via any UI path sees the explainer (no silent failure).
4. Admins can remove other admins but cannot remove the owner (RLS denies, UI hides the action).
5. `groups.created_by` survives ownership transfers and is displayed on the group detail screen ("Created by @username").
6. `tsc --noEmit` and existing tests pass; new migration applies cleanly to the linked Supabase Cloud project.
