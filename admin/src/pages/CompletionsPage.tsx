import { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { DataTable } from '@/components/shared/DataTable';
import type { Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserCell } from '@/components/shared/UserCell';
import { MediaThumbnail } from '@/components/shared/MediaPreview';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CompletionDetailSheet } from '@/components/completions/CompletionDetailSheet';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchCompletions } from '@/services/completions';
import type { AdminCompletion } from '@/services/completions';
import { PAGE_SIZE, QUEST_SOURCE_TYPES, STATUS_LABELS } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';

interface CompletionsFilters {
  status: string;
  sourceType: string;
  search: string;
}

const statusTabs = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'removed', label: 'Removed' },
];

export function CompletionsPage() {
  const [selected, setSelected] = useState<AdminCompletion | null>(null);

  const fetcher = useCallback(
    (params: CompletionsFilters & { page: number; pageSize: number }) => fetchCompletions(params),
    [],
  );

  const { data, total, loading, filters, page, setFilters, setPage, refetch } =
    useAsyncData<AdminCompletion, CompletionsFilters>(
      fetcher,
      { status: '', sourceType: '', search: '' },
      PAGE_SIZE,
    );

  const columns: Column<AdminCompletion>[] = [
    {
      key: 'media',
      header: '',
      className: 'w-14',
      render: (row) => (
        <MediaThumbnail url={row.media?.[0]?.media_url ?? null} />
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (row) => (
        <UserCell
          displayName={row.profile?.display_name ?? null}
          username={row.profile?.username ?? null}
          avatarUrl={row.profile?.avatar_url ?? null}
        />
      ),
    },
    {
      key: 'quest',
      header: 'Quest',
      render: (row) => (
        <span className="text-sm text-foreground truncate block max-w-48">
          {row.quest?.title_en ?? row.caption ?? '—'}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      className: 'w-28',
      render: (row) => <StatusBadge status={row.quest_source_type} />,
    },
    {
      key: 'aura',
      header: 'AURA',
      className: 'w-20',
      render: (row) => (
        <span className="font-mono text-sm font-medium text-primary-light">
          +{formatNumber(row.aura_earned)}
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
      key: 'date',
      header: 'Date',
      className: 'w-32',
      render: (row) => (
        <span className="text-xs text-muted">
          {formatDistanceToNow(new Date(row.completed_at), { addSuffix: true })}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Completions"
        description="Review and moderate quest completions"
        actions={
          <Button variant="ghost" size="sm" onClick={refetch}>
            <RefreshCw size={14} />
            Refresh
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <SearchInput
          value={filters.search}
          onChange={(search) => setFilters({ ...filters, search })}
          placeholder="Search by caption…"
          className="w-72"
        />
        <Tabs
          tabs={statusTabs}
          value={filters.status}
          onChange={(status) => setFilters({ ...filters, status })}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Source:</span>
          <select
            value={filters.sourceType}
            onChange={(e) => setFilters({ ...filters, sourceType: e.target.value })}
            className="h-8 rounded-lg bg-surface px-2 text-xs text-foreground shadow-xs"
          >
            <option value="">All</option>
            {QUEST_SOURCE_TYPES.map((t) => (
              <option key={t} value={t}>{STATUS_LABELS[t]}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        rowKey={(row) => row.id}
        onRowClick={(row) => setSelected(row)}
        emptyTitle="No completions found"
        emptyDescription="Try adjusting your filters"
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
      />

      <CompletionDetailSheet
        completion={selected}
        onClose={() => setSelected(null)}
        onUpdated={() => {
          refetch();
          setSelected(null);
        }}
      />
    </div>
  );
}
