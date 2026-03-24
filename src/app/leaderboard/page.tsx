import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  let users: { id: string; name: string | null; username: string | null; totalPoints: number }[] = [];

  try {
    users = await prisma.user.findMany({
      orderBy: { totalPoints: "desc" },
      take: 20,
      select: { id: true, name: true, username: true, totalPoints: true },
    });
  } catch {
    // DB not ready
  }

  const currentUserRank = session?.user?.id
    ? users.findIndex((u) => u.id === session.user.id) + 1
    : 0;

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-100">Leaderboard</h1>
        <p className="text-sm text-cinema-muted mt-1">Top players by total points</p>
      </div>

      {currentUserRank > 0 && (
        <div className="rounded-xl border border-gold/30 bg-gold/10 p-3 text-center text-sm">
          <span className="text-gold font-semibold">Your rank: #{currentUserRank}</span>
        </div>
      )}

      {users.length === 0 ? (
        <div className="rounded-xl border border-cinema-border bg-cinema-surface p-8 text-center text-cinema-muted">
          No scores yet — be the first to play!
        </div>
      ) : (
        <div className="rounded-xl border border-cinema-border overflow-hidden">
          {users.map((user, i) => {
            const rank = i + 1;
            const isCurrentUser = user.id === session?.user?.id;
            const medal =
              rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

            return (
              <div
                key={user.id}
                className={`flex items-center gap-3 px-4 py-3 border-b border-cinema-border last:border-b-0 ${
                  isCurrentUser ? "bg-gold/5" : "bg-cinema-surface"
                }`}
              >
                <span className="w-7 text-center text-sm font-bold text-cinema-muted">
                  {medal ?? `#${rank}`}
                </span>
                <span className={`flex-1 text-sm font-medium ${isCurrentUser ? "text-gold" : "text-slate-200"}`}>
                  {user.username ?? user.name ?? "Anonymous"}
                  {isCurrentUser && " (you)"}
                </span>
                <span className="text-sm font-bold text-gold">{user.totalPoints.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
