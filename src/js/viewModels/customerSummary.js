define([
  'knockout',
  '../services/accountService',
  '../utils/authGuard',
  '../utils/sessionService',
  'ojs/ojbutton',
  'ojs/ojprogress-circle'
], function (ko, accountService, authGuard, sessionService) {
  'use strict';

  function CustomerSummaryViewModel() {
    var self = this;
    self.username = sessionService.username;
    self.accounts = ko.observableArray([]);
    self.isLoading = ko.observable(false);
    self.errorMessage = ko.observable('');

    self.hasAccounts = ko.pureComputed(function () {
      return self.accounts().length > 0;
    });

    self.totalAvailable = ko.pureComputed(function () {
      return self.accounts().reduce(function (total, account) {
        return total + Number(account.availableBalance || 0);
      }, 0);
    });

    self.formatMoney = function (amount) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR'
      }).format(Number(amount || 0));
    };

    self.maskAccount = function (accountNumber) {
      var lastFour = String(accountNumber || '').slice(-4);
      return lastFour ? '•••• ' + lastFour : 'Unavailable';
    };

    function customerIdFromToken() {
      var token = sessionService.getToken();
      if (!token) return null;

      try {
        var encoded = token.split('.')[1];
        var base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        var claims = JSON.parse(window.atob(base64));
        var customerId = Number(claims.customerId);
        return Number.isSafeInteger(customerId) && customerId > 0
          ? customerId : null;
      } catch (error) {
        return null;
      }
    }

    self.loadSummary = function () {
      if (!authGuard.requireAuthentication()) return;

      var customerId = customerIdFromToken();
      if (!customerId) {
        self.errorMessage('Your session has no customer ID. Please sign in again.');
        return;
      }

      self.errorMessage('');
      self.isLoading(true);
      accountService.getCustomerSummary(customerId)
        .then(function (accounts) {
          if (!Array.isArray(accounts)) {
            throw new Error('The account summary response is invalid.');
          }
          self.accounts(accounts);
        })
        .catch(function (error) {
          self.accounts([]);
          self.errorMessage(error.message || 'Unable to load your accounts.');
        })
        .finally(function () {
          self.isLoading(false);
        });
    };

    self.connected = function () {
      document.title = 'Customer summary | FinThink Bank';
      self.loadSummary();
    };
  }

  return CustomerSummaryViewModel;
});
