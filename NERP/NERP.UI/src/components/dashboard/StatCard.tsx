import React, { useEffect, useState } from "react";

interface Props {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: string;
  className?: string;
}

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const to = target;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const current = Math.floor(from + (to - from) * t);
      setValue(current);
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export default function StatCard({ title, value, icon, trend, className = "" }: Props) {
  const numeric = typeof value === "number" ? value : parseInt(String(value).replace(/[^0-9-]/g, "")) || 0;
  const animated = useCountUp(numeric);

  return (
    <div className={`rounded-2xl p-4 transition-transform hover:scale-[1.02] ${className} glass card-shadow fade-in`}>
      <div className="flex items-start gap-3">
        <div className="rounded-lg p-2 bg-gradient-to-tr from-primary/10 to-secondary/10 text-primary">{icon}</div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{title}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <h3 className="text-2xl font-extrabold">{typeof value === "number" ? animated.toLocaleString() : value}</h3>
            {trend ? <span className="text-sm text-success">{trend}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
