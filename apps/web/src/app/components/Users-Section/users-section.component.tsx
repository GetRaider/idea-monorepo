import { Spinner } from '@radix-ui/themes';
import { useGetAllUsers } from '@hooks/users/useGetAllUsers.hook';
import styles from './users-section.module.css';

export const UsersSection = () => {
  const { users, loading, error } = useGetAllUsers();
  if (loading)
    return (
      <div className={styles.loading}>
        <Spinner size="3" />
        <p>Users are loading...</p>
      </div>
    );
  return (
    <div>
      {users?.map((user) => (
        <div key={user._id} className={styles.userCard}>
          <p>{user.login}</p>
        </div>
      ))}
    </div>
  );
};
