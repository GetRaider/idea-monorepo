import { redirect } from "next/navigation";

export default function TasksIndexRedirectPage() {
  redirect("/tasks/root");
}
