"use client";

import React, { useState, useEffect } from "react";
import AuthModal from "./AuthModal";
import OnboardingModal from "./OnboardingModal";
import VectorDiagnosticsDrawer from "./VectorDiagnosticsDrawer";
import type { AuthUser, UserVectorData } from "@/lib/types";

interface HeaderAuthProps {
  onVectorUpdated?: (newVector: UserVectorData) => void;
}

export default function HeaderAuth({ onVectorUpdated }: HeaderAuthProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [vector, setVector] = useState<UserVectorData | null>(null);
  const [interactionCount, setInteractionCount] = useState(0);
  const [recentSearches, setRecentSearches] = useState<{ query: string; created_at: string }[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check session on mount
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          setVector(data.vector);
          setInteractionCount(data.interactionCount || 0);
          setRecentSearches(data.recentSearches || []);
          if (data.needsProfileSetup) {
            setIsOnboardingOpen(true);
          }
          if (onVectorUpdated && data.vector) {
            onVectorUpdated(data.vector);
          }
        }
      } catch (err) {
        console.error("Failed to load session:", err);
      } finally {
        setIsLoaded(true);
      }
    }
    loadSession();
  }, [onVectorUpdated]);

  const handleAuthSuccess = (newUser: AuthUser, newVector: UserVectorData) => {
    setUser(newUser);
    setVector(newVector);
    setInteractionCount(0);
    setRecentSearches([]);
    if (!newUser.profileCompleted) {
      setIsOnboardingOpen(true);
    }
    if (onVectorUpdated) {
      onVectorUpdated(newVector);
    }
  };

  const handleOnboardingCompleted = (updatedUser: AuthUser, newVector: UserVectorData) => {
    setUser(updatedUser);
    setVector(newVector);
    setIsOnboardingOpen(false);
    if (onVectorUpdated) {
      onVectorUpdated(newVector);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setVector(null);
      setInteractionCount(0);
      setRecentSearches([]);
      window.location.reload();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (!isLoaded) {
    return <div className="h-9 w-32 bg-ivory-border/40 animate-pulse rounded-lg" />;
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Inspect AI Engine Button (Secret weapon for presentation) */}
        <button
          type="button"
          onClick={async () => {
            try {
              const res = await fetch("/api/auth/me");
              const data = await res.json();
              if (data.authenticated && data.vector) {
                setVector(data.vector);
                setInteractionCount(data.interactionCount || 0);
                setRecentSearches(data.recentSearches || []);
              }
            } catch { }
            setIsDrawerOpen(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-brand/10 border border-brand/30 hover:bg-brand/20 text-brand text-xs font-mono font-bold rounded-lg transition-all shadow-xs"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
          </span>
          <span>Inspect AI Engine</span>
        </button>

        {/* User Account / Sign In State */}
        {user ? (
          <div className="flex items-center gap-2.5 bg-ivory-bg border border-ivory-border px-3 py-1.5 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center font-bold text-xs font-mono">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-serif font-bold text-foreground leading-tight">
                {user.name}
              </span>
              <span className="text-[9px] font-mono text-ivory-text-muted">
                {user.profileCompleted
                  ? `${user.locationType?.split("/")[0].trim()} · ${user.age}y`
                  : "Profile Pending"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-[10px] font-mono uppercase text-ivory-text-muted hover:text-red-600 ml-1 transition-colors"
              title="Sign Out"
            >
              Log out
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="px-4 py-1.5 bg-brand text-white font-mono font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shadow-md hover:shadow-lg hover:scale-105 border border-brand hover:bg-brand/95 text-xs"
          >
            <span>Sign In</span>
          </button>
        )}
      </div>

      {/* Auth Modal (Google Sign In / Email) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* One-Time Progressive Onboarding Modal (Appears only once when profile_completed === false) */}
      {user && !user.profileCompleted && (
        <OnboardingModal
          isOpen={isOnboardingOpen}
          user={user}
          onCompleted={handleOnboardingCompleted}
          onDismiss={() => setIsOnboardingOpen(false)}
        />
      )}

      {/* Vector Diagnostics Drawer */}
      <VectorDiagnosticsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
        vector={vector}
        interactionCount={interactionCount}
        recentSearches={recentSearches}
      />
    </>
  );
}
