import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/DashboardLayout";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export default async function BatchHandoverFormPage({
  searchParams
}: {
  searchParams: Promise<{ ids?: string }>
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const resolvedParams = await searchParams;
  const rawIds = resolvedParams.ids || "";
  const ids = rawIds.split(",").map(id => id.trim()).filter(Boolean);

  if (ids.length === 0) redirect("/penyerahan");

  const collaterals = await prisma.collateral.findMany({
    where: { id: { in: ids } },
    include: { items: true }
  });

  if (collaterals.length === 0) redirect("/penyerahan");

  const approvers = await prisma.user.findMany({
    where: { role: { in: ["KABAG_OPERASIONAL", "PIMPINAN_CABANG", "DIREKTUR"] } },
    select: { name: true, role: true }
  });

  // Derive common customer name (first collateral's name)
  const customerName = collaterals[0].customerName;

  async function submitBatchHandover(formData: FormData) {
    "use server";

    const notes = formData.get("notes") as string;
    const photoFile = formData.get("photoProof") as File;
    const tanggalLunas = formData.get("tanggalLunas") as string;
    const disetujuiOleh = formData.get("disetujuiOleh") as string;
    const collateralIds = (formData.get("collateralIds") as string)
      .split(",").map(id => id.trim()).filter(Boolean);

    const userSession = await getServerSession(authOptions);
    if (!userSession) return;

    // Upload photo
    let photoUrl = "";
    if (photoFile && photoFile.size > 0) {
      const bytes = await photoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${photoFile.name.replace(/\s+/g, "-")}`;
      const uploadDir = path.join(process.cwd(), "public/uploads");
      try { await mkdir(uploadDir, { recursive: true }); } catch (e) {}
      await writeFile(path.join(uploadDir, fileName), buffer);
      photoUrl = `/uploads/${fileName}`;
    }

    // Fetch collateral records
    const cols = await prisma.collateral.findMany({
      where: { id: { in: collateralIds } }
    });
    const cName = cols[0]?.customerName || "";

    // Create ONE handover form for all selected collaterals
    const handoverForm = await prisma.handoverForm.create({
      data: {
        adminId: userSession.user.id,
        customerName: cName,
        notes,
        tanggalLunas: tanggalLunas ? new Date(tanggalLunas) : null,
        disetujuiOleh: disetujuiOleh || null,
        photoProofUrl: photoUrl,
      }
    });

    // Link all collaterals to this handover form and mark as SELESAI
    await prisma.collateral.updateMany({
      where: { id: { in: collateralIds } },
      data: {
        status: "SELESAI_DISERAHKAN",
        handoverFormId: handoverForm.id
      }
    });

    revalidateTag("collaterals");
    revalidatePath("/penyerahan");
    redirect(`/penyerahan/cetak/${handoverForm.id}`);
  }

  return (
    <DashboardLayout>
      <div className="page-content animate-fade-in">
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ marginBottom: "0.5rem" }}>Form Serah Terima Agunan</h1>
          <p>Proses penyerahan <strong>{collaterals.length} agunan</strong> sekaligus dalam satu Berita Acara.</p>
        </div>

        {/* Summary of selected collaterals */}
        <div className="card" style={{ marginBottom: "2rem" }}>
          <h4 style={{ marginBottom: "1rem" }}>📋 Daftar Agunan yang Akan Diserahkan</h4>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", color: "var(--secondary)", fontWeight: 500 }}>No</th>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", color: "var(--secondary)", fontWeight: 500 }}>ID Agunan</th>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", color: "var(--secondary)", fontWeight: 500 }}>Nasabah</th>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", color: "var(--secondary)", fontWeight: 500 }}>Jenis</th>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", color: "var(--secondary)", fontWeight: 500 }}>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {collaterals.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.75rem" }}>{i + 1}</td>
                  <td style={{ padding: "0.75rem", fontWeight: 600 }}>{c.collateralId}</td>
                  <td style={{ padding: "0.75rem" }}>{c.customerName}</td>
                  <td style={{ padding: "0.75rem" }}>{c.items.map(it => it.type).join(", ") || "Tanpa Item"}</td>
                  <td style={{ padding: "0.75rem", color: "var(--secondary)" }}>
                    {c.items.map(it => it.description).filter(Boolean).join("; ") || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ maxWidth: "600px" }}>
          <form action={submitBatchHandover}>
            <input type="hidden" name="collateralIds" value={ids.join(",")} />

            <div className="form-group">
              <label className="form-label" htmlFor="tanggalLunas">Tanggal Lunas</label>
              <input type="date" id="tanggalLunas" name="tanggalLunas" className="form-input" required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="disetujuiOleh">Menyetujui (Pejabat)</label>
              <select id="disetujuiOleh" name="disetujuiOleh" className="form-input" required>
                <option value="">-- Pilih Pejabat yang Menyetujui --</option>
                {approvers.map((u, i) => (
                  <option key={i} value={`${u.name} - ${u.role}`}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="photoProof">📷 Foto Bukti Penyerahan</label>
              <input
                type="file"
                id="photoProof"
                name="photoProof"
                className="form-input"
                accept="image/*"
                capture="environment"
                required
              />
              <p style={{ fontSize: "0.75rem", color: "var(--secondary)", marginTop: "0.5rem" }}>
                *Ambil foto langsung menggunakan kamera. Foto akan tercetak di Berita Acara.
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: "2rem" }}>
              <label className="form-label" htmlFor="notes">Catatan Serah Terima</label>
              <textarea id="notes" name="notes" className="form-input" rows={3} placeholder="Catatan tambahan (opsional)..." />
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ backgroundColor: "var(--success)", borderColor: "var(--success)" }}
              >
                ✅ Selesaikan Penyerahan ({collaterals.length} Agunan)
              </button>
              <a href="/penyerahan" className="btn btn-outline" style={{ textDecoration: "none" }}>Batal</a>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
