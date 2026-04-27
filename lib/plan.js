'use strict';

const semver = require('semver');

const SEVERITY_ORDER = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };

function severityRank(s) {
  return SEVERITY_ORDER[s] != null ? SEVERITY_ORDER[s] : 0;
}

// Walk audit.via to find the underlying advisory(s) for a vuln entry.
// npm v8+ audit nests advisories under `via` as objects when the entry is the
// "leaf" vulnerable package, and as strings (names of other vuln entries) when
// the vuln is inherited transitively.
function flattenAdvisories(name, audit, seen = new Set()) {
  if (seen.has(name)) return [];
  seen.add(name);
  const entry = audit.vulnerabilities && audit.vulnerabilities[name];
  if (!entry) return [];
  const out = [];
  for (const v of entry.via || []) {
    if (typeof v === 'string') {
      out.push(...flattenAdvisories(v, audit, seen));
    } else if (v && typeof v === 'object') {
      out.push({
        source: v.source,
        title: v.title,
        url: v.url,
        severity: v.severity || entry.severity,
        cwe: v.cwe || [],
        cvss: v.cvss || null,
        affectedRange: v.range || null,
        viaPackage: v.name || name,
      });
    }
  }
  return out;
}

function classifyExposure(name, directs) {
  if (directs.prod.has(name)) return 'prod-direct';
  if (directs.dev.has(name)) return 'dev-direct';
  return 'transitive';
}

function bumpKind(currentRange, fixVersion) {
  if (!fixVersion) return null;
  const fixClean = semver.coerce(fixVersion);
  if (!fixClean) return null;
  // Try to coerce "current installed" from the audit range "<X.Y.Z" or ">=X.Y.Z <A.B.C".
  // Best-effort. We use the upper bound of the affected range as a proxy for
  // "what is currently installed".
  const m = currentRange ? currentRange.match(/<\s*(\d[\d.\-A-Za-z]*)/) : null;
  const proxyCurrent = m ? semver.coerce(m[1]) : null;
  if (!proxyCurrent) return 'unknown';
  if (semver.major(fixClean) > semver.major(proxyCurrent)) return 'major';
  if (semver.minor(fixClean) > semver.minor(proxyCurrent)) return 'minor';
  return 'patch';
}

function buildPlan(audit, opts) {
  const items = [];
  const minRank = severityRank(opts.minSeverity || 'low');

  for (const [name, entry] of Object.entries(audit.vulnerabilities || {})) {
    if (severityRank(entry.severity) < minRank) continue;

    const exposure = classifyExposure(name, opts.directs);
    if (opts.prodOnly && exposure === 'dev-direct') continue;
    if (opts.prodOnly && exposure === 'transitive') {
      // Keep only if any effect lands on a prod direct dep.
      const effectsOnProd = (entry.effects || []).some((e) => opts.directs.prod.has(e));
      if (!effectsOnProd) continue;
    }

    const advisories = flattenAdvisories(name, audit);
    const fix = entry.fixAvailable;
    const fixVersion =
      fix && typeof fix === 'object' && fix.version ? fix.version : null;
    const fixViaName =
      fix && typeof fix === 'object' && fix.name ? fix.name : name;
    const isMajor =
      fix && typeof fix === 'object' ? !!fix.isSemVerMajor : false;
    if (opts.hideMajor && isMajor) continue;

    const kind = bumpKind(entry.range, fixVersion);
    const depthInfo = opts.depthFor ? opts.depthFor(name) : { depth: -1, chain: [] };

    items.push({
      package: name,
      severity: entry.severity,
      exposure,
      affectedRange: entry.range || null,
      depth: depthInfo.depth,
      chain: depthInfo.chain,
      directParent: depthInfo.chain && depthInfo.chain[0] ? depthInfo.chain[0] : null,
      effects: entry.effects || [],
      fix: {
        available: !!fix,
        viaPackage: fixVersion ? fixViaName : null,
        version: fixVersion,
        isSemVerMajor: isMajor,
        kind,
      },
      advisories,
    });
  }

  items.sort((a, b) => {
    const s = severityRank(b.severity) - severityRank(a.severity);
    if (s !== 0) return s;
    const expRank = (x) =>
      x === 'prod-direct' ? 0 : x === 'transitive' ? 1 : 2;
    const e = expRank(a.exposure) - expRank(b.exposure);
    if (e !== 0) return e;
    return (a.package || '').localeCompare(b.package || '');
  });

  return {
    generatedAt: new Date().toISOString(),
    summary: summarize(items, audit),
    items,
  };
}

function summarize(items, audit) {
  const counts = { critical: 0, high: 0, moderate: 0, low: 0, info: 0 };
  let fixable = 0;
  let majorBumps = 0;
  let prodDirect = 0;
  for (const it of items) {
    counts[it.severity] = (counts[it.severity] || 0) + 1;
    if (it.fix.available) fixable++;
    if (it.fix.isSemVerMajor) majorBumps++;
    if (it.exposure === 'prod-direct') prodDirect++;
  }
  return {
    totalShown: items.length,
    counts,
    fixable,
    majorBumps,
    prodDirect,
    auditMetadata: audit.metadata || null,
  };
}

module.exports = { buildPlan };
