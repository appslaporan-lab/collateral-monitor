import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const roleLabels: Record<string, string> = {
    ADM_KREDIT: "Adm Kredit",
    KABAG_OPERASIONAL: "Kabag Ops",
    PIMPINAN_CABANG: "Pimpinan Cabang",
    DIREKTUR: "Direktur",
    KEPALA_KAS: "Kepala Kas",
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          AgunanMonitor
        </div>
        <nav className="sidebar-nav">
          <Link href="/" className="nav-link">
            <span>Dashboard</span>
          </Link>
          <Link href="/agunan" className="nav-link">
            <span>Data Agunan</span>
          </Link>
          <Link href="/pengeluaran" className="nav-link">
            <span>Pengajuan Keluar</span>
          </Link>
          <Link href="/approval" className="nav-link">
            <span>Persetujuan</span>
          </Link>
          <Link href="/penyerahan" className="nav-link">
            <span>Serah Terima</span>
          </Link>
          <Link href="/her" className="nav-link">
            <span>Her 5 Tahunan</span>
          </Link>
          <Link href="/laporan" className="nav-link">
            <span>Laporan (Excel)</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-header">
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Portal</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {session.user?.name} ({roleLabels[session.user?.role as string] || session.user?.role})
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {session.user?.name?.charAt(0)}
            </div>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Logout</button>
            </form>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
