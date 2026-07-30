import Image from "next/image";
import { GLITCHER_ASSETS } from "@/utils/glitcherAssets";

export default function BrandMark({
  compact = false,
  tagline,
  className = "",
}: {
  compact?: boolean;
  tagline?: string;
  className?: string;
}) {
  return (
    <div className={`glitcher-brand ${compact ? "glitcher-brand--compact" : ""} ${className}`}>
      <Image
        src={GLITCHER_ASSETS.vector.brandMark}
        alt=""
        aria-hidden="true"
        width={160}
        height={160}
        unoptimized
        className="glitcher-brand__mark"
      />
      <div className="glitcher-brand__copy">
        <span className="glitcher-brand__name">
          <span>The</span>
          <strong>Glitcher</strong>
        </span>
        {tagline ? <span className="glitcher-brand__tagline">{tagline}</span> : null}
      </div>
    </div>
  );
}

