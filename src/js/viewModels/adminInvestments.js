define([
  'knockout', '../services/investmentService', '../utils/investmentFormat',
  '../utils/authGuard', '../utils/sessionService', '../utils/navigationService',
  'ojs/ojbutton', 'ojs/ojprogress-circle'
], function (ko, investmentService, format, authGuard, sessionService, navigationService) {
  'use strict';

  function AdminInvestmentsViewModel() {
    var self = this;
    self.products = ko.observableArray([]);
    self.productId = ko.observable('');
    self.interestRate = ko.observable('');
    self.confirming = ko.observable(false);
    self.reviewedChange = ko.observable(null);
    self.isLoading = ko.observable(false);
    self.isBusy = ko.observable(false);
    self.errorMessage = ko.observable('');
    self.successMessage = ko.observable('');
    self.money = format.money;

    self.selectedProduct = ko.pureComputed(function () {
      var id = Number(self.productId());
      return self.products().find(function (product) { return product.productId === id; }) || null;
    });

    self.load = function () {
      if (!authGuard.requireAuthentication()) return;
      if (!sessionService.isAdmin()) {
        navigationService.goTo('dashboard');
        return;
      }
      self.isLoading(true);
      self.errorMessage('');
      investmentService.products()
        .then(function (items) {
          if (!Array.isArray(items)) throw new Error('Invalid investment products response.');
          self.products(items.filter(function (product) {
            return /\b(FD|RD)\b/i.test(product.investmentName || '');
          }));
        }).catch(function (error) { self.errorMessage(error.message || 'Unable to load products.'); })
        .finally(function () { self.isLoading(false); });
    };

    self.choose = function (product) {
      self.productId(product.productId);
      self.interestRate(String(product.interestRate));
      self.confirming(false);
      self.reviewedChange(null);
      self.errorMessage('');
      self.successMessage('');
    };

    self.review = function () {
      self.errorMessage('');
      var rate = self.interestRate().trim();
      if (!self.selectedProduct() || !/^\d+(?:\.\d{1,2})?$/.test(rate) || Number(rate) <= 0) {
        self.errorMessage('Choose an FD or RD product and enter a positive rate with at most two decimal places.');
        return;
      }
      self.confirming(true);
      self.reviewedChange({ productId: self.selectedProduct().productId, rate: rate });
    };

    self.cancel = function () {
      self.confirming(false);
      self.reviewedChange(null);
    };

    self.confirm = function () {
      if (self.isBusy() || !self.confirming()) return;
      var product = self.selectedProduct();
      var rate = self.interestRate().trim();
      var reviewed = self.reviewedChange();
      if (!reviewed || !product || reviewed.productId !== product.productId || reviewed.rate !== rate) {
        self.cancel();
        self.errorMessage('The proposed rate changed. Review it again.');
        return;
      }
      if (!product || !/^\d+(?:\.\d{1,2})?$/.test(rate) || Number(rate) <= 0) {
        self.confirming(false);
        self.reviewedChange(null);
        self.errorMessage('Review the product and rate again.');
        return;
      }
      self.isBusy(true);
      self.errorMessage('');
      investmentService.updateRate({
        productId: product.productId,
        interestRate: Number(rate)
      }).then(function (affected) {
        self.successMessage('Rate updated. ' + (Array.isArray(affected) ? affected.length : 0) +
          ' active investment(s) were returned as affected.');
        self.confirming(false);
        return investmentService.products();
      }).then(function (items) {
        self.products(items.filter(function (item) {
          return /\b(FD|RD)\b/i.test(item.investmentName || '');
        }));
      }).catch(function (error) { self.errorMessage(error.message || 'Unable to update rate.'); })
        .finally(function () { self.isBusy(false); });
    };

    self.connected = function () {
      document.title = 'Investment Rates | FinThink Bank';
      self.load();
    };
  }

  return AdminInvestmentsViewModel;
});
