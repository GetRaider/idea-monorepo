import { View } from 'react-native';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  Button,
} from '@/components/ui';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  isPending = false,
  confirmDisabled = false,
  children,
  onOpenChange,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogPortal>
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
          {children}
          <View className="mt-5 gap-3 sm:flex-row sm:justify-end">
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant={destructive ? 'destructive' : 'default'}
                disabled={isPending || confirmDisabled}
                onPress={onConfirm}
              >
                {isPending ? 'Working…' : confirmLabel}
              </Button>
            </AlertDialogAction>
          </View>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialog>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  isPending?: boolean;
  confirmDisabled?: boolean;
  children?: React.ReactNode;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};
