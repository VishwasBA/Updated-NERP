import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";

// Curated for workplace recognition messages rather than a full unicode
// emoji set — keeps the picker small and relevant instead of a giant,
// mostly-irrelevant grid.
const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  { label: "Celebrate", emojis: ["🎉", "🎊", "🥳", "🙌", "👏", "🎈", "🏆", "🥇"] },
  { label: "Appreciation", emojis: ["❤️", "💙", "💛", "💜", "🧡", "✨", "🌟", "⭐"] },
  { label: "Energy", emojis: ["🚀", "🔥", "💪", "⚡", "🎯", "📈", "💡", "🙏"] },
  { label: "Faces", emojis: ["😀", "😄", "😊", "🤩", "😍", "🤗", "👍", "💯"] },
];

export default function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Insert emoji"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Smile className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 rounded-2xl p-3">
        <div className="space-y-3">
          {EMOJI_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              <div className="grid grid-cols-8 gap-1">
                {group.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onSelect(emoji)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-base transition hover:bg-muted"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
