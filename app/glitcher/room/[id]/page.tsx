import GlitcherMobileShell from "@/components/glitcher/GlitcherMobileShell";

export default async function GlitcherRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GlitcherMobileShell roomId={id} />;
}
