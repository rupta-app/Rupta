export function formatCompletionTime(iso: string, lang: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  const es = lang === 'es';
  if (diffM < 1) return es ? 'ahora' : 'just now';
  if (diffM < 60) return es ? `hace ${diffM} min` : `${diffM}m ago`;
  if (diffH < 24) return es ? `hace ${diffH} h` : `${diffH}h ago`;
  if (diffD < 7) return es ? `hace ${diffD} d` : `${diffD}d ago`;
  return d.toLocaleDateString(lang === 'es' ? 'es' : 'en', { month: 'short', day: 'numeric' });
}
