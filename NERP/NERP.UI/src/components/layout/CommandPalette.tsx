import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Award, Trophy, Star, Gift, User, Bell, History, Shield, Users, Building2, Users2 } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useAuth } from "@/contexts/AuthContext";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const go = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  const pages = [
    { to: "/", label: "Dashboard", icon: Home },
    { to: "/directory", label: "Employee Directory", icon: Users2 },
    { to: "/appreciate", label: "Appreciate an Employee", icon: Star },
    { to: "/nominations", label: "Nominations", icon: Award },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { to: "/my-recognitions", label: "Wall of Fame", icon: Award },
    { to: "/redeem", label: "Rewards Store", icon: Gift },
    { to: "/redeem-history", label: "Redeem History", icon: History },
  ];

  const account = [
    { to: "/profile", label: "My Profile", icon: User },
    { to: "/notifications", label: "Notifications", icon: Bell },
    ...(user?.userRole === "manager" ? [{ to: "/manager-dashboard", label: "My Team", icon: Users }] : []),
    ...(user?.userRole === "admin"
      ? [
          { to: "/all-teams", label: "All Teams", icon: Building2 },
          { to: "/admin", label: "Admin Dashboard", icon: Shield },
        ]
      : []),
  ];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search employees, recognitions, rewards…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {pages.map((p) => (
            <CommandItem key={p.to} onSelect={() => go(p.to)}>
              <p.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Account">
          {account.map((p) => (
            <CommandItem key={p.to} onSelect={() => go(p.to)}>
              <p.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {p.label}
              <CommandShortcut>↵</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/** Registers the global Ctrl+K / Cmd+K shortcut. Call once from AppLayout. */
export function useCommandPaletteShortcut(setOpen: (fn: (v: boolean) => boolean) => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setOpen]);
}

export function useCommandPaletteState() {
  return useState(false);
}
