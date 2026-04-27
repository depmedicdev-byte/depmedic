'use strict';

const pc = require('picocolors');

const SEV_COLORS = {
  critical: pc.bgRed,
  high: pc.red,
  moderate: pc.yellow,
  low: pc.cyan,
  info: pc.gray,
};

function colorSev(sev) {
  const fn = SEV_COLORS[sev] || pc.white;
  return fn(` ${sev.toUpperCase()} `);
}

function renderHuman(plan) {
  const lines = [];
  const s = plan.summary;
  lines.push(pc.bold('depmedic') + pc.gray(`  ${plan.generatedAt}`));
  lines.push('');
  if (plan.items.length === 0) {
    lines.push(pc.green('No vulnerabilities at the selected severity threshold.'));
    return lines.join('\n');
  }

  lines.push(
    `Found ${pc.bold(s.totalShown)} vulnerabilities  ` +
      `[${pc.red('crit ' + s.counts.critical)}` +
      `  ${pc.red('high ' + s.counts.high)}` +
      `  ${pc.yellow('mod ' + s.counts.moderate)}` +
      `  ${pc.cyan('low ' + s.counts.low)}]`
  );
  lines.push(
    `  fixable: ${pc.bold(s.fixable)}` +
      `   major-bumps: ${pc.bold(s.majorBumps)}` +
      `   prod-direct: ${pc.bold(s.prodDirect)}`
  );
  lines.push('');

  for (const it of plan.items) {
    const head =
      colorSev(it.severity) +
      ' ' +
      pc.bold(it.package) +
      pc.gray(`  (${it.exposure}` + (it.depth > 0 ? `, depth ${it.depth}` : '') + ')');
    lines.push(head);

    if (it.affectedRange) {
      lines.push('  affected: ' + pc.gray(it.affectedRange));
    }
    if (it.chain && it.chain.length > 1) {
      lines.push('  pulled in via: ' + pc.gray(it.chain.join(' -> ')));
    } else if (it.directParent && it.directParent !== it.package) {
      lines.push('  pulled in via: ' + pc.gray(it.directParent));
    }

    if (it.fix.available && it.fix.version) {
      const tag =
        it.fix.kind === 'major'
          ? pc.red('MAJOR')
          : it.fix.kind === 'minor'
          ? pc.yellow('minor')
          : it.fix.kind === 'patch'
          ? pc.green('patch')
          : pc.gray(it.fix.kind || 'unknown');
      lines.push(
        '  ' + pc.green('fix:') +
          ` upgrade ${pc.bold(it.fix.viaPackage)} -> ${pc.bold(it.fix.version)} (${tag})`
      );
    } else if (it.fix.available) {
      lines.push('  ' + pc.yellow('fix: available via npm audit fix (no exact version surfaced)'));
    } else {
      lines.push('  ' + pc.red('fix: none available'));
    }

    if (it.advisories && it.advisories.length) {
      const top = it.advisories[0];
      if (top.title) lines.push('  ' + pc.gray(top.title));
      if (top.url) lines.push('  ' + pc.gray(top.url));
    }

    lines.push('');
  }

  lines.push(pc.gray('tips:'));
  lines.push(pc.gray('  depmedic --prod-only      ignore dev-only issues'));
  lines.push(pc.gray('  depmedic --no-major       hide fixes that need a semver-major bump'));
  lines.push(pc.gray('  depmedic --severity=high  only show high+critical'));
  lines.push(pc.gray('  depmedic --json           emit JSON for CI'));
  lines.push('');
  lines.push(pc.gray('also from depmedic:'));
  lines.push(pc.gray('  ci-doctor                 audit GitHub Actions for cost + security  npx ci-doctor'));
  lines.push(pc.gray('  cursor-rules-init         scaffold .cursorrules in one command       npx cursor-rules-init'));
  lines.push(pc.gray('  gha-budget                estimate $ cost of a workflow              npx gha-budget'));
  lines.push(pc.gray('  pin-actions               pin every action ref to a SHA              npx pin-actions'));
  lines.push('');
  if (s.prodDirect > 0 || s.counts.critical > 0 || s.counts.high > 0) {
    lines.push(pc.gray('Stuck on a dep upgrade chain? The Senior Dev System Prompt is the'));
    lines.push(pc.gray('exact prompt I use for these. $3, one-time:'));
    lines.push(pc.gray('https://buy.polar.sh/polar_cl_uB8vltMstgTufNMgUCEslCJXYrJdKh7IiaV4X40HCoS'));
  }

  return lines.join('\n');
}

function renderJson(plan) {
  return JSON.stringify(plan, null, 2);
}

module.exports = { renderHuman, renderJson };
