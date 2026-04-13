"use client";

import { useMemo, useState } from "react";
import {
  AvalonRoom,
  AvalonSkillType,
  AvalonSkillUsageLog,
} from "@/server/game/AvalonTypes";
import { BookOpenText, ChevronDown, ChevronUp } from "lucide-react";

const QUEST_PHASES = [1, 2, 3, 4, 5];

const SKILL_LABEL: Record<AvalonSkillType, string> = {
  none: "Không có kỹ năng",
  merlinEternalBond: "Đồng Quy Vô Tận",
  assassinInsight: "Soi Vai",
  morganaSilence: "Đêm Câm Lặng",
  mordredForceFail: "Nguyền Thất Bại",
  athenaFateFlip: "Đảo Mệnh",
  percivalTrace: "Truy Vết",
  minionChaCha: "Cha Cha Minion",
};

function formatLogLine(log: AvalonSkillUsageLog) {
  const skill = SKILL_LABEL[log.skillType] ?? log.skillType;
  const targetSuffix = log.targetName ? ` -> ${log.targetName}` : "";
  return `${log.actorName} dùng ${skill}${targetSuffix}`;
}

export default function SkillUsageHistoryPanel({
  gameState,
}: {
  gameState: AvalonRoom;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const questLogsByPhase = useMemo(() => {
    const map = new Map<number, AvalonSkillUsageLog[]>();
    const history = gameState.skillUsageHistory ?? [];

    history.forEach((log) => {
      if (log.phase !== "quest" || log.questNumber == null) return;
      if (!map.has(log.questNumber)) {
        map.set(log.questNumber, []);
      }
      map.get(log.questNumber)!.push(log);
    });

    return map;
  }, [gameState.skillUsageHistory]);

  const finalPhaseLogs = useMemo(
    () =>
      (gameState.skillUsageHistory ?? []).filter(
        (log) => log.phase === "preAssassination",
      ),
    [gameState.skillUsageHistory],
  );

  return (
    <div className="fixed left-4 top-4 z-110 pointer-events-auto">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/35 bg-black/60 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-100 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-md transition-colors hover:bg-cyan-500/15 cursor-pointer"
      >
        <BookOpenText className="h-4 w-4" />
        {isOpen ? "Ẩn Log Kỹ Năng" : "Xem Log Kỹ Năng"}
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {isOpen && (
        <div className="mt-2 w-[min(92vw,420px)] rounded-xl border border-cyan-300/25 bg-black/70 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.6)] backdrop-blur-lg">
          <div className="mb-3 rounded-lg border border-cyan-300/20 bg-cyan-500/10 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100/80">
              Lịch Sử Kỹ Năng 5 Phase
            </p>
            <p className="mt-1 text-[11px] text-cyan-50/80">
              Bảng này chỉ hiển thị những kỹ năng đã thực sự được kích hoạt.
            </p>
          </div>

          <div className="max-h-[68vh] space-y-2 overflow-y-auto pr-1 custom-avalon-scrollbar">
            {QUEST_PHASES.map((phaseNumber) => {
              const logs = questLogsByPhase.get(phaseNumber) ?? [];

              return (
                <div
                  key={phaseNumber}
                  className="rounded-lg border border-white/10 bg-slate-900/55 p-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100">
                      Phase {phaseNumber}
                    </p>
                    <span className="text-[9px] uppercase tracking-[0.14em] text-cyan-50/60">
                      {logs.length} kỹ năng
                    </span>
                  </div>

                  {logs.length === 0 ? (
                    <p className="mt-1 text-[11px] text-slate-300/70">
                      Không có kỹ năng được dùng.
                    </p>
                  ) : (
                    <div className="mt-1.5 space-y-1">
                      {logs.map((log) => (
                        <div
                          key={log.id}
                          className="rounded-md border border-cyan-300/12 bg-cyan-500/6 px-2 py-1.5"
                        >
                          <p className="text-[11px] text-cyan-50/90">
                            {formatLogLine(log)}
                          </p>
                          {log.detail && (
                            <p className="mt-0.5 text-[10px] text-cyan-100/65">
                              {log.detail}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {finalPhaseLogs.length > 0 && (
              <div className="rounded-lg border border-amber-300/20 bg-amber-500/10 p-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-100">
                  Phase Cuối Trước Ám Sát
                </p>
                <div className="mt-1.5 space-y-1">
                  {finalPhaseLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-md border border-amber-200/20 bg-amber-500/10 px-2 py-1.5"
                    >
                      <p className="text-[11px] text-amber-50/90">
                        {formatLogLine(log)}
                      </p>
                      {log.detail && (
                        <p className="mt-0.5 text-[10px] text-amber-50/70">
                          {log.detail}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
