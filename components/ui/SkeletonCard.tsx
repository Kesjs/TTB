import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
  count?: number;
}

export const SkeletonCard = ({ className, count = 1 }: SkeletonCardProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'bg-zinc-100 rounded-2xl overflow-hidden animate-pulse',
            className
          )}
        >
          {/* Image placeholder */}
          <div className="aspect-[3/4] bg-zinc-200" />
          
          {/* Content placeholder */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <div className="h-6 bg-zinc-200 rounded" />
            
            {/* Subtitle */}
            <div className="h-4 bg-zinc-200 rounded w-2/3" />
            
            {/* Stats */}
            <div className="flex items-center gap-2 pt-2">
              <div className="h-4 bg-zinc-200 rounded w-8" />
              <div className="h-4 bg-zinc-200 rounded w-12" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};
