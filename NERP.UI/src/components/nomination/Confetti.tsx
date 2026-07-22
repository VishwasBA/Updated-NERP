import { motion } from "framer-motion";
import { useMemo } from "react";

const COLORS = ["#2563EB", "#3B82F6", "#7C3AED", "#22C55E", "#F59E0B", "#EF4444"];

interface Piece {
  id: number;
  x: number;
  rotate: number;
  color: string;
  delay: number;
  size: number;
  shape: "rect" | "circle";
}

export default function Confetti({ count = 42 }: { count?: number }) {
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 320,
        rotate: Math.random() * 360,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 0.25,
        size: 6 + Math.random() * 6,
        shape: Math.random() > 0.5 ? "rect" : "circle",
      })),
    [count]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: -20, rotate: 0 }}
          animate={{ opacity: 0, x: p.x, y: 180, rotate: p.rotate }}
          transition={{ duration: 1.1, delay: p.delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: "50%",
            top: "20%",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : 2,
          }}
        />
      ))}
    </div>
  );
}
