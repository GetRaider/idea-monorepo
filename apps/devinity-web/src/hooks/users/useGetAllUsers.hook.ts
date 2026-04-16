"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../lib/query-keys";
import { api } from "../../lib/http-client";

export interface User {
  _id: string;
  login: string;
  name: string;
  age: number;
}

export function useGetAllUsers() {
  const query = useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const res = await api.get<User[]>("/users");
      return res.data;
    },
  });

  return {
    users: query.data ?? null,
    loading: query.isPending,
    error: query.error,
  };
}
