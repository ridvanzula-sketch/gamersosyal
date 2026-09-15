import { NextResponse } from "next/server";
import { currentUser } from "../../../lib/auth";
import { readDB, writeDB } from "../../../lib/db";

export async function GET() {
  const me = currentUser();
  if (!me) return NextResponse.json({ notifications: [] });
  const db = readDB();
  const notifications = (db.notifications || [])
    .filter((n) => n.to === me.id)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 50);
  return NextResponse.json({ notifications });
}

export async function PATCH(req: Request) {
  const me = currentUser();
  if (!me) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
  const { ids } = await req.json();
  if (!Array.isArray(ids)) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  const db = readDB();
  for (const n of db.notifications || []) {
    if (n.to === me.id && ids.includes(n.id)) n.read = true;
  }
  writeDB(db);
  return NextResponse.json({ ok: true });
}
