import { NextResponse } from "next/server";
import { currentUser } from "../../../lib/auth";
export async function GET(){
  const u=currentUser();
  if(!u) return NextResponse.json({user:null});
  return NextResponse.json({user:{id:u.id,username:u.username,email:u.email,avatar:u.avatar,cover:u.cover,bio:u.bio,games:u.games,friends:u.friends}});
}
