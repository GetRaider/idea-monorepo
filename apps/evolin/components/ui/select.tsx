import * as SelectPrimitive from '@rn-primitives/select';
import { Check, ChevronDown } from 'lucide-react-native';
import { View } from 'react-native';

import { cn } from '@/lib/utils';

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({
  children,
  className,
  ...props
}: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'min-h-11 flex-row items-center justify-between rounded-xl border border-border bg-card px-3',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown color="#66736c" size={18} />
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  children,
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content> & {
  className?: string;
}) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Overlay className="absolute inset-0" />
      <SelectPrimitive.Content
        className={cn(
          'min-w-48 rounded-xl border border-border bg-card p-1 shadow',
          className,
        )}
        {...props}
      >
        {children}
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({
  className,
  ...props
}: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'min-h-11 flex-row items-center justify-between rounded-lg px-3',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText />
      <View className="w-5">
        <SelectPrimitive.ItemIndicator>
          <Check color="#286348" size={16} />
        </SelectPrimitive.ItemIndicator>
      </View>
    </SelectPrimitive.Item>
  );
}

type SelectTriggerProps = Omit<
  React.ComponentProps<typeof SelectPrimitive.Trigger>,
  'children'
> & {
  className?: string;
  children: React.ReactNode;
};

type SelectItemProps = Omit<
  React.ComponentProps<typeof SelectPrimitive.Item>,
  'children'
> & {
  className?: string;
};
