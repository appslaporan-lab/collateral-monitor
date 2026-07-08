import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PrintAction from "@/components/PrintAction";

export default async function CetakHandoverPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const handover = await prisma.handoverForm.findUnique({
    where: { id: resolvedParams.id },
    include: {
      collaterals: {
        include: {
          items: true
        }
      },
      admin: true,
    }
  });

  if (!handover || handover.collaterals.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Berita Acara tidak ditemukan.</h2>
        <a href="/penyerahan">← Kembali</a>
      </div>
    );
  }

  // Flatten all items across all collaterals in the handover
  const allItems = handover.collaterals.flatMap(c =>
    c.items.map(item => ({
      ...item,
      parentCollateralId: c.collateralId,
      parentNoRekening: c.noRekening
    }))
  );

  const tgl = handover.handoverDate.toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  const tglLunas = handover.tanggalLunas
    ? handover.tanggalLunas.toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })
    : "-";

  return (
    <div style={{ backgroundColor: "white", color: "black", minHeight: "100vh" }}>
      <PrintAction />

      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4; margin: 12mm; }
          body { font-size: 11px; }
        }
        .print-page {
          padding: 20px 28px;
          max-width: 800px;
          margin: 0 auto;
          font-family: 'Arial', sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
        }
      `}</style>

      <div className="print-page">
        {/* ===== HEADER ===== */}
        <div style={{
          display: "flex", alignItems: "center", gap: "16px",
          borderBottom: "2.5px solid #000", paddingBottom: "10px", marginBottom: "12px"
        }}>
          <img src="/logo.png" alt="Logo" style={{ height: "60px", objectFit: "contain" }} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontWeight: "bold", fontSize: "15px", letterSpacing: "0.5px" }}>
              BERITA ACARA SERAH TERIMA AGUNAN
            </div>
            <div style={{ fontSize: "11px", color: "#444", marginTop: "2px" }}>
              No. Dokumen: {handover.id}
            </div>
          </div>
        </div>

        {/* ===== PEMBUKA ===== */}
        <p style={{ marginBottom: "10px", fontSize: "12px" }}>
          Pada hari ini <strong>{tgl}</strong>, telah dilakukan serah terima agunan dengan rincian sebagai berikut:
        </p>

        {/* ===== INFO UMUM (2 kolom) ===== */}
        <table style={{ width: "100%", marginBottom: "10px", fontSize: "12px" }}>
          <tbody>
            <tr>
              <td style={{ width: "35%", padding: "2px 0", verticalAlign: "top" }}><strong>Nama Nasabah</strong></td>
              <td style={{ width: "2%", padding: "2px 0" }}>:</td>
              <td style={{ padding: "2px 0" }}>{handover.customerName}</td>
              <td style={{ width: "35%", padding: "2px 0 2px 16px", verticalAlign: "top" }}><strong>Tanggal Lunas</strong></td>
              <td style={{ width: "2%", padding: "2px 0" }}>:</td>
              <td style={{ padding: "2px 0" }}>{tglLunas}</td>
            </tr>
            <tr>
              <td style={{ padding: "2px 0", verticalAlign: "top" }}><strong>Diserahkan Oleh</strong></td>
              <td style={{ padding: "2px 0" }}>:</td>
              <td style={{ padding: "2px 0" }}>
                {handover.admin.name}
                <br />
                <span style={{ fontSize: "10px", color: "#555" }}>({handover.admin.role.replace(/_/g, " ")})</span>
              </td>
              <td style={{ padding: "2px 0 2px 16px", verticalAlign: "top" }}><strong>Menyetujui</strong></td>
              <td style={{ padding: "2px 0" }}>:</td>
              <td style={{ padding: "2px 0" }}>
                {handover.disetujuiOleh
                  ? handover.disetujuiOleh.split(" - ")[0]
                  : "-"}
                {handover.disetujuiOleh && handover.disetujuiOleh.includes(" - ") && (
                  <><br /><span style={{ fontSize: "10px", color: "#555" }}>({handover.disetujuiOleh.split(" - ")[1].replace(/_/g, " ")})</span></>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ===== TABEL AGUNAN ===== */}
        <div style={{ marginBottom: "10px" }}>
          <strong style={{ fontSize: "12px" }}>Daftar Agunan yang Diserahkan:</strong>
          <table style={{
            width: "100%", borderCollapse: "collapse", marginTop: "6px",
            fontSize: "11px", border: "1px solid #bbb"
          }}>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th style={{ border: "1px solid #bbb", padding: "4px 6px", textAlign: "center", width: "4%" }}>No</th>
                <th style={{ border: "1px solid #bbb", padding: "4px 6px", textAlign: "left", width: "14%" }}>ID Agunan</th>
                <th style={{ border: "1px solid #bbb", padding: "4px 6px", textAlign: "left", width: "10%" }}>Jenis</th>
                <th style={{ border: "1px solid #bbb", padding: "4px 6px", textAlign: "left", width: "16%" }}>No. Rekening</th>
                <th style={{ border: "1px solid #bbb", padding: "4px 6px", textAlign: "left" }}>Detail</th>
                <th style={{ border: "1px solid #bbb", padding: "4px 6px", textAlign: "left", width: "18%" }}>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {allItems.map((item, i) => {
                let detail = "-";
                if (item.type.includes("BPKB")) {
                  detail = [
                    item.noBpkb ? `No.BPKB: ${item.noBpkb}` : "",
                    item.namaBpkb ? `Nama: ${item.namaBpkb}` : "",
                    item.noPol ? `NoPol: ${item.noPol}` : "",
                    (item.kendaraanMerk || item.kendaraanTahun) ? `${item.kendaraanJenis || ""} ${item.kendaraanMerk || ""} ${item.kendaraanTahun || ""}`.trim() : ""
                  ].filter(Boolean).join(" | ") || "-";
                } else if (item.type.includes("SHM") || item.type.includes("SHGB")) {
                  detail = [
                    item.noShm ? `No.SHM: ${item.noShm}` : "",
                    item.namaPemilikShm ? `Pemilik: ${item.namaPemilikShm}` : "",
                    item.alamatShm ? `Alamat: ${item.alamatShm}` : ""
                  ].filter(Boolean).join(" | ") || "-";
                }
                return (
                  <tr key={item.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ border: "1px solid #bbb", padding: "4px 6px", textAlign: "center" }}>{i + 1}</td>
                    <td style={{ border: "1px solid #bbb", padding: "4px 6px", fontWeight: "bold" }}>{item.parentCollateralId}</td>
                    <td style={{ border: "1px solid #bbb", padding: "4px 6px" }}>{item.type}</td>
                    <td style={{ border: "1px solid #bbb", padding: "4px 6px" }}>{item.parentNoRekening || "-"}</td>
                    <td style={{ border: "1px solid #bbb", padding: "4px 6px" }}>{detail}</td>
                    <td style={{ border: "1px solid #bbb", padding: "4px 6px" }}>{item.description || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ===== CATATAN ===== */}
        {handover.notes && (
          <p style={{ fontSize: "11px", marginBottom: "8px" }}>
            <strong>Catatan:</strong> {handover.notes}
          </p>
        )}

        {/* ===== PERNYATAAN ===== */}
        <p style={{ fontSize: "11px", marginBottom: "12px" }}>
          Demikian berita acara ini dibuat dengan sebenarnya dan dapat dipergunakan sebagaimana mestinya.
        </p>

        {/* ===== FOTO + TANDA TANGAN (sejajar) ===== */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
          {/* Foto Bukti */}
          {handover.photoProofUrl && (
            <div style={{ textAlign: "center", flex: "0 0 180px" }}>
              <p style={{ fontWeight: "bold", fontSize: "11px", marginBottom: "4px" }}>Foto Bukti Penyerahan</p>
              <img
                src={handover.photoProofUrl}
                alt="Bukti Foto"
                style={{
                  width: "170px", height: "110px",
                  objectFit: "cover",
                  border: "1px solid #ccc",
                  borderRadius: "4px"
                }}
              />
            </div>
          )}

          {/* TTD Pihak Bank */}
          <div style={{ textAlign: "center", flex: 1 }}>
            <p style={{ fontSize: "11px" }}>Pihak Bank (Yang Menyerahkan)</p>
            <div style={{ height: "55px" }} />
            <p style={{ fontSize: "11px" }}>___________________________</p>
            <p style={{ fontWeight: "bold", fontSize: "11px" }}>({handover.admin.name})</p>
            <p style={{ fontSize: "10px", color: "#444" }}>{handover.admin.role.replace(/_/g, " ")}</p>
          </div>

          {/* TTD Menyetujui */}
          <div style={{ textAlign: "center", flex: 1 }}>
            <p style={{ fontSize: "11px" }}>Menyetujui</p>
            <div style={{ height: "55px" }} />
            <p style={{ fontSize: "11px" }}>___________________________</p>
            {handover.disetujuiOleh ? (
              <>
                <p style={{ fontWeight: "bold", fontSize: "11px" }}>
                  ({handover.disetujuiOleh.split(" - ")[0]})
                </p>
                {handover.disetujuiOleh.includes(" - ") && (
                  <p style={{ fontSize: "10px", color: "#444" }}>
                    {handover.disetujuiOleh.split(" - ")[1].replace(/_/g, " ")}
                  </p>
                )}
              </>
            ) : (
              <p style={{ fontWeight: "bold", fontSize: "11px" }}>(...)</p>
            )}
          </div>

          {/* TTD Nasabah */}
          <div style={{ textAlign: "center", flex: 1 }}>
            <p style={{ fontSize: "11px" }}>Nasabah (Yang Menerima)</p>
            <div style={{ height: "55px" }} />
            <p style={{ fontSize: "11px" }}>___________________________</p>
            <p style={{ fontWeight: "bold", fontSize: "11px" }}>({handover.customerName})</p>
          </div>
        </div>
      </div>
    </div>
  );
}
