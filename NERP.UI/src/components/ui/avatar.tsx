import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

import { getInitials } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn("aspect-square h-full w-full", className)} {...props} />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export function getAvatarColorClass(name?: string | null): string {
  const colors = [
    "bg-blue-600 text-white dark:bg-blue-700",
    "bg-indigo-600 text-white dark:bg-indigo-700",
    "bg-violet-600 text-white dark:bg-violet-700",
    "bg-purple-600 text-white dark:bg-purple-700",
    "bg-sky-600 text-white dark:bg-sky-700",
    "bg-cyan-600 text-white dark:bg-cyan-700",
    "bg-teal-600 text-white dark:bg-teal-700",
    "bg-emerald-600 text-white dark:bg-emerald-700",
  ];
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "bg-blue-600 text-white dark:bg-blue-700";
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = trimmed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

interface UserAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string | null;
  avatar?: string | null;
  size?: string;
  fallbackClassName?: string;
}

const UserAvatar = React.forwardRef<
  HTMLDivElement,
  UserAvatarProps
>(({ name, avatar, size = "h-10 w-10", className, fallbackClassName, ...props }, ref) => {
  const initials = getInitials(name);
  const colorClass = getAvatarColorClass(name);

  return (
    <div
      ref={ref}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase shadow-inner border border-white/10 select-none",
        size,
        colorClass,
        className,
        fallbackClassName
      )}
      {...props}
    >
      {initials}
    </div>
  );
});
UserAvatar.displayName = "UserAvatar";

export { Avatar, AvatarImage, AvatarFallback, UserAvatar };
