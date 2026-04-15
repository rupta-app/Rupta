import { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import type { Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserCell } from '@/components/shared/UserCell';
import { MediaThumbnail } from '@/components/shared/MediaPreview';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ReportDetailSheet } from '@/components/reports/ReportDetailSheet';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchReports } from '@/services/reports';
import type { AdminReport } from '@/services/reports';
import { PAGE_SIZE, REPORT_REASONS, REASON_LABELS } from '@/lib/constants';

interface ReportsFilters {
  status: string;
  reason: string;
}

const statusTabs = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

export function ReportsPage() {
  const [selected, setSelected] = useState<AdminReport | null>(null);

  const fetcher = useCallback(
    (params: ReportsFilters & { page: number; pageSize: number }) => fetchReports(params),
    [],
  );

  const { data, total, loading, filters, page, setFilters, setPage, refetch } =
    useAsyncData<AdminReport, ReportsFilters>(fetcher, { status: 'pending', reason: '' }, PAGE_SIZE);

  const columns: Column<AdminReport>[] = [
    {
      key: 'reason',
      header: 'Reason',
      className: 'w-36',
      render: (row) => (
        <span className="text-sm font-medium text-foreground">
          {REASON_LABELS[row.reason as keyof typeof REASON_LABELS] ?? row.reason}
        </span>
      ),
    },
    {
      key: 'reporter',
      header: 'Reporter',
      render: (row) => (
        <UserCell
          displayName={row.reporter?.display_name ?? null}
          username={row.reporter?.username ?? null}
          avatarUrl={row.reporter?.avatar_url ?? null}
        />
      ),
    },
    {
      key: 'reported_user',
      header: 'Reported User',
      render: (row) =>
        row.reported_user ? (
          <UserCell
            displayName={row.reported_user.display_name}
            username={row.reported_user.username}
            avatarUrl={row.reported_user.avatar_url}
          />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: 'type',
      header: 'Type',
      className: 'w-24',
      render: (row) => (
        <span className="text-xs font-medium text-muted">
          {row.comment_id ? 'Comment' : 'Completion'}
        </span>
      ),
    },
    {
      key: 'evidence',
      header: 'Evidence',
      className: 'w-14',
      render: (row) =>
        row.comment ? (
          <span className="text-xs text-muted-foreground truncate max-w-[120px] block" title={row.comment.content}>
            {row.comment.content}
          </span>
        ) : (
          <MediaThumbnail url={row.completion?.media?.[0]?.media_url ?? null} />
        ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-28',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'date',
      header: 'Filed',
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
        title="Reports"
        description="Review user reports for fake proof, harassment, spam, and more"
        actions={
          <Button variant="ghost" size="sm" onClick={refetch}>
            <RefreshCw size={14} />
            Refresh
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <Tabs
          tabs={statusTabs}
          value={filters.status}
          onChange={(status) => setFilters({ ...filters, status })}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Reason:</span>
          <select
            value={filters.reason}
            onChange={(e) => setFilters({ ...filters, reason: e.target.value })}
            className="h-8 rounded-lg bg-surface px-2 text-xs text-foreground shadow-xs"
          >
            <option value="">All</option>
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>{REASON_LABELS[r]}</option>
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
        emptyTitle="No reports found"
        emptyDescription={filters.status === 'pending' ? 'All caught up!' : 'Try adjusting your filters'}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
      />

      <ReportDetailSheet
        report={selected}
        onClose={() => setSelected(null)}
        onUpdated={() => {
          refetch();
          setSelected(null);
        }}
      />
    </div>
  );
}
