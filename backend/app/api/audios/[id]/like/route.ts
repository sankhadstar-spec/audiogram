import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/audios/:id/like — toggles like for the signed-in user
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id: audioId } = await params;

  const existing = await prisma.like.findUnique({
    where: { userId_audioId: { userId, audioId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { userId, audioId } });
  }

  const count = await prisma.like.count({ where: { audioId } });
  return NextResponse.json({ liked: !existing, likeCount: count });
}
