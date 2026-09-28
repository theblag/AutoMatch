"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { AuthUser, UserVectorData } from "@/lib/types";
import { neonAuthClient } from "@/lib/neonAuth";
import OnboardingModal from "./OnboardingModal";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (user: AuthUser, vector: UserVectorData) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
}: AuthModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<"GOOGLE" | "EMAIL">("GOOGLE");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Post-OAuth Onboarding state
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Email form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  // Handle Google Sign In via Neon Auth
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg("");

    try {
      const callbackURL = `${window.location.origin}/auth/callback`;
      const res = await neonAuthClient.signIn.social({
        provider: "google",
        callbackURL,
      });

      if (res.error) {
        throw new Error(res.error.message || "Failed to initiate Google sign-in with Neon Auth.");
      }

      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      console.error("Neon Auth Google error:", err);
      setErrorMsg(err.message || "Failed to connect to Google Auth via Neon.");
      setIsLoading(false);
    }
  };

  // Handle Email / Password Sign In & Sign Up via Neon Auth
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const displayName = name.trim() || email.split("@")[0];

      if (isRegisterMode) {
        const signUpRes = await neonAuthClient.signUp.email({
          email,
          password,
          name: displayName,
        });

        if (signUpRes.error) {
          throw new Error(signUpRes.error.message || "Sign up failed with Neon Auth.");
        }
      } else {
        const signInRes = await neonAuthClient.signIn.email({
          email,
          password,
        });

        if (signInRes.error) {
          throw new Error(signInRes.error.message || "Invalid credentials.");
        }
      }

      // Sync user profile with Neon DB & recommender vectors
      const syncRes = await fetch("/api/auth/neon-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: displayName,
        }),
      });

      const syncData = await syncRes.json();
      if (!syncRes.ok) {
        throw new Error(syncData.error || "Failed to sync user profile.");
      }

      // If user hasn't set their lifestyle priors yet, prompt the one-time questionnaire
      if (syncData.needsProfileSetup) {
        onClose();
        router.push("/onboarding");
      } else {
        if (onAuthSuccess) {
          onAuthSuccess(syncData.user, syncData.vector);
        }
        onClose();
        router.push("/recommendations");
      }
    } catch (err: any) {
      console.error("Email auth error:", err);
      setErrorMsg(err.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // Called when the one-time lifestyle onboarding is completed
  const handleOnboardingCompleted = (user: AuthUser, vector: UserVectorData) => {
    setIsOnboardingOpen(false);
    if (onAuthSuccess) {
      onAuthSuccess(user, vector);
    }
    onClose();
    router.push("/recommendations");
  };

  // If one-time onboarding is active, display the onboarding modal
  if (isOnboardingOpen && pendingUser) {
    return (
      <OnboardingModal
        isOpen={isOnboardingOpen}
        user={pendingUser}
        onCompleted={handleOnboardingCompleted}
        onDismiss={() => {
          setIsOnboardingOpen(false);
          onClose();
          router.push("/recommendations");
        }}
      />
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white border border-ivory-border shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ivory-border px-6 py-5 bg-ivory-bg/60">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-brand block">
              AutoMatch Authentication
            </span>
            <h2 className="font-serif text-xl font-bold text-foreground">
              Sign In to AutoMatch
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ivory-text-muted hover:text-foreground p-1 text-lg font-mono rounded-md hover:bg-ivory-border/40 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-foreground">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-sans rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Primary Action: Continue with Google */}
          <div className="space-y-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleGoogleSignIn()}
              className="w-full py-3.5 px-4 bg-white hover:bg-ivory-bg border border-ivory-border text-foreground font-sans text-sm font-semibold rounded-xl flex items-center justify-center gap-3 transition-all shadow-xs hover:border-brand/40 group"
            >
              {/* Official Google G Logo */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoading ? "Signing in with Google..." : "Continue with Google"}</span>
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-ivory-border"></div>
            <span className="flex-shrink mx-3 font-mono text-[10px] uppercase text-ivory-text-muted">
              Or continue with email
            </span>
            <div className="flex-grow border-t border-ivory-border"></div>
          </div>

          {/* Email / Password fallback */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {isRegisterMode && (
              <div>
                <label className="block text-[11px] font-mono uppercase text-ivory-text-muted mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 text-sm border-2 border-ivory-border rounded-lg bg-white focus:outline-brand focus:border-brand"
                />
              </div>
            )}
            <div>
              <label className="block text-[11px] font-mono uppercase text-ivory-text-muted mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 text-sm border-2 border-ivory-border rounded-lg bg-white focus:outline-brand focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-ivory-text-muted mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2 text-sm border-2 border-ivory-border rounded-lg bg-white focus:outline-brand focus:border-brand"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-foreground text-white hover:bg-brand font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-colors disabled:opacity-50"
            >
              {isRegisterMode ? "Sign Up with Email" : "Sign In with Email"}
            </button>

            <p className="text-center text-xs text-ivory-text-muted pt-1">
              {isRegisterMode ? "Already have an account?" : "Need an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-brand font-semibold underline ml-1"
              >
                {isRegisterMode ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
