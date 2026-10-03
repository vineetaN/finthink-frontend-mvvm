define([
  'knockout', '../services/rewardService', '../utils/authGuard',
  '../utils/navigationService', 'ojs/ojbutton', 'ojs/ojprogress-circle'
], function (ko, rewardService, authGuard, navigationService) {
  'use strict';

  function RewardsWalletViewModel() {
    var self = this;
    self.availablePoints = ko.observable(0);
    self.entries = ko.observableArray([]);
    self.isLoading = ko.observable(false);
    self.errorMessage = ko.observable('');

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
    self.load = function () {
      if (!authGuard.requireAuthentication()) return;
      self.isLoading(true);
      self.errorMessage('');
      rewardService.wallet()
        .then(function (wallet) {
          if (!wallet || !Array.isArray(wallet.entries)) {
            throw new Error('Invalid rewards wallet response.');
          }
          self.availablePoints(Number(wallet.availablePoints || 0));
          self.entries(wallet.entries);
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
