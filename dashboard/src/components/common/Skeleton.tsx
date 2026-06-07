import React from 'react';

export function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-white/5 shimmer rounded-xl ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
      <Skeleton className="w-1/3 h-6" />
      <Skeleton className="w-full h-24" />
      <div className="flex gap-2">
        <Skeleton className="w-12 h-10" />
        <Skeleton className="w-full h-10" />
      </div>
    </div>
  );
}

export function SkeletonPlayer() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-panel p-8 rounded-3xl border border-white/5 flex flex-col items-center gap-6">
          <Skeleton className="w-64 h-64 rounded-2xl" />
          <Skeleton className="w-1/2 h-8" />
          <Skeleton className="w-1/3 h-5" />
          <Skeleton className="w-full h-2 mt-4" />
          <div className="flex justify-center gap-6 w-full mt-2">
            <Skeleton className="w-12 h-12 rounded-full" />
            <Skeleton className="w-12 h-12 rounded-full" />
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="w-12 h-12 rounded-full" />
            <Skeleton className="w-12 h-12 rounded-full" />
          </div>
        </div>
      </div>
      <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
        <Skeleton className="w-1/3 h-6" />
        <Skeleton className="w-full h-12 rounded-xl" />
        <Skeleton className="w-full h-12 rounded-xl" />
        <Skeleton className="w-full h-12 rounded-xl" />
      </div>
    </div>
  );
}
