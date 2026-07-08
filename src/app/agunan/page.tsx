import DashboardLayout from "@/components/DashboardLayout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AgunanGrouped from "./AgunanGrouped";

const statusColors: Record<string, string> = {
  DI_BRANKAS: "status-info",
  MENUNGGU_APPROVAL: "status-warning",
  DISAHKAN: "status-info",
  PROSES_PENYERAHAN: "status-primary",
  SELESAI_DISERAHKAN: "status-success",
  MUTASI: "status-info",
  PENCAIRAN_ULANG: "status-warning"
};

const statusLabels: Record<string, string> = {
  DI_BRANKAS: "Di Brankas",
  MENUNGGU_APPROVAL: "Menunggu Approval",
  DISAHKAN: "Disahkan",
  PROSES_PENYERAHAN: "Proses Penyerahan",
  SELESAI_DISERAHKAN: "Selesai (Lunas)",
  MUTASI: "Mutasi",
  PENCAIRAN_ULANG: "Pencairan Ulang"
};

export default async function AgunanPage() {
  const collaterals = await prisma.collateral.findMany({
    include: { items: true },
    orderBy: [{ customerName: "asc" }, { createdAt: "asc" }]
  });

  const grouped = collaterals.map(c => ({
    customerName: c.customerName,
    items: c.items.map(item => ({
      id: item.id,           // CollateralItem ID — unique per row (used as React key)
      collateralDbId: c.id,  // Parent Collateral ID — used for detail page link
      collateralId: c.collateralId,
      customerName: c.customerName,
      type: item.type,
      description: item.description,
      status: c.status,
      itemStatus: item.status, // CollateralItemStatus: DI_BRANKAS | KELUAR_HER
      noRekening: c.noRekening,
      noBpkb: item.noBpkb,
      noShm: item.noShm,
      createdAt: item.createdAt.toISOString()
    }))
  }));

  return (
    <DashboardLayout>
      <div className="page-content animate-fade-in">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ marginBottom: "0.5rem" }}>Data Agunan Nasabah</h1>
            <p>
              {grouped.length} nasabah &bull; {collaterals.length} agunan total
            </p>
          </div>
          <Link href="/agunan/tambah" className="btn btn-primary">
            + Tambah Agunan Baru
          </Link>
        </div>

        {/* Grouped table */}
        {grouped.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--secondary)" }}>
            Belum ada data agunan. Klik tombol &ldquo;Tambah Agunan Baru&rdquo; untuk memulai.
          </div>
        ) : (
          <AgunanGrouped
            grouped={grouped}
            statusColors={statusColors}
            statusLabels={statusLabels}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
