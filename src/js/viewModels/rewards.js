define([
  'knockout', '../services/rewardService', '../services/accountService',
  '../utils/authGuard', '../utils/sessionService', '../utils/navigationService', '../utils/revealSection',
  'ojs/ojbutton', 'ojs/ojprogress-circle'
], function (ko, rewardService, accountService, authGuard, sessionService, navigationService, revealSection) {
  'use strict';

  function RewardsViewModel() {
    var self = this;
    self.rewards = ko.observableArray([]);
    self.currentPage = ko.observable(1);
    self.pageSize = 7;
    self.accounts = ko.observableArray([]);
    self.availablePoints = ko.observable(0);
    self.selectedReward = ko.observable(null);
    self.selectedAccountId = ko.observable('');
    self.isLoading = ko.observable(false);
    self.isBusy = ko.observable(false);
    self.errorMessage = ko.observable('');
    self.successMessage = ko.observable('');
    self.confirming = ko.observable(false);

    self.pageCount = ko.pureComputed(function () {
      return Math.max(1, Math.ceil(self.rewards().length / self.pageSize));
    });
    self.visibleRewards = ko.pureComputed(function () {
      var start = (self.currentPage() - 1) * self.pageSize;
      return self.rewards().slice(start, start + self.pageSize);
    });
    self.firstRewardNumber = ko.pureComputed(function () {
      return self.rewards().length ? (self.currentPage() - 1) * self.pageSize + 1 : 0;
    });
    self.lastRewardNumber = ko.pureComputed(function () {
      return Math.min(self.currentPage() * self.pageSize, self.rewards().length);
    });
    self.pageNumbers = ko.pureComputed(function () {
      var total = self.pageCount();
      var start = Math.max(1, Math.min(self.currentPage() - 2, total - 4));
      var pages = [];
      for (var page = start; page <= Math.min(total, start + 4); page += 1) pages.push(page);
      return pages;
    });
    self.changePage = function (page) {
      if (self.isBusy() || page < 1 || page > self.pageCount() || page === self.currentPage()) return;
      self.selectedReward(null);
      self.confirming(false);
      self.currentPage(page);
      revealSection('rewards-catalogue-heading');
    };
    self.previousPage = function () { self.changePage(self.currentPage() - 1); };
    self.nextPage = function () { self.changePage(self.currentPage() + 1); };

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
          self.currentPage(1);
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
      if (self.isBusy()) return;
      self.selectedReward(null);
      self.confirming(false);
      self.errorMessage('');
    };

    self.requestRedeem = function () {
      if (self.canRedeem()) {
        self.confirming(true);
      }
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
          revealSection('rewards-success');
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
