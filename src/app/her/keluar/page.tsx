import DashboardLayout from "@/components/DashboardLayout";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { checkoutBpkbAction } from "../actions";

export default async function HerKeluarPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Fetch BPKB collateral items that are currently in the safe (DI_BRANKAS)
  const availableBpkbs = await prisma.collateralItem.findMany({
    where: {
      type: { contains: "BPKB" },
      status: "DI_BRANKAS"
    },
    include: {
      collateral: true
    },
    orderBy: {
      collateral: {
        customerName: "asc"
      }
    }
  });

  const defaultKeluar = new Date().toISOString().split('T')[0];
  const defaultEstimasi = new Date();
  defaultEstimasi.setMonth(defaultEstimasi.getMonth() + 3);
  const defaultEstimasiStr = defaultEstimasi.toISOString().split('T')[0];

  return (
    <DashboardLayout>
      <div className="page-content animate-fade-in">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>Keluarkan BPKB untuk Her 5 Tahunan</h1>
          <p>Lengkapi formulir di bawah ini untuk mencatat pengeluaran BPKB ke Samsat.</p>
        </div>

        <div className="card" style={{ maxWidth: '600px' }}>
          <form action={checkoutBpkbAction}>
            <div className="form-group">
              <label className="form-label" htmlFor="collateralItemId">Pilih BPKB di Brankas *</label>
              <select id="collateralItemId" name="collateralItemId" className="form-input" required>
                <option value="">-- Pilih BPKB Agunan --</option>
                {availableBpkbs.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.collateral.customerName} - {item.noPol || "NoPol -"} (BPKB: {item.noBpkb} a/n {item.namaBpkb})
                  </option>
                ))}
              </select>
              {availableBpkbs.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.5rem' }}>
                  Tidak ada BPKB berstatus DI_BRANKAS yang tersedia saat ini.
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="petugasName">Nama Petugas Her *</label>
              <input
                type="text"
                id="petugasName"
                name="petugasName"
                className="form-input"
                required
                placeholder="Masukkan nama petugas yang memproses"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="tglKeluar">Tanggal Her (Keluar) *</label>
                <input
                  type="date"
                  id="tglKeluar"
                  name="tglKeluar"
                  className="form-input"
                  required
                  defaultValue={defaultKeluar}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="tglEstimasiKembali">Estimasi Kembali (Maks 3 Bulan) *</label>
                <input
                  type="date"
                  id="tglEstimasiKembali"
                  name="tglEstimasiKembali"
                  className="form-input"
                  required
                  defaultValue={defaultEstimasiStr}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="stnkNoticeNo">No. STNK / Notice Pajak Pengganti Sementara *</label>
              <input
                type="text"
                id="stnkNoticeNo"
                name="stnkNoticeNo"
                className="form-input"
                required
                placeholder="Masukkan nomor STNK atau Notice Pajak sementara"
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '0.5rem' }}>
                * BPKB yang keluar dari brankas wajib diganti sementara dengan STNK / Notice pajak kendaraan.
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label" htmlFor="notes">Catatan Tambahan</label>
              <textarea
                id="notes"
                name="notes"
                className="form-input"
                rows={3}
                placeholder="Masukkan alasan atau catatan tambahan..."
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={availableBpkbs.length === 0}
              >
                💾 Simpan Transaksi Her
              </button>
              <Link href="/her" className="btn btn-outline" style={{ textDecoration: 'none' }}>
                Batal
              </Link>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
