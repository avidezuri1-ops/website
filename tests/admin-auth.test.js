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

test("admin API rejects untrusted origins before reaching protected routes",async()=>{
  const response=await worker.fetch(request("/api/admin/orders",{origin:"https://attacker.example"}),{});
  assert.equal(response.status,403);
});
