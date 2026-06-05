import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 14,
  md: 16,
  lg: 20,
};

export const ButtonLoader = ({ size = 'md', className }: ButtonLoaderProps) => {
  return (
    <Loader2
      className={cn('animate-spin text-current', className)}
      size={sizeMap[size]}
    />
  );
};
