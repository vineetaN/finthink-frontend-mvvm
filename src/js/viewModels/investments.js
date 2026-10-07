define([
  'knockout', '../services/investmentService', '../utils/investmentFormat',
  '../utils/authGuard', '../utils/sessionService', '../utils/navigationService', '../utils/revealSection',
  'ojs/ojbutton', 'ojs/ojprogress-circle'
], function (ko, investmentService, format, authGuard, sessionService, navigationService, revealSection) {
  'use strict';

  function InvestmentsViewModel() {
    var self = this;
    self.items = ko.observableArray([]);
    self.selected = ko.observable(null);
    self.valuation = ko.observable(null);
    self.redeemMode = ko.observable('ALL');
    self.unitsToRedeem = ko.observable('');
    self.confirmAction = ko.observable('');
    self.reviewedRedemption = ko.observable(null);
    self.isLoading = ko.observable(false);
    self.isBusy = ko.observable(false);
    self.errorMessage = ko.observable('');
    self.successMessage = ko.observable('');
    self.money = format.money;
    self.nav = format.nav;
    self.decimal = format.decimal;
    self.date = format.date;

    self.totalInvested = ko.pureComputed(function () {
      return self.items().reduce(function (sum, item) {
        return sum + Number(item.principal || 0);
      }, 0);
    });
    self.isFund = ko.pureComputed(function () {
      return !!self.selected() && self.selected().investmentType === 'MUTUAL_FUND';
    });

    self.load = function () {
      if (!authGuard.requireAuthentication()) return;
      self.errorMessage('');
      self.isLoading(true);
      investmentService.active()
        .then(function (items) {
          if (!Array.isArray(items)) throw new Error('Invalid investments response.');
          self.items(items);
        })
        .catch(function (error) {
          self.items([]);
          self.errorMessage(error.message || 'Unable to load investments.');
        })
        .finally(function () { self.isLoading(false); });
    };

    self.view = function (item) {
      if (self.isBusy()) return;
      self.selected(item);
      revealSection('investment-detail');
      self.valuation(null);
      self.redeemMode('ALL');
      self.unitsToRedeem('');
      self.confirmAction('');
      self.reviewedRedemption(null);
      self.errorMessage('');
      if (item.investmentType !== 'MUTUAL_FUND') return;
      self.isBusy(true);
      investmentService.valuation(item.investmentId)
        .then(function (result) { self.valuation(result); })
        .catch(function (error) { self.errorMessage(error.message || 'Unable to load fund valuation.'); })
        .finally(function () { self.isBusy(false); });
    };

    self.closeDetails = function () {
      self.selected(null);
      self.valuation(null);
      self.confirmAction('');
      self.reviewedRedemption(null);
      self.errorMessage('');
    };

    self.askClose = function () {
      if (self.selected() && !self.isFund()) {
        self.confirmAction('CLOSE');
        revealSection('investment-confirm');
      }
    };

    self.askRedeem = function () {
      if (!self.isFund() || self.isBusy()) return;
      if (self.redeemMode() === 'PARTIAL') {
        var text = self.unitsToRedeem().trim();
        var units = Number(text);
        if (!/^\d+(?:\.\d{1,4})?$/.test(text) || units <= 0 ||
            units > Number(self.selected().units || 0)) {
          self.errorMessage('Enter a positive number of units up to the units you hold.');
          return;
        }
      }
      self.errorMessage('');
      self.reviewedRedemption({
        mode: self.redeemMode(),
        units: self.unitsToRedeem().trim()
      });
      self.confirmAction('REDEEM');
      revealSection('investment-confirm');
    };

    self.cancelAction = function () {
      self.confirmAction('');
      self.reviewedRedemption(null);
    };

    self.confirm = function () {
      var item = self.selected();
      var action = self.confirmAction();
      if (!item || !action || self.isBusy()) return;
      if (action === 'REDEEM') {
        var reviewed = self.reviewedRedemption();
        if (!reviewed || reviewed.mode !== self.redeemMode() ||
            reviewed.units !== self.unitsToRedeem().trim()) {
          self.errorMessage('Redemption details changed. Review them again.');
          self.cancelAction();
          return;
        }
      }
      var customerId = sessionService.getCustomerId();
      if (!customerId) {
        self.errorMessage('Your session has no customer ID. Please sign in again.');
        return;
      }
      self.isBusy(true);
      self.errorMessage('');
      var request = action === 'CLOSE'
        ? investmentService.closePremature(item.investmentId, customerId)
        : investmentService.redeemFund(item.investmentId,
          self.redeemMode() === 'ALL' ? null : Number(self.unitsToRedeem()));
      request.then(function (result) {
        self.successMessage(action === 'CLOSE'
          ? 'Deposit closed. Amount credited: ' + format.money(result.maturityAmount) + '.'
          : 'Redemption complete. Credited: ' + format.money(result.redemptionValue) +
            '. Exit load: ' + format.money(result.exitLoadCharged) + '.');
        self.selected(null);
        self.valuation(null);
        self.confirmAction('');
        self.reviewedRedemption(null);
        revealSection('investment-success');
        return investmentService.active();
      }).then(function (items) { self.items(items); })
        .catch(function (error) { self.errorMessage(error.message || 'Unable to complete investment action.'); })
        .finally(function () { self.isBusy(false); });
    };

    self.goToDeposits = function () { navigationService.goTo('investmentDeposits'); };
    self.goToFunds = function () { navigationService.goTo('mutualFunds'); };
    self.connected = function () {
      document.title = 'Investments | FinThink Bank';
      self.load();
    };
  }

  return InvestmentsViewModel;
});
