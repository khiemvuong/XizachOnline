import WeredogShell from "@/components/weredog/WeredogShell";

export default async function WeredogRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WeredogShell roomId={id} />;
}
