'use strict';

const fs = require('fs');
const path = require('path');

function loadLockfile(cwd) {
  const p = path.join(cwd, 'package-lock.json');
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function classifyDeps(cwd) {
  const p = path.join(cwd, 'package.json');
  const out = { prod: new Set(), dev: new Set(), peer: new Set(), optional: new Set() };
  if (!fs.existsSync(p)) return out;
  let pkg;
  try { pkg = JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return out; }
  for (const k of Object.keys(pkg.dependencies || {})) out.prod.add(k);
  for (const k of Object.keys(pkg.devDependencies || {})) out.dev.add(k);
  for (const k of Object.keys(pkg.peerDependencies || {})) out.peer.add(k);
  for (const k of Object.keys(pkg.optionalDependencies || {})) out.optional.add(k);
  return out;
}

// BFS on the npm v3 lockfile "packages" map. Returns shortest dependency chain depth
// from the root project to the named package, plus the chain itself.
function depthFor(lockfile, target) {
  if (!lockfile || !lockfile.packages) return { depth: -1, chain: [] };
  const root = lockfile.packages[''];
  if (!root) return { depth: -1, chain: [] };

  const initial = {
    ...(root.dependencies || {}),
    ...(root.devDependencies || {}),
    ...(root.optionalDependencies || {}),
  };

  const visited = new Map();
  const queue = [];
  for (const name of Object.keys(initial)) {
    queue.push({ name, depth: 1, chain: [name] });
  }

  while (queue.length) {
    const cur = queue.shift();
    const prev = visited.get(cur.name);
    if (prev && prev.depth <= cur.depth) continue;
    visited.set(cur.name, { depth: cur.depth, chain: cur.chain });
    if (cur.name === target && cur.depth <= 1) {
      return { depth: cur.depth, chain: cur.chain };
    }
    const entryKey = findEntryKey(lockfile, cur.name, cur.chain);
    if (!entryKey) continue;
    const entry = lockfile.packages[entryKey];
    if (!entry) continue;
    const subDeps = {
      ...(entry.dependencies || {}),
      ...(entry.optionalDependencies || {}),
    };
    for (const sub of Object.keys(subDeps)) {
      queue.push({ name: sub, depth: cur.depth + 1, chain: [...cur.chain, sub] });
    }
  }

  return visited.get(target) || { depth: -1, chain: [] };
}

// Try the most specific nested key first, then fall back to a top-level node_modules entry.
function findEntryKey(lockfile, name, chain) {
  const keys = Object.keys(lockfile.packages);
  const nested = 'node_modules/' + chain.join('/node_modules/');
  if (lockfile.packages[nested]) return nested;
  const flat = 'node_modules/' + name;
  if (lockfile.packages[flat]) return flat;
  return keys.find((k) => k === flat || k.endsWith('/node_modules/' + name)) || null;
}

module.exports = { loadLockfile, classifyDeps, depthFor };
