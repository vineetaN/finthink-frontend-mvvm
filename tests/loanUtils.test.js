const assert = require('assert');
const { calculateIndicativeEmi, buildRepaymentSchedule, escapeCsvCell, normalizeLoanType } = require('../src/js/utils/loanUtils');

function run() {
  const emi = calculateIndicativeEmi(1000000, 8.5, 12);
  assert.ok(Number.isFinite(emi), 'indicative EMI should be numeric');
  assert.ok(emi > 0, 'indicative EMI should be positive');

  const schedule = buildRepaymentSchedule(1000000, 8.5, 12, '2026-10-05');
  assert.equal(schedule.length, 12, 'first 12 rows should be returned');
  assert.ok(schedule[0].emi > 0, 'schedule EMI should be positive');
  assert.ok(schedule[0].balance < 1000000, 'balance should reduce over time');

  const escaped = escapeCsvCell('=cmd|whoami');
  assert.equal(escaped.charAt(0), "'", 'CSV injection marker should be prefixed');

  assert.equal(normalizeLoanType('gold plus', true), 'GOLD_PLUS');
  assert.equal(normalizeLoanType('  custom  ', false), 'custom');

  console.log('loan utils checks passed');
}

run();
