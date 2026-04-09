import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div className={cn("animate-pulse bg-blue-100 dark:bg-slate-800 rounded-md", className)} />
  );
};

export const DashboardSkeleton = () => (
  <div className="space-y-8 mb-12">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white dark:bg-black p-5 rounded-3xl border border-blue-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="w-8 h-8 rounded-xl" />
            <Skeleton className="w-16 h-3" />
          </div>
          <Skeleton className="w-32 h-8" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2].map(i => (
        <div key={i} className="bg-white dark:bg-black p-6 rounded-3xl border border-blue-200 dark:border-slate-800 shadow-sm h-72">
          <Skeleton className="w-40 h-4 mb-6" />
          <Skeleton className="w-full h-48 rounded-2xl" />
        </div>
      ))}
    </div>
  </div>
);

export const TransactionSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-white dark:bg-black p-4 rounded-2xl border border-blue-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-20 h-3" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="w-24 h-6 ml-auto" />
          <Skeleton className="w-16 h-2 ml-auto" />
        </div>
      </div>
    ))}
  </div>
);
