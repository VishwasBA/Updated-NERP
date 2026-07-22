import * as React from "react";
import { UserAvatar } from "./avatar";
import { Badge } from "./badge";
import { Award, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecognitionPreviewCardProps extends React.HTMLAttributes<HTMLDivElement> {
  toName?: string | null;
  toDepartment?: string | null;
  fromName?: string | null;
  message?: string | null;
  categoryName?: string | null;
  categoryIcon?: React.ReactNode;
  categoryBg?: string;
  categoryColor?: string;
  points?: number;
  type: "appreciation" | "nomination";
}

export function RecognitionPreviewCard({
  toName,
  toDepartment,
  fromName,
  message,
  categoryName,
  categoryIcon,
  categoryBg,
  categoryColor,
  points,
  type,
  className,
  ...props
}: RecognitionPreviewCardProps) {
  const isNomination = type === "nomination";
  const defaultPlaceholder = isNomination
    ? "Your nomination reason preview will appear here."
    : "Your appreciation message will appear here.";

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all duration-200",
        className
      )}
      {...props}
    >
      {/* Visual Accent Corner Accent to match Top Performers premium look */}
      <div className="absolute top-0 right-0 h-16 w-16 overflow-hidden rounded-tr-2xl pointer-events-none">
        <div className={cn(
          "absolute -top-8 -right-8 h-16 w-16 rotate-45 opacity-10",
          isNomination ? "bg-indigo-600" : "bg-blue-600"
        )} />
      </div>

      <div className="flex items-start gap-4">
        {/* Avatar placement */}
        <UserAvatar name={toName} size="h-12 w-12" fallbackClassName="text-sm font-bold" />
        
        <div className="flex-1 min-w-0 space-y-3">
          {/* User info */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white truncate">
              {toName || <span className="text-slate-400 font-normal">Select Employee</span>}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {toDepartment || (isNomination ? "Award Nominee" : "Recipient Department")}
            </p>
          </div>

          {/* Badge positioning */}
          <div className="flex flex-wrap items-center gap-2">
            {categoryName && (
              <div
                style={{ backgroundColor: categoryBg, color: categoryColor }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-slate-200/50 dark:border-slate-700/50",
                  !categoryBg && "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                )}
              >
                {categoryIcon && <span className="flex-shrink-0">{categoryIcon}</span>}
                <span>{categoryName}</span>
              </div>
            )}

            {isNomination && points !== undefined && points > 0 && (
              <Badge className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600">
                <Award className="mr-1 h-3.5 w-3.5" />
                +{points} pts
              </Badge>
            )}

            {!isNomination && (
              <Badge className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600">
                <Heart className="mr-1 h-3.5 w-3.5 fill-current" />
                Appreciation
              </Badge>
            )}
          </div>

          {/* Typography */}
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed break-words whitespace-pre-line">
            {message || defaultPlaceholder}
          </p>

          {/* Sender */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <UserAvatar name={fromName || "You"} size="h-6 w-6" fallbackClassName="text-[9px]" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              From <span className="font-semibold text-slate-900 dark:text-white">{fromName || "You"}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
