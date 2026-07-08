import DashboardLayout from "@/components/DashboardLayout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { unstable_cache } from "next/cache";

const getCachedStats = unstable_cache(
  async () => {
    const totalAgunan = await prisma.collateral.count({
      where: { status: "DI_BRANKAS" }
    });

    const menungguApproval = await prisma.collateral.count({
      where: { status: "MENUNGGU_APPROVAL" }
    });

    const prosesPenyerahan = await prisma.collateral.count({
      where: { status: "PROSES_PENYERAHAN" }
    });

    const agunanSelesai = await prisma.collateral.count({
      where: { status: "SELESAI_DISERAHKAN" }
    });

    return { totalAgunan, menungguApproval, prosesPenyerahan, agunanSelesai };
  },
  ["dashboard-stats"],
  { revalidate: 3600, tags: ["collaterals"] }
);

const getCachedLatestActivity = unstable_cache(
  async () => {
    return prisma.collateral.findMany({
      include: { items: true },
      orderBy: { updatedAt: "desc" },
      take: 5
    });
  },
  ["latest-collaterals"],
  { revalidate: 3600, tags: ["collaterals"] }
);

const getCachedOverdue = unstable_cache(
  async () => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return prisma.collateral.findMany({
      where: {
        status: { in: ["DISAHKAN", "PROSES_PENYERAHAN"] },
        updatedAt: { lt: oneDayAgo }
      }
    });
  },
  ["overdue-collaterals"],
  { revalidate: 3600, tags: ["collaterals"] }
);

// Ambil SEMUA BPKB yang masih keluar untuk HER (beserta data nasabah & item)
const getCachedHerActive = unstable_cache(
  async () => {
    return prisma.herTransaction.findMany({
      where: { status: "KELUAR" },
      include: {
        collateralItem: {
          include: { collateral: true }
        }
      },
      orderBy: { tglEstimasiKembali: "asc" }
    });
  },
  ["her-active"],
  { revalidate: 3600, tags: ["collaterals"] }
);

export default async function Home() {
  const { totalAgunan, menungguApproval, prosesPenyerahan, agunanSelesai } =
    await getCachedStats();
  const latestAgunan = await getCachedLatestActivity();
  const overdueHandovers = await getCachedOverdue();
  const herActive = await getCachedHerActive();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Hitung sisa hari untuk tiap transaksi HER
  const herWithDays = herActive.map(h => {
    const tgl = new Date(h.tglEstimasiKembali);
    tgl.setHours(0, 0, 0, 0);
    const diffMs = tgl.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return { ...h, diffDays };
  });

  const herNeedAlert = herWithDays.filter(h => h.diffDays <= 2);

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

  return (
    <DashboardLayout>
      <div className="page-content animate-fade-in">
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ marginBottom: "0.5rem" }}>Selamat Datang</h1>
          <p>Pantau status pergerakan dan posisi agunan dengan mudah.</p>
        </div>

        {/* Alert: Agunan terlambat diserahkan */}
        {overdueHandovers.length > 0 && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#fef2f2",
              borderLeft: "4px solid var(--danger)",
              color: "#991b1b",
              marginBottom: "1.5rem",
              borderRadius: "var(--radius)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <svg
                style={{ width: "1.25rem", height: "1.25rem" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h4 style={{ margin: 0, fontSize: "1rem" }}>
                Peringatan! Ada {overdueHandovers.length} Agunan Terlambat Diserahkan
              </h4>
            </div>
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
              Terdapat agunan yang sudah dikeluarkan dari brankas (Disahkan) lebih
              dari 1 hari namun belum dikonfirmasi selesai serah terima ke nasabah.
              Silakan cek menu <strong>Serah Terima</strong>.
            </p>
          </div>
        )}

        {/* Alert: BPKB HER mendekati / melewati tenggat */}
        {herNeedAlert.length > 0 && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#fffbeb",
              borderLeft: "4px solid #d97706",
              color: "#92400e",
              marginBottom: "1.5rem",
              borderRadius: "var(--radius)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <svg
                style={{ width: "1.25rem", height: "1.25rem" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "bold" }}>
                ⏰ Pengingat! {herNeedAlert.length} BPKB Her 5 Tahunan Harus Segera Diambil
              </h4>
            </div>
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
              BPKB berikut mendekati atau melewati estimasi kembali dari Samsat.
              Segera koordinasi dengan petugas Her. Cek detail di menu{" "}
              <strong>
                <Link href="/her" style={{ color: "inherit", textDecoration: "underline" }}>
                  Her 5 Tahunan
                </Link>
              </strong>
              .
            </p>
          </div>
        )}

        {/* Stat Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem"
          }}
        >
          <div className="card">
            <h3 style={{ fontSize: "0.875rem", color: "var(--secondary)", marginBottom: "0.5rem" }}>
              Total Agunan di Brankas
            </h3>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "var(--foreground)" }}>
              {totalAgunan}
            </p>
          </div>
          <div className="card">
            <h3 style={{ fontSize: "0.875rem", color: "var(--secondary)", marginBottom: "0.5rem" }}>
              Menunggu Approval
            </h3>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "var(--warning)" }}>
              {menungguApproval}
            </p>
          </div>
          <div className="card">
            <h3 style={{ fontSize: "0.875rem", color: "var(--secondary)", marginBottom: "0.5rem" }}>
              Proses Penyerahan
            </h3>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "var(--primary)" }}>
              {prosesPenyerahan}
            </p>
          </div>
          <div className="card">
            <h3 style={{ fontSize: "0.875rem", color: "var(--secondary)", marginBottom: "0.5rem" }}>
              Agunan Selesai Diserahkan
            </h3>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "var(--success)" }}>
              {agunanSelesai}
            </p>
          </div>
          <div className="card">
            <h3 style={{ fontSize: "0.875rem", color: "var(--secondary)", marginBottom: "0.5rem" }}>
              🚗 BPKB Sedang Her
            </h3>
            <p
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: herActive.length > 0 ? "#d97706" : "var(--foreground)"
              }}
            >
              {herActive.length}
            </p>
          </div>
        </div>

        {/* Tabel BPKB yang sedang HER */}
        {herWithDays.length > 0 && (
          <div className="card" style={{ marginBottom: "2rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <h3 style={{ fontSize: "1.125rem", margin: 0 }}>
                  🚗 BPKB Sedang Her 5 Tahunan
                </h3>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    backgroundColor: "rgba(245,158,11,0.15)",
                    color: "#b45309",
                    borderRadius: "12px",
                    padding: "2px 10px"
                  }}
                >
                  {herWithDays.length} unit
                </span>
              </div>
              <Link href="/her" className="btn btn-outline" style={{ fontSize: "0.875rem" }}>
                Kelola Her
              </Link>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: "0.9rem"
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--border)",
                      backgroundColor: "rgba(0,0,0,0.02)"
                    }}
                  >
                    <th style={{ padding: "0.6rem 1rem", color: "var(--secondary)", fontWeight: 500 }}>
                      Nasabah
                    </th>
                    <th style={{ padding: "0.6rem 1rem", color: "var(--secondary)", fontWeight: 500 }}>
                      No. BPKB
                    </th>
                    <th style={{ padding: "0.6rem 1rem", color: "var(--secondary)", fontWeight: 500 }}>
                      Petugas Her
                    </th>
                    <th style={{ padding: "0.6rem 1rem", color: "var(--secondary)", fontWeight: 500 }}>
                      Tgl Keluar
                    </th>
                    <th style={{ padding: "0.6rem 1rem", color: "var(--secondary)", fontWeight: 500 }}>
                      Est. Kembali
                    </th>
                    <th style={{ padding: "0.6rem 1rem", color: "var(--secondary)", fontWeight: 500 }}>
                      Status Pengambilan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {herWithDays.map(h => {
                    const isOverdue = h.diffDays < 0;
                    const isUrgent = h.diffDays >= 0 && h.diffDays <= 2;

                    const rowBg = isOverdue
                      ? "rgba(239,68,68,0.05)"
                      : isUrgent
                      ? "rgba(245,158,11,0.05)"
                      : "transparent";

                    const statusText = isOverdue
                      ? `Terlambat ${Math.abs(h.diffDays)} hari`
                      : h.diffDays === 0
                      ? "Hari ini!"
                      : `${h.diffDays} hari lagi`;

                    const statusColor = isOverdue
                      ? "#991b1b"
                      : isUrgent
                      ? "#92400e"
                      : "#065f46";

                    const statusBg = isOverdue
                      ? "rgba(239,68,68,0.12)"
                      : isUrgent
                      ? "rgba(245,158,11,0.15)"
                      : "rgba(16,185,129,0.12)";

                    const statusBorder = isOverdue
                      ? "rgba(239,68,68,0.4)"
                      : isUrgent
                      ? "rgba(245,158,11,0.4)"
                      : "rgba(16,185,129,0.35)";

                    const dot = isOverdue ? "🔴" : isUrgent ? "🟡" : "🟢";

                    return (
                      <tr
                        key={h.id}
                        style={{
                          borderBottom: "1px solid var(--border)",
                          backgroundColor: rowBg
                        }}
                      >
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>
                          {h.collateralItem.collateral.customerName}
                        </td>
                        <td
                          style={{
                            padding: "0.75rem 1rem",
                            fontFamily: "monospace",
                            fontSize: "0.85rem"
                          }}
                        >
                          {h.collateralItem.noBpkb || "-"}
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>{h.petugasName}</td>
                        <td style={{ padding: "0.75rem 1rem", color: "var(--secondary)" }}>
                          {new Date(h.tglKeluar).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>
                          {new Date(h.tglEstimasiKembali).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span
                            style={{
                              display: "inline-block",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              color: statusColor,
                              backgroundColor: statusBg,
                              border: `1px solid ${statusBorder}`,
                              borderRadius: "8px",
                              padding: "2px 10px"
                            }}
                          >
                            {dot} {statusText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Aktivitas Terbaru */}
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem"
            }}
          >
            <h3 style={{ fontSize: "1.125rem" }}>Aktivitas Terbaru</h3>
            <Link href="/agunan" className="btn btn-outline" style={{ fontSize: "0.875rem" }}>
              Lihat Semua
            </Link>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "0.75rem", color: "var(--secondary)", fontWeight: 500 }}>
                    ID Agunan
                  </th>
                  <th style={{ padding: "0.75rem", color: "var(--secondary)", fontWeight: 500 }}>
                    Nama Nasabah
                  </th>
                  <th style={{ padding: "0.75rem", color: "var(--secondary)", fontWeight: 500 }}>
                    Jenis
                  </th>
                  <th style={{ padding: "0.75rem", color: "var(--secondary)", fontWeight: 500 }}>
                    Status
                  </th>
                  <th style={{ padding: "0.75rem", color: "var(--secondary)", fontWeight: 500 }}>
                    Tanggal Update
                  </th>
                </tr>
              </thead>
              <tbody>
                {latestAgunan.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ padding: "2rem", textAlign: "center", color: "var(--secondary)" }}
                    >
                      Belum ada data
                    </td>
                  </tr>
                ) : (
                  latestAgunan.map(agunan => (
                    <tr key={agunan.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "1rem 0.75rem", fontWeight: 500 }}>
                        {agunan.collateralId}
                      </td>
                      <td style={{ padding: "1rem 0.75rem" }}>{agunan.customerName}</td>
                      <td style={{ padding: "1rem 0.75rem" }}>
                        {agunan.items.map(it => it.type).join(", ") || "Tanpa Item"}
                      </td>
                      <td style={{ padding: "1rem 0.75rem" }}>
                        <span
                          className={`status-badge ${statusColors[agunan.status] || "status-info"}`}
                        >
                          {statusLabels[agunan.status] || agunan.status}
                        </span>
                      </td>
                      <td style={{ padding: "1rem 0.75rem", color: "var(--secondary)" }}>
                        {new Date(agunan.updatedAt).toLocaleDateString("id-ID")}
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
