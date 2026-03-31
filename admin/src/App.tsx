import { useEffect, useState } from 'react';

import { adminClient, isConfigured } from './lib/supabaseAdmin';

type Profile = {
  id: string;
  username: string;
  display_name: string;
  status: string;
  total_aura: number;
  is_admin: boolean;
};

type Completion = {
  id: string;
  user_id: string;
  quest_id: string;
  status: string;
  aura_earned: number;
};

type Report = {
  id: string;
  reporter_id: string;
  completion_id: string | null;
  reason: string;
  status: string;
};

export default function App() {
  const [tab, setTab] = useState<'users' | 'completions' | 'reports'>('users');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [err, setErr] = useState('');

  const load = async () => {
    setErr('');
    try {
      if (tab === 'users') {
        const { data, error } = await adminClient
          .from('profiles')
          .select('id, username, display_name, status, total_aura, is_admin')
          .order('created_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        setProfiles(data ?? []);
      } else if (tab === 'completions') {
        const { data, error } = await adminClient
          .from('quest_completions')
          .select('id, user_id, quest_id, status, aura_earned')
          .in('status', ['under_review', 'removed', 'active'])
          .order('completed_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        setCompletions(data ?? []);
      } else {
        const { data, error } = await adminClient
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        setReports(data ?? []);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    }
  };

  useEffect(() => {
    if (isConfigured) void load();
  }, [tab]);

  if (!isConfigured) {
    return (
      <div className="min-h-screen p-8 bg-background text-foreground">
        <h1 className="text-2xl font-bold text-primary">Rupta Admin</h1>
        <p className="text-muted mt-4">
          Set <code className="text-foreground">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-foreground">VITE_SUPABASE_SERVICE_ROLE_KEY</code> in{' '}
          <code className="text-foreground">admin/.env.local</code>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-primary">Rupta Admin</h1>
        <button type="button" onClick={() => load()} className="text-sm text-muted hover:text-foreground">
          Refresh
        </button>
      </header>
      <nav className="flex gap-2 mb-6">
        {(['users', 'completions', 'reports'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg border ${tab === t ? 'border-primary bg-primary/20' : 'border-zinc-700'}`}
          >
            {t}
          </button>
        ))}
      </nav>
      {err ? <p className="text-red-400 mb-4">{err}</p> : null}

      {tab === 'users' ? (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-muted border-b border-zinc-700">
              <th className="py-2">User</th>
              <th>AURA</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-b border-zinc-800">
                <td className="py-2">
                  {p.display_name} <span className="text-muted">@{p.username}</span>
                </td>
                <td>{p.total_aura}</td>
                <td>
                  <select
                    className="bg-surface border border-zinc-700 rounded px-2 py-1"
                    value={p.status}
                    onChange={async (e) => {
                      await adminClient.from('profiles').update({ status: e.target.value }).eq('id', p.id);
                      void load();
                    }}
                  >
                    <option value="normal">normal</option>
                    <option value="warned">warned</option>
                    <option value="flagged_cheater">flagged_cheater</option>
                  </select>
                </td>
                <td>
                  <button
                    type="button"
                    className="text-primary text-xs"
                    onClick={async () => {
                      await adminClient.from('profiles').update({ is_admin: !p.is_admin }).eq('id', p.id);
                      void load();
                    }}
                  >
                    toggle admin
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {tab === 'completions' ? (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-muted border-b border-zinc-700">
              <th className="py-2">ID</th>
              <th>User</th>
              <th>Status</th>
              <th>AURA</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {completions.map((c) => (
              <tr key={c.id} className="border-b border-zinc-800">
                <td className="py-2 font-mono text-xs">{c.id.slice(0, 8)}…</td>
                <td className="font-mono text-xs">{c.user_id.slice(0, 8)}…</td>
                <td>{c.status}</td>
                <td>{c.aura_earned}</td>
                <td className="space-x-2">
                  <button
                    type="button"
                    className="text-xs text-primary"
                    onClick={async () => {
                      await adminClient.from('quest_completions').update({ status: 'active' }).eq('id', c.id);
                      void load();
                    }}
                  >
                    active
                  </button>
                  <button
                    type="button"
                    className="text-xs text-amber-400"
                    onClick={async () => {
                      await adminClient.from('quest_completions').update({ status: 'under_review' }).eq('id', c.id);
                      void load();
                    }}
                  >
                    review
                  </button>
                  <button
                    type="button"
                    className="text-xs text-red-400"
                    onClick={async () => {
                      await adminClient.from('quest_completions').update({ status: 'removed' }).eq('id', c.id);
                      void load();
                    }}
                  >
                    remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {tab === 'reports' ? (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-muted border-b border-zinc-700">
              <th className="py-2">ID</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Completion</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-b border-zinc-800">
                <td className="py-2 font-mono text-xs">{r.id.slice(0, 8)}…</td>
                <td>{r.reason}</td>
                <td>
                  <select
                    className="bg-surface border border-zinc-700 rounded px-2 py-1"
                    value={r.status}
                    onChange={async (e) => {
                      await adminClient.from('reports').update({ status: e.target.value }).eq('id', r.id);
                      void load();
                    }}
                  >
                    <option value="pending">pending</option>
                    <option value="reviewed">reviewed</option>
                    <option value="resolved">resolved</option>
                    <option value="dismissed">dismissed</option>
                  </select>
                </td>
                <td className="font-mono text-xs">{r.completion_id?.slice(0, 8) ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
