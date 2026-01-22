import { redirect } from "next/navigation";

/**
 * Admin index page - redirects to dashboard
 * This prevents 404 when users access /admin directly
 */
export default function AdminIndex() {
  redirect("/admin/dashboard");
}

