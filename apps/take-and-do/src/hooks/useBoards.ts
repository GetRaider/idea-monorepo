import { SetStateAction, Dispatch, useEffect, useState } from "react";

import { apiServices } from "@/services/api";
import { TaskBoard } from "@/types/workspace";

interface UseBoardsReturn {
  boards: TaskBoard[];
  isLoading: boolean;
  setBoards: Dispatch<SetStateAction<TaskBoard[]>>;
}

interface UseBoardsParams {}

export function useBoards(): UseBoardsReturn {
  const [boards, setBoards] = useState<TaskBoard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBoards = async () => {
      const boards = await apiServices.taskBoards.getAll();
      setBoards(boards);
      setIsLoading(false);
    };
    fetchBoards();
  }, []);

  return { boards, isLoading, setBoards };
}
