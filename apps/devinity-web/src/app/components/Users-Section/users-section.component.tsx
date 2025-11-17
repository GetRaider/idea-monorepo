import { useGetAllUsers } from "@hooks/users/useGetAllUsers.hook";
import { LoadingContainer, UserCard, Spinner } from "./UsersSection.styles";

export const UsersSection = () => {
  const { users, loading, error } = useGetAllUsers();
  if (loading)
    return (
      <LoadingContainer>
        <Spinner />
        <p>Users are loading...</p>
      </LoadingContainer>
    );
  return (
    <div>
      {users?.map((user, index) => (
        <UserCard key={index}>
          <p>{user.name}</p>
        </UserCard>
      ))}
    </div>
  );
};
