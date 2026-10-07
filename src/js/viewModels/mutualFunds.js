define([
  'knockout', '../services/investmentService', '../services/accountService',
  '../utils/investmentFormat', '../utils/authGuard', '../utils/sessionService',
  '../utils/navigationService', '../utils/revealSection', 'ojs/ojbutton', 'ojs/ojprogress-circle'
], function (ko, investmentService, accountService, format, authGuard,
             sessionService, navigationService, revealSection) {
  'use strict';

  function MutualFundsViewModel() {
    var self = this;
    self.funds = ko.observableArray([]);
    self.accounts = ko.observableArray([]);
    self.categories = ko.observableArray([]);
    self.risks = ko.observableArray([]);
    self.category = ko.observable('');
    self.riskLevel = ko.observable('');
    self.selectedFund = ko.observable(null);
    self.accountId = ko.observable('');
    self.mode = ko.observable('LUMP_SUM');
    self.amount = ko.observable('');
    self.tenureMonths = ko.observable('');
    self.previewResult = ko.observable(null);
    self.reviewKey = ko.observable('');
    self.created = ko.observable(null);
    self.isLoading = ko.observable(false);
    self.isBusy = ko.observable(false);
    self.errorMessage = ko.observable('');
    self.money = format.money;
    self.nav = format.nav;
    self.decimal = format.decimal;
    self.date = format.date;
    self.isLumpSum = ko.pureComputed(function () { return self.mode() === 'LUMP_SUM'; });

    self.formKey = function () {
      return [self.selectedFund() && self.selectedFund().fundId, self.accountId(),
        self.mode(), self.amount(), self.tenureMonths()].join('|');
    };
    self.isReviewCurrent = ko.pureComputed(function () {
      return self.reviewKey() && self.reviewKey() === self.formKey();
    });
    self.selectedAccount = function () {
      var id = Number(self.accountId());
      return self.accounts().find(function (account) { return account.accountId === id; });
    };

    self.load = function () {
      if (!authGuard.requireAuthentication()) return;
      var customerId = sessionService.getCustomerId();
      if (!customerId) {
        self.errorMessage('Your session has no customer ID. Please sign in again.');
        return;
      }
      self.errorMessage('');
      self.isLoading(true);
      Promise.all([investmentService.funds(), accountService.getCustomerSummary(customerId)])
        .then(function (results) {
          if (!Array.isArray(results[0]) || !Array.isArray(results[1])) {
            throw new Error('Invalid funds or account response.');
          }
          self.funds(results[0]);
          self.categories(Array.from(new Set(results[0].map(function (fund) { return fund.category; }).filter(Boolean))));
          self.risks(Array.from(new Set(results[0].map(function (fund) { return fund.riskLevel; }).filter(Boolean))));
          self.accounts(results[1].filter(function (account) {
            return String(account.status).toUpperCase() === 'ACTIVE';
          }).map(function (account) {
            return {
              accountId: account.accountId,
              availableBalance: Number(account.availableBalance || 0),
              label: account.accountType + ' •••• ' + String(account.accountNumber || '').slice(-4) +
                ' · ' + format.money(account.availableBalance)
            };
          }));
        }).catch(function (error) { self.errorMessage(error.message || 'Unable to load funds.'); })
        .finally(function () { self.isLoading(false); });
    };

    self.applyFilters = function () {
      if (self.isBusy()) return;
      self.isLoading(true);
      self.errorMessage('');
      investmentService.funds(self.category(), self.riskLevel())
        .then(function (items) {
          if (!Array.isArray(items)) throw new Error('Invalid funds response.');
          self.funds(items);
          self.selectedFund(null);
          self.reviewKey('');
          self.previewResult(null);
        }).catch(function (error) { self.errorMessage(error.message || 'Unable to filter funds.'); })
        .finally(function () { self.isLoading(false); });
    };

    self.chooseFund = function (fund) {
      self.selectedFund(fund);
      self.reviewKey('');
      self.previewResult(null);
      self.created(null);
      self.errorMessage('');
      revealSection('fund-form');
    };

    self.validate = function () {
      var fund = self.selectedFund();
      var account = self.selectedAccount();
      if (!fund) return 'Choose a mutual fund.';
      if (!account) return 'Choose an active account.';
      if (!format.validAmount(self.amount())) return 'Enter an amount greater than zero with at most two decimal places.';
      if (Number(self.amount()) > account.availableBalance) return 'The amount exceeds the available balance shown for this account.';
      var minimum = Number(self.isLumpSum() ? fund.minLumpsumAmount : fund.minSipAmount);
      if (Number(self.amount()) < minimum) return 'The amount is below this fund’s minimum of ' + format.money(minimum) + '.';
      if (!self.isLumpSum() && self.tenureMonths() !== '') {
        var tenure = Number(self.tenureMonths());
        if (!Number.isSafeInteger(tenure) || tenure < 1) return 'Enter a positive SIP tenure or leave it blank.';
      }
      return '';
    };

    self.review = function () {
      if (self.isBusy() || self.isLoading()) return;
      self.errorMessage(self.validate());
      if (self.errorMessage()) return;
      var key = self.formKey();
      self.reviewKey('');
      self.previewResult(null);
      if (!self.isLumpSum()) {
        self.reviewKey(key);
        revealSection('fund-review');
        return;
      }
      self.isBusy(true);
      investmentService.previewFund({
        fundId: self.selectedFund().fundId,
        amount: Number(self.amount())
      }).then(function (result) {
        if (key === self.formKey()) {
          self.previewResult(result);
          self.reviewKey(key);
          revealSection('fund-review');
        }
      }).catch(function (error) { self.errorMessage(error.message || 'Unable to preview purchase.'); })
        .finally(function () { self.isBusy(false); });
    };

    self.confirm = function () {
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
        fundId: self.selectedFund().fundId
      };
      var request;
      if (self.isLumpSum()) {
        payload.amount = Number(self.amount());
        request = investmentService.buyFund(payload);
      } else {
        payload.monthlyAmount = Number(self.amount());
        if (self.tenureMonths() !== '') payload.tenureMonths = Number(self.tenureMonths());
        request = investmentService.startSip(payload);
      }
      self.isBusy(true);
      request.then(function (result) {
        self.created(result);
        self.reviewKey('');
        self.previewResult(null);
        revealSection('fund-success');
      }).catch(function (error) { self.errorMessage(error.message || 'Unable to complete investment.'); })
        .finally(function () { self.isBusy(false); });
    };

    self.startAgain = function () {
      self.created(null);
      self.selectedFund(null);
      self.accountId('');
      self.amount('');
      self.tenureMonths('');
      self.category('');
      self.riskLevel('');
      self.reviewKey('');
      self.previewResult(null);
      self.errorMessage('');
      self.load();
    };
    self.goToPortfolio = function () { navigationService.goTo('investments'); };
    self.connected = function () {
      document.title = 'Mutual Funds | FinThink Bank';
      self.load();
    };
  }

  return MutualFundsViewModel;
});
