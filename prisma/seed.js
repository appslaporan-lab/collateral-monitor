const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  const users = [
    { username: 'admin1', name: 'Budi (Adm Kredit)', role: 'ADM_KREDIT', password },
    { username: 'kabag1', name: 'Siti (Kabag Operasional)', role: 'KABAG_OPERASIONAL', password },
    { username: 'pimpinan1', name: 'Ahmad (Pimpinan Cabang)', role: 'PIMPINAN_CABANG', password },
    { username: 'direktur1', name: 'Linda (Direktur)', role: 'DIREKTUR', password },
    { username: 'kas1', name: 'Eko (Kepala Kas)', role: 'KEPALA_KAS', password },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: u,
    });
  }

  // Seed some collaterals
  const collaterals = [
    { collateralId: 'AGN-2026-001', customerName: 'Joko Widodo', type: 'SHM', description: 'Tanah 200m2 di Jakarta' },
    { collateralId: 'AGN-2026-002', customerName: 'Susilo Bambang', type: 'BPKB Mobil', description: 'Toyota Avanza 2022' },
  ];

  for (const c of collaterals) {
    await prisma.collateral.upsert({
      where: { collateralId: c.collateralId },
      update: {},
      create: c,
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
