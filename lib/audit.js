'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');

async function collectAudit({ cwd, inputPath }) {
  if (inputPath) {
    const raw = fs.readFileSync(inputPath, 'utf8');
    return JSON.parse(raw);
  }
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const res = spawnSync(npm, ['audit', '--json'], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 100 * 1024 * 1024,
    shell: false,
  });
  const stdout = res.stdout || '';
  if (!stdout.trim()) {
    throw new Error(
      `npm audit produced no output. stderr: ${(res.stderr || '').slice(0, 500)}`
    );
  }
  try {
    return JSON.parse(stdout);
  } catch (e) {
    throw new Error(`npm audit returned non-JSON output: ${stdout.slice(0, 200)}`);
  }
}

module.exports = { collectAudit };
