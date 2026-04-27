'use strict';

function parseArgs(argv) {
  const out = {
    help: false,
    version: false,
    json: false,
    prodOnly: false,
    noMajor: false,
    severity: null,
    cwd: null,
    input: null,
  };
  for (const a of argv) {
    if (a === '-h' || a === '--help') out.help = true;
    else if (a === '-v' || a === '--version') out.version = true;
    else if (a === '--json') out.json = true;
    else if (a === '--prod-only') out.prodOnly = true;
    else if (a === '--no-major') out.noMajor = true;
    else if (a.startsWith('--severity=')) out.severity = a.slice('--severity='.length);
    else if (a.startsWith('--cwd=')) out.cwd = a.slice('--cwd='.length);
    else if (a.startsWith('--input=')) out.input = a.slice('--input='.length);
    else throw new Error(`Unknown argument: ${a}`);
  }
  return out;
}

module.exports = { parseArgs };
