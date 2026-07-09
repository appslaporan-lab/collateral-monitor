"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag as nextRevalidateTag } from "next/cache";
import { redirect } from "next/navigation";

// SOLUSI FINAL: Gunakan 'as any' pada opsi untuk mematikan pengecekan tipe data yang kaku
const revalidateTag = (tag: string) => (nextRevalidateTag as any)(tag, { type: 'layout' } as any);

async function generateCollateralId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `AGN-${year}-`;
  const count = await prisma.collateral.count({
    where: { collateralId: { startsWith: prefix } }
  });
  let seq = count + 1;
  let candidate = `${prefix}${String(seq).padStart(3, "0")}`;
  while (true) {
    const existing = await prisma.collateral.findUnique({ where: { collateralId: candidate } });
    if (!existing) break;
    seq++;
    candidate = `${prefix}${String(seq).padStart(3, "0")}`;
  }
  return candidate;
}

export async function addAgunanAction(formData: FormData) {
  const customerName = formData.get("customerName") as string;
  const noRekening   = formData.get("noRekening") as string;
  const disetujuiOleh = formData.get("disetujuiOleh") as string;

  if (noRekening) {
    const existing = await prisma.collateral.findUnique({ where: { noRekening } });
    if (existing) {
      redirect(`/agunan/${existing.id}/tambah-item`);
    }
  }

  const collateralId = await generateCollateralId();

  const collateral = await prisma.collateral.create({
    data: {
      collateralId,
      customerName,
      noRekening: noRekening || null,
      disetujuiOleh: disetujuiOleh || null,
      status: "DI_BRANKAS",
    }
  });

  const itemCount = parseInt(formData.get("itemCount") as string) || 1;
  for (let i = 0; i < itemCount; i++) {
    const type = formData.get(`item_${i}_type`) as string;
    if (!type) continue;

    const itemData: any = {
      collateralId: collateral.id,
      type,
      description: formData.get(`item_${i}_description`) as string || null,
    };

    if (type.includes("BPKB")) {
      itemData.noBpkb       = formData.get(`item_${i}_noBpkb`) as string || null;
      itemData.namaBpkb     = formData.get(`item_${i}_namaBpkb`) as string || null;
      itemData.noPol        = formData.get(`item_${i}_noPol`) as string || null;
      itemData.kendaraanJenis = formData.get(`item_${i}_kendaraanJenis`) as string || null;
      itemData.kendaraanMerk  = formData.get(`item_${i}_kendaraanMerk`) as string || null;
      itemData.kendaraanTahun = formData.get(`item_${i}_kendaraanTahun`) as string || null;
    } else if (type.includes("SHM") || type.includes("SHGB")) {
      itemData.noShm        = formData.get(`item_${i}_noShm`) as string || null;
      itemData.namaPemilikShm = formData.get(`item_${i}_namaPemilikShm`) as string || null;
      itemData.alamatShm      = formData.get(`item_${i}_alamatShm`) as string || null;
    }

    await prisma.collateralItem.create({ data: itemData });
  }

  revalidateTag("collaterals");
  revalidatePath("/agunan");
  redirect("/agunan");
}

export async function addItemToCollateralAction(collateralId: string, formData: FormData) {
  const type = formData.get("type") as string;
  if (!type) return;

  const itemData: any = {
    collateralId,
    type,
    description: formData.get("description") as string || null,
  };

  if (type.includes("BPKB")) {
    itemData.noBpkb = formData.get("noBpkb") as string || null;
    itemData.namaBpkb = formData.get("namaBpkb") as string || null;
    itemData.noPol = formData.get("noPol") as string || null;
    itemData.kendaraanJenis = formData.get("kendaraanJenis") as string || null;
    itemData.kendaraanMerk = formData.get("kendaraanMerk") as string || null;
    itemData.kendaraanTahun = formData.get("kendaraanTahun") as string || null;
  } else if (type.includes("SHM") || type.includes("SHGB")) {
    itemData.noShm = formData.get("noShm") as string || null;
    itemData.namaPemilikShm = formData.get("namaPemilikShm") as string || null;
    itemData.alamatShm = formData.get("alamatShm") as string || null;
  }

  await prisma.collateralItem.create({ data: itemData });
  
  revalidateTag("collaterals");
  revalidatePath(`/agunan/${collateralId}`);
  redirect(`/agunan/${collateralId}`);
}