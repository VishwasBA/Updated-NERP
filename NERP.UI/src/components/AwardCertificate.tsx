import { ApiRecognition } from "@/services/api";

interface Props {
  recognition: ApiRecognition;
}

/**
 * Dark companion to AppreciationCard, built on the same token system:
 * Ink #1C2230 · Bronze #A9824C · Hairline (white/10) on a near-black field.
 */
export default function AwardCertificate({ recognition }: Props) {
  const formattedDate = new Date(recognition.createdAt).toLocaleDateString("en-GB");

  return (
    <div
      id={`certificate-${recognition.id}`}
      className="
        relative
        w-[900px]
        h-[620px]
        overflow-hidden
        bg-[#1C2230]
        text-white
        shadow-[0_20px_60px_rgba(0,0,0,0.35)]
      "
    >
      {/* Ground */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1C2230] via-[#181E2A] to-[#101521]" />

      {/* Hairline frame — replaces the diagonal ribbon corners with a quieter device */}
      <div className="absolute inset-7 border border-white/10" />
      <div className="absolute left-7 top-7 h-12 w-12 border-l border-t border-[#A9824C]" />
      <div className="absolute right-7 top-7 h-12 w-12 border-r border-t border-[#A9824C]" />
      <div className="absolute bottom-7 left-7 h-12 w-12 border-b border-l border-[#A9824C]" />
      <div className="absolute bottom-7 right-7 h-12 w-12 border-b border-r border-[#A9824C]" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center px-16 pt-14 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[4px] text-white/50">Nexer Recognition</p>

        <h1 className="mt-5 font-serif text-[46px] font-semibold uppercase tracking-[6px] leading-none text-white">
          Certificate
        </h1>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-px w-16 bg-[#A9824C]/60" />
          <span className="h-1 w-1 rounded-full bg-[#A9824C]" />
          <div className="h-px w-16 bg-[#A9824C]/60" />
        </div>

        <p className="mt-5 text-[11px] font-medium uppercase tracking-[2px] text-white/50">
          This certificate is proudly presented to
        </p>

        <h2 className="mt-7 font-serif text-[52px] italic font-normal leading-none text-white">
          {recognition.toEmployee?.name || "Name Surname"}
        </h2>

        <div className="mt-6 rounded-full border border-[#A9824C]/40 bg-[#A9824C]/10 px-5 py-1.5">
          <p className="text-[12px] font-semibold uppercase tracking-[1.5px] text-[#D9B575]">
            {recognition.category?.name || recognition.customCategory || "Nexer Award"}
          </p>

        </div>

        <p className="mt-5 max-w-[640px] text-center text-[13.5px] leading-7 text-white/55 italic font-medium">
          "Good job! Keep the momentum up and continue inspiring those around you."
        </p>

        {/* Footer row */}
        <div className="mt-auto mb-16 flex w-full items-center justify-center gap-16">
          <div className="w-[160px] text-center">
            <div className="h-px w-full bg-[#A9824C]/50" />
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[2px] text-white/50">Date</p>
            <p className="mt-1 text-[12px] text-white/75">{formattedDate}</p>
          </div>

          {/* Bronze seal — recolored to match the shared accent instead of bright gold */}
          <div className="relative flex h-[108px] w-[108px] flex-shrink-0 items-center justify-center rounded-full border border-[#A9824C]/50 bg-gradient-to-br from-[#3A3422] via-[#1C2230] to-[#0E1118]">
            <div className="absolute inset-[6px] rounded-full border border-[#A9824C]/30" />
            <div className="relative z-10 text-center">
              <p className="text-[10px] font-semibold tracking-[1.5px] text-[#D9B575]">BRAND</p>
              <p className="text-[10px] font-semibold tracking-[1.5px] text-[#D9B575]">AWARD</p>
              <div className="mt-1.5 text-[11px] text-[#D9B575]">★★★★★</div>
            </div>
          </div>

          <div className="w-[160px] text-center">
            <div className="h-px w-full bg-[#A9824C]/50" />
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[2px] text-white/50">Signature</p>
            <p className="mt-1 text-[12px] text-white/75">{recognition.fromEmployee?.name || "Admin"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
