"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { io } from "socket.io-client";
import BrandMark from "@/components/glitcher/BrandMark";
import RoomCodeInput from "@/components/glitcher/RoomCodeInput";
import useScreenWakeLock from "@/hooks/useScreenWakeLock";
import { GLITCHER_ASSETS } from "@/utils/glitcherAssets";

function generateRoomId(): string {
  const randomValue = new Uint32Array(1);
  window.crypto.getRandomValues(randomValue);
  return String(100000 + (randomValue[0] % 900000));
}

export default function GlitcherHomePage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useScreenWakeLock({ enabled: true, mobileOnly: true });

  const openRoom = (roomId: string) => {
    router.push(`/glitcher/room/${roomId}`);
  };

  const createRoom = () => {
    if (isBusy) return;

    setIsBusy(true);
    setErrorMessage("");

    const roomId = generateRoomId();
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "";
    const socket = io(`${socketUrl}/glitcher`, { reconnection: false });

    const fail = () => {
      socket.disconnect();
      setIsBusy(false);
      setErrorMessage("Không thể tạo phòng lúc này. Vui lòng thử lại.");
    };

    socket.once("connect_error", fail);
    socket.emit("createRoom", roomId, (success: boolean) => {
      socket.off("connect_error", fail);
      socket.disconnect();

      if (success) {
        openRoom(roomId);
        return;
      }

      setIsBusy(false);
      setErrorMessage("Mã phòng vừa tạo đã được dùng. Hãy thử lại.");
    });
  };

  const joinRoom = () => {
    if (isBusy || roomCode.length !== 6) return;

    setIsBusy(true);
    setErrorMessage("");

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "";
    const socket = io(`${socketUrl}/glitcher`, { reconnection: false });

    const fail = () => {
      socket.disconnect();
      setIsBusy(false);
      setErrorMessage("Không thể kết nối máy chủ The Glitcher.");
    };

    socket.once("connect_error", fail);
    socket.emit("checkRoom", roomCode, (exists: boolean) => {
      socket.off("connect_error", fail);
      socket.disconnect();
      setIsBusy(false);

      if (exists) {
        openRoom(roomCode);
        return;
      }

      setErrorMessage("Mã phòng không tồn tại hoặc tour đã kết thúc.");
    });
  };

  return (
    <main className="glitcher-theme glitcher-entry">
      <button
        type="button"
        onClick={() => router.push("/")}
        className="glitcher-entry__back"
        aria-label="Quay về trang chọn game"
      >
        <ArrowLeft aria-hidden="true" />
        <span>Trang chủ</span>
      </button>

      <div className="glitcher-glitch-overlay" aria-hidden="true" />

      <section className="glitcher-entry__hero" aria-label="The Glitcher">
        <BrandMark tagline="Mọi dữ liệu đều đáng ngờ" />
        <Image
          src={GLITCHER_ASSETS.raster.roseHero}
          alt=""
          aria-hidden="true"
          width={1122}
          height={1402}
          priority
          sizes="(max-width: 1023px) 38vw, 48vw"
          className="glitcher-entry__rose"
        />
      </section>

      <section className="glitcher-entry__panel" aria-labelledby="glitcher-room-heading">
        <div className="glitcher-section-heading">
          <Image
            src={GLITCHER_ASSETS.vector.divider}
            alt=""
            aria-hidden="true"
            width={640}
            height={24}
            unoptimized
          />
          <h1 id="glitcher-room-heading">Nhập mã phòng</h1>
        </div>

        <RoomCodeInput
          value={roomCode}
          onChange={(value) => {
            setRoomCode(value);
            setErrorMessage("");
          }}
          disabled={isBusy}
          hasError={Boolean(errorMessage)}
        />

        <p className="glitcher-entry__error" role="alert">
          {errorMessage}
        </p>

        <button
          type="button"
          onClick={joinRoom}
          disabled={isBusy || roomCode.length !== 6}
          className="glitcher-primary-button"
        >
          {isBusy ? <LoaderCircle className="glitcher-spinner" aria-hidden="true" /> : null}
          <span>Vào phòng</span>
        </button>

        <button
          type="button"
          onClick={createRoom}
          disabled={isBusy}
          className="glitcher-entry__create"
        >
          Tạo phòng mới
        </button>

        <p className="glitcher-entry__capacity">6–12 người</p>
      </section>
    </main>
  );
}

