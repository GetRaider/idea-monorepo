import { cva, type VariantProps } from 'class-variance-authority';
import {
  Pressable,
  Text,
  type PressableProps,
} from 'react-native';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'min-h-11 flex-row items-center justify-center rounded-xl px-4',
  {
    variants: {
      variant: {
        default: 'bg-accent',
        outline: 'border border-border bg-card',
        ghost: 'bg-transparent',
        destructive: 'bg-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export function Button({
  children,
  className,
  variant,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        buttonVariants({ variant }),
        disabled ? 'opacity-50' : 'active:opacity-80',
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text
          className={cn(
            'text-base font-semibold',
            variant === 'outline' || variant === 'ghost'
              ? 'text-foreground'
              : 'text-white',
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

export type ButtonProps = PressableProps &
  VariantProps<typeof buttonVariants> & {
    className?: string;
    children: React.ReactNode;
  };
