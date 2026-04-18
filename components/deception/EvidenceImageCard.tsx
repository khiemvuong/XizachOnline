import {
  getResolvedClueImageUrl,
  getResolvedMeansImageUrl,
} from "@/utils/deceptionAssets";

interface EvidenceImageCardProps {
  id?: number | null;
  tone: "means" | "clue";
  english?: string;
  vietnamese?: string;
  className?: string;
  label?: string; // Optional custom top label, defaults to "Hung khí" or "Manh mối"
}

export default function EvidenceImageCard({
  id,
  tone,
  english,
  vietnamese,
  className = "h-full w-full",
  label,
}: EvidenceImageCardProps) {
  const isMeans = tone === "means";
  const imageUrl = id
    ? isMeans
      ? getResolvedMeansImageUrl(id)
      : getResolvedClueImageUrl(id)
    : "";
  const displayLabel = label || (isMeans ? "Hung khí" : "Manh mối");

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${className}`}
      style={{
        borderColor: isMeans ? "rgba(255,184,0,0.4)" : "rgba(0,212,255,0.4)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: imageUrl
            ? `url(${imageUrl})`
            : isMeans
            ? "linear-gradient(180deg,rgba(50,30,5,0.5),rgba(18,10,3,0.8))"
            : "linear-gradient(180deg,rgba(5,30,48,0.5),rgba(3,10,20,0.8))",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(to_top,rgba(0,0,0,0.9),transparent)]" />
      <div className="absolute inset-x-0 bottom-0 p-2">
        <p
          className="text-[8px] font-black uppercase tracking-widest"
          style={{ color: isMeans ? "#ffb84a" : "#00d4ff" }}
        >
          {displayLabel}
        </p>
        <p className="mt-0.5 text-[12px] font-bold uppercase leading-tight text-white drop-shadow-md">
          {vietnamese || english || (id ? String(id) : "?")}
        </p>
      </div>
    </div>
  );
}
