import { NextResponse } from "next/server";
import { currentUser } from "../../../lib/auth";
import { readDB, writeDB } from "../../../lib/db";
import crypto from "crypto";

export async function GET(req: Request) {
  const me = currentUser();
  if (!me) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
  const to = new URL(req.url).searchParams.get("to") || "";
  const db = readDB();
  const messages = to
    ? db.messages.filter((m) => (m.from === me.id && m.to === to) || (m.from === to && m.to === me.id))
    : db.messages.filter((m) => m.from === me.id || m.to === me.id);
  return NextResponse.json({ messages });
}

export async function POST(req: Request) {
  const me = currentUser();
  if (!me) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
  const { to, text } = await req.json();
  if (!to || !String(text || "").trim()) return NextResponse.json({ error: "Mesaj boş olamaz." }, { status: 400 });
  const db = readDB();
  const actor = db.users.find((u) => u.id === me.id);
  const target = db.users.find((u) => u.id === to);
  if (!actor || !target) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });

  const m = { id: crypto.randomUUID(), from: me.id, to, text: String(text).slice(0, 2000), createdAt: new Date().toISOString() };
  db.messages.push(m);
  db.notifications ||= [];
  db.notifications.push({
    id: crypto.randomUUID(),
    to: target.id,
    from: actor.id,
    fromUsername: actor.username,
    type: "message",
    text: `${actor.username} sana yeni bir mesaj gönderdi.`,
    createdAt: new Date().toISOString(),
    read: false,
  });
  writeDB(db);
  return NextResponse.json({ message: m });
}
