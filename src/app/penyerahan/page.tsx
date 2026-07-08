import DashboardLayout from "@/components/DashboardLayout";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PenyerahanClient from "./PenyerahanClient";

export default async function PenyerahanPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const agunanList = await prisma.collateral.findMany({
    where: {
      status: { in: ["DISAHKAN", "PROSES_PENYERAHAN", "SELESAI_DISERAHKAN"] }
    },
    include: {
      items: true
    },
    orderBy: { updatedAt: "desc" }
  });

  // Serialize dates to strings for client component
  const serialized = agunanList.map(a => ({
    id: a.id,
    collateralId: a.collateralId,
    customerName: a.customerName,
    type: a.items.map(it => it.type).join(", ") || "Tanpa Item",
    status: a.status,
    updatedAt: a.updatedAt.toISOString(),
    handoverFormId: a.handoverFormId
  }));

  return (
    <DashboardLayout>
      <div className="page-content animate-fade-in">
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ marginBottom: "0.5rem" }}>Serah Terima Agunan</h1>
          <p>Pilih satu atau lebih agunan yang akan diserahterimakan sekaligus dalam satu Berita Acara.</p>
        </div>
        <PenyerahanClient agunanList={serialized} />
      </div>
    </DashboardLayout>
  );
}
