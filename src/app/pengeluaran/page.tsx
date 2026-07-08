import DashboardLayout from "@/components/DashboardLayout";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

export default async function PengeluaranPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) redirect("/login");

  // Only show collaterals that are in the safe
  const availableCollaterals = await prisma.collateral.findMany({
    where: { status: "DI_BRANKAS" },
    include: { items: true },
    orderBy: { createdAt: "desc" }
  });

  const recentRequests = await prisma.collateralRequest.findMany({
    where: { requestorId: session.user.id },
    include: { 
      collateral: {
        include: {
          items: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  async function submitRequest(formData: FormData) {
    "use server";
    
    const collateralIdStr = formData.get("collateralId") as string;
    const purpose = formData.get("purpose") as string;
    const notes = formData.get("notes") as string;

    const userSession = await getServerSession(authOptions);
    if (!userSession) return;

    // 1. Create the request
    await prisma.collateralRequest.create({
      data: {
        collateralId: collateralIdStr,
        requestorId: userSession.user.id as string,
        purpose: purpose as any,
        notes: notes,
        status: "PENDING"
      }
    });

    // 2. Update collateral status to MENUNGGU_APPROVAL
    await prisma.collateral.update({
      where: { id: collateralIdStr },
      data: { status: "MENUNGGU_APPROVAL" }
    });

    revalidateTag("collaterals");
    revalidatePath("/pengeluaran");
    revalidatePath("/");
  }

  const purposeLabels: Record<string, string> = {
    PELUNASAN_LANGSUNG: "Pelunasan Langsung",
    MELALUI_KEPALA_KAS: "Melalui Kepala Kas",
    MUTASI_ANTAR_KANTOR: "Mutasi Antar Kantor",
    PENCAIRAN_ULANG: "Pencairan Ulang"
  };

  return (
    <DashboardLayout>
      <div className="page-content animate-fade-in">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>Pengajuan Keluar Agunan</h1>
          <p>Form untuk mengajukan pengeluaran agunan dari brankas (membutuhkan persetujuan atasan).</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Form Section */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>Buat Pengajuan</h3>
            <form action={submitRequest}>
              <div className="form-group">
                <label className="form-label" htmlFor="collateralId">Pilih Agunan di Brankas</label>
                <select id="collateralId" name="collateralId" className="form-input" required>
                  <option value="">-- Pilih Agunan --</option>
                  {availableCollaterals.map(col => (
                    <option key={col.id} value={col.id}>
                      {col.collateralId} - {col.customerName} ({col.items.map(it => it.type).join(", ") || "Tanpa Item"})
                    </option>
                  ))}
                </select>
                {availableCollaterals.length === 0 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.5rem' }}>
                    Tidak ada agunan di brankas yang tersedia untuk diajukan.
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="purpose">Tujuan Pengeluaran</label>
                <select id="purpose" name="purpose" className="form-input" required>
                  <option value="">-- Pilih Tujuan --</option>
                  <option value="PELUNASAN_LANGSUNG">Pelunasan Langsung (Nasabah Hadir)</option>
                  <option value="MELALUI_KEPALA_KAS">Melalui Kepala Kas</option>
                  <option value="MUTASI_ANTAR_KANTOR">Mutasi Antar Kantor</option>
                  <option value="PENCAIRAN_ULANG">Pencairan Ulang (Refinancing)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label" htmlFor="notes">Catatan Tambahan (Opsional)</label>
                <textarea id="notes" name="notes" className="form-input" rows={3} placeholder="Tuliskan alasan spesifik atau catatan tambahan..."></textarea>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                disabled={availableCollaterals.length === 0}
              >
                Kirim Pengajuan
              </button>
            </form>
          </div>

          {/* History Section */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>Riwayat Pengajuan Anda</h3>
            {recentRequests.length === 0 ? (
              <p style={{ color: 'var(--secondary)' }}>Belum ada riwayat pengajuan.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recentRequests.map(req => (
                  <div key={req.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong>{req.collateral.collateralId}</strong>
                      <span className={`status-badge ${req.status === 'PENDING' ? 'status-warning' : req.status === 'APPROVED' ? 'status-success' : 'status-danger'}`}>
                        {req.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--secondary)', marginBottom: '0.25rem' }}>{req.collateral.customerName}</p>
                    <p style={{ fontSize: '0.875rem' }}>Tujuan: {purposeLabels[req.purpose]}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
