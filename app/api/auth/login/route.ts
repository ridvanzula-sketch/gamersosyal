import { NextResponse } from "next/server";
import { readDB } from "../../../../lib/db";
import { verifyPassword, signSession, COOKIE } from "../../../../lib/auth";

export async function POST(req:Request){
  try{
    const {email,password}=await req.json();
    const user=readDB().users.find(u=>u.email.toLowerCase()===String(email||"").toLowerCase());
    if(!user || !verifyPassword(password||"",user.passwordHash)) return NextResponse.json({error:"E-posta veya şifre hatalı."},{status:401});
    const res=NextResponse.json({user:{id:user.id,username:user.username,email:user.email}});
    res.cookies.set(COOKIE,signSession(user.id),{httpOnly:true,sameSite:"lax",path:"/",maxAge:60*60*24*30});
    return res;
  }catch{return NextResponse.json({error:"Giriş başarısız."},{status:400})}
}
