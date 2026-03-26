import { redirect } from "next/navigation";
// import { getSessionCookie } from "@/lib/auth/cookies";
// import { verifySession } from "@/lib/auth/jwt";

export default async function HomePage() {
  // const token = await getSessionCookie();

  // if (!token) redirect("/login");

  // try {
  //   verifySession(token);
  //   redirect("/dashboard");
  // } catch {
  //   redirect("/login");
  // }

  redirect("/dashboard");
}
