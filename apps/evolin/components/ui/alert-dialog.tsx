import * as AlertDialogPrimitive from '@rn-primitives/alert-dialog';

import { cn } from '@/lib/utils';

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogPortal = AlertDialogPrimitive.Portal;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
export const AlertDialogAction = AlertDialogPrimitive.Action;

export function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay> & {
  className?: string;
}) {
  return (
    <AlertDialogPrimitive.Overlay
      className={cn('absolute inset-0 bg-black/40', className)}
      {...props}
    />
  );
}

export function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content> & {
  className?: string;
}) {
  return (
    <AlertDialogPrimitive.Content
      className={cn(
        'mx-4 w-full max-w-lg self-center rounded-2xl bg-card p-5',
        className,
      )}
      {...props}
    />
  );
}

export function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title> & {
  className?: string;
}) {
  return (
    <AlertDialogPrimitive.Title
      className={cn('text-xl font-bold text-foreground', className)}
      {...props}
    />
  );
}

export function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description> & {
  className?: string;
}) {
  return (
    <AlertDialogPrimitive.Description
      className={cn('mt-2 text-base text-muted', className)}
      {...props}
    />
  );
}
