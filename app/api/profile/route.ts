import { NextResponse } from "next/server";
import { currentUser } from "../../../lib/auth";
import { readDB, writeDB } from "../../../lib/db";

export async function PATCH(req:Request){
  const me=currentUser(); if(!me) return NextResponse.json({error:"Giriş yapmalısın."},{status:401});
  const body=await req.json();
  const db=readDB(); const u=db.users.find(x=>x.id===me.id)!;
  if(typeof body.bio==="string") u.bio=body.bio.slice(0,500);
  if(typeof body.avatar==="string") u.avatar=body.avatar;
  if(typeof body.cover==="string") u.cover=body.cover;
  if(Array.isArray(body.games)) u.games=body.games.slice(0,20);
  writeDB(db);
  return NextResponse.json({ok:true,user:{id:u.id,username:u.username,bio:u.bio,avatar:u.avatar,cover:u.cover,games:u.games}});
}
