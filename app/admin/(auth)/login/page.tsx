"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";

/**
 * Admin login page - Public route (no auth required)
 * 
 * This page is in the (auth) route group, which means it will NOT
 * be protected by the auth guard in (panel)/layout.tsx.
 * 
 * This prevents redirect loops because:
 * - Middleware excludes /admin/login explicitly
 * - (panel)/layout.tsx only protects routes in the (panel) group
 * - This page is in (auth) group, so it's never checked by auth guard
 */
export default function AdminLogin() {
  const [providerStatus, setProviderStatus] = useState<string>("Laster...");

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((res) => {
        if (!res.ok) {
          setProviderStatus(`NextAuth providers FEIL: ${res.status}`);
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setProviderStatus(`NextAuth OK: ${JSON.stringify(data)}`);
        }
      })
      .catch((err) => {
        setProviderStatus(`NextAuth providers FEIL: ${err.message}`);
      });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow">
        <div className="mb-4 rounded bg-yellow-100 px-3 py-2 text-sm font-semibold text-yellow-800">
          GITHUB LOGIN ENABLED ✅
        </div>

        <div className="mb-4 rounded bg-gray-100 px-3 py-2 text-xs text-gray-700">
          <strong>Debug:</strong> {providerStatus}
        </div>

        <h1 className="mb-6 text-3xl font-bold">Admin Login</h1>

        <a
          href="/api/auth/signin/github?callbackUrl=/admin"
          className="block w-full rounded bg-black px-4 py-2 text-center text-white hover:bg-gray-800"
        >
          Logg inn med GitHub
        </a>

        <p className="mt-4 text-xs text-gray-500 text-center">
          Hvis du klikker og ingenting skjer: åpne /api/auth/signin/github direkte.
        </p>
      </div>
    </div>
  );
}

