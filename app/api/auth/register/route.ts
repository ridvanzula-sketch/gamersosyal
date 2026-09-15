import { NextResponse } from "next/server";
import { readDB, writeDB } from "../../../../lib/db";
import { hashPassword, signSession, COOKIE } from "../../../../lib/auth";
import crypto from "crypto";

export async function POST(req:Request){
  try{
    const {username,email,password}=await req.json();
    if(!username||!email||!password||password.length<6) return NextResponse.json({error:"Kullanıcı adı, e-posta ve en az 6 karakter şifre gerekli."},{status:400});
    const db=readDB();
    if(db.users.some(u=>u.username.toLowerCase()===username.toLowerCase())) return NextResponse.json({error:"Bu kullanıcı adı zaten kullanılıyor."},{status:409});
    if(db.users.some(u=>u.email.toLowerCase()===email.toLowerCase())) return NextResponse.json({error:"Bu e-posta zaten kayıtlı."},{status:409});
    const user={id:crypto.randomUUID(),username,email,passwordHash:hashPassword(password),avatar:"",cover:"",bio:"",games:[],friends:[],createdAt:new Date().toISOString()};
    db.users.push(user); writeDB(db);
    const res=NextResponse.json({user:{id:user.id,username:user.username,email:user.email}});
    res.cookies.set(COOKIE,signSession(user.id),{httpOnly:true,sameSite:"lax",path:"/",maxAge:60*60*24*30});
    return res;
  }catch{return NextResponse.json({error:"Geçersiz istek."},{status:400})}
}
