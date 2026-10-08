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

const ko = {
  observable,
  pureComputed: (compute) => compute
};

const calls = [];
const apiClient = {
  post: (url, payload) => {
    calls.push({ url, payload });
    return Promise.resolve({ message: 'Accepted' });
  }
};

let authService;
vm.runInNewContext(fs.readFileSync(
  path.join(__dirname, '..', 'src/js/services/authService.js'), 'utf8'
), {
  define: (names, factory) => { authService = factory(apiClient); }
}, { filename: 'authService.js' });

let RegisterViewModel;
let timerCallback;
vm.runInNewContext(fs.readFileSync(
  path.join(__dirname, '..', 'src/js/viewModels/register.js'), 'utf8'
), {
  define: (names, factory) => {
    RegisterViewModel = factory(ko, authService, { goTo: () => {} });
  },
  window: {
    setInterval: (callback) => { timerCallback = callback; return 1; },
    clearInterval: () => {}
  },
  Promise,
  Math,
  document: { title: '' }
}, { filename: 'register.js' });

async function run() {
  const page = new RegisterViewModel();
  page.username('new_customer');
  page.password('Secure#123');
  page.firstName('New');
  page.lastName('Customer');
  page.email('new@example.com');
  page.mobileNo('+919876543210');

  assert.equal(page.registrationStep(), 'details');
  assert.equal(calls.length, 0);
  await page.sendCode();
  assert.equal(calls[0].url, '/identification-service/auth/registrationOtp');
  assert.equal(calls[0].payload.email, 'new@example.com');
  assert.equal(page.registrationStep(), 'verify');
  assert.equal(page.canRegister(), false);
  assert.equal(page.resendSeconds(), 60);

  page.otp('123456');
  await page.submit();
  assert.equal(calls[1].url, '/identification-service/auth/userRegistration');
  assert.equal(calls[1].payload.otp, '123456');
  assert.equal(calls[1].payload.username, 'new_customer');
  assert.equal(page.registrationStep(), 'success');
  assert.equal(page.password(), '');
  assert.equal(page.otp(), '');
  assert.equal(typeof timerCallback, 'function');
  console.log('Registration code request and verified account creation checks passed.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
