#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const libCoverage = require('istanbul-lib-coverage');
const libReport = require('istanbul-lib-report');
const reports = require('istanbul-reports');

const base = path.resolve(__dirname, '..');
const unitPath = path.join(base, 'coverage-unit', 'coverage-final.json');
const intPath = path.join(base, 'coverage-integration', 'coverage-final.json');
const outDir = path.join(base, 'coverage');

const map = libCoverage.createCoverageMap({});

let found = false;
if (fs.existsSync(unitPath)) {
  const unit = JSON.parse(fs.readFileSync(unitPath, 'utf8'));
  map.merge(unit);
  found = true;
}
if (fs.existsSync(intPath)) {
  const integ = JSON.parse(fs.readFileSync(intPath, 'utf8'));
  map.merge(integ);
  found = true;
}

if (!found) {
  console.error('No coverage-final.json found in coverage-unit or coverage-integration.');
  process.exit(1);
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const context = libReport.createContext({
  dir: outDir,
  coverageMap: map,
});

const reportTypes = ['html', 'lcovonly', 'text-summary'];

reportTypes.forEach(type => {
  const report = reports.create(type, {});
  report.execute(context);
});

fs.writeFileSync(path.join(outDir, 'coverage-final.json'), JSON.stringify(map.toJSON()));

console.log('Coverage merged into', outDir);
