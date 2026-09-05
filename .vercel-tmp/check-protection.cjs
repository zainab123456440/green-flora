#!/usr/bin/env node
/**
 * Fetches full (non-secret) build-related project settings from the Vercel API.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const candidates = [
  path.join(process.env.APPDATA || '', 'xdg.data', 'com.vercel.cli', 'auth.json'),
  path.join(os.homedir(), '.local', 'share', 'com.vercel.cli', 'auth.json'),
];

let token = null;
for (const p of candidates) {
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    token = data.token;
    if (token) break;
  } catch (e) { /* try next */ }
}

if (!token) {
  console.error('Could not read Vercel CLI auth token.');
  process.exit(1);
}

const TEAM_ID = 'team_pYhuG2qN9i3rlmNRU6fTj4Jv';
const PROJECT = 'green-flora-lbwh';

async function main() {
  const res = await fetch(
    `https://api.vercel.com/v9/projects/${PROJECT}?teamId=${TEAM_ID}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  if (!res.ok) {
    console.error('API error:', res.status, JSON.stringify(body).slice(0, 500));
    process.exit(1);
  }
  const out = {
    name: body.name,
    framework: body.framework,
    buildCommand: body.buildCommand,
    devCommand: body.devCommand,
    installCommand: body.installCommand,
    outputDirectory: body.outputDirectory,
    rootDirectory: body.rootDirectory,
    serverlessFunctionRegion: body.serverlessFunctionRegion,
    nodeVersion: body.nodeVersion,
    targets: body.targets ? Object.keys(body.targets) : undefined,
  };
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => { console.error(e.message); process.exit(1); });
