define([
  'knockout', '../services/rewardService', '../services/accountService',
  '../utils/authGuard', '../utils/sessionService', '../utils/navigationService',
  'ojs/ojbutton', 'ojs/ojprogress-circle'
], function (ko, rewardService, accountService, authGuard, sessionService, navigationService) {
  'use strict';

  function RewardsViewModel() {
    var self = this;
    self.rewards = ko.observableArray([]);
    self.accounts = ko.observableArray([]);
    self.availablePoints = ko.observable(0);
    self.selectedReward = ko.observable(null);
    self.selectedAccountId = ko.observable('');
    self.isLoading = ko.observable(false);
    self.isBusy = ko.observable(false);
    self.errorMessage = ko.observable('');
    self.successMessage = ko.observable('');
    self.confirming = ko.observable(false);

    self.formatMoney = function (value) {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
        .format(Number(value || 0));
    };
    self.rewardValue = function (reward) {
      return reward && reward.rewardType === 'CASHBACK'
        ? self.formatMoney(reward.rewardValue)
        : 'Value: ' + self.formatMoney(reward.rewardValue);
    };
    self.isCashback = ko.pureComputed(function () {
      var reward = self.selectedReward();
      return !!reward && reward.rewardType === 'CASHBACK';
    });
    self.canRedeem = ko.pureComputed(function () {
      var reward = self.selectedReward();
      return !!reward && !self.isBusy() && self.availablePoints() >= reward.pointsRequired
        && (!self.isCashback() || !!self.selectedAccountId());
    });

    self.load = function () {
      if (!authGuard.requireAuthentication()) return;
      self.isLoading(true);
      self.errorMessage('');
      Promise.all([rewardService.list(), rewardService.wallet()])
        .then(function (results) {
          if (!Array.isArray(results[0])) throw new Error('Invalid rewards response.');
          self.rewards(results[0]);
          self.availablePoints(Number(results[1].availablePoints || 0));
        })
        .catch(function (error) {
          self.errorMessage(error.message || 'Unable to load rewards.');
        })
        .finally(function () { self.isLoading(false); });
    };

    self.chooseReward = function (reward) {
      self.errorMessage('');
      self.successMessage('');
      self.confirming(false);
      self.selectedAccountId('');
      self.isBusy(true);
      rewardService.get(reward.rewardId)
        .then(function (detail) {
          self.selectedReward(detail);
          if (detail.rewardType !== 'CASHBACK') return;
          var customerId = sessionService.getCustomerId();
          if (!customerId) throw new Error('Your session has no customer ID. Please sign in again.');
          return accountService.getCustomerSummary(customerId).then(function (accounts) {
            self.accounts((accounts || []).filter(function (account) {
              return String(account.status).toUpperCase() === 'ACTIVE';
            }).map(function (account) {
              return {
                accountId: account.accountId,
                label: account.accountType + ' •••• ' + String(account.accountNumber || '').slice(-4)
              };
            }));
          });
        })
        .catch(function (error) { self.errorMessage(error.message || 'Unable to load reward.'); })
        .finally(function () { self.isBusy(false); });
    };

    self.closeReward = function () {
      self.selectedReward(null);
      self.confirming(false);
      self.errorMessage('');
    };

    self.requestRedeem = function () {
      if (self.canRedeem()) self.confirming(true);
    };

    self.cancelRedeem = function () { self.confirming(false); };

    self.confirmRedeem = function () {
      if (!self.canRedeem() || !self.confirming()) return;
      var reward = self.selectedReward();
      self.isBusy(true);
      self.errorMessage('');
      rewardService.redeem(reward.rewardId,
        self.isCashback() ? self.selectedAccountId() : null)
        .then(function (result) {
          self.availablePoints(Number(result.availablePoints || 0));
          self.successMessage(result.message +
            (result.referenceNo ? ' Reference: ' + result.referenceNo : ''));
          self.selectedReward(null);
          self.confirming(false);
        })
        .catch(function (error) { self.errorMessage(error.message || 'Redemption failed.'); })
        .finally(function () { self.isBusy(false); });
    };

    self.goToWallet = function () { navigationService.goTo('rewardsWallet'); };
    self.connected = function () {
      document.title = 'Rewards | FinThink Bank';
      self.load();
    };
  }

  return RewardsViewModel;
});
