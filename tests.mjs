import {test} from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
test('cloud demo: health, synthetic entities/history, read-only routes and static files',async()=>{
 const child=spawn(process.execPath,['server.mjs'],{cwd:import.meta.dirname,env:{...process.env,PORT:'18788',HOST:'127.0.0.1'},stdio:'pipe'});const base='http://127.0.0.1:18788';
 try{let ready=false;for(let i=0;i<60;i++){try{if((await fetch(base+'/healthz')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,50));}assert.ok(ready);
 const d=await(await fetch(base+'/api/status')).json();assert.equal(d.demo,true);assert.equal(d.states.length,6);assert.ok(d.states.every(s=>s.entity_id&&s.attributes));assert.equal(d.token,undefined);
 for(const s of d.states){const h=await(await fetch(base+'/api/history?entity='+s.entity_id+'&hours=6')).json();assert.equal(h.demo,true);assert.ok(h.rows.length);assert.ok(h.rows.every(r=>Number.isFinite(new Date(r.last_changed).getTime())));}
 assert.equal((await fetch(base+'/api/history?entity=missing')).status,400);assert.equal((await fetch(base+'/api/config',{method:'POST',body:'{}'})).status,405);assert.equal((await fetch(base+'/.local-data/connection.json')).status,404);
 const html=await(await fetch(base)).text();assert.ok(html.includes('DEMO'));assert.ok(!html.includes('id="token"'));assert.equal((await fetch(base+'/app.js')).status,200);
 const stream=await fetch(base+'/api/events');const reader=stream.body.getReader();assert.match(new TextDecoder().decode((await reader.read()).value),/"demo":true/);await reader.cancel();
 }finally{child.kill();}
});
