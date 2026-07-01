"use client";

import { type CSSProperties } from "react";
import Image from "next/image";
import { type WeredogRoleName, type RoleDisplayConfig } from "./nightConstants";

export interface AccessoryConfig {
  path: string;
  style: CSSProperties;
}

export const ACCESSORY_MAP: Record<string, AccessoryConfig> = {
  wolf: {
    path: "/werewolf/ACCESSORY/wolf.png",
    style: { top: "-65%", left: "-43%", width: "190%", height: "auto" }
  },
  shield: {
    path: "/werewolf/ACCESSORY/bodyguard.png",
    style: { top: "50%", left: "40%", width: "100%", height: "auto" }
  },
  owl: {
    path: "/werewolf/ACCESSORY/seer.png",
    style: { top: "-30%", left: "-45%", width: "190%", height: "auto" }
  },
  crown: {
    path: "/werewolf/ACCESSORY/hunter.png",
    style: { top: "-10%", left: "-80%", width: "120%", height: "auto" }
  },
  rose: {
    path: "/werewolf/ACCESSORY/cupid.png",
    style: { top: "20%", left: "60%", width: "80%", height: "auto" }
  },
  potion: {
    path: "/werewolf/ACCESSORY/witch.png",
    style: { top: "-70%", left: "10%", width: "116%", height: "auto" }
  },
  shiba: {
    path: "/werewolf/ACCESSORY/villager.png",
    style: { top: "-33%", left: "-21%", width: "140%", height: "auto" }
  },
  Elder: {
    path: "/werewolf/ACCESSORY/elerly.png",
    style: { top: "-30%", left: "25%", width: "160%", height: "auto" }
  }
};

// Expose list of accessories for Lobby to distribute
export const LOBBY_ACCESSORIES_LIST: AccessoryConfig[] = [
  ACCESSORY_MAP.wolf,
  ACCESSORY_MAP.shield,
  ACCESSORY_MAP.owl,
  ACCESSORY_MAP.crown,
  ACCESSORY_MAP.rose,
  ACCESSORY_MAP.potion,
  ACCESSORY_MAP.Elder,
  ACCESSORY_MAP.shiba,
];

interface RoleAccessoryProps {
  role?: WeredogRoleName;
  frameType?: RoleDisplayConfig["frameType"];
  customAccessory?: AccessoryConfig;
}

export default function RoleAccessory({ role, frameType, customAccessory }: RoleAccessoryProps) {
  const config = customAccessory
    ? customAccessory
    : (role === "Elder" && ACCESSORY_MAP.Elder)
    ? ACCESSORY_MAP.Elder
    : frameType
    ? ACCESSORY_MAP[frameType]
    : undefined;

  if (!config) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
      <Image
        src={config.path}
        alt={role || frameType || "accessory"}
        style={config.style}
        className="absolute pointer-events-none select-none max-w-none"
        width={300}
        height={300}
        unoptimized
      />
    </div>
  );
}
