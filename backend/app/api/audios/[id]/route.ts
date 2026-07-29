import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/audios/:id — powers the watch page. Increments plays once per fetch.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const audio = await prisma.audio.update({
    where: { id },
    data: { plays: { increment: 1 } },
    include: {
      creator: { select: { id: true, name: true, image: true, _count: { select: { followers: true } } } },
      comments: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      _count: { select: { likes: true } },
    },
  });

  if (!audio) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ audio });
}
