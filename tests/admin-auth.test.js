import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

function request(path, options={}) {
  return new Request("https://admin.avidezuri.com"+path,{
    method:options.method||"GET",
    headers:{...(options.origin?{origin:options.origin}:{}),...(options.headers||{}),...(options.body!==undefined?{"content-type":"application/json"}:{})},
    body:options.body===undefined?undefined:JSON.stringify(options.body)
  });
}

test("admin API denies requests without an authenticated database session",async()=>{
  const response=await worker.fetch(request("/api/admin/orders"),{});
  assert.equal(response.status,401);
});

test("admin login rejects requests outside the trusted admin origin",async()=>{
  const response=await worker.fetch(request("/api/admin/login",{method:"POST",origin:"https://attacker.example",body:{email:"admin@example.com",password:"x"}}),{});
  assert.equal(response.status,403);
});

test("admin preflight permits the CSRF header required by authenticated mutations",async()=>{
  const response=await worker.fetch(request("/api/admin/orders",{method:"OPTIONS",origin:"https://admin.avidezuri.com"}),{});
  assert.equal(response.status,204);
  assert.match(response.headers.get("access-control-allow-headers")||"",/x-csrf-token/i);
});

test("admin branch preview origin is trusted only on the matching preview host",async()=>{
  const previewRequest=new Request("https://feature-multi-admin-auth.avidezuri.com/api/admin/login",{
    method:"POST",
    headers:{origin:"https://feature-multi-admin-auth.avidezuri.com","content-type":"application/json"},
    body:JSON.stringify({email:"admin@example.com",password:"x"})
  });
  const response=await worker.fetch(previewRequest,{});
  assert.equal(response.status,503);
  const mismatchedHost=new Request("https://admin.avidezuri.com/api/admin/login",{
    method:"POST",
    headers:{origin:"https://feature-multi-admin-auth.avidezuri.com","content-type":"application/json"},
    body:JSON.stringify({email:"admin@example.com",password:"x"})
  });
  const rejected=await worker.fetch(mismatchedHost,{});
  assert.equal(rejected.status,403);
});

test("admin API rejects untrusted origins before reaching protected routes",async()=>{
  const response=await worker.fetch(request("/api/admin/orders",{origin:"https://attacker.example"}),{});
  assert.equal(response.status,403);
});

test("legacy secrets bootstrap the first Super Admin into a hashed database account",async()=>{
  const users=[],attempts=new Map();
  const db={
    prepare(sql){
      let args=[];
      return {
        bind(...values){args=values;return this},
        async first(){
          if(sql.includes("FROM admin_login_attempts"))return attempts.get(args[0])||null;
          if(sql.includes("SELECT COUNT(*) AS total FROM admin_users"))return {total:users.length};
          if(sql.includes("SELECT * FROM admin_users WHERE email=?"))return users.find(u=>u.email===args[0])||null;
          if(sql.includes("FROM admin_users WHERE id=?"))return users.find(u=>u.id===args[0])||null;
          return null;
        },
        async all(){return {results:[]}},
        async run(){
          if(sql.includes("INSERT OR IGNORE INTO admin_users")){
            if(!users.some(u=>u.email===args[0]))users.push({id:1,email:args[0],display_name:args[1],password_hash:args[2],password_salt:args[3],password_iterations:args[4],role:"super_admin",is_active:1,must_change_password:0,session_version:1});
          }
          if(sql.includes("DELETE FROM admin_login_attempts"))attempts.delete(args[0]);
          if(sql.includes("INSERT INTO admin_login_attempts"))attempts.set(args[0],{attempts:args[1],window_started_at:args[2],locked_until:args[3]});
          return {success:true,meta:{changes:1}};
        }
      };
    }
  };
  const env={DB:db,ADMIN_EMAIL:"owner@example.com",ADMIN_PASSWORD:"StrongLegacyPassphrase!",ADMIN_SESSION_SECRET:"a".repeat(48)};
  const login=await worker.fetch(request("/api/admin/login",{method:"POST",origin:"https://admin.avidezuri.com",body:{email:env.ADMIN_EMAIL,password:env.ADMIN_PASSWORD}}),env);
  assert.equal(login.status,200);
  const payload=await login.json();
  assert.equal(payload.role,"super_admin");
  assert.equal(users.length,1);
  assert.notEqual(users[0].password_hash,env.ADMIN_PASSWORD);
  const cookie=login.headers.get("set-cookie").split(";")[0];
  const session=await worker.fetch(new Request("https://admin.avidezuri.com/api/admin/session",{headers:{cookie}}),env);
  assert.equal(session.status,200);
  assert.equal((await session.json()).authenticated,true);
});

test("authenticated state changes reject missing CSRF tokens",async()=>{
  const users=[{id:1,email:"owner@example.com",display_name:"Owner",role:"super_admin",is_active:1,must_change_password:0,session_version:1,password_hash:"",password_salt:"",password_iterations:310000}];
  const db={prepare(sql){let args=[];return{bind(...v){args=v;return this},async first(){if(sql.includes("FROM admin_users WHERE id=?"))return users[0];return null},async all(){return{results:[]}},async run(){return{success:true}}}}};
  const env={DB:db,ADMIN_SESSION_SECRET:"b".repeat(48)};
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(env.ADMIN_SESSION_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const csrf="csrf-test-token";
  const payload= btoa(JSON.stringify({id:1,email:"owner@example.com",sv:1,csrf,exp:Math.floor(Date.now()/1000)+300})).replace(/=/g,"").replaceAll("+","-").replaceAll("/","_");
  const signature=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(payload));
  const sig=btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g,"").replaceAll("+","-").replaceAll("/","_");
  const response=await worker.fetch(new Request("https://admin.avidezuri.com/api/admin/users",{method:"POST",headers:{origin:"https://admin.avidezuri.com",cookie:"avz_admin_session="+payload+"."+sig,"content-type":"application/json"},body:JSON.stringify({})}),env);
  assert.equal(response.status,403);
});
