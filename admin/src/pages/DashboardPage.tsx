import { useNavigate } from 'react-router-dom';
import {
  Users,
  Flag,
  Sparkles,
  AlertCircle,
  CheckCircle,
  BookOpen,
  UsersRound,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/layout/PageHeader';
import { useStats } from '@/hooks/useStats';
import { formatNumber, cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  /** Color the number to signal it needs attention (only when value > 0) */
  accent?: string;
  onClick?: () => void;
}

function StatCard({ label, value, icon, accent, onClick }: StatCardProps) {
  const showAccent = accent && value > 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl bg-surface p-5 shadow-sm',
        onClick && 'cursor-pointer transition-colors duration-150 hover:bg-surface-elevated',
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">{label}</p>
        {icon}
      </div>
      <p
        className={cn(
          'mt-3 text-2xl font-bold tracking-tight',
          showAccent ? accent : 'text-foreground',
        )}
      >
        {formatNumber(value)}
      </p>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl bg-surface p-5 shadow-sm">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-4 h-7 w-14" />
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { stats, activity, loading } = useStats();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of pending moderation tasks"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {loading || !stats ? (
          Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Users"
              value={stats.totalUsers}
              icon={<Users size={16} className="text-muted-foreground" />}
              onClick={() => navigate('/users')}
            />
            <StatCard
              label="Pending Reports"
              value={stats.pendingReports}
              icon={<Flag size={16} className="text-danger-light" />}
              accent="text-danger-light"
              onClick={() => navigate('/reports')}
            />
            <StatCard
              label="Spontaneous Queue"
              value={stats.pendingSpontaneous}
              icon={<Sparkles size={16} className="text-respect" />}
              accent="text-respect"
              onClick={() => navigate('/spontaneous')}
            />
            <StatCard
              label="Under Review"
              value={stats.underReviewCompletions}
              icon={<AlertCircle size={16} className="text-respect" />}
              accent="text-respect"
              onClick={() => navigate('/completions')}
            />
            <StatCard
              label="Completions Today"
              value={stats.completionsToday}
              icon={<CheckCircle size={16} className="text-secondary" />}
            />
            <StatCard
              label="Active Quests"
              value={stats.totalQuests ?? 0}
              icon={<BookOpen size={16} className="text-muted-foreground" />}
              onClick={() => navigate('/quests')}
            />
            <StatCard
              label="Groups"
              value={stats.totalGroups ?? 0}
              icon={<UsersRound size={16} className="text-muted-foreground" />}
              onClick={() => navigate('/groups')}
            />
            <StatCard
              label="Suggestions"
              value={stats.pendingSuggestions ?? 0}
              icon={<Lightbulb size={16} className="text-muted-foreground" />}
              accent="text-respect"
              onClick={() => navigate('/suggestions')}
            />
          </>
        )}
      </div>

      {/* Needs Attention */}
      <div className="mt-10">
        <h2 className="mb-4 text-xs font-medium text-muted-foreground">
          Needs Attention
        </h2>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <div className="rounded-xl bg-surface p-8 text-center shadow-sm">
            <p className="text-sm text-muted">All caught up — nothing pending</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activity.map((item) => {
              const isReport = item.type === 'report';
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3.5 shadow-sm cursor-pointer transition-colors duration-100 hover:bg-surface-elevated"
                  onClick={() => navigate(isReport ? '/reports' : '/spontaneous')}
                >
                  {isReport ? (
                    <Flag size={15} className="shrink-0 text-danger-light" />
                  ) : (
                    <Sparkles size={15} className="shrink-0 text-respect" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                  </div>
                  <StatusBadge status={isReport ? 'pending' : 'pending_catalog'} />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-muted-foreground/40" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
