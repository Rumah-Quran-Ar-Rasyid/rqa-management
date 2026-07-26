import { redirect } from "next/navigation";

import { getCurrentUser } from "@/modules/auth/application/session";

export default async function Home() {
  const user = await getCurrentUser();

  redirect(user ? "/app" : "/login");
}
