import crypto from "crypto";
import { cookies } from "next/headers";
import { readDB } from "./db";

const COOKIE="gamerhub_session";
const SECRET=process.env.SESSION_SECRET || "gamerhub-local-secret-change-me";

export function hashPassword(password:string){
  const salt=crypto.randomBytes(16).toString("hex");
  const hash=crypto.scryptSync(password,salt,64).toString("hex");
  return `${salt}:${hash}`;
}
export function verifyPassword(password:string, stored:string){
  if(!stored || !stored.includes(":")) return false;
  const [salt,hash]=stored.split(":");
  const derived=crypto.scryptSync(password,salt,64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash,"hex"),Buffer.from(derived,"hex"));
}
export function signSession(id:string){
  const sig=crypto.createHmac("sha256",SECRET).update(id).digest("hex");
  return `${id}.${sig}`;
}
export function readSessionId(){
  const value=cookies().get(COOKIE)?.value;
  if(!value) return null;
  const [id,sig]=value.split(".");
  if(!id||!sig) return null;
  const expected=crypto.createHmac("sha256",SECRET).update(id).digest("hex");
  if(!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected))) return null;
  return id;
}
export function currentUser(){
  const id=readSessionId();
  if(!id) return null;
  return readDB().users.find(u=>u.id===id)||null;
}
export { COOKIE };
