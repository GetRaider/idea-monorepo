'use client';

import { Button } from '@denzel/ui/src/components/button';

import styles from './page.module.css';
import { useGetAllUsers } from '@hooks/users/useGetAllUsers.hook';

const RootPage = () => {
  const { users, loading, error } = useGetAllUsers();
  console.log({ users, loading, error });
  return (
    <main className={styles.main}>
      <header>
        <h1 className={styles.mainTitle}>Denzel App</h1>
      </header>
      <Button>Click me!</Button>
      {users?.map((user) => (
        <div key={user._id}>
          <p>{user.login}</p>
        </div>
      ))}
    </main>
  );
};

export default RootPage;
