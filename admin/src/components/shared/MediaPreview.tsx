import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaItem {
  id: string;
  media_url: string;
  media_type: string;
}

interface MediaPreviewProps {
  media: MediaItem[];
  size?: 'sm' | 'md' | 'lg';
}

export function MediaPreview({ media, size = 'sm' }: MediaPreviewProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (media.length === 0) {
    return <div className="text-xs text-muted-foreground">No media</div>;
  }

  const sizeClass = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
  }[size];

  return (
    <>
      <div className="flex gap-1.5 flex-wrap">
        {media.map((item) => (
          <button
            key={item.id}
            onClick={() => setLightboxUrl(item.media_url)}
            className={cn(
              'group relative overflow-hidden rounded-md shadow-xs',
              sizeClass,
            )}
          >
            <img
              src={item.media_url}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
              <ZoomIn size={14} className="text-white" />
            </div>
          </button>
        ))}
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute right-4 top-4 text-white/70 hover:text-white"
            onClick={() => setLightboxUrl(null)}
          >
            <X size={24} />
          </button>
          <img
            src={lightboxUrl}
            alt=""
            className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
}

interface MediaThumbnailProps {
  url: string | null;
  onClick?: () => void;
}

export function MediaThumbnail({ url, onClick }: MediaThumbnailProps) {
  if (!url) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-md shadow-xs bg-surface-elevated text-xs text-muted-foreground">
        —
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="group relative h-10 w-10 overflow-hidden rounded-md shadow-xs"
    >
      <img src={url} alt="" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
    </button>
  );
}
