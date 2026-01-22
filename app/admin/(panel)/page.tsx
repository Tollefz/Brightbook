import { redirect } from "next/navigation";

/**
 * Admin panel index page - redirects to dashboard
 * This is inside (panel) route group, so it's protected by (panel)/layout.tsx
 * This prevents 404 when users access /admin directly after login
 */
export default function AdminPanelIndex() {
  redirect("/admin/dashboard");
}

