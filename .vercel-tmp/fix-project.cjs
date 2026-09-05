#!/usr/bin/env node
/**
 * Fixes the Vercel project configuration: sets the Next.js framework preset
 * and corrects the root directory, then re-reads the settings to confirm.
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

async function patchProject() {
  const res = await fetch(
    `https://api.vercel.com/v9/projects/${PROJECT}?teamId=${TEAM_ID}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        framework: 'nextjs',
        rootDirectory: 'Frontend/greenflora',
      }),
    }
  );
  const body = await res.json();
  if (!res.ok) {
    console.error('PATCH failed:', res.status, JSON.stringify(body).slice(0, 800));
    process.exit(1);
  }
  console.log(JSON.stringify({
    name: body.name,
    framework: body.framework,
    rootDirectory: body.rootDirectory,
    buildCommand: body.buildCommand,
    installCommand: body.installCommand,
    outputDirectory: body.outputDirectory,
  }, null, 2));
}

patchProject().catch((e) => { console.error(e.message); process.exit(1); });
