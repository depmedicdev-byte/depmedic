'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const { buildPlan } = require('../lib/plan.js');
const { renderHuman, renderJson } = require('../lib/render.js');

function loadFixtures() {
  const audit = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'fixture-audit.json'), 'utf8')
  );
  const directs = {
    prod: new Set(['lodash', 'mkdirp']),
    dev: new Set(['minimist']),
    peer: new Set(),
    optional: new Set(),
  };
  return { audit, directs };
}

test('buildPlan: ranks critical above high, prod-direct above transitive', () => {
  const { audit, directs } = loadFixtures();
  const plan = buildPlan(audit, {
    lockfile: null,
    directs,
    minSeverity: 'low',
    depthFor: () => ({ depth: -1, chain: [] }),
  });
  assert.equal(plan.items.length, 3);
  assert.equal(plan.items[0].severity, 'critical');
  assert.equal(plan.summary.counts.critical, 2);
  assert.equal(plan.summary.counts.high, 1);
});

test('buildPlan: --prod-only drops dev-direct entries', () => {
  const { audit, directs } = loadFixtures();
  const plan = buildPlan(audit, {
    lockfile: null,
    directs,
    minSeverity: 'low',
    prodOnly: true,
    depthFor: () => ({ depth: -1, chain: [] }),
  });
  const names = plan.items.map((i) => i.package);
  assert.ok(!names.includes('minimist'), 'dev-only minimist should be filtered');
});

test('buildPlan: --no-major hides major bumps', () => {
  const { audit, directs } = loadFixtures();
  const plan = buildPlan(audit, {
    lockfile: null,
    directs,
    minSeverity: 'low',
    hideMajor: true,
    depthFor: () => ({ depth: -1, chain: [] }),
  });
  const names = plan.items.map((i) => i.package);
  assert.ok(names.includes('lodash'));
  assert.ok(!names.includes('mkdirp'));
});

test('buildPlan: severity threshold filters lower entries', () => {
  const { audit, directs } = loadFixtures();
  const plan = buildPlan(audit, {
    lockfile: null,
    directs,
    minSeverity: 'critical',
    depthFor: () => ({ depth: -1, chain: [] }),
  });
  for (const it of plan.items) assert.equal(it.severity, 'critical');
});

test('renderHuman: produces non-empty output and mentions package names', () => {
  const { audit, directs } = loadFixtures();
  const plan = buildPlan(audit, {
    lockfile: null,
    directs,
    minSeverity: 'low',
    depthFor: () => ({ depth: -1, chain: [] }),
  });
  const out = renderHuman(plan);
  assert.ok(out.includes('lodash'));
  assert.ok(out.includes('mkdirp'));
  assert.ok(out.includes('depmedic'));
});

test('renderJson: round-trips to valid JSON with items', () => {
  const { audit, directs } = loadFixtures();
  const plan = buildPlan(audit, {
    lockfile: null,
    directs,
    minSeverity: 'low',
    depthFor: () => ({ depth: -1, chain: [] }),
  });
  const out = renderJson(plan);
  const parsed = JSON.parse(out);
  assert.ok(Array.isArray(parsed.items));
  assert.ok(parsed.summary);
});
