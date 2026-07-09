"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag as nextRevalidateTag } from "next/cache";
import { redirect } from "next/navigation";

// Definisi alias yang sama agar konsisten
const revalidateTag = (tag: string) => (nextRevalidateTag as any)(tag, { type: 'layout' } as any);

export async function addHerAction(formData: FormData) {
  // Masukkan logika addHerAction Anda di sini
  // await prisma.her.create({ ... });

  revalidateTag("collaterals");
  revalidatePath("/her");
  revalidatePath("/");
  redirect("/her");
}