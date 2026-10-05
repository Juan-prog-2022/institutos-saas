import { currentUser } from "@clerk/nextjs/server";

export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const emails = (process.env.SUPERADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return emails.includes(email.toLowerCase());
}

export async function checkSuperAdmin(): Promise<boolean> {
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  return isSuperAdmin(email);
}
