import { PrintView } from "@/features/concept/print-view";

export const dynamic = "force-dynamic";

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PrintView projectId={id} />;
}
