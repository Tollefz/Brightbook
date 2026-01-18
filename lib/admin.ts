export const ADMIN_EMAILS = ["rob.tol@hotmail.com"];

export const isAdminEmail = (email?: string | null): boolean => {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
};

