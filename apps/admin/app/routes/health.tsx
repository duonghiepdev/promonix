import db from "../db.server";
export async function loader() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "connected" });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
