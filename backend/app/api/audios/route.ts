import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/audios?genre=Folk+tale&cursor=xxx&limit=12
// Powers the home feed grid. Cursor-paginated, newest first for now —
// swap the orderBy for a real ranking signal once you have engagement data.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const genre = searchParams.get("genre");
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 12), 50);

  const audios = await prisma.audio.findMany({
    where: { published: true, ...(genre && genre !== "All" ? { genre } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      creator: { select: { id: true, name: true, image: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  const nextCursor = audios.length === limit ? audios[audios.length - 1].id : null;
  return NextResponse.json({ audios, nextCursor });
}

// POST /api/audios — publish a story from the Studio pipeline
// Body: { title, description, genre, coverUrl, audioUrl, videoUrl?, durationSec }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json();
  const { title, description, genre, coverUrl, audioUrl, videoUrl, durationSec } = body;

  if (!title || !coverUrl || !audioUrl || !durationSec) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const audio = await prisma.audio.create({
    data: {
      title,
      description,
      genre,
      coverUrl,
      audioUrl,
      videoUrl,
      durationSec,
      creatorId: (session.user as { id: string }).id,
    },
  });

  return NextResponse.json({ audio }, { status: 201 });
}
