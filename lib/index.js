'use strict';

const { parseArgs } = require('./args.js');
const { collectAudit } = require('./audit.js');
const { loadLockfile, classifyDeps, depthFor } = require('./lockfile.js');
const { buildPlan } = require('./plan.js');
const { renderHuman, renderJson } = require('./render.js');

const HELP = `
depmedic - surgical npm vulnerability triage

Usage:
  depmedic [options]

Options:
  --json              Emit machine-readable JSON.
  --prod-only         Ignore devDependency vulnerabilities.
  --severity=<lvl>    Minimum severity to show: low|moderate|high|critical (default: low).
  --no-major          Hide fixes that require a semver-major bump.
  --cwd=<path>        Project directory (default: process.cwd()).
  --input=<path>      Read 'npm audit --json' output from a file instead of running it.
  -h, --help          Show this help.
  -v, --version       Show version.

Exit codes:
  0  no vulnerabilities at or above the selected severity threshold
  1  vulnerabilities present
  2  unexpected error
`.trim();

async function run(argv) {
  const args = parseArgs(argv);
  if (args.help) { console.log(HELP); return 0; }
  if (args.version) {
    console.log(require('../package.json').version);
    return 0;
  }

  const cwd = args.cwd || process.cwd();
  const audit = await collectAudit({ cwd, inputPath: args.input });
  if (!audit || !audit.vulnerabilities) {
    console.error('depmedic: could not parse npm audit output');
    return 2;
  }

  const lock = loadLockfile(cwd);
  const directs = classifyDeps(cwd);

  const plan = buildPlan(audit, {
    lockfile: lock,
    directs,
    prodOnly: args.prodOnly,
    minSeverity: args.severity || 'low',
    hideMajor: args.noMajor === true,
    depthFor: (name) => depthFor(lock, name),
  });

  if (args.json) {
    process.stdout.write(renderJson(plan) + '\n');
  } else {
    process.stdout.write(renderHuman(plan) + '\n');
  }

  return plan.items.length > 0 ? 1 : 0;
}

module.exports = { run };
