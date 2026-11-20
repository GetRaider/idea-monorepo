import type { TextInputProps } from 'react-native';

import { Input } from './input';

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <Input
      className={`min-h-24 py-3 ${className ?? ''}`}
      multiline
      textAlignVertical="top"
      {...props}
    />
  );
}

export type TextareaProps = TextInputProps & { className?: string };
