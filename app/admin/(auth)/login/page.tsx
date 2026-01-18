"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

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
  const [isConfigError, setIsConfigError] = useState(false);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((res) => {
        if (!res.ok) {
          setProviderStatus(`NextAuth providers FEIL: ${res.status}`);
          setIsConfigError(true);
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          const hasGitHub = data.github;
          if (hasGitHub) {
            setProviderStatus("GitHub login er tilgjengelig");
            setIsConfigError(false);
          } else {
            setProviderStatus("GitHub login er ikke konfigurert");
            setIsConfigError(true);
          }
        }
      })
      .catch((err) => {
        setProviderStatus(`NextAuth providers FEIL: ${err.message}`);
        setIsConfigError(true);
      });
  }, []);

  const handleGitHubLogin = () => {
    signIn("github", { callbackUrl: "/admin" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow">
        <h1 className="mb-6 text-3xl font-bold text-center">Admin Login</h1>

        {isConfigError ? (
          <div className="mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-800">
            <strong>Feil:</strong> GitHub login er ikke konfigurert.
            <p className="mt-2 text-xs">
              Sjekk at GITHUB_ID, GITHUB_SECRET, NEXTAUTH_URL og NEXTAUTH_SECRET er satt.
            </p>
          </div>
        ) : (
          <div className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-800">
            {providerStatus}
          </div>
        )}

        <button
          onClick={handleGitHubLogin}
          disabled={isConfigError}
          className="w-full rounded bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Logg inn med GitHub
        </button>

        <p className="mt-4 text-xs text-gray-500 text-center">
          Kun administratorer med tilgang kan logge inn.
        </p>
      </div>
    </div>
  );
}

