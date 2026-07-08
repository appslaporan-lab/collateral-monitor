import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// params sekarang didefinisikan sebagai Promise
export async function POST(
  request: Request, 
  { params }: { params: Promise<{ id: string }> } 
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Await params untuk mendapatkan id
    const { id } = await params;
    const body = await request.json();

    await prisma.handoverForm.update({
      where: { id: id }, // Gunakan id yang sudah di-await
      data: { disetujuiOleh: body.disetujuiOleh || null }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}