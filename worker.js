const enc = new TextEncoder();
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
 status, headers: {'Content-Type':'application/json', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', ...headers}
});
const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(value))), b => b.toString(16).padStart(2,'0')).join('');
const clean = (v, max=200) => String(v ?? '').trim().slice(0,max);
const statuses = ['new','called','scheduled','done','spam'];
async function limit(env,key,max,seconds) {
 const now=Math.floor(Date.now()/1000);
 const row=await env.DB.prepare('INSERT INTO rate_limits(key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires < ? THEN 1 ELSE count+1 END, expires=CASE WHEN expires < ? THEN excluded.expires ELSE expires END RETURNING count').bind(key,now+seconds,now,now).first();
 return row.count<=max;
}
async function authenticated(req,env) {
 const cookie=req.headers.get('Cookie')||'';
 const token=cookie.match(/(?:^|;\s*)elite_session=([a-f0-9]{64})(?:;|$)/)?.[1];
 if(!token)return false;
 return !!await env.DB.prepare('SELECT token FROM sessions WHERE token=? AND expires>?').bind(await hash(token),Date.now()).first();
}
async function body(req) {
 if(Number(req.headers.get('Content-Length')||0)>16000)throw new Error('Request too large');
 const raw=await req.text();if(raw.length>16000)throw new Error('Request too large');
 return JSON.parse(raw);
}
function leadData(d) {
 const name=clean(d.name,120),phone=clean(d.phone,50),email=clean(d.email,200),service=clean(d.service,150),message=clean(d.message,4000),booking_date=clean(d.booking_date,80);
 if(!name||!phone||!service)throw new Error('Name, phone, and service are required.');
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Enter a valid email address.');
 return [name,phone,email,service,message,booking_date];
}
export default {
 async fetch(req,env) {
 const url=new URL(req.url), path=url.pathname.replace(/\/$/,'');
 if(!path.startsWith('/api/'))return env.ASSETS.fetch(req);
 if(!env.DB)return json({error:'Lead storage is not configured.'},503);
 const mutation=!['GET','HEAD'].includes(req.method);
 if(mutation&&req.headers.get('Origin')!==url.origin)return json({error:'Invalid request origin.'},403);
 try {
 const ip=req.headers.get('CF-Connecting-IP')||'local';
 if(path==='/api/session'&&req.method==='GET')return json({authenticated:await authenticated(req,env)});
 if(path==='/api/login'&&req.method==='POST') {
  if(!env.DASHBOARD_PASSWORD)return json({error:'Dashboard password is not configured.'},503);
  if(!await limit(env,'login:'+ip,10,900))return json({error:'Too many attempts. Try again in 15 minutes.'},429);
  const d=await body(req);
  const a=await hash(clean(d.password,500)),b=await hash(env.DASHBOARD_PASSWORD);
  let diff=a.length^b.length;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
  if(diff||d.username!=='admin')return json({error:'Incorrect username or password.'},401);
  const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
  const seconds=d.remember?2592000:43200;
  await env.DB.batch([env.DB.prepare('DELETE FROM sessions WHERE expires<?').bind(Date.now()),env.DB.prepare('INSERT INTO sessions(token,expires) VALUES (?,?)').bind(await hash(token),Date.now()+seconds*1000)]);
  return json({ok:true},200,{'Set-Cookie':`elite_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${seconds}`});
 }
 if(path==='/api/submissions'&&req.method==='POST') {
  const d=await body(req);
  if(d.website)return json({ok:true});
  if(!await limit(env,'submit:'+ip,8,3600))return json({error:'Too many requests. Please call us instead.'},429);
  const values=leadData(d);
  const row=await env.DB.prepare('INSERT INTO leads(name,phone,email,service,message,booking_date) VALUES (?,?,?,?,?,?) RETURNING id').bind(...values).first();
  return json({ok:true,id:row.id},201);
 }
 if(!await authenticated(req,env))return json({error:'Please sign in.'},401);
 if(path==='/api/logout'&&req.method==='POST') {
  const token=(req.headers.get('Cookie')||'').match(/elite_session=([a-f0-9]{64})/)?.[1];
  if(token)await env.DB.prepare('DELETE FROM sessions WHERE token=?').bind(await hash(token)).run();
  return json({ok:true},200,{'Set-Cookie':'elite_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'});
 }
 if(path==='/api/leads'&&req.method==='GET') {
  const {results}=await env.DB.prepare('SELECT * FROM leads ORDER BY created_at DESC, id DESC LIMIT 2000').all();
  return json({leads:results});
 }
 if(path==='/api/leads'&&req.method==='POST') {
  const d=await body(req),values=leadData(d);
  const row=await env.DB.prepare('INSERT INTO leads(name,phone,email,service,message,booking_date) VALUES (?,?,?,?,?,?) RETURNING *').bind(...values).first();
  return json({lead:row},201);
 }
 const id=path.match(/^\/api\/leads\/(\d+)$/)?.[1];
 if(id&&req.method==='PATCH') {
  const d=await body(req);
  if(!statuses.includes(d.status))return json({error:'Invalid lead status.'},400);
  const row=await env.DB.prepare("UPDATE leads SET status=?, note=?, booking_date=?, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? RETURNING *").bind(d.status,clean(d.note,4000),clean(d.booking_date,80),id).first();
  return row?json({lead:row}):json({error:'Lead not found.'},404);
 }
 if(id&&req.method==='DELETE') {
  await env.DB.prepare('DELETE FROM leads WHERE id=?').bind(id).run();return json({ok:true});
 }
 return json({error:'Not found.'},404);
 } catch(e) {
 if(e instanceof SyntaxError)return json({error:'Invalid request.'},400);
 if(['Name, phone, and service are required.','Enter a valid email address.','Request too large'].includes(e.message))return json({error:e.message},400);
 console.error('Lead API request failed');return json({error:'Unable to complete the request. Please try again.'},500);
 }
 }
};
