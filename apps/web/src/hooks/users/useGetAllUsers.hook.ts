'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export interface User {
  _id: string;
  login: string;
  name: string;
  age: number;
}

export function useGetAllUsers() {
  const [data, setData] = useState<User[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        // TODO: Polish fetching users
        const res = await api.get('/users');
        const users = res?.data?.users;
        console.log({ users });
        if (isMounted) {
          setData(users);
        }
      } catch (err: any) {
        console.log(err.stack);
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  return { users: data, loading, error };
}
