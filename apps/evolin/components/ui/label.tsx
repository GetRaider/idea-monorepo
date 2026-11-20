import * as LabelPrimitive from '@rn-primitives/label';

import { cn } from '@/lib/utils';

export function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & { className?: string }) {
  return (
    <LabelPrimitive.Root
      className={cn('text-sm font-semibold text-foreground', className)}
      {...props}
    />
  );
}
