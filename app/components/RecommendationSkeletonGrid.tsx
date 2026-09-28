"use client";

import React from "react";

interface SkeletonCardProps {
  index: number;
}

function SkeletonCard({ index }: SkeletonCardProps) {
  return (
    <article
      className="relative rounded-2xl border border-ivory-border bg-white p-5 md:p-6 shadow-xs overflow-hidden animate-pulse"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      {/* Top Bar: Match Score & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ivory-border/60 pb-4">
        <div className="flex items-center gap-2">
          {/* Rank Badge */}
          <div className="h-6 w-12 rounded-md bg-neutral-200/80" />
          {/* Vector Match Score Badge */}
          <div className="h-6 w-32 rounded-full bg-neutral-200/80" />
        </div>
        <div className="flex items-center gap-2">
          {/* Star Button */}
          <div className="h-7 w-20 rounded-full bg-neutral-200/70" />
          {/* Compare Button */}
          <div className="h-7 w-24 rounded-full bg-neutral-200/70" />
        </div>
      </div>

      {/* Main Info: Car Make, Model, Price */}
      <div className="mt-4 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
        <div className="space-y-2 flex-1">
          {/* Make and Model */}
          <div className="h-7 w-2/3 rounded-lg bg-neutral-200" />
          {/* Variant and Tagline */}
          <div className="h-4 w-4/5 rounded bg-neutral-200/70" />
        </div>
        {/* Price Box */}
        <div className="h-8 w-28 rounded-lg bg-neutral-200/90" />
      </div>

      {/* Spec Highlights Grid */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="p-3 rounded-xl bg-ivory-bg/40 border border-ivory-border/50 space-y-1.5"
          >
            <div className="h-3 w-14 rounded bg-neutral-200/60" />
            <div className="h-4 w-20 rounded bg-neutral-200/90" />
          </div>
        ))}
      </div>

      {/* AI Latent Alignment Explanation Badges */}
      <div className="mt-5 pt-4 border-t border-ivory-border/60 flex flex-wrap gap-2">
        <div className="h-6 w-44 rounded-full bg-neutral-200/70" />
        <div className="h-6 w-36 rounded-full bg-neutral-200/70" />
      </div>

      {/* Shimmer sweep effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
    </article>
  );
}

export default function RecommendationSkeletonGrid({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {/* Loading header status notice */}
      <div className="p-3.5 bg-brand/5 border border-brand/20 rounded-xl flex items-center justify-between text-brand text-xs font-mono animate-pulse">
        <div className="flex items-center gap-2.5">
          <span className="inline-block h-2 w-2 rounded-full bg-brand animate-ping" />
          <span>Calibrating 7D Latent Vectors & Computing Cosine Distance across 1,276 vehicles...</span>
        </div>
        <span className="text-[10px] text-ivory-text-muted hidden sm:inline">Neon DB pgvector</span>
      </div>

      {/* Grid of Skeleton Cards */}
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} index={i} />
        ))}
      </div>
    </div>
  );
}
