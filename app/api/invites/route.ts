import { NextResponse } from "next/server";
import { currentUser } from "../../../lib/auth";
import { readDB, writeDB } from "../../../lib/db";
import crypto from "crypto";

export async function GET() {
  const me = currentUser();
  if (!me) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
  const db = readDB();
  return NextResponse.json({ invites: db.invites.filter((i) => i.to === me.id || i.from === me.id) });
}

export async function POST(req: Request) {
  const me = currentUser();
  if (!me) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
  const { to, game } = await req.json();
  const db = readDB();
  const target = db.users.find((u) => u.id === to);
  const actor = db.users.find((u) => u.id === me.id);
  if (!target || !actor || target.id === actor.id) return NextResponse.json({ error: "Oyuncu bulunamadı." }, { status: 404 });

  const invite = { id: crypto.randomUUID(), from: actor.id, to, game: String(game || "Oyun"), status: "pending" as const, createdAt: new Date().toISOString() };
  db.invites.push(invite);
  db.notifications ||= [];
  db.notifications.push({
    id: crypto.randomUUID(),
    to: target.id,
    from: actor.id,
    fromUsername: actor.username,
    type: "invite",
    text: `${actor.username} seni ${invite.game} oyununa davet etti.`,
    inviteId: invite.id,
    createdAt: new Date().toISOString(),
    read: false,
  });
  writeDB(db);
  return NextResponse.json({ invite });
}

export async function PATCH(req: Request) {
  const me = currentUser();
  if (!me) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
  const { id, status } = await req.json();
  const db = readDB();
  const i = db.invites.find((x) => x.id === id && x.to === me.id);
  if (!i || !["accepted", "rejected"].includes(status)) return NextResponse.json({ error: "Davet bulunamadı." }, { status: 404 });
  i.status = status;
  writeDB(db);
  return NextResponse.json({ ok: true });
}
