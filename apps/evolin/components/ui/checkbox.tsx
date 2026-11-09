import * as CheckboxPrimitive from '@rn-primitives/checkbox';
import { Check } from 'lucide-react-native';

import { cn } from '@/lib/utils';

export function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  className?: string;
}) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'h-6 w-6 items-center justify-center rounded border border-border bg-card',
        props.checked ? 'border-accent bg-accent' : '',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check color="#ffffff" size={16} strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
