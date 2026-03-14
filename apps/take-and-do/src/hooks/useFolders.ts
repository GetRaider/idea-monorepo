import { useEffect, useState } from "react";

import { apiServices } from "@/services/api";
import { Folder } from "@/types/workspace";

interface UseFoldersReturn {
  folders: Folder[];
  isLoading: boolean;
  setFolders: (folders: Folder[]) => void;
}

interface UseFoldersParams {}

export function useFolders(): UseFoldersReturn {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFolders = async () => {
      const folders = await apiServices.folders.getAll();
      setFolders(folders);
      setIsLoading(false);
    };
    fetchFolders();
  }, []);

  return { folders, isLoading, setFolders };
}
