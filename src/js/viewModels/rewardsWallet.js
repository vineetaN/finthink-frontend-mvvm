define([
  'knockout', '../services/rewardService', '../utils/authGuard',
  '../utils/navigationService', '../utils/revealSection', 'ojs/ojbutton', 'ojs/ojprogress-circle'
], function (ko, rewardService, authGuard, navigationService, revealSection) {
  'use strict';

  function RewardsWalletViewModel() {
    var self = this;
    self.availablePoints = ko.observable(0);
    self.entries = ko.observableArray([]);
    self.currentPage = ko.observable(1);
    self.pageSize = 7;
    self.isLoading = ko.observable(false);
    self.errorMessage = ko.observable('');

    self.pageCount = ko.pureComputed(function () {
      return Math.max(1, Math.ceil(self.entries().length / self.pageSize));
    });
    self.visibleEntries = ko.pureComputed(function () {
      var start = (self.currentPage() - 1) * self.pageSize;
      return self.entries().slice(start, start + self.pageSize);
    });
    self.firstEntryNumber = ko.pureComputed(function () {
      return self.entries().length ? (self.currentPage() - 1) * self.pageSize + 1 : 0;
    });
    self.lastEntryNumber = ko.pureComputed(function () {
      return Math.min(self.currentPage() * self.pageSize, self.entries().length);
    });
    self.pageNumbers = ko.pureComputed(function () {
      var total = self.pageCount();
      var start = Math.max(1, Math.min(self.currentPage() - 2, total - 4));
      var end = Math.min(total, start + 4);
      var pages = [];
      for (var page = start; page <= end; page += 1) pages.push(page);
      return pages;
    });
    self.redeemedCount = ko.pureComputed(function () {
      return self.entries().filter(function (entry) {
        return String(entry.pointsType).toUpperCase() === 'REDEEMED';
      }).length;
    });

    self.formatDate = function (value) {
      if (!value) return '—';
      var date = new Date(value);
      return isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    };
    self.pointsLabel = function (entry) {
      return (Number(entry.points) > 0 ? '+' : '') + Number(entry.points).toLocaleString('en-IN');
    };
    self.isNegativePoints = function (entry) {
      return Number(entry.points) < 0;
    };
    self.balanceAfterLabel = function (entry) {
      return Number(entry.availablePoints).toLocaleString('en-IN') + ' after';
    };
    self.rewardTypeLabel = function (entry) {
      if (entry.rewardId == null) return '';
      var type = String(entry.rewardType || '').toUpperCase();
      if (!type) return 'Type unavailable';
      return type.charAt(0) + type.slice(1).toLowerCase();
    };
    self.changePage = function (page) {
      if (page < 1 || page > self.pageCount() || page === self.currentPage()) return;
      self.currentPage(page);
      revealSection('wallet-history-heading');
    };
    self.previousPage = function () { self.changePage(self.currentPage() - 1); };
    self.nextPage = function () { self.changePage(self.currentPage() + 1); };
    self.load = function () {
      if (!authGuard.requireAuthentication()) return;
      self.isLoading(true);
      self.errorMessage('');
      Promise.allSettled([rewardService.wallet(), rewardService.list()])
        .then(function (results) {
          if (results[0].status !== 'fulfilled') throw results[0].reason;
          var wallet = results[0].value;
          if (!wallet || !Array.isArray(wallet.entries)) {
            throw new Error('Invalid rewards wallet response.');
          }
          var catalogue = results[1].status === 'fulfilled' && Array.isArray(results[1].value)
            ? results[1].value : [];
          var typesById = new Map(catalogue.map(function (reward) {
            return [String(reward.rewardId), reward.rewardType];
          }));
          self.availablePoints(Number(wallet.availablePoints || 0));
          self.entries(wallet.entries.map(function (entry) {
            return Object.assign({}, entry, {
              rewardType: entry.rewardType || typesById.get(String(entry.rewardId)) ||
                (entry.cashbackTransactionId != null ? 'CASHBACK' : '')
            });
          }));
          self.currentPage(1);
        })
        .catch(function (error) { self.errorMessage(error.message || 'Unable to load your wallet.'); })
        .finally(function () { self.isLoading(false); });
    };
    self.goToRewards = function () { navigationService.goTo('rewards'); };
    self.connected = function () {
      document.title = 'Rewards Wallet | FinThink Bank';
      self.load();
    };
  }

  return RewardsWalletViewModel;
});
