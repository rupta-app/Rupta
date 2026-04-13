import { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { DataTable } from '@/components/shared/DataTable';
import type { Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { QuestDetailSheet } from '@/components/quests/QuestDetailSheet';
import { QuestForm } from '@/components/quests/QuestForm';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchQuests, createQuest } from '@/services/quests';
import type { AdminQuest, QuestFormData } from '@/services/quests';
import { PAGE_SIZE } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import { toast } from 'sonner';

interface QuestsFilters {
  search: string;
  category: string;
  difficulty: string;
  isActive: string;
}

const activeTabs = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

const CATEGORIES = [
  'fitness', 'outdoors', 'social', 'creativity', 'travel',
  'food', 'learning', 'random', 'personal_growth',
];

export function QuestsPage() {
  const [selected, setSelected] = useState<AdminQuest | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetcher = useCallback(
    (params: QuestsFilters & { page: number; pageSize: number }) => fetchQuests(params),
    [],
  );

  const { data, total, loading, filters, page, setFilters, setPage, refetch } =
    useAsyncData<AdminQuest, QuestsFilters>(
      fetcher,
      { search: '', category: '', difficulty: '', isActive: '' },
      PAGE_SIZE,
    );

  async function handleCreate(formData: QuestFormData) {
    await createQuest(formData);
    toast.success('Quest created');
    setShowCreate(false);
    refetch();
  }

  const columns: Column<AdminQuest>[] = [
    {
      key: 'title',
      header: 'Title (EN)',
      render: (row) => (
        <span className="text-sm font-medium text-foreground truncate block max-w-56">
          {row.title_en}
        </span>
      ),
    },
    {
      key: 'title_es',
      header: 'Title (ES)',
      render: (row) => (
        <span className="text-sm text-muted truncate block max-w-48">
          {row.title_es}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      className: 'w-28',
      render: (row) => <Badge variant="muted">{row.category}</Badge>,
    },
    {
      key: 'difficulty',
      header: 'Difficulty',
      className: 'w-24',
      render: (row) => <Badge variant="muted">{row.difficulty}</Badge>,
    },
    {
      key: 'aura',
      header: 'AURA',
      className: 'w-20',
      render: (row) => (
        <span className="font-mono text-sm font-medium text-primary-light">
          +{formatNumber(row.aura_reward)}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      className: 'w-24',
      render: (row) => (
        <StatusBadge status={row.is_active ? 'active' : 'removed'} />
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
        title="Quests"
        description="Manage the official quest catalog"
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={refetch}>
              <RefreshCw size={14} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus size={14} />
              New Quest
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <SearchInput
          value={filters.search}
          onChange={(search) => setFilters({ ...filters, search })}
          placeholder="Search quests…"
          className="w-72"
        />
        <Tabs
          tabs={activeTabs}
          value={filters.isActive}
          onChange={(isActive) => setFilters({ ...filters, isActive })}
        />
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="h-8 rounded-lg bg-surface px-2 text-xs text-foreground shadow-xs"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.replace('_', ' ')}</option>
          ))}
        </select>
        <select
          value={filters.difficulty}
          onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
          className="h-8 rounded-lg bg-surface px-2 text-xs text-foreground shadow-xs"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
          <option value="legendary">Legendary</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        rowKey={(row) => row.id}
        onRowClick={(row) => setSelected(row)}
        emptyTitle="No quests found"
        emptyDescription="Try adjusting your filters or create a new quest"
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
      />

      <QuestDetailSheet
        quest={selected}
        onClose={() => setSelected(null)}
        onUpdated={() => {
          refetch();
          setSelected(null);
        }}
      />

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} className="max-w-2xl">
        <DialogTitle>Create New Quest</DialogTitle>
        <QuestForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          submitLabel="Create Quest"
        />
      </Dialog>
    </div>
  );
}
