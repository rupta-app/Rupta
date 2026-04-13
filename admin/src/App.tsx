import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardPage } from '@/pages/DashboardPage';
import { UsersPage } from '@/pages/UsersPage';
import { QuestsPage } from '@/pages/QuestsPage';
import { CompletionsPage } from '@/pages/CompletionsPage';
import { GroupsPage } from '@/pages/GroupsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SpontaneousPage } from '@/pages/SpontaneousPage';
import { SuggestionsPage } from '@/pages/SuggestionsPage';
import { useStats } from '@/hooks/useStats';
import { isConfigured } from '@/lib/supabaseAdmin';

function NotConfigured() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="max-w-md text-center animate-fade-in">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <span className="text-lg font-bold text-white">R</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Rupta Admin</h1>
        <p className="mt-3 text-sm text-muted">
          Set the following environment variables in{' '}
          <code className="rounded-md bg-surface-elevated px-1.5 py-0.5 text-xs text-foreground">
            admin/.env.local
          </code>
        </p>
        <div className="mt-4 space-y-2 text-left">
          <code className="block rounded-lg bg-surface px-3 py-2.5 text-xs text-primary-light shadow-sm">
            VITE_SUPABASE_URL=your_url
          </code>
          <code className="block rounded-lg bg-surface px-3 py-2.5 text-xs text-primary-light shadow-sm">
            VITE_SUPABASE_SERVICE_ROLE_KEY=your_key
          </code>
        </div>
      </div>
    </div>
  );
}

function AdminShell() {
  const { stats } = useStats();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        pendingReports={stats?.pendingReports}
        pendingSpontaneous={stats?.pendingSpontaneous}
        pendingSuggestions={stats?.pendingSuggestions}
      />
      <main className="flex-1 overflow-auto p-8">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/completions" element={<CompletionsPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/spontaneous" element={<SpontaneousPage />} />
          <Route path="/suggestions" element={<SuggestionsPage />} />
        </Routes>
      </main>
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: '#1E1E2E',
            color: '#F8FAFC',
            boxShadow: '0 6px 16px -4px rgba(0,0,0,0.5)',
          },
        }}
      />
    </div>
  );
}

export default function App() {
  if (!isConfigured) {
    return <NotConfigured />;
  }
  return <AdminShell />;
}
