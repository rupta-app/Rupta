import { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { DataTable } from '@/components/shared/DataTable';
import type { Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserCell } from '@/components/shared/UserCell';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { UserDetailSheet } from '@/components/users/UserDetailSheet';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchUsers } from '@/services/users';
import type { AdminProfile } from '@/services/users';
import { PAGE_SIZE } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

interface UsersFilters {
  search: string;
  status: string;
}

const statusTabs = [
  { value: '', label: 'All' },
  { value: 'normal', label: 'Normal' },
  { value: 'warned', label: 'Warned' },
  { value: 'flagged_cheater', label: 'Flagged' },
];

export function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<AdminProfile | null>(null);

  const fetcher = useCallback(
    (params: UsersFilters & { page: number; pageSize: number }) => fetchUsers(params),
    [],
  );

  const { data, total, loading, filters, page, setFilters, setPage, refetch } =
    useAsyncData<AdminProfile, UsersFilters>(fetcher, { search: '', status: '' }, PAGE_SIZE);

  const columns: Column<AdminProfile>[] = [
    {
      key: 'user',
      header: 'User',
      render: (row) => (
        <UserCell
          displayName={row.display_name}
          username={row.username}
          avatarUrl={row.avatar_url}
        />
      ),
    },
    {
      key: 'aura',
      header: 'AURA',
      className: 'w-24',
      render: (row) => (
        <span className="font-mono text-sm font-medium text-primary-light">
          {formatNumber(row.total_aura)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-32',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'admin',
      header: 'Admin',
      className: 'w-20',
      render: (row) =>
        row.is_admin ? <Badge variant="info">Admin</Badge> : null,
    },
    {
      key: 'plan',
      header: 'Plan',
      className: 'w-20',
      render: (row) => (
        <Badge variant={row.plan === 'pro' ? 'info' : 'muted'}>
          {row.plan === 'pro' ? 'Pro' : 'Free'}
        </Badge>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      className: 'w-32',
      render: (row) => (
        <span className="text-xs text-muted">
          {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage user accounts, status, and admin privileges"
        actions={
          <Button variant="ghost" size="sm" onClick={refetch}>
            <RefreshCw size={14} />
            Refresh
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-4">
        <SearchInput
          value={filters.search}
          onChange={(search) => setFilters({ ...filters, search })}
          placeholder="Search users…"
          className="w-72"
        />
        <Tabs
          tabs={statusTabs}
          value={filters.status}
          onChange={(status) => setFilters({ ...filters, status })}
        />
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        rowKey={(row) => row.id}
        onRowClick={(row) => setSelectedUser(row)}
        emptyTitle="No users found"
        emptyDescription="Try adjusting your search or filters"
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
      />

      <UserDetailSheet
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onUpdated={() => {
          refetch();
          setSelectedUser(null);
        }}
      />
    </div>
  );
}
