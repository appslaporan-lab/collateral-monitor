import { redirect } from "next/navigation";

export default async function HandoverFormRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  redirect(`/penyerahan/form/batch?ids=${resolvedParams.id}`);
}
