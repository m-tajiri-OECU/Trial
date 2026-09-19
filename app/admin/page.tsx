import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isAuthorized } from "@/lib/admin-auth";
import { getAllSkills } from "@/lib/skills";
import AdminLoginForm from "./login-form";
import AdminSkillManager from "./skill-manager";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!isAuthorized(token)) {
    return <AdminLoginForm />;
  }

  const skills = getAllSkills();
  return <AdminSkillManager initialSkills={skills} />;
}
