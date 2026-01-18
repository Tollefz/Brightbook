// Read admin emails from env (comma-separated) or fallback to hardcoded list
const getAdminEmails = (): string[] => {
  const envEmails = process.env.ADMIN_EMAILS;
  if (envEmails) {
    return envEmails.split(",").map((e) => e.trim().toLowerCase());
  }
  // Fallback to hardcoded list
  return ["rob.tol@hotmail.com"];
};

export const ADMIN_EMAILS = getAdminEmails();

export const isAdminEmail = (email?: string | null): boolean => {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
};

