const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadAmd(relativePath, dependencies, extras) {
  let exported;
  const source = fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
  const sandbox = Object.assign({
    define: function (names, factory) {
      exported = factory.apply(null, names.map(function (name) {
        return dependencies[name];
      }));
    }
  }, extras || {});
  vm.runInNewContext(source, sandbox, { filename: relativePath });
  return exported;
}

function observable(initialValue) {
  let value = initialValue;
  return function (nextValue) {
    if (arguments.length) {
      value = nextValue;
    }
    return value;
  };
}

async function run() {
  const calls = [];
  const quote = {
    loanId: 17,
    loanAccountNo: 'LN-17',
    outstandingAmount: 900,
    dueInterestAmount: 50,
    overduePenaltyAmount: 0,
    foreclosurePenalty: 50,
    totalPayable: 1000
  };
  const receipt = {
    transactionId: 90,
    referenceNo: 'REF-90',
    loanId: 17,
    amountPaid: 1000,
    loanStatus: 'CLOSED',
    transactionDate: '2026-10-09T10:00:00'
  };
  const apiClient = {
    get: function (url) {
      calls.push(['GET', url]);
      if (url.endsWith('/foreclosure-quote')) return Promise.resolve(quote);
      if (url.endsWith('/repayments')) return Promise.resolve([]);
      if (url === '/banking-service/loans/17') {
        return Promise.resolve({ loanId: 17, loanStatus: 'CLOSED' });
      }
      if (url === '/banking-service/loans') return Promise.resolve([]);
      throw new Error('Unexpected GET ' + url);
    },
    post: function (url, body) {
      calls.push(['POST', url, body]);
      if (url.endsWith('/foreclose/initiate')) {
        return Promise.resolve({ authorizationId: 'AUTH-17', verificationRequired: true });
      }
      if (url.endsWith('/authorizations/AUTH-17/resend')) {
        return Promise.resolve({ authorizationId: 'AUTH-17', verificationRequired: true });
      }
      if (url.endsWith('/foreclose/authorizations/AUTH-17/verify')) {
        return Promise.resolve(receipt);
      }
      throw new Error('Unexpected POST ' + url);
    }
  };
  const loanService = loadAmd('src/js/services/loanService.js', {
    '../config/apiConfig': {},
    'text!../data/loanMock.json': '[]',
    './apiClient': apiClient
  });
  const accountService = {
    getMyAccounts: function () {
      return Promise.resolve([
        { accountId: 659, status: 'ACTIVE', availableBalance: 1500,
          accountType: 'SAVINGS', accountMasked: '••659' },
        { accountId: 661, status: 'ACTIVE', availableBalance: 100,
          accountType: 'SAVINGS', accountMasked: '••661' },
        { accountId: 660, status: 'BLOCKED', availableBalance: 5000 }
      ]);
    }
  };
  const ko = {
    observable: observable,
    observableArray: observable,
    pureComputed: function (calculate) { return calculate; }
  };
  const LoansViewModel = loadAmd('src/js/viewModels/loans.js', {
    knockout: ko,
    '../services/loanService': loanService,
    '../services/accountService': accountService,
    '../utils/authGuard': { requireAuthentication: function () { return true; } }
  }, {
    window: {
      setInterval: function () { return 1; },
      clearInterval: function () {},
      setTimeout: function () {}
    }
  });
  const page = new LoansViewModel();
  page.selectedLoan({ loanId: 17, loanStatus: 'CLOSED' });
  page.openForeclosureDialog();
  assert.equal(page.isForeclosureDialogOpen(), false, 'closed loan must not open foreclosure');

  page.selectedLoan({ loanId: 17, loanStatus: 'ACTIVE', loanAccountNo: 'LN-17' });
  await page.openForeclosureDialog();
  assert.equal(page.foreclosureStep(), 'select');
  assert.equal(page.foreclosureAccounts().length, 2, 'only active accounts should appear');
  assert.ok(calls.some(function (call) {
    return call[0] === 'GET' &&
      call[1] === '/banking-service/loans/17/foreclosure-quote';
  }));

  page.selectedForeclosureAccountId(661);
  assert.equal(page.canReviewForeclosure(), false, 'insufficient balance must block review');
  page.reviewForeclosure();
  assert.equal(page.foreclosureStep(), 'select');

  page.selectedForeclosureAccountId(659);
  assert.equal(page.canReviewForeclosure(), true);
  page.reviewForeclosure();
  assert.equal(page.foreclosureStep(), 'review');
  await page.sendForeclosureOtp();
  assert.equal(page.foreclosureStep(), 'otp');
  assert.equal(page.foreclosureAuthorizationId(), 'AUTH-17');
  assert.ok(calls.some(function (call) {
    return call[0] === 'POST' &&
      call[1] === '/banking-service/loans/17/foreclose/initiate' &&
      call[2].sourceAccountId === 659;
  }));

  page.clearForeclosureResendTimer();
  await page.resendForeclosureOtp();
  assert.ok(calls.some(function (call) {
    return call[0] === 'POST' &&
      call[1] === '/banking-service/loans/authorizations/AUTH-17/resend';
  }));

  page.foreclosureOtp('123456');
  const verification = page.verifyForeclosureOtp();
  assert.equal(page.verifyForeclosureOtp(), undefined, 'duplicate verification must be blocked');
  await verification;
  assert.equal(page.foreclosureStep(), 'success');
  assert.equal(page.foreclosureReceipt().referenceNo, 'REF-90');
  assert.ok(calls.some(function (call) {
    return call[0] === 'POST' &&
      call[1] === '/banking-service/loans/17/foreclose/authorizations/AUTH-17/verify' &&
      call[2].otp === '123456';
  }));
  assert.equal(calls.filter(function (call) {
    return call[0] === 'POST' && call[1].endsWith('/verify');
  }).length, 1, 'verification should be sent once');
  console.log('loan foreclosure frontend checks passed');
}

run().catch(function (error) {
  console.error(error);
  process.exitCode = 1;
});
