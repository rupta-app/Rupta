import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CheckCircle,
  UsersRound,
  Flag,
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  pendingReports?: number;
  pendingSpontaneous?: number;
  pendingSuggestions?: number;
}

export function Sidebar({
  pendingReports = 0,
  pendingSpontaneous = 0,
  pendingSuggestions = 0,
}: SidebarProps) {
  const navItems: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/users', label: 'Users', icon: <Users size={18} /> },
    { to: '/quests', label: 'Quests', icon: <BookOpen size={18} /> },
    { to: '/completions', label: 'Completions', icon: <CheckCircle size={18} /> },
    { to: '/groups', label: 'Groups', icon: <UsersRound size={18} /> },
    { to: '/reports', label: 'Reports', icon: <Flag size={18} />, badge: pendingReports },
    { to: '/spontaneous', label: 'Spontaneous', icon: <Sparkles size={18} />, badge: pendingSpontaneous },
    { to: '/suggestions', label: 'Suggestions', icon: <Lightbulb size={18} />, badge: pendingSuggestions },
  ];

  return (
    <aside className="sticky top-0 flex h-screen w-60 flex-col bg-surface shadow-lg">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-bold text-white">R</span>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-foreground">Rupta</h1>
          <p className="text-[10px] text-muted-foreground">Admin</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 pt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium',
                'transition-colors duration-100',
                isActive
                  ? 'bg-primary/10 text-primary-light'
                  : 'text-muted hover:text-foreground hover:bg-surface-elevated',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-primary-light' : 'text-muted-foreground'}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger/15 px-1.5 text-[10px] font-bold text-danger-light">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4">
        <p className="text-[10px] text-muted-foreground/60">Service Role Access</p>
      </div>
    </aside>
  );
}
