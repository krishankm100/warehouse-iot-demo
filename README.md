# Warehouse IoT — cloud deployment demo

A self-contained Node.js demo with simulated warehouse sensors. No Home Assistant connection, token, private data or external packages. Clearly labelled DEMO in the dashboard.

## Deploy on Render (Free)
1. Create a GitHub repository named `warehouse-iot-demo` and upload the contents of this folder at the repository root (not the ZIP).
2. In Render: New → Web Service → connect that repository.
3. Runtime: Node. Build command: `npm install --omit=dev`. Start command: `npm start`. Instance type: **Free**. Health check: `/healthz`. No secrets or paid services required.
4. Click Deploy Web Service. Wait until Live and open the supplied `https://…onrender.com` URL.

Alternatively use New → Blueprint with this repository; `render.yaml` explicitly selects the free plan.

Free web services may sleep after 15 minutes without incoming traffic and take around a minute to wake. This is a learning demo, not an always-on production service. No artificial keep-awake jobs are included. Activity is in memory and resets on restart. History is generated from the simulation clock, not recorded real observations.

## Local preview
Node.js 22+: `npm start`, then open http://localhost:8788. The original live portal uses 8787 and is unchanged.

## Exercise
Watch the loading-bay door toggle automatically; open-door KPI and alerts update every five seconds. Select temperature or humidity in Sensor trends. Use the search and entity filter. Every user sees the same time-based simulation. Low battery (18%) is intentional demo data.

`npm test` verifies the demo API, history and rejection of configuration writes. The server reads only its static public files; it never reads local Home Assistant credentials.
