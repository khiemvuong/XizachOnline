"use client";

import { ArrowLeft } from "lucide-react";

type ReturnConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmTone?: "cyan" | "red";
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ReturnConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Ở lại",
  confirmTone = "cyan",
  onCancel,
  onConfirm,
}: ReturnConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/72 p-4 backdrop-blur-sm">
      <section className="deception-card w-full max-w-md rounded-2xl p-5 sm:p-6">
        <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-full bg-[rgba(255,45,85,0.15)] text-(--deception-red)">
          <ArrowLeft className="h-6 w-6" />
        </div>

        <h2 className="mt-4 text-center text-2xl font-black uppercase tracking-[0.14em] text-(--on-surface)">
          {title}
        </h2>

        <p className="mt-3 text-center text-sm text-(--on-surface-variant)">
          {description}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="deception-btn-outline px-4 py-3 text-xs font-black uppercase tracking-[0.16em]"
          >
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            className={`${confirmTone === "red" ? "deception-btn-red" : "deception-btn-cyan"} px-4 py-3 text-xs font-black uppercase tracking-[0.16em]`}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
