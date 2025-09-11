#!/usr/bin/env node
/**
 * Lightweight secret scanner to catch obvious key patterns before commit.
 * Not a replacement for dedicated tools (GitLeaks, TruffleHog) but fast & local.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const EXTS = ['.ts', '.tsx', '.js', '.mjs', '.cjs'];
const PATTERNS = [
  { name: 'Google API', regex: /AIza[0-9A-Za-z\-_]{35}/g },
  { name: 'Generic Secret', regex: /secret_key\s*=\s*['\"][A-Za-z0-9_\-]{16,}['\"]/gi },
  { name: 'Bearer Token', regex: /Bearer\s+[A-Za-z0-9\-_.]{20,}/g },
  { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/g },
  { name: 'Finnhub Key Style', regex: /\b[a-z0-9]{20,32}\b/g },
  { name: 'Benzinga Key', regex: /bz\.[A-Z0-9]{10,}/g }
];

const ignoreDirs = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'data', 'scripts']);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoreDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (EXTS.includes(path.extname(entry.name))) files.push(full);
  }
  return files;
}

function scanFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const hits = [];
  for (const pattern of PATTERNS) {
    const matches = content.match(pattern.regex);
    if (matches) {
      hits.push({ pattern: pattern.name, samples: matches.slice(0, 3) });
    }
  }
  return hits.length ? { file, hits } : null;
}

const files = walk(ROOT);
const results = files.map(scanFile).filter(Boolean);

if (!results.length) {
  console.log('✅ No obvious secrets detected.');
  process.exit(0);
}

console.error('\n⚠ Potential secrets detected:');
for (const r of results) {
  console.error(`\nFile: ${path.relative(ROOT, r.file)}`);
  for (const h of r.hits) {
    console.error(`  - ${h.pattern}: ${h.samples.join(', ')}`);
  }
}
console.error('\nReview & remove/rotate any real secrets before committing.');
process.exit(1);
