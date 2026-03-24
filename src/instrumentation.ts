export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { execSync } = await import("child_process");
    try {
      console.log("[instrumentation] Running database migrations...");
      execSync("npx prisma migrate deploy", {
        stdio: "inherit",
        env: process.env,
      });
      console.log("[instrumentation] Migrations complete.");
    } catch (err) {
      console.error("[instrumentation] Migration failed:", err);
    }
  }
}
