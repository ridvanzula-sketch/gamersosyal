import fs from "fs";
import path from "path";

export type User = {
  id: string; username: string; email: string; passwordHash: string;
  avatar: string; cover: string; bio: string; games: {game:string; rank:string; role:string}[];
  friends: string[]; createdAt: string;
};

export type Message = { id:string; from:string; to:string; text:string; createdAt:string; };
export type Invite = { id:string; from:string; to:string; game:string; status:"pending"|"accepted"|"rejected"; createdAt:string; };
export type Notification = { id:string; to:string; from:string; fromUsername:string; type:"friend"|"message"|"invite"; text:string; createdAt:string; read:boolean; inviteId?:string; };

type DB = { users:User[]; messages:Message[]; invites:Invite[]; notifications:Notification[]; };

const file = path.join(process.cwd(), "data", "db.json");
const initial:DB = {
  users: [
    {id:"demo-r3aper",username:"R3APER",email:"r3aper@gamerhub.local",passwordHash:"",avatar:"",cover:"",bio:"Ranked oynarım. Takım arıyorum.",games:[{game:"VALORANT",rank:"Diamond",role:"Duelist"},{game:"CS2",rank:"18K",role:"Rifler"}],friends:[],createdAt:new Date().toISOString()},
    {id:"demo-lunaa",username:"Lunaa",email:"lunaa@gamerhub.local",passwordHash:"",avatar:"",cover:"",bio:"Controller main.",games:[{game:"VALORANT",rank:"Ascendant",role:"Controller"}],friends:[],createdAt:new Date().toISOString()},
    {id:"demo-mert",username:"MertFPS",email:"mert@gamerhub.local",passwordHash:"",avatar:"",cover:"",bio:"CS2 ve FPS.",games:[{game:"CS2",rank:"18K",role:"Rifler"}],friends:[],createdAt:new Date().toISOString()}
  ],
  messages: [],
  invites: [],
  notifications: []
};

function ensure(){
  const dir=path.dirname(file);
  if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
  if(!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(initial,null,2),"utf8");
}
export function readDB():DB{ ensure(); const db=JSON.parse(fs.readFileSync(file,"utf8")); db.notifications ||= []; return db; }
export function writeDB(db:DB){ ensure(); fs.writeFileSync(file,JSON.stringify(db,null,2),"utf8"); }
