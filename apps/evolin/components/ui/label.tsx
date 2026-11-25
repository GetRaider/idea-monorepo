import * as LabelPrimitive from "@rn-primitives/label";

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export function Label({
  className,
  children,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & { className?: string }) {
  return (
    <LabelPrimitive.Root {...props}>
      <Text className={cn("text-sm font-semibold text-foreground", className)}>
        {children}
      </Text>
    </LabelPrimitive.Root>
  );
}
