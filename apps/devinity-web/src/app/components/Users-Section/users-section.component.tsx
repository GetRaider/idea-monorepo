import { useGetAllUsers } from "@hooks/users/useGetAllUsers.hook";

export const UsersSection = () => {
  const { users, loading } = useGetAllUsers();
  if (loading)
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-violet-500/20 border-t-violet-500/80" />
        <p>Users are loading...</p>
      </div>
    );
  return (
    <div>
      {users?.map((user, index) => (
        <div
          key={index}
          className="my-2 rounded-xl border border-slate-400/20 bg-slate-400/10 p-4 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-slate-400/30 hover:bg-slate-400/[0.15] max-sm:px-4 max-sm:py-3"
        >
          <p className="m-0 font-medium text-slate-100">{user.name}</p>
        </div>
      ))}
    </div>
  );
};
