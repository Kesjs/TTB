import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export const ProgressBar = ({ 
  progress, 
  className, 
  showPercentage = false,
  size = 'md'
}: ProgressBarProps) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="flex items-center gap-3">
      <div className={cn('flex-1 bg-gray-200 rounded-full overflow-hidden', sizeMap[size], className)}>
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <span className="text-xs font-mono text-zinc-600 min-w-[3rem]">
          {Math.round(clampedProgress)}%
        </span>
      )}
    </div>
  );
};
