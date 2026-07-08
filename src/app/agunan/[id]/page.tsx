import DashboardLayout from "@/components/DashboardLayout";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import AddItemForm from "./AddItemForm";

const statusLabels: Record<string, string> = {
  DI_BRANKAS: "Di Brankas",
  MENUNGGU_APPROVAL: "Menunggu Approval",
  DISAHKAN: "Disahkan",
  PROSES_PENYERAHAN: "Proses Penyerahan",
  SELESAI_DISERAHKAN: "Selesai (Lunas)",
  MUTASI: "Mutasi",
  PENCAIRAN_ULANG: "Pencairan Ulang"
};

const statusColors: Record<string, string> = {
  DI_BRANKAS: "status-info",
  MENUNGGU_APPROVAL: "status-warning",
  DISAHKAN: "status-info",
  PROSES_PENYERAHAN: "status-primary",
  SELESAI_DISERAHKAN: "status-success",
  MUTASI: "status-info",
  PENCAIRAN_ULANG: "status-warning"
};

export default async function AgunanDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params;
  const collateral = await prisma.collateral.findUnique({
    where: { id: resolvedParams.id },
    include: { items: true }
  });

  if (!collateral) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="page-content animate-fade-in">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Link href="/agunan" style={{ textDecoration: "none", color: "var(--secondary)", fontSize: "0.9rem" }}>
                ← Kembali ke Data Agunan
              </Link>
            </div>
            <h1 style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>Nasabah: {collateral.customerName}</h1>
            <p style={{ fontSize: "0.95rem", color: "var(--secondary)" }}>
              ID Agunan: <strong style={{ color: "var(--foreground)" }}>{collateral.collateralId}</strong> &bull; No. Rekening: <strong style={{ color: "var(--foreground)" }}>{collateral.noRekening || "-"}</strong>
            </p>
          </div>
          <div>
            <span className={`status-badge ${statusColors[collateral.status]}`}>
              {statusLabels[collateral.status]}
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem", alignItems: "start" }}>
          {/* List Items */}
          <div className="card">
            <h3 style={{ marginBottom: "1.5rem" }}>🗂️ Daftar Item Agunan ({collateral.items.length})</h3>

            {collateral.items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--secondary)" }}>
                Belum ada item agunan fisik yang terdaftar.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {collateral.items.map((item, idx) => {
                  const isBpkb = item.type.includes("BPKB");
                  const isShm = item.type.includes("SHM") || item.type.includes("SHGB");

                  return (
                    <div
                      key={item.id}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        padding: "1.25rem",
                        backgroundColor: "rgba(0,0,0,0.01)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                        <h4 style={{ margin: 0, color: "var(--primary)" }}>Item #{idx + 1}: {item.type}</h4>
                        <span style={{ fontSize: "0.8rem", color: "var(--secondary)" }}>
                          Terdaftar: {new Date(item.createdAt).toLocaleDateString("id-ID")}
                        </span>
                      </div>

                      {isBpkb && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1rem", fontSize: "0.9rem" }}>
                          <div><strong>No. BPKB:</strong> {item.noBpkb || "-"}</div>
                          <div><strong>Nama di BPKB:</strong> {item.namaBpkb || "-"}</div>
                          <div><strong>No. Polisi:</strong> {item.noPol || "-"}</div>
                          <div><strong>Kendaraan:</strong> {item.kendaraanJenis || "-"} {item.kendaraanMerk || ""} ({item.kendaraanTahun || "-"})</div>
                        </div>
                      )}

                      {isShm && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div><strong>No. SHM/SHGB:</strong> {item.noShm || "-"}</div>
                            <div><strong>Nama Pemilik:</strong> {item.namaPemilikShm || "-"}</div>
                          </div>
                          <div><strong>Alamat:</strong> {item.alamatShm || "-"}</div>
                        </div>
                      )}

                      {!isBpkb && !isShm && (
                        <div style={{ fontSize: "0.9rem", color: "var(--secondary)" }}>
                          Jenis agunan lainnya.
                        </div>
                      )}

                      {item.description && (
                        <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed var(--border)", fontSize: "0.85rem", color: "var(--secondary)" }}>
                          <strong>Keterangan:</strong> {item.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form Tambah Item Baru */}
          <div className="card">
            <h3 style={{ marginBottom: "1.5rem" }}>➕ Tambah Item Agunan Baru</h3>
            <AddItemForm collateralId={collateral.id} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
