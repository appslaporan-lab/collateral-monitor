import DashboardLayout from "@/components/DashboardLayout";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { returnBpkbAction } from "../../actions";
import Link from "next/link";

export default async function HerKembaliPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const resolvedParams = await params;
  const transaction = await prisma.herTransaction.findUnique({
    where: { id: resolvedParams.id },
    include: {
      collateralItem: {
        include: {
          collateral: true
        }
      }
    }
  });

  if (!transaction || transaction.status !== "KELUAR") {
    notFound();
  }

  const defaultKembali = new Date().toISOString().split('T')[0];

  async function submitReturn(formData: FormData) {
    "use server";
    await returnBpkbAction(resolvedParams.id, formData);
  }

  return (
    <DashboardLayout>
      <div className="page-content animate-fade-in">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>Pengembalian BPKB dari Samsat</h1>
          <p>Konfirmasi pengembalian BPKB yang telah selesai diproses Her 5 tahunan.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '2rem', alignItems: 'start' }}>
          {/* Info Card */}
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem' }}>Detail Transaksi Her</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
              <div>
                <strong>Nasabah:</strong> {transaction.collateralItem.collateral.customerName}
              </div>
              <div>
                <strong>No. Polisi:</strong> {transaction.collateralItem.noPol || "-"}
              </div>
              <div>
                <strong>Kendaraan:</strong> {transaction.collateralItem.kendaraanJenis} {transaction.collateralItem.kendaraanMerk} ({transaction.collateralItem.kendaraanTahun})
              </div>
              <hr style={{ border: '0', borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />
              <div>
                <strong>Petugas Pelaksana:</strong> {transaction.petugasName}
              </div>
              <div>
                <strong>Tanggal Keluar:</strong> {new Date(transaction.tglKeluar).toLocaleDateString('id-ID')}
              </div>
              <div>
                <strong>Estimasi Kembali:</strong> {new Date(transaction.tglEstimasiKembali).toLocaleDateString('id-ID')}
              </div>
              <div>
                <strong>Pengganti Sementara:</strong> 📄 {transaction.stnkNoticeNo || "-"}
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem' }}>Form Penerimaan BPKB</h3>
            <form action={submitReturn}>
              <div className="form-group">
                <label className="form-label" htmlFor="tglKembali">Tanggal BPKB Kembali *</label>
                <input
                  type="date"
                  id="tglKembali"
                  name="tglKembali"
                  className="form-input"
                  required
                  defaultValue={defaultKembali}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newNoBpkb">Nomor BPKB Saat Ini (Baru) *</label>
                <input
                  type="text"
                  id="newNoBpkb"
                  name="newNoBpkb"
                  className="form-input"
                  required
                  defaultValue={transaction.oldNoBpkb || ""}
                  placeholder="Masukkan nomor BPKB yang kembali dari Samsat"
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>
                  * Ubah jika nomor BPKB berubah setelah proses ganti buku / balik nama di Samsat.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newNamaBpkb">Nama Pemilik di BPKB Saat Ini (Baru) *</label>
                <input
                  type="text"
                  id="newNamaBpkb"
                  name="newNamaBpkb"
                  className="form-input"
                  required
                  defaultValue={transaction.oldNamaBpkb || ""}
                  placeholder="Masukkan nama pemilik di BPKB yang kembali"
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>
                  * Ubah jika ada balik nama kepemilikan BPKB setelah proses Her.
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label" htmlFor="notes">Catatan Tambahan (Opsional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  className="form-input"
                  rows={3}
                  placeholder="Masukkan keterangan pengembalian jika ada..."
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}>
                  📥 Selesaikan Pengembalian
                </button>
                <Link href="/her" className="btn btn-outline" style={{ textDecoration: 'none' }}>
                  Batal
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
