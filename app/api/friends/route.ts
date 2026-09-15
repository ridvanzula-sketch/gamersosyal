import { NextResponse } from "next/server";
import { currentUser } from "../../../lib/auth";
import { readDB, writeDB } from "../../../lib/db";
import crypto from "crypto";

export async function GET() {
  const me = currentUser();
  if (!me) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
  const db = readDB();
  const ids = new Set(me.friends || []);
  const friends = db.users
    .filter((u) => ids.has(u.id))
    .map(({ id, username, avatar, bio, games }) => ({ id, username, avatar, bio, games }));
  return NextResponse.json({ friends });
}

export async function POST(req: Request) {
  const me = currentUser();
  if (!me) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
  const { userId } = await req.json();
  const db = readDB();
  const target = db.users.find((u) => u.id === userId);
  const actor = db.users.find((u) => u.id === me.id);
  if (!target || !actor || target.id === me.id) return NextResponse.json({ error: "Oyuncu bulunamadı." }, { status: 404 });

  if (!actor.friends.includes(target.id)) actor.friends.push(target.id);
  if (!target.friends.includes(actor.id)) target.friends.push(actor.id);

  db.notifications ||= [];
  if (!db.notifications.some((n) => n.to === target.id && n.from === actor.id && n.type === "friend" && !n.read)) {
    db.notifications.push({
      id: crypto.randomUUID(),
      to: target.id,
      from: actor.id,
      fromUsername: actor.username,
      type: "friend",
      text: `${actor.username} seni arkadaş olarak ekledi.`,
      createdAt: new Date().toISOString(),
      read: false,
    });
  }

  writeDB(db);
  return NextResponse.json({ ok: true });
}
