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

const ko = { observable, observableArray: observable, pureComputed: (compute) => compute };
let Dashboard;
const source = fs.readFileSync(path.join(__dirname, '..', 'src/js/viewModels/dashboard.js'), 'utf8');
const routes = [];
const dependencies = {
  knockout: ko,
  '../accUtils': { announce: () => {} },
  '../services/accountService': { getCustomerSummary: (id) => {
    assert.equal(id, 42);
    return Promise.resolve([
      { accountType: 'SAVINGS', status: 'ACTIVE', accountNumber: '12345678', availableBalance: 1250 },
      { accountType: 'CURRENT', status: 'ACTIVE', accountNumber: '87654321', availableBalance: 750 }
    ]);
  } },
  '../services/rewardService': { wallet: () => Promise.resolve({ availablePoints: 125 }) },
  '../services/investmentService': { active: () => Promise.resolve([{ investmentId: 1 }, { investmentId: 2 }]) },
  '../utils/authGuard': { requireAuthentication: () => true },
  '../utils/sessionService': { username: observable('Ritisha'), getCustomerId: () => 42 },
  '../utils/navigationService': { goTo: (route) => { routes.push(route); return Promise.resolve(); } }
};
vm.runInNewContext(source, {
  define: (names, factory) => { Dashboard = factory(...names.map((name) => dependencies[name])); },
  document: { title: '' }, Promise, Number, String, Intl
}, { filename: 'dashboard.js' });

async function run() {
  const dashboard = new Dashboard();
  assert.equal(dashboard.username(), 'Ritisha');
  await dashboard.load();
  assert.equal(dashboard.balanceText(), '••••••');
  assert.equal(dashboard.totalAvailable(), 2000);
  dashboard.toggleBalance();
  assert.match(dashboard.balanceText(), /2,000/);
  assert.equal(dashboard.savingsAccountLabel(), 'Account •••• 5678');
  assert.equal(dashboard.savingsHeading(), 'Active savings account');
  assert.match(dashboard.savingsBalanceText(), /1,250/);
  assert.equal(dashboard.pointsText(), '125 pts');
  assert.equal(dashboard.investmentsText(), '2');
  await dashboard.goToTransfer();
  await dashboard.goToBillPayments();
  await dashboard.goToStatements();
  await dashboard.goToAccounts();
  await dashboard.goToRewards();
  await dashboard.goToInvestments();
  assert.deepEqual(routes, [
    'fundTransfer', 'billers', 'transactions', 'customerSummary', 'rewardsWallet', 'investments'
  ]);
  await dashboard.load();
  assert.equal(dashboard.balanceText(), '••••••');

  dependencies['../services/rewardService'].wallet = () => Promise.reject(new Error('Offline'));
  await dashboard.load();
  assert.equal(dashboard.pointsText(), 'Unavailable');
  assert.equal(dashboard.balanceText(), '••••••');
  console.log('Dashboard data, masking, and navigation checks passed.');
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
