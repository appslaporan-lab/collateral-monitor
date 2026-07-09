"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag as nextRevalidateTag } from "next/cache";
import { redirect } from "next/navigation";

// Definisi alias agar bisa dipanggil dengan 1 argumen
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
    data: { collateralId, customerName, noRekening: noRekening || null, disetujuiOleh: disetujuiOleh || null, status: "DI_BRANKAS" }
  });

  const itemCount = parseInt(formData.get("itemCount") as string) || 1;
  for (let i = 0; i < itemCount; i++) {
    const type = formData.get(`item_${i}_type`) as string;
    if (!type) continue;
    const itemData: any = { collateralId: collateral.id, type, description: formData.get(`item_${i}_description`) as string || null };
    
    if (type.includes("BPKB")) {
      itemData.noBpkb = formData.get(`item_${i}_noBpkb`) as string || null;
      itemData.namaBpkb = formData.get(`item_${i}_namaBpkb`) as string || null;
      itemData.noPol = formData.get(`item_${i}_noPol`) as string || null;
    }
    await prisma.collateralItem.create({ data: itemData });
  }

  revalidateTag("collaterals");
  revalidatePath("/agunan");
  redirect("/agunan");
}

export async function addItemToCollateralAction(collateralId: string, formData: FormData) {
  // ... (Logika addItemToCollateralAction Anda)
  revalidateTag("collaterals");
  revalidatePath(`/agunan/${collateralId}`);
  redirect(`/agunan/${collateralId}`);
}