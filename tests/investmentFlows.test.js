const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function observable(initial) {
  let value = initial;
  return function (next) {
    if (arguments.length) value = next;
    return value;
  };
}
const ko = { observable, observableArray: observable, pureComputed: (fn) => fn };
function loadAmd(file, dependencies) {
  let exported;
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', file), 'utf8');
  vm.runInNewContext(source, {
    define: (names, factory) => { exported = factory(...names.map((name) => dependencies[name])); },
    window: {}, document: {}, Promise, Intl, Number, String, Set
  }, { filename: file });
  return exported;
}
const tick = () => new Promise((resolve) => setImmediate(resolve));

async function run() {
  const paths = [];
  const apiClient = {
    get: (url) => { paths.push('GET ' + url); return Promise.resolve({}); },
    post: (url) => { paths.push('POST ' + url); return Promise.resolve({}); }
  };
  const api = loadAmd('services/investmentService.js', { './apiClient': apiClient });
  await api.active();
  await api.previewFd({});
  await api.createFd({});
  await api.createRd({});
  await api.closePremature(7, 1);
  await api.funds('ELSS', 'HIGH');
  await api.previewFund({});
  await api.buyFund({});
  await api.startSip({});
  await api.redeemFund(7, 2);
  await api.valuation(7);
  await api.products();
  await api.updateRate({});
  assert.deepEqual(paths, [
    'POST /investment-service/api/investments/customer/getInvestment',
    'POST /investment-service/api/investments/fd/preview',
    'POST /investment-service/api/investments/fd',
    'POST /investment-service/api/investments/rd',
    'POST /investment-service/api/investments/7/close-premature',
    'GET /investment-service/api/investments/mutual-funds?category=ELSS&riskLevel=HIGH',
    'POST /investment-service/api/investments/mutual-fund/preview',
    'POST /investment-service/api/investments/mutual-fund/buy',
    'POST /investment-service/api/investments/mutual-fund/sip/start',
    'POST /investment-service/api/investments/mutual-fund/7/redeem',
    'GET /investment-service/api/investments/mutual-fund/7/valuation',
    'GET /investment-service/api/investments/admin/getInvestment',
    'POST /investment-service/api/investments/admin/updateInterestRate'
  ]);

  const format = loadAmd('utils/investmentFormat.js', {});
  const accountService = { getCustomerSummary: () => Promise.resolve([{
    accountId: 101, accountNumber: '00004821', accountType: 'SAVINGS',
    availableBalance: 20000, status: 'ACTIVE'
  }]) };
  const calls = [];
  const service = {
    previewFd: (payload) => { calls.push(['previewFd', payload]); return Promise.resolve({ rate: 7, maturityAmount: 10700 }); },
    createFd: (payload) => { calls.push(['createFd', payload]); return Promise.resolve({ investmentId: 1 }); },
    createRd: (payload) => { calls.push(['createRd', payload]); return Promise.resolve({ investmentId: 2 }); },
    funds: () => Promise.resolve([{ fundId: 5, fundName: 'Growth Fund', category: 'EQUITY',
      riskLevel: 'MEDIUM', minLumpsumAmount: 100, minSipAmount: 50 }]),
    previewFund: (payload) => { calls.push(['previewFund', payload]); return Promise.resolve({ unitsAllotted: 5 }); },
    buyFund: (payload) => { calls.push(['buyFund', payload]); return Promise.resolve({ investmentId: 3 }); },
    startSip: (payload) => { calls.push(['startSip', payload]); return Promise.resolve({ investmentId: 4 }); }
  };
  const deps = {
    knockout: ko, '../services/investmentService': service,
    '../services/accountService': accountService,
    '../utils/investmentFormat': format,
    '../utils/authGuard': { requireAuthentication: () => true },
    '../utils/sessionService': { getCustomerId: () => 1 },
    '../utils/navigationService': { goTo: () => Promise.resolve() },
    '../utils/revealSection': function () {}
  };

  const Deposits = loadAmd('viewModels/investmentDeposits.js', deps);
  const deposits = new Deposits();
  deposits.loadAccounts();
  await tick();
  deposits.accountId(101);
  deposits.amount('1000');
  deposits.review();
  await tick();
  assert.equal(deposits.isReviewCurrent(), true);
  deposits.create();
  await tick();
  assert.equal(calls[1][1].customerId, 1);
  assert.equal(calls[1][1].accountId, 101);
  assert.equal(calls[1][1].onMaturityAction, 'LIQUIDATE');
  deposits.startAgain();
  await tick();
  deposits.mode('RD');
  deposits.accountId(101);
  deposits.amount('500');
  deposits.onMaturityAction('AUTO_RENEW');
  deposits.review();
  deposits.create();
  await tick();
  assert.equal(calls[2][0], 'createRd');
  assert.equal(calls[2][1].autoRenewal, true);

  const MutualFunds = loadAmd('viewModels/mutualFunds.js', deps);
  const funds = new MutualFunds();
  funds.load();
  await tick();
  funds.chooseFund(funds.funds()[0]);
  funds.accountId(101);
  funds.amount('250');
  funds.review();
  await tick();
  funds.confirm();
  await tick();
  assert.equal(calls[4][0], 'buyFund');
  assert.equal(calls[4][1].fundId, 5);
  assert.equal(calls[4][1].amount, 250);
  funds.startAgain();
  await tick();
  funds.chooseFund(funds.funds()[0]);
  funds.mode('SIP');
  funds.accountId(101);
  funds.amount('100');
  funds.tenureMonths('12');
  funds.review();
  funds.confirm();
  await tick();
  assert.equal(calls[5][0], 'startSip');
  assert.equal(calls[5][1].monthlyAmount, 100);
  assert.equal(calls[5][1].tenureMonths, 12);
  process.stdout.write('Investment routes and purchase flows passed.\n');
}

run().catch((error) => {
  process.stderr.write(error.stack + '\n');
  process.exitCode = 1;
});
