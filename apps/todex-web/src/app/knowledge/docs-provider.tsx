"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DocType } from "@repo/api/todex";
import type { DocFolder, DocSummary, Space } from "@repo/api/todex";
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
  const spacesQuery = useQuery({
    queryKey: ["boards"],
    queryFn: () => todexClient.spaces.list(),
  });
  const foldersQuery = useQuery({
    queryKey: ["doc-folders"],
    queryFn: () => todexClient.docFolders.list(),
  });

  const createDoc = useMutation({
    mutationFn: (input: {
      type: DocType;
      spaceId: string;
      folderId?: string | null;
    }) =>
      todexClient.docs.create({
        type: input.type,
        title: "Untitled",
        spaceId: input.spaceId,
        folderId: input.folderId ?? null,
      }),
    onSuccess: async (doc) => {
      await queryClient.invalidateQueries({ queryKey: ["docs"] });
      router.push(
        doc.type === DocType.GOAL
          ? `/planning/goals/${doc.id}`
          : `/knowledge/${doc.id}`,
      );
    },
    onError: () => toast.error("Could not create the doc"),
  });

  const createFolder = useMutation({
    mutationFn: (input: { name: string; spaceId: string }) =>
      todexClient.docFolders.create(input),
    onSuccess: async (folder) => {
      await queryClient.invalidateQueries({ queryKey: ["doc-folders"] });
      toast.success(`Folder "${folder.name}" created`);
    },
    onError: () => toast.error("Could not create the folder"),
  });
  const createSpace = useMutation({
    mutationFn: (name: string) =>
      todexClient.spaces.create({ name, folderId: null }),
    onSuccess: async (space) => {
      await queryClient.invalidateQueries({ queryKey: ["boards"] });
      toast.success(`Space "${space.name}" created`);
    },
    onError: () => toast.error("Could not create the space"),
  });

  const value: DocsContextValue = {
    state: {
      docs: docsQuery.data ?? [],
      spaces: spacesQuery.data ?? [],
      folders: foldersQuery.data ?? [],
      search,
      isLoading:
        docsQuery.isLoading || spacesQuery.isLoading || foldersQuery.isLoading,
    },
    actions: {
      setSearch,
      createDoc: async (type, spaceId, folderId) => {
        await createDoc.mutateAsync({ type, spaceId, folderId });
      },
      createFolder: (name, spaceId) =>
        createFolder.mutateAsync({ name, spaceId }),
      createSpace: (name) => createSpace.mutateAsync(name),
    },
  };

  return <DocsContext value={value}>{children}</DocsContext>;
}

export function useDocs() {
  const value = use(DocsContext);
  if (!value) throw new Error("useDocs must be used within DocsProvider");
  return value;
}

interface DocsContextValue {
  state: {
    docs: DocSummary[];
    spaces: Space[];
    folders: DocFolder[];
    search: string;
    isLoading: boolean;
  };
  actions: {
    setSearch: (search: string) => void;
    createDoc: (
      type: DocType,
      spaceId: string,
      folderId?: string | null,
    ) => Promise<void>;
    createFolder: (name: string, spaceId: string) => Promise<DocFolder>;
    createSpace: (name: string) => Promise<Space>;
  };
}
