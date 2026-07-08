"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Agunan {
  id: string;
  collateralId: string;
  customerName: string;
  type: string;
  status: string;
  updatedAt: string;
  handoverFormId?: string | null;
}

export default function PenyerahanClient({ agunanList }: { agunanList: Agunan[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const readyAgunan = agunanList.filter(a => a.status === "DISAHKAN" || a.status === "PROSES_PENYERAHAN");
  const selesaiAgunan = agunanList.filter(a => a.status === "SELESAI_DISERAHKAN");

  function toggleSelect(id: string) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    if (selected.length === readyAgunan.length) {
      setSelected([]);
    } else {
      setSelected(readyAgunan.map(a => a.id));
    }
  }

  async function handleProses() {
    if (selected.length === 0) return;
    setLoading(true);
    // Encode selected IDs as query param
    const ids = selected.join(",");
    router.push(`/penyerahan/form/batch?ids=${encodeURIComponent(ids)}`);
  }

  return (
    <div>
      {/* Agunan Siap Diserahkan */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: 0 }}>Agunan Siap Diserahkan</h3>
          {selected.length > 0 && (
            <button
              onClick={handleProses}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? "Memproses..." : `✅ Proses ${selected.length} Agunan Terpilih`}
            </button>
          )}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th style={{ padding: "0.75rem", width: "40px" }}>
                  <input
                    type="checkbox"
                    onChange={toggleAll}
                    checked={selected.length === readyAgunan.length && readyAgunan.length > 0}
                    title="Pilih semua"
                  />
                </th>
                <th style={{ padding: "0.75rem", color: "var(--secondary)", fontWeight: 500 }}>ID Agunan</th>
                <th style={{ padding: "0.75rem", color: "var(--secondary)", fontWeight: 500 }}>Nama Nasabah</th>
                <th style={{ padding: "0.75rem", color: "var(--secondary)", fontWeight: 500 }}>Jenis</th>
                <th style={{ padding: "0.75rem", color: "var(--secondary)", fontWeight: 500 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {readyAgunan.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--secondary)" }}>
                    Tidak ada agunan yang siap diserahkan.
                  </td>
                </tr>
              ) : (
                readyAgunan.map(agunan => {
                  const isLate = new Date().getTime() - new Date(agunan.updatedAt).getTime() > 24 * 60 * 60 * 1000;
                  const isChecked = selected.includes(agunan.id);
                  return (
                    <tr
                      key={agunan.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        backgroundColor: isChecked ? "rgba(99,102,241,0.06)" : "transparent",
                        cursor: "pointer",
                        transition: "background 0.15s"
                      }}
                      onClick={() => toggleSelect(agunan.id)}
                    >
                      <td style={{ padding: "1rem 0.75rem" }} onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(agunan.id)}
                        />
                      </td>
                      <td style={{ padding: "1rem 0.75rem", fontWeight: 500 }}>
                        {agunan.collateralId}
                        {isLate && (
                          <div style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: "0.25rem", fontWeight: "bold" }}>
                            ⚠️ Terlambat (&gt; 1 hari)
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "1rem 0.75rem" }}>{agunan.customerName}</td>
                      <td style={{ padding: "1rem 0.75rem" }}>{agunan.type}</td>
                      <td style={{ padding: "1rem 0.75rem" }}>
                        <span className={`status-badge ${agunan.status === "DISAHKAN" ? "status-info" : "status-primary"}`}>
                          {agunan.status === "DISAHKAN" ? "Siap Diserahkan" : "Proses Penyerahan"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agunan Selesai */}
      {selesaiAgunan.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: "1.5rem" }}>Riwayat Serah Terima Selesai</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)" }}>
                  <th style={{ padding: "0.75rem", color: "var(--secondary)", fontWeight: 500 }}>ID Agunan</th>
                  <th style={{ padding: "0.75rem", color: "var(--secondary)", fontWeight: 500 }}>Nama Nasabah</th>
                  <th style={{ padding: "0.75rem", color: "var(--secondary)", fontWeight: 500 }}>Jenis</th>
                  <th style={{ padding: "0.75rem", color: "var(--secondary)", fontWeight: 500 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {selesaiAgunan.map(agunan => (
                  <tr key={agunan.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "1rem 0.75rem", fontWeight: 500 }}>{agunan.collateralId}</td>
                    <td style={{ padding: "1rem 0.75rem" }}>{agunan.customerName}</td>
                    <td style={{ padding: "1rem 0.75rem" }}>{agunan.type}</td>
                    <td style={{ padding: "1rem 0.75rem" }}>
                      <a
                        href={`/penyerahan/cetak/${agunan.handoverFormId}`}
                        target="_blank"
                        className="btn btn-outline"
                        style={{ padding: "0.25rem 0.75rem", fontSize: "0.875rem", textDecoration: "none" }}
                      >
                        🖨️ Cetak Bukti
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
