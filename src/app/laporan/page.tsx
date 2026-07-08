import DashboardLayout from "@/components/DashboardLayout";
import { prisma } from "@/lib/prisma";
import ExportExcelButton from "@/components/ExportExcelButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LaporanPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Fetch all collaterals
  const collaterals = await prisma.collateral.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" }
  });

  // Prepare data for Excel
  const excelData = collaterals.flatMap(c => {
    if (c.items.length === 0) {
      return [{
        "ID Agunan": c.collateralId,
        "Nama Nasabah": c.customerName,
        "No. Rekening": c.noRekening || "-",
        "Jenis Agunan": "Tanpa Item",
        "Keterangan": "-",
        "Status Terakhir": c.status,
        "No BPKB": "-",
        "No Polisi": "-",
        "Jenis Kend.": "-",
        "Merk Kend.": "-",
        "Tahun Kend.": "-",
        "No SHM": "-",
        "Pemilik SHM": "-",
        "Disetujui Oleh": c.disetujuiOleh || "-",
        "Tanggal Input": c.createdAt.toISOString().split("T")[0],
        "Terakhir Update": c.updatedAt.toISOString().split("T")[0]
      }];
    }
    return c.items.map(item => ({
      "ID Agunan": c.collateralId,
      "Nama Nasabah": c.customerName,
      "No. Rekening": c.noRekening || "-",
      "Jenis Agunan": item.type,
      "Keterangan": item.description || "-",
      "Status Terakhir": c.status,
      "No BPKB": item.noBpkb || "-",
      "No Polisi": item.noPol || "-",
      "Jenis Kend.": item.kendaraanJenis || "-",
      "Merk Kend.": item.kendaraanMerk || "-",
      "Tahun Kend.": item.kendaraanTahun || "-",
      "No SHM": item.noShm || "-",
      "Pemilik SHM": item.namaPemilikShm || "-",
      "Disetujui Oleh": c.disetujuiOleh || "-",
      "Tanggal Input": c.createdAt.toISOString().split("T")[0],
      "Terakhir Update": c.updatedAt.toISOString().split("T")[0]
    }));
  });

  const statusLabels: Record<string, string> = {
    DI_BRANKAS: "Di Brankas",
    MENUNGGU_APPROVAL: "Menunggu Approval",
    DISAHKAN: "Disahkan",
    PROSES_PENYERAHAN: "Proses Penyerahan",
    SELESAI_DISERAHKAN: "Selesai (Lunas)",
    MUTASI: "Mutasi",
    PENCAIRAN_ULANG: "Pencairan Ulang"
  };

  return (
    <DashboardLayout>
      <div className="page-content animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>Laporan Agunan</h1>
            <p>Rekapitulasi seluruh data agunan untuk keperluan pelaporan.</p>
          </div>
          <ExportExcelButton data={excelData} fileName="Laporan_Agunan_Keseluruhan" />
        </div>

        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>ID Agunan</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>Nama Nasabah</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>Jenis</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>Status</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>Terakhir Update</th>
                </tr>
              </thead>
              <tbody>
                {collaterals.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary)' }}>Belum ada data</td>
                  </tr>
                ) : (
                  collaterals.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem 0.75rem', fontWeight: 500 }}>{c.collateralId}</td>
                      <td style={{ padding: '1rem 0.75rem' }}>{c.customerName}</td>
                      <td style={{ padding: '1rem 0.75rem' }}>{c.items.map(it => it.type).join(", ") || "Tanpa Item"}</td>
                      <td style={{ padding: '1rem 0.75rem' }}>{statusLabels[c.status] || c.status}</td>
                      <td style={{ padding: '1rem 0.75rem', color: 'var(--secondary)' }}>{c.updatedAt.toLocaleDateString('id-ID')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
