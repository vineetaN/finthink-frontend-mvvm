define([
  'knockout', '../services/investmentService', '../services/accountService',
  '../utils/investmentFormat', '../utils/authGuard', '../utils/sessionService',
  '../utils/navigationService', '../utils/revealSection', 'ojs/ojbutton', 'ojs/ojprogress-circle'
], function (ko, investmentService, accountService, format, authGuard,
             sessionService, navigationService, revealSection) {
  'use strict';

  function InvestmentDepositsViewModel() {
    var self = this;
    self.mode = ko.observable('FD');
    self.accounts = ko.observableArray([]);
    self.accountId = ko.observable('');
    self.amount = ko.observable('');
    self.tenureMonths = ko.observable('12');
    self.onMaturityAction = ko.observable('LIQUIDATE');
    self.previewResult = ko.observable(null);
    self.reviewKey = ko.observable('');
    self.created = ko.observable(null);
    self.isLoading = ko.observable(false);
    self.isBusy = ko.observable(false);
    self.errorMessage = ko.observable('');
    self.money = format.money;
    self.date = format.date;
    self.isFd = ko.pureComputed(function () { return self.mode() === 'FD'; });
    self.isReviewCurrent = ko.pureComputed(function () {
      return self.reviewKey() && self.reviewKey() === self.formKey();
    });

    self.formKey = function () {
      return [self.mode(), self.accountId(), self.amount(), self.tenureMonths(),
        self.onMaturityAction()].join('|');
    };
    self.selectedAccount = function () {
      var id = Number(self.accountId());
      return self.accounts().find(function (item) { return item.accountId === id; });
    };

    self.loadAccounts = function () {
      if (!authGuard.requireAuthentication()) return;
      var customerId = sessionService.getCustomerId();
      if (!customerId) {
        self.errorMessage('Your session has no customer ID. Please sign in again.');
        return;
      }
      self.isLoading(true);
      self.errorMessage('');
      accountService.getCustomerSummary(customerId)
        .then(function (items) {
          if (!Array.isArray(items)) throw new Error('Invalid account response.');
          self.accounts(items.filter(function (account) {
            return String(account.status).toUpperCase() === 'ACTIVE';
          }).map(function (account) {
            return {
              accountId: account.accountId,
              availableBalance: Number(account.availableBalance || 0),
              label: account.accountType + ' •••• ' + String(account.accountNumber || '').slice(-4) +
                ' · ' + format.money(account.availableBalance)
            };
          }));
        })
        .catch(function (error) { self.errorMessage(error.message || 'Unable to load accounts.'); })
        .finally(function () { self.isLoading(false); });
    };

    self.validate = function () {
      var account = self.selectedAccount();
      var tenure = Number(self.tenureMonths());
      if (!account) return 'Choose an active account.';
      if (!format.validAmount(self.amount())) return 'Enter an amount greater than zero with at most two decimal places.';
      if (Number(self.amount()) > account.availableBalance) return 'The amount exceeds the available balance shown for this account.';
      if (!Number.isSafeInteger(tenure) || tenure < 1) return 'Enter a valid tenure in months.';
      return '';
    };

    self.review = function () {
      if (self.isBusy() || self.isLoading()) return;
      self.errorMessage(self.validate());
      if (self.errorMessage()) return;
      var key = self.formKey();
      self.reviewKey('');
      self.previewResult(null);
      if (!self.isFd()) {
        self.reviewKey(key);
        revealSection('deposit-review');
        return;
      }
      self.isBusy(true);
      investmentService.previewFd({
        principal: Number(self.amount()),
        tenureMonths: Number(self.tenureMonths())
      }).then(function (result) {
        if (key === self.formKey()) {
          self.previewResult(result);
          self.reviewKey(key);
          revealSection('deposit-review');
        }
      }).catch(function (error) { self.errorMessage(error.message || 'Unable to preview deposit.'); })
        .finally(function () { self.isBusy(false); });
    };

    self.create = function () {
      if (self.isBusy() || !self.isReviewCurrent()) return;
      self.errorMessage(self.validate());
      if (self.errorMessage()) return;
      var customerId = sessionService.getCustomerId();
      if (!customerId) {
        self.errorMessage('Your session has no customer ID. Please sign in again.');
        return;
      }
      var payload = {
        customerId: customerId,
        accountId: Number(self.accountId()),
        amount: Number(self.amount()),
        tenureMonths: Number(self.tenureMonths()),
        autoRenewal: self.onMaturityAction() === 'AUTO_RENEW',
        onMaturityAction: self.onMaturityAction()
      };
      self.isBusy(true);
      var request = self.isFd()
        ? investmentService.createFd(payload)
        : investmentService.createRd(payload);
      request.then(function (result) {
        self.created(result);
        self.reviewKey('');
        self.previewResult(null);
        revealSection('deposit-success');
      }).catch(function (error) { self.errorMessage(error.message || 'Unable to create deposit.'); })
        .finally(function () { self.isBusy(false); });
    };

    self.startAgain = function () {
      self.created(null);
      self.accountId('');
      self.amount('');
      self.reviewKey('');
      self.previewResult(null);
      self.errorMessage('');
      self.loadAccounts();
    };
    self.goToPortfolio = function () { navigationService.goTo('investments'); };
    self.connected = function () {
      document.title = 'Deposits | FinThink Bank';
      self.loadAccounts();
    };
  }

  return InvestmentDepositsViewModel;
});
