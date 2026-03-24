import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username } = await req.json();
  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  const clean = username.trim().slice(0, 24);
  if (!/^[a-zA-Z0-9_-]{2,24}$/.test(clean)) {
    return NextResponse.json(
      { error: "Username must be 2–24 characters: letters, numbers, _ or -" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { username: clean },
      select: { username: true },
    });
    return NextResponse.json({ username: user.username });
  } catch {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }
}
