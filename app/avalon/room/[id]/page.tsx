import AvalonBoard from "@/components/avalon/AvalonBoard";

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <main className="h-dvh w-full overflow-hidden avalon-landscape-wrapper">
      <AvalonBoard roomId={id} />
    </main>
  );
}
