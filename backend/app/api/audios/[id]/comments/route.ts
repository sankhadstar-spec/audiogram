import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/audios/:id/comments
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: audioId } = await params;
  const comments = await prisma.comment.findMany({
    where: { audioId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, image: true } } },
  });
  return NextResponse.json({ comments });
}

// POST /api/audios/:id/comments — Body: { text }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { id: audioId } = await params;
  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "Comment can't be empty" }, { status: 400 });

  const comment = await prisma.comment.create({
    data: {
      text: text.trim(),
      audioId,
      userId: (session.user as { id: string }).id,
    },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
