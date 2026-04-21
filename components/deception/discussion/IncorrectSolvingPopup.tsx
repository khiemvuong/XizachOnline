import React from "react";
import { ShieldAlert } from "lucide-react";

export default function IncorrectSolvingPopup({ solvingResolutionNotice }: { solvingResolutionNotice: { investigatorName?: string; accusedName?: string; result?: string; } | null | undefined }) {
  return (
    <div className="fixed inset-0 z-75 flex items-center justify-center bg-[radial-gradient(circle_at_50%_20%,rgba(255,55,95,0.22),rgba(0,0,0,0.82)_55%)] p-3 backdrop-blur-md sm:p-6">
      <section className="deception-card relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[rgba(255,95,130,0.48)] bg-[linear-gradient(180deg,rgba(19,12,20,0.98),rgba(10,11,17,0.98))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.72),0_0_0_1px_rgba(255,95,130,0.2)] sm:p-8">
        <div className="pointer-events-none absolute -left-16 top-0 h-42 w-42 rounded-full bg-[radial-gradient(circle,rgba(255,84,122,0.36),transparent_70%)] blur-2xl" />
        <div className="pointer-events-none absolute -right-18 bottom-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(255,84,122,0.22),transparent_72%)] blur-2xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,transparent,rgba(255,110,146,0.92),transparent)]" />

        <div className="relative z-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(255,112,148,0.62)] bg-[radial-gradient(circle_at_35%_30%,rgba(255,120,154,0.38),rgba(84,18,34,0.48))] text-(--deception-red) shadow-[0_0_30px_rgba(255,90,125,0.34)] sm:h-20 sm:w-20">
            <ShieldAlert className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>

          <p className="mt-4 text-center text-[10px] font-black uppercase tracking-[0.24em] text-[rgba(255,186,202,0.78)]">
            Alert • Solving Result
          </p>

          <h2 className="mt-2 text-center text-3xl font-black uppercase tracking-[0.16em] text-[#ff5f85] sm:text-5xl sm:tracking-[0.18em]">
            Phá Án Sai
          </h2>

          <div className="mt-5 rounded-2xl border border-[rgba(255,110,146,0.3)] bg-[linear-gradient(145deg,rgba(255,95,130,0.1),rgba(255,95,130,0.02))] p-4 sm:mt-6 sm:p-5">
            <p className="text-center text-sm leading-relaxed text-(--on-surface-variant) sm:text-base">
              <span className="font-black uppercase tracking-[0.08em] text-(--deception-cyan)">
                {solvingResolutionNotice?.investigatorName ||
                  "Một điều tra viên"}
              </span>{" "}
              đã tố cáo sai
              {solvingResolutionNotice?.accusedName ? (
                <>
                  {" "}
                  <span className="font-black uppercase tracking-[0.08em] text-(--deception-red-soft)">
                    {solvingResolutionNotice.accusedName}
                  </span>
                </>
              ) : (
                ""
              )}
              .
            </p>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:mt-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[rgba(255,95,130,0.38)] bg-[rgba(255,95,130,0.14)] px-3 py-2 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[rgba(255,193,207,0.88)]">
                Kết quả
              </p>
              <p className="mt-1 text-sm font-black uppercase tracking-[0.12em] text-[#ff7a9b]">
                Incorrect
              </p>
            </div>

            <div className="rounded-xl border border-[rgba(255,95,130,0.38)] bg-[rgba(255,95,130,0.14)] px-3 py-2 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[rgba(255,193,207,0.88)]">
                Badge
              </p>
              <p className="mt-1 text-sm font-black uppercase tracking-[0.12em] text-[#ffd2dc]">
                Revoked
              </p>
            </div>
          </div>

          <p className="mt-4 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-(--on-surface-variant) sm:mt-5 sm:text-xs">
            Huy hiệu của người tố cáo đã bị thu hồi. Cuộc điều tra tiếp tục.
          </p>
        </div>
      </section>
    </div>
  );
}
