import { Text as NativeText, type TextProps } from 'react-native';

import { cn } from '@/lib/utils';

export function Text({ className, ...props }: TextProps & { className?: string }) {
  return (
    <NativeText
      className={cn('text-base text-foreground', className)}
      {...props}
    />
  );
}
