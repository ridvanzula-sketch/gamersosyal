import { NextResponse } from "next/server";
import { readDB } from "../../../lib/db";
export async function GET(req:Request){
  const q=new URL(req.url).searchParams;
  const search=(q.get("search")||"").toLowerCase();
  const game=q.get("game")||"";
  const users=readDB().users.filter(u=>
    (!search || `${u.username} ${u.bio} ${u.games.map(g=>g.game+" "+g.rank+" "+g.role).join(" ")}`.toLowerCase().includes(search)) &&
    (!game || u.games.some(g=>g.game===game))
  ).map(u=>({id:u.id,username:u.username,avatar:u.avatar,bio:u.bio,games:u.games}));
  return NextResponse.json({players:users});
}
