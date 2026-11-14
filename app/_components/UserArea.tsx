// Header user area: the signed-in user's email and «Выйти» (DESIGN, shared components). Server Component, so the
// email comes from the session cookie without any API call or Supabase key in the browser.
import { getUser } from "@/server/auth";
import { SignOutButton } from "@/src/ui/SignOutButton";
import styles from "./UserArea.module.css";

export async function UserArea() {
  const user = await getUser();
  if (!user) return null;
  return (
    <div className={styles.user}>
      {user.email && (
        <span className={styles.email} title={user.email}>
          {user.email}
        </span>
      )}
      <SignOutButton />
    </div>
  );
}
