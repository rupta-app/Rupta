import { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { DataTable } from '@/components/shared/DataTable';
import type { Column } from '@/components/shared/DataTable';
import { UserCell } from '@/components/shared/UserCell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GroupDetailSheet } from '@/components/groups/GroupDetailSheet';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchGroups } from '@/services/groups';
import type { AdminGroup } from '@/services/groups';
import { PAGE_SIZE } from '@/lib/constants';
import { imageUrl } from '@/lib/mediaUrls';

interface GroupsFilters {
  search: string;
}

export function GroupsPage() {
  const [selected, setSelected] = useState<AdminGroup | null>(null);

  const fetcher = useCallback(
    (params: GroupsFilters & { page: number; pageSize: number }) => fetchGroups(params),
    [],
  );

  const { data, total, loading, filters, page, setFilters, setPage, refetch } =
    useAsyncData<AdminGroup, GroupsFilters>(fetcher, { search: '' }, PAGE_SIZE);

  const columns: Column<AdminGroup>[] = [
    {
      key: 'name',
      header: 'Group',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.avatar_url ? (
            <img src={imageUrl(row.avatar_url, 'avatar')} alt="" className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary-light">
              {row.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{row.name}</p>
            {row.description && (
              <p className="truncate text-xs text-muted-foreground max-w-48">{row.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (row) => (
        <UserCell
          displayName={row.owner?.display_name ?? null}
          username={row.owner?.username ?? null}
          avatarUrl={row.owner?.avatar_url ?? null}
        />
      ),
    },
    {
      key: 'members',
      header: 'Members',
      className: 'w-24',
      render: (row) => (
        <span className="text-sm font-medium text-foreground">{row.member_count}</span>
      ),
    },
    {
      key: 'quest_rule',
      header: 'Quest Rule',
      className: 'w-32',
      render: (row) => (
        <Badge variant="muted">
          {(row.settings?.quest_creation_rule ?? 'anyone').replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'public',
      header: 'Public',
      className: 'w-20',
      render: (row) => (
        <Badge variant={row.settings?.is_public ? 'success' : 'muted'}>
          {row.settings?.is_public ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      key: 'date',
      header: 'Created',
      className: 'w-28',
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Groups"
        description="Manage user-created groups, settings, and members"
        actions={
          <Button variant="ghost" size="sm" onClick={refetch}>
            <RefreshCw size={14} />
            Refresh
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput
          value={filters.search}
          onChange={(search) => setFilters({ search })}
          placeholder="Search groups…"
          className="w-72"
        />
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        rowKey={(row) => row.id}
        onRowClick={(row) => setSelected(row)}
        emptyTitle="No groups found"
        emptyDescription="Try adjusting your search"
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
      />

      <GroupDetailSheet
        group={selected}
        onClose={() => setSelected(null)}
        onUpdated={() => {
          refetch();
          setSelected(null);
        }}
      />
    </div>
  );
}
