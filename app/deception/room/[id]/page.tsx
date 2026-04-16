import DeceptionMobileShell from "@/components/deception/DeceptionMobileShell";

export default async function DeceptionRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DeceptionMobileShell roomId={id} />;
}
