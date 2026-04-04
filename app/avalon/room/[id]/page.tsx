import AvalonBoard from "@/components/avalon/AvalonBoard";

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <main className="avalon-orientation-lock">
      <div className="avalon-orientation-blocker">
        <div className="avalon-orientation-card">
          <h2 className="avalon-orientation-title">Vui long xoay ngang dien thoai</h2>
          <p className="avalon-orientation-note">
            Phòng Avalon yêu cầu chế độ màn hình ngang để hiển thị đúng tỷ lệ trên mobile.
          </p>
        </div>
      </div>

      <div className="avalon-orientation-game">
        <AvalonBoard roomId={id} />
      </div>
    </main>
  );
}
