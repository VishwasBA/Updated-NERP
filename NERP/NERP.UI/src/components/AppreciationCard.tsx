import { Award, Sparkles } from "lucide-react";
import { ApiRecognition } from "@/services/api";
import { getInitials } from "@/lib/utils";

interface Props {
  recognition: ApiRecognition;
}

/**
 * Shares the token system used across the recognition flow:
 * Ink #1C2230 · Slate #5B6478 · Hairline #E4E2DA · Parchment #FAF9F6 · Bronze #A9824C
 */
export default function AppreciationCard({ recognition }: Props) {
  const formattedDate = new Date(recognition.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      id={`card-${recognition.id}`}
      className="
        relative
        w-[800px]
        h-[560px]
        overflow-hidden
        bg-[#FAF9F6]
        shadow-[0_25px_80px_rgba(28,34,48,0.18)]
      "
    >
      {/* Subtle ambient tint, kept quiet rather than decorative blobs */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FAF9F6] via-white to-[#F4ECDD]/40" />

      {/* Outer + inner hairline frame */}
      <div className="absolute inset-5 border border-[#1C2230]/15" />
      <div className="absolute inset-8 border border-[#E4E2DA]" />

      {/* Bronze corner ticks — the page's one ornamental gesture */}
      <div className="absolute left-8 top-8 h-10 w-10 border-l-2 border-t-2 border-[#A9824C]" />
      <div className="absolute right-8 top-8 h-10 w-10 border-r-2 border-t-2 border-[#A9824C]" />
      <div className="absolute bottom-8 left-8 h-10 w-10 border-b-2 border-l-2 border-[#A9824C]" />
      <div className="absolute bottom-8 right-8 h-10 w-10 border-b-2 border-r-2 border-[#A9824C]" />

      <div className="relative z-10 flex h-full flex-col items-center px-16 py-11">
        {/* Wordmark */}
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#A9824C]" strokeWidth={1.75} />
          <span className="text-[11px] font-medium uppercase tracking-[4px] text-[#5B6478]">
            Nerp Recognition
          </span>
        </div>

        {/* Title */}
        <h1 className="mt-5 font-serif text-[44px] font-semibold uppercase tracking-[8px] text-[#1C2230]">
          Certificate
        </h1>

        <div className="mt-3 flex items-center gap-3">
          <div className="h-px w-20 bg-[#A9824C]/50" />
          <Award className="h-4 w-4 text-[#A9824C]" strokeWidth={1.75} />
          <div className="h-px w-20 bg-[#A9824C]/50" />
        </div>

        <p className="mt-3 text-[11px] font-medium uppercase tracking-[3px] text-[#9AA0AE]">
          Certificate of Appreciation
        </p>

        {/* Avatar */}
        <div className="mt-7 flex h-20 w-20 items-center justify-center rounded-full border border-[#A9824C]/40 bg-white">
          <span className="font-serif text-[26px] font-semibold text-[#1C2230]">
            {getInitials(recognition.toEmployee?.name)}
          </span>
        </div>

        {/* Recipient */}
        <p className="mt-5 text-[11px] font-medium uppercase tracking-[3px] text-[#9AA0AE]">Presented To</p>

        <h2 className="mt-2 font-serif text-[42px] italic font-normal text-[#1C2230]">
          {recognition.toEmployee?.name || "Employee Name"}
        </h2>

        <div className="mt-3 h-px w-[280px] bg-gradient-to-r from-transparent via-[#A9824C]/60 to-transparent" />

        {/* Category */}
        <div className="mt-5 rounded-full border border-[#A9824C]/30 bg-[#F4ECDD] px-5 py-1.5">
          <p className="text-[12px] font-semibold uppercase tracking-[1.5px] text-[#A9824C]">
            {recognition.category?.name || "Employee Recognition"}
          </p>
        </div>

        {/* Message */}
        <p className="mt-5 max-w-[600px] text-center text-[13.5px] leading-7 text-[#5B6478] italic font-medium">
          "Celebrating the excellence, collaboration, and value you bring every day."
        </p>

        {/* Footer */}
        <div className="mt-auto flex w-full justify-between">
          <div className="w-48">
            <div className="border-b border-[#1C2230]/20" />
            <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[2px] text-[#9AA0AE]">Date</p>
            <p className="text-center text-sm text-[#1C2230]">{formattedDate}</p>
          </div>

          <div className="w-48">
            <div className="border-b border-[#1C2230]/20" />
            <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[2px] text-[#9AA0AE]">
              Appreciated By
            </p>
            <p className="text-center text-sm text-[#1C2230]">{recognition.fromEmployee?.name || "Manager"}</p>
          </div>
        </div>

        {/* Seal */}
        <div className="absolute bottom-24 right-16 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#A9824C] bg-white">
          <Award className="h-6 w-6 text-[#A9824C]" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}
