import { Spinner } from "@radix-ui/themes";
import { useGetAllUsers } from "@hooks/users/useGetAllUsers.hook";
import { LoadingContainer, UserCard } from "./UsersSection.styles";

export const UsersSection = () => {
  const { users, loading, error } = useGetAllUsers();
  if (loading)
    return (
      <LoadingContainer>
        <Spinner size="3" />
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
