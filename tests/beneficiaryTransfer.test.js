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
    define: (names, factory) => {
      exported = factory(...names.map((name) => dependencies[name]));
    },
    window: { sessionStorage: { getItem: () => null } },
    document: {},
    Promise,
    Intl,
    Number,
    String
  }, { filename: file });
  return exported;
}

const tick = () => new Promise((resolve) => setImmediate(resolve));

async function run() {
  const routes = [];
  const apiClient = {
    get: (url) => { routes.push('GET ' + url); return Promise.resolve({}); },
    post: (url) => { routes.push('POST ' + url); return Promise.resolve({}); },
    patch: (url) => { routes.push('PATCH ' + url); return Promise.resolve({}); },
    remove: (url) => { routes.push('DELETE ' + url); return Promise.resolve({}); }
  };
  const beneficiaryApi = loadAmd('services/beneficiaryService.js', { './apiClient': apiClient });
  const transferApi = loadAmd('services/paymentService.js', { './apiClient': apiClient });
  await beneficiaryApi.list();
  await beneficiaryApi.get(10);
  await beneficiaryApi.create({});
  await beneficiaryApi.setStatus(10, 'INACTIVE');
  await beneficiaryApi.remove(10);
  await transferApi.initiate({});
  await transferApi.verifyOtp('payment-1', '123456');
  assert.deepEqual(routes, [
    'GET /banking-service/api/beneficiaries',
    'GET /banking-service/api/beneficiaries/10',
    'POST /banking-service/api/beneficiaries',
    'PATCH /banking-service/api/beneficiaries/10/status',
    'DELETE /banking-service/api/beneficiaries/10',
    'POST /banking-service/api/payments/initiate',
    'POST /banking-service/api/payments/payment-1/verify-otp'
  ]);

  const calls = [];
  const paymentService = {
    initiate: (payload) => {
      calls.push({ type: 'initiate', payload });
      return Promise.resolve({
        paymentId: 'payment-1', status: 'OTP_SENT', recipientName: 'Ananya Sharma',
        recipientAccountNumber: '****9012', recipientIfscCode: 'HDFC0123456', amount: 2500
      });
    },
    verifyOtp: (id, otp) => {
      calls.push({ type: 'verify', id, otp });
      return Promise.resolve({
        status: 'SUCCESS', referenceNo: 'TRF123', debitTransactionId: 42,
        amount: 2500, message: 'Payment completed successfully.'
      });
    }
  };
  const beneficiaryService = {
    list: () => Promise.resolve([{ beneficiaryId: 10, beneficiaryName: 'Ananya Sharma',
      accountNumber: '123456789012', status: 'ACTIVE' }])
  };
  const accountService = {
    getCustomerSummary: () => Promise.resolve([{ accountId: 101, accountNumber: '00004821',
      accountType: 'SAVINGS', availableBalance: 10000, status: 'ACTIVE' }])
  };
  const FundTransferViewModel = loadAmd('viewModels/fundTransfer.js', {
    knockout: ko,
    '../services/paymentService': paymentService,
    '../services/beneficiaryService': beneficiaryService,
    '../services/accountService': accountService,
    '../utils/authGuard': { requireAuthentication: () => true },
    '../utils/sessionService': { getCustomerId: () => 1 },
    '../utils/navigationService': { goTo: () => Promise.resolve() }
  });
  const page = new FundTransferViewModel();
  page.loadChoices();
  await tick();
  page.sourceAccountId(101);
  page.beneficiaryId(10);
  page.amount('2500.00');
  page.description('Monthly rent');
  page.initiate();
  await tick();
  assert.equal(page.stage(), 'otp');
  assert.equal(calls[0].payload.paymentMode, 'BENEFICIARY');
  assert.equal(calls[0].payload.beneficiaryId, 10);
  assert.equal(calls[0].payload.amount, 2500);
  page.otp('123456');
  page.verify();
  await tick();
  assert.equal(page.stage(), 'done');
  assert.deepEqual(calls[1], { type: 'verify', id: 'payment-1', otp: '123456' });

  page.startOver();
  await tick();
  page.sourceAccountId(101);
  page.paymentMode('DIRECT');
  page.recipientAccountNumber('123456789012');
  page.recipientIfscCode('hdfc0123456');
  page.amount('50.25');
  page.initiate();
  await tick();
  assert.equal(calls[2].payload.paymentMode, 'DIRECT');
  assert.equal(calls[2].payload.recipientIfscCode, 'HDFC0123456');
  assert.equal(calls[2].payload.beneficiaryId, undefined);
  assert.equal(calls[2].payload.amount, 50.25);
  process.stdout.write('Beneficiary and direct transfer flows passed.\n');
}

run().catch((error) => {
  process.stderr.write(error.stack + '\n');
  process.exitCode = 1;
});
