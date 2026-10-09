define([
  'knockout', '../accUtils', '../services/accountService',
  '../services/rewardService', '../services/investmentService',
  '../utils/authGuard', '../utils/sessionService', '../utils/navigationService',
  'ojs/ojbutton'
], function (ko, accUtils, accountService, rewardService, investmentService,
             authGuard, sessionService, navigationService) {
  'use strict';

  function DashboardViewModel() {
    var self = this;
    self.username = sessionService.username;
    self.accounts = ko.observableArray([]);
    self.availablePoints = ko.observable(null);
    self.investments = ko.observableArray([]);
    self.accountsState = ko.observable('loading');
    self.rewardsState = ko.observable('loading');
    self.investmentsState = ko.observable('loading');
    self.showBalance = ko.observable(false);

    self.formatMoney = function (value) {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
        .format(Number(value || 0));
    };

    self.totalAvailable = ko.pureComputed(function () {
      return self.accounts().reduce(function (sum, account) {
        return sum + Number(account.availableBalance || 0);
      }, 0);
    });

    self.balanceText = ko.pureComputed(function () {
      if (self.accountsState() === 'loading') return 'Loading…';
      if (self.accountsState() === 'error') return 'Unavailable';
      return self.showBalance() ? self.formatMoney(self.totalAvailable()) : '••••••';
    });

    self.balanceCaption = ko.pureComputed(function () {
      if (self.accountsState() === 'error') return 'Unable to load account balances.';
      if (self.accountsState() === 'loading') return 'Checking your accounts';
      return self.accounts().length + ' linked account' +
        (self.accounts().length === 1 ? '' : 's') + ' · available balance';
    });

    self.savingsAccount = ko.pureComputed(function () {
      return self.accounts().find(function (account) {
        return String(account.accountType || '').toUpperCase().includes('SAVING') &&
          String(account.status || '').toUpperCase() === 'ACTIVE';
      }) || null;
    });

    self.savingsHeading = ko.pureComputed(function () {
      if (self.accountsState() === 'loading') return 'Checking savings account';
      if (self.accountsState() === 'error') return 'Savings account unavailable';
      return self.savingsAccount() ? 'Active savings account' : 'No active savings account';
    });

    self.savingsAccountLabel = ko.pureComputed(function () {
      var account = self.savingsAccount();
      if (!account) return 'No active savings account linked';
      var lastFour = String(account.accountNumber || '').slice(-4);
      return lastFour ? 'Account •••• ' + lastFour : 'Savings account';
    });

    self.savingsBalanceText = ko.pureComputed(function () {
      if (self.accountsState() === 'loading') return 'Loading…';
      if (self.accountsState() === 'error') return 'Unavailable';
      var account = self.savingsAccount();
      return account ? self.formatMoney(account.availableBalance) : '—';
    });

    self.pointsText = ko.pureComputed(function () {
      if (self.rewardsState() === 'loading') return 'Loading…';
      if (self.rewardsState() === 'error') return 'Unavailable';
      return self.availablePoints().toLocaleString('en-IN') + ' pts';
    });

    self.investmentsText = ko.pureComputed(function () {
      if (self.investmentsState() === 'loading') return 'Loading…';
      if (self.investmentsState() === 'error') return 'Unavailable';
      return self.investments().length.toLocaleString('en-IN');
    });

    self.toggleBalance = function () {
      if (self.accountsState() === 'ready') self.showBalance(!self.showBalance());
    };

    self.load = function () {
      if (!authGuard.requireAuthentication()) return Promise.resolve();
      self.showBalance(false);
      self.accountsState('loading');
      self.rewardsState('loading');
      self.investmentsState('loading');

      var customerId = sessionService.getCustomerId();
      var accountsRequest = customerId
        ? accountService.getCustomerSummary(customerId).then(function (accounts) {
            if (!Array.isArray(accounts)) throw new Error('Invalid account summary.');
            self.accounts(accounts);
            self.accountsState('ready');
          }).catch(function () {
            self.accounts([]);
            self.accountsState('error');
          })
        : Promise.resolve().then(function () {
            self.accounts([]);
            self.accountsState('error');
          });

      var rewardsRequest = rewardService.wallet().then(function (wallet) {
        var points = wallet && Number(wallet.availablePoints);
        if (!Number.isFinite(points)) throw new Error('Invalid rewards wallet.');
        self.availablePoints(points);
        self.rewardsState('ready');
      }).catch(function () {
        self.availablePoints(null);
        self.rewardsState('error');
      });

      var investmentsRequest = investmentService.active().then(function (items) {
        if (!Array.isArray(items)) throw new Error('Invalid investments response.');
        self.investments(items);
        self.investmentsState('ready');
      }).catch(function () {
        self.investments([]);
        self.investmentsState('error');
      });

      return Promise.all([accountsRequest, rewardsRequest, investmentsRequest]);
    };

    self.goToTransfer = function () { return navigationService.goTo('fundTransfer'); };
    self.goToBillPayments = function () { return navigationService.goTo('billers'); };
    self.goToStatements = function () { return navigationService.goTo('transactions'); };
    self.goToAccounts = function () { return navigationService.goTo('customerSummary'); };
    self.goToRewards = function () { return navigationService.goTo('rewardsWallet'); };
    self.goToInvestments = function () { return navigationService.goTo('investments'); };

    self.connected = function () {
      if (!authGuard.requireAuthentication()) return;
      accUtils.announce('Dashboard page loaded.', 'assertive');
      document.title = 'Dashboard | FinThink Bank';
      self.load();
    };
  }

  return DashboardViewModel;
});
