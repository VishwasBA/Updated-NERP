import * as React from "react";
import { ScrollArea, ScrollBar } from "./scroll-area";
import { cn } from "@/lib/utils";


interface ScrollableContainerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "dir"> {
  maxHeight?: string;
}

export function ScrollableContainer({
  maxHeight = "350px",
  className,
  children,
  ...props
}: ScrollableContainerProps) {
  return (
    <ScrollArea
      style={{ maxHeight }}
      className={cn("w-full pr-3", className)}
      {...props}
    >
      {children}
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  );
}
