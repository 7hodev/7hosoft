// components/user-profile-badge.tsx
"use client";

import { useDb } from "@/providers/db-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserProfileBadgeProps = {
  userData?: Partial<AppUser>;
  showName?: boolean;
  showEmail?: boolean;
  responsive?: boolean;
};

type AppUser = {
  id: string;
  email?: string;
  display_name: string;
  metadata: {
    avatar_url?: string;
  };
};

export function UserProfileBadge({
  userData,
  showName = true,
  showEmail = false,
  responsive = false
}: UserProfileBadgeProps) {
  const { user: contextUser, loading: contextLoading } = useDb();
  const user = userData ? (userData as AppUser) : contextUser;
  const loading = userData ? false : contextLoading;

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        {(showName || showEmail) && !responsive && (
          <div className="space-y-1 hidden md:block">
            {showName && <Skeleton className="h-4 w-[100px]" />}
            {showEmail && <Skeleton className="h-3 w-[80px]" />}
          </div>
        )}
        {(showName || showEmail) && responsive && (
          <div className="space-y-1 hidden md:block">
            {showName && <Skeleton className="h-4 w-[100px]" />}
            {showEmail && <Skeleton className="h-3 w-[80px]" />}
          </div>
        )}
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <Avatar className={responsive ? "md:h-8 md:w-8" : "h-8 w-8"}>
        <AvatarImage src={user.metadata?.avatar_url} />
        <AvatarFallback>
          {user.display_name?.[0] || user.email?.[0]}
        </AvatarFallback>
      </Avatar>
      
      {(showName || showEmail) && (
        <div className={`${responsive ? "hidden md:block" : ""}`}>
          {showName && (
            <p className="font-medium text-sm">
              {user.display_name || "Usuario"}
            </p>
          )}
          {showEmail && (
            <p className="text-muted-foreground text-xs">
              {user.email}
            </p>
          )}
        </div>
      )}
    </div>
  );
}