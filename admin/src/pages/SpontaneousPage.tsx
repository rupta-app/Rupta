import { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import type { Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserCell } from '@/components/shared/UserCell';
import { MediaThumbnail } from '@/components/shared/MediaPreview';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SpontaneousDetailSheet } from '@/components/spontaneous/SpontaneousDetailSheet';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchSpontaneousQuests } from '@/services/spontaneous';
import type { AdminSpontaneousQuest } from '@/services/spontaneous';
import { PAGE_SIZE } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';

interface SpontaneousFilters {
  reviewStatus: string;
}

const statusTabs = [
  { value: 'pending_catalog', label: 'Pending' },
  { value: '', label: 'All' },
  { value: 'promoted', label: 'Promoted' },
  { value: 'rejected', label: 'Rejected' },
];

export function SpontaneousPage() {
  const [selected, setSelected] = useState<AdminSpontaneousQuest | null>(null);

  const fetcher = useCallback(
    (params: SpontaneousFilters & { page: number; pageSize: number }) =>
      fetchSpontaneousQuests(params),
    [],
  );

  const { data, total, loading, filters, page, setFilters, setPage, refetch } =
    useAsyncData<AdminSpontaneousQuest, SpontaneousFilters>(
      fetcher,
      { reviewStatus: 'pending_catalog' },
      PAGE_SIZE,
    );

  const columns: Column<AdminSpontaneousQuest>[] = [
    {
      key: 'media',
      header: '',
      className: 'w-14',
      render: (row) => (
        <MediaThumbnail
          url={row.completion?.media?.[0]?.media_url ?? null}
        />
      ),
    },
    {
      key: 'creator',
      header: 'Creator',
      render: (row) => (
        <UserCell
          displayName={row.creator?.display_name ?? null}
          username={row.creator?.username ?? null}
          avatarUrl={row.creator?.avatar_url ?? null}
        />
      ),
    },
    {
      key: 'title',
      header: 'Quest Title',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{row.title_en ?? '—'}</p>
          {row.title_es && row.title_es !== row.title_en && (
            <p className="truncate text-xs text-muted">{row.title_es}</p>
          )}
        </div>
      ),
    },
    {
      key: 'suggested_aura',
      header: 'Suggested AURA',
      className: 'w-32',
      render: (row) => (
        <span className="font-mono text-sm font-medium text-respect">
          +{formatNumber(row.aura_reward)}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      className: 'w-28',
      render: (row) => (
        row.category ? <Badge variant="muted">{row.category}</Badge> : <span className="text-xs text-muted-foreground">—</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-32',
      render: (row) => <StatusBadge status={row.spontaneous_review_status} />,
    },
    {
      key: 'date',
      header: 'Submitted',
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
        title="Spontaneous Quests"
        description="Review user-created quests for promotion to the official catalog"
        actions={
          <Button variant="ghost" size="sm" onClick={refetch}>
            <RefreshCw size={14} />
            Refresh
          </Button>
        }
      />

      <div className="mb-4">
        <Tabs
          tabs={statusTabs}
          value={filters.reviewStatus}
          onChange={(reviewStatus) => setFilters({ reviewStatus })}
        />
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        rowKey={(row) => row.id}
        onRowClick={(row) => setSelected(row)}
        emptyTitle={
          filters.reviewStatus === 'pending_catalog'
            ? 'No pending quests'
            : 'No spontaneous quests found'
        }
        emptyDescription={
          filters.reviewStatus === 'pending_catalog'
            ? 'All caught up!'
            : undefined
        }
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
      />

      <SpontaneousDetailSheet
        quest={selected}
        onClose={() => setSelected(null)}
        onUpdated={() => {
          refetch();
          setSelected(null);
        }}
      />
    </div>
  );
}
