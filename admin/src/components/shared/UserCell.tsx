import { cn } from '@/lib/utils';
import { imageUrl } from '@/lib/mediaUrls';

interface UserCellProps {
  displayName: string | null;
  username: string | null;
  avatarUrl?: string | null;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function UserCell({ displayName, username, avatarUrl, onClick, size = 'sm' }: UserCellProps) {
  const avatarSize = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm';
  const resolvedAvatar = imageUrl(avatarUrl, 'avatar');

  return (
    <div
      className={cn(
        'flex items-center gap-2.5',
        onClick && 'cursor-pointer hover:opacity-80',
      )}
      onClick={onClick}
    >
      {resolvedAvatar ? (
        <img
          src={resolvedAvatar}
          alt=""
          className={cn('rounded-full object-cover', avatarSize)}
        />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-primary/20 font-semibold text-primary-light',
            avatarSize,
          )}
        >
          {(displayName ?? username ?? '?').charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {displayName ?? 'Unknown'}
        </p>
        {username && (
          <p className="truncate text-xs text-muted">@{username}</p>
        )}
      </div>
    </div>
  );
}
