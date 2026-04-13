import { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import type { Column } from '@/components/shared/DataTable';
import { UserCell } from '@/components/shared/UserCell';
import { Button } from '@/components/ui/button';
import { SuggestionDetailSheet } from '@/components/suggestions/SuggestionDetailSheet';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchSuggestions } from '@/services/suggestions';
import type { AdminSuggestion } from '@/services/suggestions';
import { PAGE_SIZE } from '@/lib/constants';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SuggestionsFilters {}

export function SuggestionsPage() {
  const [selected, setSelected] = useState<AdminSuggestion | null>(null);

  const fetcher = useCallback(
    (params: SuggestionsFilters & { page: number; pageSize: number }) => fetchSuggestions(params),
    [],
  );

  const { data, total, loading, page, setPage, refetch } =
    useAsyncData<AdminSuggestion, SuggestionsFilters>(fetcher, {}, PAGE_SIZE);

  const columns: Column<AdminSuggestion>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (row) => (
        <span className="text-sm font-medium text-foreground">{row.title}</span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => (
        <span className="text-sm text-muted truncate block max-w-64">
          {row.description ?? '—'}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'Suggested By',
      render: (row) => (
        <UserCell
          displayName={row.user?.display_name ?? null}
          username={row.user?.username ?? null}
          avatarUrl={row.user?.avatar_url ?? null}
        />
      ),
    },
    {
      key: 'date',
      header: 'Date',
      className: 'w-32',
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
        title="Quest Suggestions"
        description="Review user-submitted quest ideas and convert them to official quests"
        actions={
          <Button variant="ghost" size="sm" onClick={refetch}>
            <RefreshCw size={14} />
            Refresh
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        rowKey={(row) => row.id}
        onRowClick={(row) => setSelected(row)}
        emptyTitle="No suggestions"
        emptyDescription="No quest suggestions have been submitted yet"
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
      />

      <SuggestionDetailSheet
        suggestion={selected}
        onClose={() => setSelected(null)}
        onUpdated={() => {
          refetch();
          setSelected(null);
        }}
      />
    </div>
  );
}
