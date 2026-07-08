"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

export async function checkoutBpkbAction(formData: FormData) {
  const collateralItemId = formData.get("collateralItemId") as string;
  const petugasName = formData.get("petugasName") as string;
  const tglKeluarInput = formData.get("tglKeluar") as string;
  const tglEstimasiInput = formData.get("tglEstimasiKembali") as string;
  const stnkNoticeNo = formData.get("stnkNoticeNo") as string;
  const notes = formData.get("notes") as string;

  if (!collateralItemId || !petugasName || !tglKeluarInput || !tglEstimasiInput) {
    throw new Error("Semua kolom wajib diisi!");
  }

  // Get current collateral item to copy old BPKB details for history
  const item = await prisma.collateralItem.findUnique({
    where: { id: collateralItemId }
  });

  if (!item) {
    throw new Error("Item agunan tidak ditemukan!");
  }

  const tglKeluar = new Date(tglKeluarInput);
  const tglEstimasiKembali = new Date(tglEstimasiInput);

  // 1. Create HerTransaction
  await prisma.herTransaction.create({
    data: {
      collateralItemId,
      petugasName,
      tglKeluar,
      tglEstimasiKembali,
      stnkNoticeNo,
      oldNoBpkb: item.noBpkb,
      oldNamaBpkb: item.namaBpkb,
      status: "KELUAR",
      notes
    }
  });

  // 2. Update CollateralItem status & temp receipt
  await prisma.collateralItem.update({
    where: { id: collateralItemId },
    data: {
      status: "KELUAR_HER",
      tempReceipt: stnkNoticeNo
    }
  });

  revalidateTag("collaterals");
  revalidatePath("/her");
  revalidatePath("/");
  redirect("/her");
}

export async function returnBpkbAction(transactionId: string, formData: FormData) {
  const tglKembaliInput = formData.get("tglKembali") as string;
  const newNoBpkb = formData.get("newNoBpkb") as string;
  const newNamaBpkb = formData.get("newNamaBpkb") as string;
  const notes = formData.get("notes") as string;

  if (!tglKembaliInput || !newNoBpkb || !newNamaBpkb) {
    throw new Error("Tanggal kembali, No BPKB baru, dan Nama baru wajib diisi!");
  }

  const tglKembali = new Date(tglKembaliInput);

  // 1. Get the transaction to retrieve collateralItemId
  const transaction = await prisma.herTransaction.findUnique({
    where: { id: transactionId }
  });

  if (!transaction) {
    throw new Error("Transaksi Her tidak ditemukan!");
  }

  // 2. Update HerTransaction
  await prisma.herTransaction.update({
    where: { id: transactionId },
    data: {
      status: "KEMBALI",
      tglKembali,
      newNoBpkb,
      newNamaBpkb,
      notes: notes || transaction.notes
    }
  });

  // 3. Update CollateralItem back to DI_BRANKAS and save new BPKB details
  await prisma.collateralItem.update({
    where: { id: transaction.collateralItemId },
    data: {
      status: "DI_BRANKAS",
      tempReceipt: null,
      noBpkb: newNoBpkb,
      namaBpkb: newNamaBpkb
    }
  });

  revalidateTag("collaterals");
  revalidatePath("/her");
  revalidatePath("/");
  redirect("/her");
}
