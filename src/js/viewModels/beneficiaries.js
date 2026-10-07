define([
  'knockout', '../services/beneficiaryService', '../utils/authGuard',
  '../utils/navigationService', 'ojs/ojbutton', 'ojs/ojprogress-circle'
], function (ko, beneficiaryService, authGuard, navigationService) {
  'use strict';

  function BeneficiariesViewModel() {
    var self = this;
    self.beneficiaries = ko.observableArray([]);
    self.selected = ko.observable(null);
    self.showAddForm = ko.observable(false);
    self.pendingRemoveId = ko.observable(null);
    self.beneficiaryName = ko.observable('');
    self.accountNumber = ko.observable('');
    self.ifscCode = ko.observable('');
    self.bankName = ko.observable('');
    self.isLoading = ko.observable(false);
    self.isBusy = ko.observable(false);
    self.errorMessage = ko.observable('');
    self.successMessage = ko.observable('');

    self.maskAccount = function (number) {
      var lastFour = String(number || '').slice(-4);
      return lastFour ? '•••• ' + lastFour : 'Unavailable';
    };
    self.clearForm = function () {
      self.beneficiaryName('');
      self.accountNumber('');
      self.ifscCode('');
      self.bankName('');
    };

    self.openAddForm = function () {
      self.errorMessage('');
      self.successMessage('');
      self.showAddForm(true);
    };

    self.closeAddForm = function () {
      if (self.isBusy()) return;
      self.showAddForm(false);
      self.clearForm();
      self.errorMessage('');
    };

    self.load = function () {
      if (!authGuard.requireAuthentication()) return;
      self.errorMessage('');
      self.isLoading(true);
      beneficiaryService.list()
        .then(function (items) {
          if (!Array.isArray(items)) throw new Error('Invalid beneficiary response.');
          self.beneficiaries(items);
        })
        .catch(function (error) {
          self.beneficiaries([]);
          self.errorMessage(error.message || 'Unable to load beneficiaries.');
        })
        .finally(function () { self.isLoading(false); });
    };

    self.add = function () {
      if (self.isBusy()) return;
      self.errorMessage('');
      self.successMessage('');
      var name = self.beneficiaryName().trim();
      var number = self.accountNumber().trim();
      var ifsc = self.ifscCode().trim().toUpperCase();
      var bank = self.bankName().trim();
      if (!name || name.length > 100 || !/^[A-Za-z0-9]{6,20}$/.test(number) ||
          !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc) || !bank || bank.length > 100) {
        self.errorMessage('Enter a name and bank (up to 100 characters), a 6–20 character account number, and a valid IFSC.');
        return;
      }
      self.isBusy(true);
      beneficiaryService.create({
        beneficiaryName: name,
        accountNumber: number,
        ifscCode: ifsc,
        bankName: bank
      }).then(function () {
        self.clearForm();
        self.showAddForm(false);
        self.successMessage('Beneficiary added.');
        return beneficiaryService.list();
      }).then(function (items) { self.beneficiaries(items); })
        .catch(function (error) { self.errorMessage(error.message || 'Unable to add beneficiary.'); })
        .finally(function () { self.isBusy(false); });
    };

    self.viewDetails = function (item) {
      if (self.isBusy()) return;
      self.errorMessage('');
      self.pendingRemoveId(null);
      self.isBusy(true);
      beneficiaryService.get(item.beneficiaryId)
        .then(function (detail) { self.selected(detail); })
        .catch(function (error) { self.errorMessage(error.message || 'Unable to load beneficiary details.'); })
        .finally(function () { self.isBusy(false); });
    };

    self.closeDetails = function () {
      if (self.isBusy()) return;
      self.selected(null);
      self.pendingRemoveId(null);
      self.errorMessage('');
    };

    self.toggleStatus = function () {
      var item = self.selected();
      if (!item || self.isBusy()) return;
      var status = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      self.errorMessage('');
      self.successMessage('');
      self.isBusy(true);
      beneficiaryService.setStatus(item.beneficiaryId, status)
        .then(function (updated) {
          self.selected(updated);
          self.successMessage('Beneficiary is now ' + status.toLowerCase() + '.');
          return beneficiaryService.list();
        }).then(function (items) { self.beneficiaries(items); })
        .catch(function (error) { self.errorMessage(error.message || 'Unable to change status.'); })
        .finally(function () { self.isBusy(false); });
    };

    self.askRemove = function () {
      if (self.selected()) self.pendingRemoveId(self.selected().beneficiaryId);
    };
    self.cancelRemove = function () { self.pendingRemoveId(null); };
    self.remove = function () {
      var id = self.pendingRemoveId();
      if (!id || self.isBusy()) return;
      self.errorMessage('');
      self.successMessage('');
      self.isBusy(true);
      beneficiaryService.remove(id)
        .then(function () {
          self.pendingRemoveId(null);
          self.selected(null);
          self.successMessage('Beneficiary removed from active use. Its transfer history is preserved.');
          return beneficiaryService.list();
        }).then(function (items) { self.beneficiaries(items); })
        .catch(function (error) { self.errorMessage(error.message || 'Unable to remove beneficiary.'); })
        .finally(function () { self.isBusy(false); });
    };

    self.goToTransfer = function () { navigationService.goTo('fundTransfer'); };
    self.connected = function () {
      document.title = 'Beneficiaries | FinThink Bank';
      self.load();
    };
  }

  return BeneficiariesViewModel;
});
