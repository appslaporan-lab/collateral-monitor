import DashboardLayout from "@/components/DashboardLayout";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HerPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Fetch active transactions (checked out)
  const activeTransactions = await prisma.herTransaction.findMany({
    where: { status: "KELUAR" },
    include: {
      collateralItem: {
        include: {
          collateral: true
        }
      }
    },
    orderBy: { tglEstimasiKembali: "asc" }
  });

  // Fetch completed transactions (returned)
  const completedTransactions = await prisma.herTransaction.findMany({
    where: { status: "KEMBALI" },
    include: {
      collateralItem: {
        include: {
          collateral: true
        }
      }
    },
    orderBy: { tglKembali: "desc" },
    take: 20
  });

  // Calculate reminders: 2 days before tglEstimasiKembali or overdue
  const today = new Date();
  const reminderThreshold = new Date();
  reminderThreshold.setDate(today.getDate() + 2);

  const reminders = activeTransactions.filter(tx => {
    const estimasi = new Date(tx.tglEstimasiKembali);
    // Include if estimasi date is before or equal to reminderThreshold
    return estimasi <= reminderThreshold;
  });

  return (
    <DashboardLayout>
      <div className="page-content animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>Her 5 Tahunan BPKB</h1>
            <p>Pengelolaan pengeluaran BPKB untuk proses Her 5 tahunan di Samsat.</p>
          </div>
          <Link href="/her/keluar" className="btn btn-primary">
            🔑 Keluarkan BPKB untuk Her
          </Link>
        </div>

        {/* Reminders / Warning Section */}
        {reminders.length > 0 && (
          <div style={{ padding: '1rem', backgroundColor: '#fffbeb', borderLeft: '4px solid #d97706', color: '#92400e', marginBottom: '2rem', borderRadius: 'var(--radius)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>Pengingat Pengembalian BPKB ({reminders.length})</h4>
            </div>
            <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
              Daftar BPKB yang harus segera kembali dari Samsat (≤ 2 hari sebelum estimasi kembali atau terlambat):
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {reminders.map(tx => {
                const estimasi = new Date(tx.tglEstimasiKembali);
                const isOverdue = estimasi < today;
                return (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.6)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.875rem' }}>
                    <div>
                      <strong>{tx.collateralItem.collateral.customerName}</strong> ({tx.collateralItem.noPol || "NoPol -"}) - BPKB: {tx.oldNoBpkb}
                    </div>
                    <div style={{ color: isOverdue ? 'var(--danger)' : '#d97706', fontWeight: 'bold' }}>
                      {isOverdue ? "⚠️ Terlambat" : "⏰ Estimasi"}: {estimasi.toLocaleDateString('id-ID')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Transactions Table */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>🚗 BPKB Sedang di Samsat (Her 5 Tahunan)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>ID Agunan / NoPol</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>Nasabah</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>BPKB Awal</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>Petugas Her</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>Tgl Keluar</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>Estimasi Kembali</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>Pengganti Sementara</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {activeTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary)' }}>
                      Tidak ada BPKB yang sedang diproses Her 5 tahunan.
                    </td>
                  </tr>
                ) : (
                  activeTransactions.map(tx => {
                    const diffDays = Math.ceil((new Date(tx.tglEstimasiKembali).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    const badgeColor = diffDays < 0 ? 'var(--danger)' : diffDays <= 2 ? '#d97706' : 'var(--primary)';
                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          <div style={{ fontWeight: 600 }}>{tx.collateralItem.collateral.collateralId}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>{tx.collateralItem.noPol || "-"}</div>
                        </td>
                        <td style={{ padding: '1rem 0.75rem' }}>{tx.collateralItem.collateral.customerName}</td>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          <div>{tx.oldNoBpkb}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>a/n {tx.oldNamaBpkb}</div>
                        </td>
                        <td style={{ padding: '1rem 0.75rem' }}>{tx.petugasName}</td>
                        <td style={{ padding: '1rem 0.75rem' }}>{new Date(tx.tglKeluar).toLocaleDateString('id-ID')}</td>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            backgroundColor: badgeColor + '1a',
                            color: badgeColor,
                            borderRadius: '12px',
                            padding: '2px 10px',
                            fontWeight: 600
                          }}>
                            {new Date(tx.tglEstimasiKembali).toLocaleDateString('id-ID')} {diffDays < 0 ? '(Terlambat)' : `(${diffDays} hari lagi)`}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          <span style={{ fontSize: '0.875rem', backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                            📄 {tx.stnkNoticeNo || "Tidak ada STNK/Notice"}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          <Link href={`/her/kembali/${tx.id}`} className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', textDecoration: 'none' }}>
                            📥 Terima BPKB
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* History Transactions Table */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--secondary)' }}>📜 Riwayat Her BPKB (Selesai)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>ID Agunan</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>Nasabah</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>Petugas</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>BPKB Awal (Lama)</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>BPKB Baru</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>Tgl Keluar</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>Tgl Kembali</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {completedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary)' }}>
                      Belum ada riwayat pengembalian.
                    </td>
                  </tr>
                ) : (
                  completedTransactions.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem' }}>{tx.collateralItem.collateral.collateralId}</td>
                      <td style={{ padding: '0.75rem' }}>{tx.collateralItem.collateral.customerName}</td>
                      <td style={{ padding: '0.75rem' }}>{tx.petugasName}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--secondary)' }}>
                        <div>{tx.oldNoBpkb}</div>
                        <div style={{ fontSize: '0.75rem' }}>a/n {tx.oldNamaBpkb}</div>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                        <div style={{ color: tx.oldNoBpkb !== tx.newNoBpkb || tx.oldNamaBpkb !== tx.newNamaBpkb ? '#059669' : 'inherit' }}>
                          {tx.newNoBpkb}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>a/n {tx.newNamaBpkb}</div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>{new Date(tx.tglKeluar).toLocaleDateString('id-ID')}</td>
                      <td style={{ padding: '0.75rem' }}>{tx.tglKembali ? new Date(tx.tglKembali).toLocaleDateString('id-ID') : "-"}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className="status-badge status-success">Kembali</span>
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
