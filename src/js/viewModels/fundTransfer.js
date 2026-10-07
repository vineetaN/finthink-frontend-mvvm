define([
  'knockout', '../services/paymentService', '../services/beneficiaryService',
  '../services/accountService', '../utils/authGuard', '../utils/sessionService',
  '../utils/navigationService', 'ojs/ojbutton', 'ojs/ojprogress-circle'
], function (ko, paymentService, beneficiaryService, accountService, authGuard,
             sessionService, navigationService) {
  'use strict';

  function FundTransferViewModel() {
    var self = this;
    self.accounts = ko.observableArray([]);
    self.beneficiaries = ko.observableArray([]);
    self.sourceAccountId = ko.observable('');
    self.paymentMode = ko.observable('BENEFICIARY');
    self.beneficiaryId = ko.observable('');
    self.recipientAccountNumber = ko.observable('');
    self.recipientIfscCode = ko.observable('');
    self.amount = ko.observable('');
    self.description = ko.observable('');
    self.otp = ko.observable('');
    self.pendingPayment = ko.observable(null);
    self.confirmation = ko.observable(null);
    self.stage = ko.observable('form');
    self.isLoading = ko.observable(false);
    self.isBusy = ko.observable(false);
    self.errorMessage = ko.observable('');

    self.isBeneficiaryMode = ko.pureComputed(function () {
      return self.paymentMode() === 'BENEFICIARY';
    });
    self.formatMoney = function (value) {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
        .format(Number(value || 0));
    };
    self.maskAccount = function (number) {
      return '•••• ' + String(number || '').slice(-4);
    };

    self.loadChoices = function () {
      if (!authGuard.requireAuthentication()) return;
      var customerId = sessionService.getCustomerId();
      if (!customerId) {
        self.errorMessage('Your session has no customer ID. Please sign in again.');
        return;
      }
      self.isLoading(true);
      self.errorMessage('');
      Promise.all([
        accountService.getCustomerSummary(customerId),
        beneficiaryService.list()
      ]).then(function (results) {
        if (!Array.isArray(results[0]) || !Array.isArray(results[1])) {
          throw new Error('Unable to read accounts or beneficiaries.');
        }
        self.accounts(results[0].filter(function (account) {
          return String(account.status).toUpperCase() === 'ACTIVE';
        }).map(function (account) {
          return {
            accountId: account.accountId,
            label: account.accountType + ' ' + self.maskAccount(account.accountNumber) +
              ' · ' + self.formatMoney(account.availableBalance),
            availableBalance: Number(account.availableBalance || 0)
          };
        }));
        self.beneficiaries(results[1].filter(function (item) {
          return String(item.status).toUpperCase() === 'ACTIVE';
        }).map(function (item) {
          return {
            beneficiaryId: item.beneficiaryId,
            label: item.beneficiaryName + ' · ' + self.maskAccount(item.accountNumber)
          };
        }));
      }).catch(function (error) {
        self.errorMessage(error.message || 'Unable to load transfer choices.');
      }).finally(function () { self.isLoading(false); });
    };

    self.initiate = function () {
      if (self.isBusy() || self.isLoading() || self.stage() !== 'form') return;
      self.errorMessage('');
      var sourceId = Number(self.sourceAccountId());
      var selectedAccount = self.accounts().find(function (account) {
        return account.accountId === sourceId;
      });
      var value = self.amount().trim();
      var amount = Number(value);
      var description = self.description().trim();
      if (!selectedAccount || !/^(?:\d{1,13})(?:\.\d{1,2})?$/.test(value) ||
          !Number.isFinite(amount) || amount < 0.01 || description.length > 250) {
        self.errorMessage('Choose an active source account and enter a valid amount and description (up to 250 characters).');
        return;
      }
      if (amount > selectedAccount.availableBalance) {
        self.errorMessage('The amount exceeds the available balance shown for this account.');
        return;
      }

      var payload = {
        sourceAccountId: sourceId,
        paymentMode: self.paymentMode(),
        amount: amount,
        description: description || null
      };
      if (self.isBeneficiaryMode()) {
        var beneficiaryId = Number(self.beneficiaryId());
        if (!self.beneficiaries().some(function (item) { return item.beneficiaryId === beneficiaryId; })) {
          self.errorMessage('Choose an active beneficiary.');
          return;
        }
        payload.beneficiaryId = beneficiaryId;
      } else {
        var accountNumber = self.recipientAccountNumber().trim();
        var ifsc = self.recipientIfscCode().trim().toUpperCase();
        if (!/^[A-Za-z0-9]{6,20}$/.test(accountNumber) || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
          self.errorMessage('Enter a valid recipient account number and IFSC.');
          return;
        }
        payload.recipientAccountNumber = accountNumber;
        payload.recipientIfscCode = ifsc;
      }

      self.isBusy(true);
      paymentService.initiate(payload)
        .then(function (response) {
          if (!response || !response.paymentId || response.status !== 'OTP_SENT') {
            throw new Error('The payment initiation response was incomplete.');
          }
          self.pendingPayment(response);
          self.otp('');
          self.stage('otp');
        })
        .catch(function (error) { self.errorMessage(error.message || 'Unable to start transfer.'); })
        .finally(function () { self.isBusy(false); });
    };

    self.verify = function () {
      if (self.isBusy() || self.stage() !== 'otp' || !self.pendingPayment()) return;
      self.errorMessage('');
      var code = self.otp().trim();
      if (!/^\d{6}$/.test(code)) {
        self.errorMessage('Enter the six-digit code sent to your registered email.');
        return;
      }
      self.isBusy(true);
      paymentService.verifyOtp(self.pendingPayment().paymentId, code)
        .then(function (response) {
          if (!response || response.status !== 'SUCCESS' || !response.referenceNo) {
            throw new Error('The transfer confirmation was incomplete.');
          }
          self.confirmation(response);
          self.otp('');
          self.stage('done');
        })
        .catch(function (error) {
          self.otp('');
          self.errorMessage(error.message || 'Unable to verify the code.');
        })
        .finally(function () { self.isBusy(false); });
    };

    self.startOver = function () {
      if (self.isBusy()) return;
      self.pendingPayment(null);
      self.confirmation(null);
      self.otp('');
      self.errorMessage('');
      self.stage('form');
      self.loadChoices();
    };
    self.goToBeneficiaries = function () { navigationService.goTo('beneficiaries'); };
    self.connected = function () {
      document.title = 'Fund Transfer | FinThink Bank';
      self.loadChoices();
    };
  }

  return FundTransferViewModel;
});
