"use client";

import { useState } from "react";

interface Agunan {
  id: string;
  collateralDbId: string;  // Parent collateral ID for detail page link
  collateralId: string;
  customerName: string;
  type: string;
  description: string | null;
  status: string;
  itemStatus: string;  // CollateralItemStatus: DI_BRANKAS | KELUAR_HER
  noRekening: string | null;
  noBpkb: string | null;
  noShm: string | null;
  createdAt: string;
}

interface Props {
  grouped: { customerName: string; items: Agunan[] }[];
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
}

export default function AgunanGrouped({ grouped, statusColors, statusLabels }: Props) {
  const [expanded, setExpanded] = useState<string[]>(grouped.map(g => g.customerName));
  const [search, setSearch] = useState("");

  function toggleGroup(name: string) {
    setExpanded(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  }

  const filtered = grouped.filter(g =>
    g.customerName.toLowerCase().includes(search.toLowerCase()) ||
    g.items.some(a =>
      a.collateralId.toLowerCase().includes(search.toLowerCase()) ||
      (a.noRekening || "").toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div>
      {/* Search bar */}
      <div style={{ marginBottom: "1.5rem" }}>
        <input
          type="text"
          className="form-input"
          placeholder="🔍 Cari nama nasabah, ID agunan, atau no rekening..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: "420px" }}
        />
      </div>

      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--secondary)" }}>
          Tidak ada data yang cocok dengan pencarian.
        </div>
      )}

      {filtered.map(group => {
        const isOpen = expanded.includes(group.customerName);
        const activeCount = group.items.filter(a => a.status !== "SELESAI_DISERAHKAN").length;

        return (
          <div key={group.customerName} className="card" style={{ marginBottom: "1rem", padding: 0, overflow: "hidden" }}>
            {/* Group Header — click to expand/collapse */}
            <div
              onClick={() => toggleGroup(group.customerName)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem 1.5rem",
                cursor: "pointer",
                backgroundColor: isOpen ? "rgba(99,102,241,0.06)" : "transparent",
                borderBottom: isOpen ? "1px solid var(--border)" : "none",
                transition: "background 0.2s",
                userSelect: "none"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>👤 {group.customerName}</span>
                <span style={{
                  fontSize: "0.75rem",
                  backgroundColor: "rgba(99,102,241,0.15)",
                  color: "var(--primary)",
                  borderRadius: "12px",
                  padding: "2px 10px",
                  fontWeight: 600
                }}>
                  {group.items.length} Agunan
                </span>
                {activeCount > 0 && (
                  <span style={{
                    fontSize: "0.75rem",
                    backgroundColor: "rgba(245,158,11,0.15)",
                    color: "#d97706",
                    borderRadius: "12px",
                    padding: "2px 10px",
                    fontWeight: 600
                  }}>
                    {activeCount} Aktif
                  </span>
                )}
              </div>
              <span style={{ fontSize: "1.25rem", color: "var(--secondary)", transition: "transform 0.2s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
                ›
              </span>
            </div>

            {/* Agunan Table — collapsible */}
            {isOpen && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "rgba(0,0,0,0.02)" }}>
                      <th style={{ padding: "0.6rem 1rem", color: "var(--secondary)", fontWeight: 500 }}>ID Agunan</th>
                      <th style={{ padding: "0.6rem 1rem", color: "var(--secondary)", fontWeight: 500 }}>Jenis</th>
                      <th style={{ padding: "0.6rem 1rem", color: "var(--secondary)", fontWeight: 500 }}>No. Rekening</th>
                      <th style={{ padding: "0.6rem 1rem", color: "var(--secondary)", fontWeight: 500 }}>Detail</th>
                      <th style={{ padding: "0.6rem 1rem", color: "var(--secondary)", fontWeight: 500 }}>Keterangan</th>
                      <th style={{ padding: "0.6rem 1rem", color: "var(--secondary)", fontWeight: 500 }}>Status</th>
                      <th style={{ padding: "0.6rem 1rem", color: "var(--secondary)", fontWeight: 500 }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map(agunan => {
                      let detail = "-";
                      if (agunan.type.includes("BPKB")) detail = agunan.noBpkb ? `No.BPKB: ${agunan.noBpkb}` : "-";
                      if (agunan.type.includes("SHM") || agunan.type.includes("SHGB")) detail = agunan.noShm ? `No.SHM: ${agunan.noShm}` : "-";

                      return (
                        <tr
                          key={agunan.id}
                          style={{ borderBottom: "1px solid var(--border)" }}
                        >
                          <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>{agunan.collateralId}</td>
                          <td style={{ padding: "0.75rem 1rem" }}>{agunan.type}</td>
                          <td style={{ padding: "0.75rem 1rem" }}>{agunan.noRekening || "-"}</td>
                          <td style={{ padding: "0.75rem 1rem", color: "var(--secondary)", fontSize: "0.85rem" }}>{detail}</td>
                          <td style={{ padding: "0.75rem 1rem" }}>
                             {agunan.itemStatus === "KELUAR_HER" ? (
                               <span style={{
                                 display: "inline-flex",
                                 alignItems: "center",
                                 gap: "4px",
                                 fontSize: "0.75rem",
                                 fontWeight: 700,
                                 color: "#b45309",
                                 backgroundColor: "rgba(245,158,11,0.15)",
                                 border: "1px solid rgba(245,158,11,0.4)",
                                 borderRadius: "8px",
                                 padding: "2px 10px",
                                 letterSpacing: "0.04em"
                               }}>
                                 🚗 HER
                               </span>
                             ) : (
                               agunan.description || "-"
                             )}
                           </td>
                          <td style={{ padding: "0.75rem 1rem" }}>
                            <span className={`status-badge ${statusColors[agunan.status] || "status-info"}`}>
                              {statusLabels[agunan.status] || agunan.status}
                            </span>
                          </td>
                          <td style={{ padding: "0.75rem 1rem" }}>
                            <a
                              href={`/agunan/${agunan.collateralDbId}`}
                              className="btn btn-outline"
                              style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", textDecoration: "none" }}
                            >
                              Detail
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
