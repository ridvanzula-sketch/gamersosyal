import { NextResponse } from "next/server";
import { currentUser } from "../../../lib/auth";
import { readDB, writeDB } from "../../../lib/db";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(req:Request){
  const me=currentUser(); if(!me) return NextResponse.json({error:"Giriş yapmalısın."},{status:401});
  const form=await req.formData(); const file=form.get("file");
  if(!(file instanceof File)) return NextResponse.json({error:"Dosya bulunamadı."},{status:400});
  if(file.size>3*1024*1024) return NextResponse.json({error:"Dosya 3MB'dan küçük olmalı."},{status:400});
  if(!file.type.startsWith("image/")) return NextResponse.json({error:"Sadece resim yükleyebilirsin."},{status:400});
  const ext=(file.type.split("/")[1]||"jpg").replace("jpeg","jpg");
  const dir=path.join(process.cwd(),"public","uploads"); fs.mkdirSync(dir,{recursive:true});
  const name=`${me.id}-${crypto.randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(dir,name),Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({url:`/uploads/${name}`});
}
