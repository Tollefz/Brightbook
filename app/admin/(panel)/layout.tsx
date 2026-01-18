import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { GlobalAIAssistantWrapper } from "@/components/admin/GlobalAIAssistantWrapper";

// Safe mode: Admin features temporarily disabled if auth is not configured
const AUTH_DISABLED = process.env.DISABLE_ADMIN_AUTH === "true";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Safe mode: If auth is disabled, show placeholder
  if (AUTH_DISABLED) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Temporarily Disabled</h1>
          <p className="text-gray-600">
            Admin features are temporarily disabled for maintenance.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Set DISABLE_ADMIN_AUTH=false to re-enable.
          </p>
        </div>
      </div>
    );
  }

  // Safe auth check: Catch errors and show placeholder instead of crashing
  try {
    const session = await getServerSession(authOptions);

    // Check if user is logged in
    if (!session || !session.user) {
      redirect("/admin/login");
    }

    // Check if user has admin role
    const userRole = session.user.role;
    if (userRole !== "admin") {
      // User is logged in but not admin - show 403
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Ingen tilgang</h1>
            <p className="text-gray-600 mb-6">
              Du har ikke tilgang til admin-panelet. Kun administratorer kan få tilgang.
            </p>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
              >
                Logg ut
              </button>
            </form>
          </div>
        </div>
      );
    }

    // User is admin - show admin panel
    return (
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
        <GlobalAIAssistantWrapper />
      </div>
    );
  } catch (error) {
    // If auth fails (e.g., missing env vars), show placeholder instead of crashing
    console.error("[ADMIN] Auth check failed:", error);
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Temporarily Unavailable</h1>
          <p className="text-gray-600">
            Authentication service is not configured. Please check environment variables.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Required: GITHUB_ID, GITHUB_SECRET, NEXTAUTH_URL, NEXTAUTH_SECRET
          </p>
        </div>
      </div>
    );
  }
}

