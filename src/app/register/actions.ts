"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function registerAction(prevState: any, formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const role = formData.get("role") as string;

  if (!username || !password || !name || !role) {
    return { error: "Semua kolom harus diisi" };
  }

  try {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { username }
    });

    if (existing) {
      return { error: "Username sudah terdaftar" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: role as any
      }
    });

    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Gagal melakukan registrasi" };
  }
}
