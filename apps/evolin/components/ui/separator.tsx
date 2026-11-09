import * as SeparatorPrimitive from '@rn-primitives/separator';

import { cn } from '@/lib/utils';

export function Separator({
  className,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root> & {
  className?: string;
}) {
  return (
    <SeparatorPrimitive.Root
      className={cn('h-px w-full bg-border', className)}
      {...props}
    />
  );
}
