import DashboardLayout from "@/components/DashboardLayout";
import { prisma } from "@/lib/prisma";
import ClientForm from "./ClientForm";

export default async function TambahAgunanPage() {
  // Fetch approvers for the dropdown
  const approvers = await prisma.user.findMany({
    where: { role: { in: ["KABAG_OPERASIONAL", "PIMPINAN_CABANG", "DIREKTUR"] } },
    select: { name: true, role: true }
  });

  return (
    <DashboardLayout>
      <div className="page-content animate-fade-in">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>Tambah Agunan Baru</h1>
          <p>Masukkan data agunan baru yang dimasukkan ke brankas.</p>
        </div>

        <div className="card" style={{ maxWidth: '600px' }}>
          <ClientForm approvers={approvers} />
        </div>
      </div>
    </DashboardLayout>
  );
}
