import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

export const Spinner = ({ size = 'md', className, text }: SpinnerProps) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <Loader2
        className={cn('animate-spin text-[#e5c47f]', className)}
        size={sizeMap[size]}
      />
      {text && (
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
          {text}
        </span>
      )}
    </div>
  );
};
