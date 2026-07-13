import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the starting 2 letters of a name (uppercased) to use as an
 * avatar placeholder everywhere in the app, e.g. "Priya Sharma" -> "PR".
 */
/**
 * Best-effort mapping from an employee's free-text `location` field (e.g.
 * "India", "Nexer Private Limited India") to a flag emoji, purely as a
 * decorative touch. Returns "" when the location doesn't match a known
 * country so nothing fabricated ever gets rendered.
 */
const LOCATION_FLAGS: { match: RegExp; flag: string }[] = [
  { match: /india/i, flag: "🇮🇳" },
  { match: /united states|\busa\b|\bus\b/i, flag: "🇺🇸" },
  { match: /united kingdom|\buk\b/i, flag: "🇬🇧" },
  { match: /canada/i, flag: "🇨🇦" },
  { match: /australia/i, flag: "🇦🇺" },
  { match: /germany/i, flag: "🇩🇪" },
  { match: /singapore/i, flag: "🇸🇬" },
  { match: /sweden/i, flag: "🇸🇪" },
  { match: /poland/i, flag: "🇵🇱" },
  { match: /philippines/i, flag: "🇵🇭" },
];

export function getLocationFlag(location?: string | null): string {
  if (!location) return "";
  const found = LOCATION_FLAGS.find((entry) => entry.match.test(location));
  return found?.flag ?? "";
}

export function getInitials(name?: string | null): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "??";
  const parts = trimmed.split(/\s+/);
  if (parts.length > 1) {
    const firstChar = parts[0].charAt(0).toUpperCase();
    const lastChar = parts[parts.length - 1].charAt(0).toUpperCase();
    return firstChar + lastChar;
  } else {
    const word = parts[0];
    if (word.length >= 2) {
      return word.slice(0, 2).toUpperCase();
    }
    return word.toUpperCase();
  }
}
