import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||8788);
const spec=[
 ['binary_sensor.loading_door','Loading bay door','door',null],
 ['binary_sensor.dispatch_door','Dispatch door','door',null],
 ['sensor.warehouse_temperature','Warehouse temperature','temperature','°C'],
 ['sensor.cold_room_temperature','Cold room temperature','temperature','°C'],
 ['sensor.warehouse_humidity','Warehouse humidity','humidity','%'],
 ['sensor.door_battery','Door sensor battery','battery','%']
];
export function reading(id,t){const minute=t/60000;switch(id){case 'binary_sensor.loading_door':return Math.floor(t/15000)%4===0?'on':'off';case 'binary_sensor.dispatch_door':return Math.floor(t/30000)%5===0?'on':'off';case 'sensor.warehouse_temperature':return (24+2*Math.sin(minute/8)).toFixed(1);case 'sensor.cold_room_temperature':return (4+.8*Math.sin(minute/12)).toFixed(1);case 'sensor.warehouse_humidity':return (52+5*Math.sin(minute/10)).toFixed(1);case 'sensor.door_battery':return '18';}}
let states=[],events=[];const clients=new Set();
function tick(){const now=Date.now();states=spec.map(([id,name,dc,unit])=>{const old=states.find(s=>s.entity_id===id),value=reading(id,now);const changed=old?.state!==value;const time=new Date(now).toISOString();if(old&&changed)events.unshift({id,name,from:old.state,to:value,time});return{entity_id:id,state:value,attributes:{friendly_name:name,device_class:dc,...(unit?{unit_of_measurement:unit}:{})},last_changed:changed?time:old.last_changed};});events=events.slice(0,100);for(const client of clients)client.write('data: '+JSON.stringify(snapshot())+'\n\n');}
function snapshot(){return{status:'live',detail:'Simulation running · Updates every 5 seconds · No real devices connected',configured:true,lastSync:new Date().toISOString(),states,events,demo:true};}
tick();const timer=setInterval(tick,5000);
const files={'/':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/style.css':['style.css','text/css']};
const server=http.createServer((req,res)=>{res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
 const json=(code,body)=>{res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(body));};
 const u=new URL(req.url,'http://localhost');if(req.method!=='GET'){json(405,{error:'Read-only demo'});return;}
 if(u.pathname==='/healthz'){json(200,{ok:true,demo:true});return;}
 if(u.pathname==='/api/status'){json(200,snapshot());return;}
 if(u.pathname==='/api/events'){res.writeHead(200,{'Content-Type':'text/event-stream','Connection':'keep-alive'});clients.add(res);res.write('data: '+JSON.stringify(snapshot())+'\n\n');req.on('close',()=>clients.delete(res));return;}
 if(u.pathname==='/api/history'){const id=u.searchParams.get('entity');if(!spec.some(s=>s[0]===id)){json(400,{error:'Unknown demo entity'});return;}const hours=Math.min(168,Math.max(1,Number(u.searchParams.get('hours'))||24)),end=Date.now(),start=end-hours*3600000,step=id.startsWith('binary_sensor.')?15000:Math.max(60000,Math.ceil(hours*3600000/300));const rows=[];let prev;for(let t=start;t<=end;t+=step){const value=reading(id,t);if(!id.startsWith('binary_sensor.')||value!==prev){rows.push({state:value,last_changed:new Date(t).toISOString()});}prev=value;}json(200,{start:new Date(start).toISOString(),end:new Date(end).toISOString(),rows,demo:true});return;}
 const file=files[u.pathname];if(file){res.writeHead(200,{'Content-Type':file[1]});res.end(fs.readFileSync(path.join(root,file[0])));return;}json(404,{error:'Not found'});
});
server.listen(port,process.env.HOST||'0.0.0.0',()=>console.log('Warehouse DEMO running on port '+port));
function shutdown(){clearInterval(timer);for(const c of clients)c.end();server.close(()=>process.exit(0));}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
