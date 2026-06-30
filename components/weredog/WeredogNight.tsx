"use client";

import { ReactNode } from "react";

interface WeredogNightProps {
  currentRole: string;
  children?: ReactNode;
}

export default function WeredogNight({ currentRole, children }: WeredogNightProps) {
  return (
    <div className="w-full h-full flex flex-col justify-between p-6">
      <div className="text-center mb-4">
        <h2 className="font-gothic-heading text-2xl text-red-500">Đêm Buông Xuống</h2>
        <p className="font-gothic-body text-sm text-[#829ea2]/80 mt-1">Đang hoạt động: {currentRole}</p>
      </div>
      <div className="my-auto w-full">
        {children}
      </div>
    </div>
  );
}
