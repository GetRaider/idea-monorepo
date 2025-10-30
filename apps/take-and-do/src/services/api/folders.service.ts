import { Folder } from "@/types/workspace";

export const foldersService = {
  async getAll(): Promise<Folder[]> {
    const response = await fetch("/api/folders");
    if (!response.ok) {
      throw new Error("Failed to fetch folders");
    }
    return response.json();
  },

  async getById(id: string): Promise<Folder> {
    const response = await fetch(`/api/folders/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch folder");
    }
    return response.json();
  },
};
