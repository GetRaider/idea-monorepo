import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/utils';
import { Text } from './text';

export function Badge({ children, className, ...props }: BadgeProps) {
  return (
    <View
      className={cn('self-start rounded-full bg-gray-100 px-2 py-1', className)}
      {...props}
    >
      <Text className="text-xs font-medium">{children}</Text>
    </View>
  );
}

export type BadgeProps = ViewProps & {
  className?: string;
  children: React.ReactNode;
};
