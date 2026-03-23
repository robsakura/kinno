import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { totalPoints: "desc" },
    take: 20,
    select: { id: true, name: true, image: true, totalPoints: true },
  });

  const entries = users.map((u, i) => ({
    rank: i + 1,
    id: u.id,
    name: u.name,
    image: u.image,
    totalPoints: u.totalPoints,
  }));

  return NextResponse.json(entries);
}
