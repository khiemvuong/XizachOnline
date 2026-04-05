import MobileLandscapeShell from "@/components/avalon/MobileLandscapeShell";

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <MobileLandscapeShell roomId={id} />;
}
