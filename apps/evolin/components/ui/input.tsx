import {
  TextInput,
  type TextInputProps,
} from 'react-native';

import { cn } from '@/lib/utils';

export function Input({ className, ...props }: InputProps) {
  return (
    <TextInput
      className={cn(
        'min-h-11 rounded-xl border border-border bg-card px-3 text-base text-foreground',
        className,
      )}
      placeholderTextColor="#66736c"
      {...props}
    />
  );
}

export type InputProps = TextInputProps & { className?: string };
