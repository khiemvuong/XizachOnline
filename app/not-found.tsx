import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#070b12] px-6 text-[#f5f7fa]">
      <section className="w-full max-w-lg border border-white/15 bg-[#0d1420] p-8 text-center shadow-2xl sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8be0d0]">
          404 · Pangames
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
          Trang bạn yêu cầu không tồn tại
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-400 sm:text-base">
          Đường dẫn có thể đã bị xóa, thay đổi hoặc chưa bao giờ tồn tại.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center justify-center border border-[#8be0d0]/60 bg-[#8be0d0] px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-[#071015] transition hover:bg-[#b6f4e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Về trang chủ
        </Link>
      </section>
    </main>
  );
}
