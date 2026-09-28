"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { neonAuthClient } from "@/lib/neonAuth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Verifying Google credentials with Neon Auth...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function processAuth() {
      try {
        // 1. Fetch current session from Neon Auth
        const sessionRes = await neonAuthClient.getSession();
        
        if (sessionRes.error || !sessionRes.data?.user) {
          throw new Error(sessionRes.error?.message || "Could not retrieve Neon Auth session.");
        }

        const neonUser = sessionRes.data.user;
        setStatus(`Welcome, ${neonUser.name || neonUser.email}! Syncing your profile...`);

        // 2. Sync user with Neon PostgreSQL database
        const syncRes = await fetch("/api/auth/neon-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: neonUser.email,
            name: neonUser.name,
          }),
        });

        const syncData = await syncRes.json();
        if (!syncRes.ok) {
          throw new Error(syncData.error || "Failed to sync user profile.");
        }

        // 3. Check if user needs first-time lifestyle calibration
        if (syncData.needsProfileSetup) {
          setStatus("First-time login detected. Redirecting to lifestyle calibration...");
          window.location.href = "/onboarding";
        } else {
          setStatus("Profile verified! Loading recommendations...");
          window.location.href = "/recommendations";
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setError(err.message || "Authentication verification failed.");
      }
    }

    processAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-editorial-pattern p-4">
      <div className="w-full max-w-md bg-white border border-ivory-border shadow-xl rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center">
          {error ? (
            <span className="text-xl text-red-600">✕</span>
          ) : (
            <span className="animate-spin text-xl text-brand">⟳</span>
          )}
        </div>

        <h1 className="font-serif text-2xl font-bold text-foreground">
          {error ? "Sign In Failed" : "Authenticating"}
        </h1>

        <p className="text-sm font-serif italic text-ivory-text-muted">
          {error ? error : status}
        </p>

        {error && (
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-4 px-6 py-2.5 bg-brand text-white font-mono text-xs font-bold uppercase rounded-lg hover:bg-brand-dark transition-colors"
          >
            Return to Home
          </button>
        )}
      </div>
    </div>
  );
}
