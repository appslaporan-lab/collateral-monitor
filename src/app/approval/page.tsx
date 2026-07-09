import DashboardLayout from "@/components/DashboardLayout";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

export default async function ApprovalPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/login");
  }

  // Only Kabag Ops, Pimpinan Cabang, or Direktur can approve
  const role = (session.user as any).role as string;
  const canApprove = ["KABAG_OPERASIONAL", "PIMPINAN_CABANG", "DIREKTUR"].includes(role);

  const pendingRequests = await prisma.collateralRequest.findMany({
    where: { status: "PENDING" },
    include: { 
      collateral: {
        include: {
          items: true
        }
      },
      requestor: true
    },
    orderBy: { createdAt: "asc" }
  });

  const processedRequests = await prisma.collateralRequest.findMany({
    where: { 
      approverId: (session.user as any).id,
      status: { not: "PENDING" }
    },
    include: { 
      collateral: {
        include: {
          items: true
        }
      }
    },
    orderBy: { updatedAt: "desc" },
    take: 5
  });

  async function handleApproval(formData: FormData) {
    "use server";
    
    const requestId = formData.get("requestId") as string;
    const action = formData.get("action") as string; // 'approve' or 'reject'
    const collateralId = formData.get("collateralId") as string;

    const userSession = await getServerSession(authOptions);
    if (!userSession) return;

    if (action === "approve") {
      await prisma.collateralRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          approverId: userSession.user.id
        }
      });
      await prisma.collateral.update({
        where: { id: collateralId },
        data: { status: "DISAHKAN" }
      });
    } else if (action === "reject") {
      await prisma.collateralRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          approverId: userSession.user.id
        }
      });
      await prisma.collateral.update({
        where: { id: collateralId },
        data: { status: "DI_BRANKAS" } // return back to safe
      });
    }

    revalidateTag("collaterals");
    revalidatePath("/approval");
    revalidatePath("/");
  }

  const purposeLabels: Record<string, string> = {
    PELUNASAN_LANGSUNG: "Pelunasan Langsung",
    MELALUI_KEPALA_KAS: "Melalui Kepala Kas",
    MUTASI_ANTAR_KANTOR: "Mutasi Antar Kantor",
    PENCAIRAN_ULANG: "Pencairan Ulang"
  };

  if (!canApprove) {
    return (
      <DashboardLayout>
        <div className="page-content animate-fade-in">
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Akses Ditolak</h2>
            <p>Hanya Kabag Operasional, Pimpinan Cabang, dan Direktur yang dapat melakukan approval pengeluaran agunan.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-content animate-fade-in">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>Persetujuan Pengeluaran</h1>
          <p>Daftar permohonan pengeluaran agunan yang menunggu persetujuan (approval).</p>
        </div>

        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>Menunggu Persetujuan ({pendingRequests.length})</h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>ID Agunan</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>Nasabah / Jenis</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>Tujuan</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>Diajukan Oleh</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary)' }}>Tidak ada pengajuan yang menunggu</td>
                  </tr>
                ) : (
                  pendingRequests.map(req => (
                    <tr key={req.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem 0.75rem', fontWeight: 500 }}>{req.collateral.collateralId}</td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div>{req.collateral.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>{req.collateral.items.map(it => it.type).join(", ") || "Tanpa Item"}</div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div>{purposeLabels[req.purpose]}</div>
                        {req.notes && <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Catatan: {req.notes}</div>}
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>{req.requestor.name}</td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <form action={handleApproval} style={{ display: 'flex', gap: '0.5rem' }}>
                          <input type="hidden" name="requestId" value={req.id} />
                          <input type="hidden" name="collateralId" value={req.collateral.id} />
                          <button type="submit" name="action" value="approve" className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>Setujui</button>
                          <button type="submit" name="action" value="reject" className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>Tolak</button>
                        </form>
                      </td>
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
