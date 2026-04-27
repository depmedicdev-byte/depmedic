# saneaudit launch package

Status: code is publishable. Blocked on you for: npm account, GitHub repo, Polar.sh product, brand handle. After those, publishing is `npm publish` and we go.

## Pre-publish checklist (user)

1. Decide brand handle. Recommended: `saneaudit` (verified available on npm). Alternatives also free: `minfix`, `audit-snipe`, `reachfix`, `snipdep`.
2. Create npm account (https://www.npmjs.com/signup) under brand email.
3. Create GitHub repo `<your-handle>/saneaudit`. Public, MIT.
4. Create Polar.sh product:
   - Name: `saneaudit Pro`
   - Type: digital product, license key
   - Price option A: $19 one-time
   - Price option B: $5/mo subscription
   - Description: "Reachability analysis, monorepo support, CI policy, HTML reports."
   - Save the public checkout URL; I'll wire it into the README at launch time.

## Pre-publish actions (me, when user is ready)

1. Update `package.json` `repository.url` and `homepage` to real GitHub URL (currently PLACEHOLDER).
2. Update README's "Pro features" section with the live Polar.sh checkout URL.
3. Tag `v0.1.0`, push to GitHub.
4. `npm login` (you), then `npm publish --access public`.
5. Verify `npx saneaudit --version` from a clean folder on another machine if available.

## Launch posts

Tone: matter-of-fact, dev-to-dev, no marketing fluff. Show, don't sell.

### Hacker News - "Show HN"
Title:
```
Show HN: saneaudit - npm vulnerability triage that doesn't break your build
```
Body:
```
npm audit fix is too aggressive. Dependabot floods PRs. Snyk wants enterprise contracts. I built a small CLI that takes your npm audit output, ranks by severity x exposure, and tells you the minimum semver bump that fixes each vuln. Major bumps are flagged loudly, never auto-applied.

Free CLI on npm:
  npx saneaudit

Differences vs npm audit:
- Prod vs dev-only split (--prod-only)
- Transitive chain shown (which top-level dep pulled the vuln in)
- Minimum-bump-first (patch beats minor beats major)
- JSON mode for CI

It is local-only. No accounts, no telemetry. Built with AI assistance, code reviewed line by line. Repo: <GITHUB_URL>

Pro tier (reachability analysis, monorepo, CI policy, HTML reports) is in progress; sign up at <POLAR_URL> if useful.

Feedback welcome - especially on the ranking heuristic and on edge cases in your lockfiles.
```

### Reddit r/node, r/javascript, r/devops
Title:
```
saneaudit: an opinionated alternative to `npm audit fix` (no breaking surprises)
```
Body: same as HN body, lightly trimmed. No marketing words. Mention npm install line first.

### X / Twitter
```
shipped saneaudit: an npm vulnerability triage CLI

- minimum-bump fixes (patch > minor > major)
- prod vs dev-only split
- shows transitive chain
- exit codes for CI
- local-only, no accounts

npx saneaudit
<GITHUB_URL>
```

### dev.to article (longer-form, day 2 of launch)
Title:
```
Stop letting `npm audit fix` break your app: a minimum-bump approach
```
Outline:
- Why npm audit fix is a footgun (concrete example with mkdirp + minimist).
- The real questions: is it prod or dev? Is it actually reachable? What's the smallest possible patch?
- Walk through saneaudit's output on a real-world repo (volunteer one of your projects or a popular OSS repo).
- Honest comparison vs Dependabot, Snyk, Socket.
- What's free vs paid.
- Roadmap.

I'll draft the full article when GitHub is up; needs the repo URL for screenshots.

## Day-of-launch sequence (recommended)

1. T-0: `npm publish`.
2. T+10min: post Show HN. Critical: do not vote-manipulate. Either organic or no launch.
3. T+30min: post r/javascript and r/node.
4. T+1hr: tweet, post to LinkedIn from your dev account if you have one.
5. T+24hr: dev.to article goes live.
6. T+48hr: scrape feedback (issues, comments), triage real bugs, ship 0.1.1 with credit to first reporters.
7. T+7d: review LEDGER.md kill criteria. <10 installs -> pivot or kill.

## What I draft for you in chat at launch
- Final HN copy with exact GitHub link.
- Final Reddit copy.
- 3 tweet variants.
- dev.to draft.

You post; I never need your credentials.
