import Image from "next/image";

interface AvatarDisplayProps {
  avatarUrl?: string | null;
  name: string;
  size?: number;
  className?: string;
}

/**
 * Reusable avatar circle: shows uploaded image or falls back to first-letter initial.
 */
export default function AvatarDisplay({
  avatarUrl,
  name,
  size,
  className = "",
}: AvatarDisplayProps) {
  const initial = (name || "?").charAt(0).toUpperCase();
  const inlineStyle = size ? { width: size, height: size } : {};

  if (avatarUrl) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full ${className}`}
        style={inlineStyle}
      >
        <Image
          src={avatarUrl}
          alt={name}
          fill
          sizes={size ? `${size}px` : "40px"}
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)] font-bold uppercase ${className}`}
      style={{
        ...inlineStyle,
        fontSize: size ? size * 0.38 : undefined,
      }}
    >
      {initial}
    </div>
  );
}
