"use client";

import Image from "next/image";
import { useEffect } from "react";
import { Fingerprint, MapPinned, X } from "lucide-react";
import type { GlitcherPrivateCard } from "@/server/game/GlitcherTypes";
import { GLITCHER_ASSETS } from "@/utils/glitcherAssets";

export default function PrivateCardModal({
  card,
  onClose,
}: {
  card: GlitcherPrivateCard;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="glitcher-private-card-layer">
      <button
        type="button"
        className="glitcher-private-card-layer__backdrop"
        onClick={onClose}
        aria-label="Đóng hồ sơ riêng"
      />

      <section
        className="glitcher-private-card-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="glitcher-private-card-title"
        aria-describedby="glitcher-private-card-description"
      >
        <Image
          src={GLITCHER_ASSETS.raster.roseDataCore}
          alt=""
          aria-hidden="true"
          width={420}
          height={420}
          className="glitcher-private-card-dialog__art"
        />

        <header className="glitcher-private-card-dialog__header">
          <div>
            <span>Hồ sơ riêng · Chỉ mình bạn thấy</span>
            <h1 id="glitcher-private-card-title">Dữ liệu màn chơi</h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="glitcher-icon-button"
            aria-label="Đóng hồ sơ riêng"
            autoFocus
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="glitcher-private-card-dialog__content">
          <article className="glitcher-private-card-dialog__scene">
            <div className="glitcher-private-card-dialog__label">
              <MapPinned aria-hidden="true" />
              <span>Hiện trường của bạn</span>
            </div>
            <h2>{card.scene.title}</h2>
            <p id="glitcher-private-card-description">{card.scene.description}</p>
          </article>

          <article className="glitcher-private-card-dialog__role">
            <div className="glitcher-private-card-dialog__label">
              <Fingerprint aria-hidden="true" />
              <span>Vai của bạn</span>
            </div>
            <h2>{card.role.name}</h2>
            <p>{card.role.action}</p>
          </article>
        </div>

        <footer>
          <span>Nhấn Esc hoặc chạm ra ngoài để đóng</span>
          <button type="button" onClick={onClose} className="glitcher-primary-button">
            Đã nhớ
          </button>
        </footer>
      </section>
    </div>
  );
}
