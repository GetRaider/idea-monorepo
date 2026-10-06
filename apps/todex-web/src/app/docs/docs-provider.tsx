"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderKind } from "@repo/api/todex";
import type { DocSummary, DocType, Folder } from "@repo/api/todex";
import { toast } from "sonner";

import { todexClient } from "@lib/todex-client";

const DocsContext = createContext<DocsContextValue | null>(null);

export function DocsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const docsQuery = useQuery({
    queryKey: ["docs"],
    queryFn: () => todexClient.docs.list(),
  });
  const foldersQuery = useQuery({
    queryKey: ["folders", "docs"],
    queryFn: () => todexClient.folders.list(FolderKind.DOCS),
  });

  const createDoc = useMutation({
    mutationFn: (input: { type: DocType; folderId?: string | null }) =>
      todexClient.docs.create({
        type: input.type,
        title: "Untitled",
        folderId: input.folderId ?? null,
      }),
    onSuccess: async (doc) => {
      await queryClient.invalidateQueries({ queryKey: ["docs"] });
      router.push(`/docs/${doc.id}`);
    },
    onError: () => toast.error("Could not create the doc"),
  });

  const createFolder = useMutation({
    mutationFn: (name: string) =>
      todexClient.folders.create({ name, kind: FolderKind.DOCS }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["folders", "docs"] });
    },
    onError: () => toast.error("Could not create the folder"),
  });

  const value: DocsContextValue = {
    state: {
      docs: docsQuery.data ?? [],
      folders: foldersQuery.data ?? [],
      search,
      isLoading: docsQuery.isLoading || foldersQuery.isLoading,
    },
    actions: {
      setSearch,
      createDoc: async (type, folderId) => {
        await createDoc.mutateAsync({ type, folderId });
      },
      createFolder: async (name) => {
        await createFolder.mutateAsync(name);
      },
    },
  };

  return (
    <DocsContext.Provider value={value}>{children}</DocsContext.Provider>
  );
}

export function useDocs() {
  const value = use(DocsContext);
  if (!value) throw new Error("useDocs must be used within DocsProvider");
  return value;
}

interface DocsContextValue {
  state: {
    docs: DocSummary[];
    folders: Folder[];
    search: string;
    isLoading: boolean;
  };
  actions: {
    setSearch: (search: string) => void;
    createDoc: (type: DocType, folderId?: string | null) => Promise<void>;
    createFolder: (name: string) => Promise<void>;
  };
}
