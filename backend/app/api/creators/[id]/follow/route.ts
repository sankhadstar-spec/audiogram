import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/creators/:id/follow — toggles subscribe/unsubscribe
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const followerId = (session.user as { id: string }).id;
  const { id: followingId } = await params;

  if (followerId === followingId) {
    return NextResponse.json({ error: "Can't follow yourself" }, { status: 400 });
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({ data: { followerId, followingId } });
  }

  const subscriberCount = await prisma.follow.count({ where: { followingId } });
  return NextResponse.json({ following: !existing, subscriberCount });
}
