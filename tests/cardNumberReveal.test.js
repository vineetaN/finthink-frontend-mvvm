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
  observableArray: observable,
  pureComputed: (compute) => compute
};

let CardService;
const serviceSource = fs.readFileSync(
  path.join(__dirname, '..', 'src/js/services/cardService.js'), 'utf8'
);
const requests = [];
const apiClient = {
  post: (url, body) => {
    requests.push({ url, body });
    return Promise.resolve(requests.length === 1
      ? { challengeId: 'challenge-1' }
      : { cardNumber: '4111111111111111' });
  }
};
vm.runInNewContext(serviceSource, {
  define: (names, factory) => {
    CardService = factory({}, '[]', apiClient);
  },
  Promise,
  Number,
  String,
  Object
}, { filename: 'cardService.js' });

let CardsViewModel;
const viewModelSource = fs.readFileSync(
  path.join(__dirname, '..', 'src/js/viewModels/cards.js'), 'utf8'
);
let hideCallback;
const windowStub = {
  setTimeout: (callback) => { hideCallback = callback; return 1; },
  clearTimeout: () => {},
  clearInterval: () => {}
};
vm.runInNewContext(viewModelSource, {
  define: (names, factory) => {
    CardsViewModel = factory(ko, CardService, { requireAuthentication: () => true });
  },
  window: windowStub,
  Promise,
  Number,
  String,
  Object,
  Intl
}, { filename: 'cards.js' });

async function run() {
  const viewModel = new CardsViewModel();
  const card = { cardId: 42, cardNumberMasked: 'XXXX XXXX 1111' };

  viewModel.openCardNumberReveal(card);
  assert.equal(viewModel.revealStep(), 'confirm');
  assert.equal(requests.length, 0);
  viewModel.closeCardNumberReveal();
  assert.equal(requests.length, 0);

  viewModel.openCardNumberReveal(card);
  await viewModel.sendCardNumberRevealOtp();
  assert.equal(viewModel.revealStep(), 'otp');
  assert.equal(viewModel.revealedCardNumber(), '');
  assert.equal(requests[0].url, '/banking-service/cards/42/number/reveal-requests');
  assert.equal(requests[0].body, undefined);

  viewModel.revealOtp('123456');
  await viewModel.verifyCardNumberReveal();
  assert.equal(requests[1].url, '/banking-service/cards/42/number/reveal');
  assert.equal(requests[1].body.challengeId, 'challenge-1');
  assert.equal(requests[1].body.otp, '123456');
  assert.equal(viewModel.revealStep(), 'visible');
  assert.equal(viewModel.revealedCardNumber(), '4111111111111111');
  assert.equal(card.cardNumberMasked, 'XXXX XXXX 1111');
  assert.equal(viewModel.revealOtp(), '');
  assert.equal(viewModel.revealChallengeId(), '');

  hideCallback();
  assert.equal(viewModel.revealDialogOpen(), false);
  assert.equal(viewModel.revealedCardNumber(), '');
  console.log('Card number reveal request, OTP, masking, and auto-hide checks passed.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
