import { Dialog } from "@/components/Dialogs";
import {
  ConfirmActions,
  ConfirmBody,
  ConfirmCancelBtn,
  ConfirmDeleteBtn,
} from "./DeleteBoard.styles";

interface DeleteBoardProps {
  onClose: () => void;
  onDelete: () => void;
  boardName: string;
}

export function DeleteBoardModal({
  onClose,
  onDelete,
  boardName,
}: DeleteBoardProps) {
  return (
    <Dialog title={`Delete "${boardName}" board?`} onClose={onClose}>
      <ConfirmBody>
        This will permanently delete the board and all its tasks. This action
        cannot be undone.
      </ConfirmBody>
      <ConfirmActions>
        <ConfirmCancelBtn onClick={onClose}>Cancel</ConfirmCancelBtn>
        <ConfirmDeleteBtn onClick={onDelete}>Delete board</ConfirmDeleteBtn>
      </ConfirmActions>
    </Dialog>
  );
}
