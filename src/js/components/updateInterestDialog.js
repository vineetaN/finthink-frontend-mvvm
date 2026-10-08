define(['knockout', '../config/apiConfig', '../services/investmentService', 'ojs/ojlabel', 'ojs/ojinputnumber', 'ojs/ojdialog', 'ojs/ojbutton', 'ojs/ojprogress-circle'], function (ko, config, investmentService) {
  'use strict';

  function UpdateInterestDialog(params) {
    var self = this;
    this.product = ko.observable(null);
    this.rateInput = ko.observable(null);
    this.rawRate = ko.observable('');
    this.validationStarted = ko.observable(false);
    this.saving = ko.observable(false);
    this.checking = ko.observable(false);
    this.requiresReload = ko.observable(false);
    this.fieldError = ko.observable('');
    this.requestError = ko.observable('');
    this.maxRate = config.MAX_INTEREST_RATE;
    this.trigger = null;
    this.saveCompleted = false;
    this.currentRateText = ko.pureComputed(function () {
      return self.product() ? Number(self.product().interestRate).toFixed(2) + '%' : '';
    });
    this.rateInputChanged = function (event) {
      self.rawRate(event.detail.value === null || event.detail.value === undefined ? '' : String(event.detail.value));
      self.fieldError('');
      self.requestError('');
    };
    this.rateError = ko.pureComputed(function () {
      var value = self.rawRate();
      if (value === null || value === undefined || value === '') return 'Enter an interest rate.';
      var number = Number(value);
      if (!Number.isFinite(number)) return 'Enter a valid number.';
      if (number < 0.01) return 'Rate must be at least 0.01%.';
      if (number > self.maxRate) return 'Rate cannot exceed ' + self.maxRate + '%.';
      if (!/^(?:\d+)(?:\.\d{1,2})?$/.test(String(value))) return 'Enter no more than 2 decimal places.';
      if (self.product() && number === Number(self.product().interestRate)) return 'Enter a different rate.';
      return '';
    });
    this.showRateError = ko.pureComputed(function () {
      return !!self.rateError() && (self.validationStarted() || self.rawRate() !== '');
    });
    this.canSubmit = ko.pureComputed(function () { return !!self.product() && !self.rateError() && !self.saving() && !self.requiresReload(); });
    this.confirmationText = ko.pureComputed(function () {
      if (!self.product() || self.rateError()) return '';
      return 'Change ' + self.product().investmentName + ' interest from ' + self.currentRateText() + ' to ' + Number(self.rawRate()).toFixed(2) + '%?';
    });
    this.open = function (product, trigger) {
      self.product(product);
      self.rateInput(null);
      self.rawRate('');
      self.validationStarted(false);
      self.requiresReload(false);
      self.fieldError('');
      self.requestError('');
      self.trigger = trigger;
      self.saveCompleted = false;
      document.getElementById('investmentUpdateDialog').open();
      window.setTimeout(function () { document.getElementById('investmentRateInput').focus(); }, 0);
    };
    this.cancel = function () { document.getElementById('investmentUpdateDialog').close(); };
    this.closed = function () {
      var trigger = self.trigger;
      if (trigger && trigger.isConnected) {
        trigger.focus();
        if (self.saveCompleted) window.setTimeout(function () { if (trigger.isConnected) trigger.focus(); }, 0);
      }
      if (self.saveCompleted) {
        self.saveCompleted = false;
        params.onSaved(self.product().productId);
      }
    };
    this.reloadList = function () {
      if (self.checking() || self.saving() || !self.product()) return;
      self.checking(true);
      params.onReload(self.product().productId).then(function (product) {
        if (product) self.product(product);
        self.requiresReload(false);
        self.requestError('Products reloaded. Check the current rate before retrying.');
      }).catch(function (error) {
        var message = error.status === 403 ? 'You do not have permission.' :
          error.status === 401 ? 'Your session has expired. Please sign in again.' :
          'Unable to reload products. Retry the reload before submitting again.';
        self.requestError(message);
      }).finally(function () { self.checking(false); });
    };
    this.confirm = function () {
      if (!self.canSubmit()) {
        self.validationStarted(true);
        return;
      }
      self.saving(true);
      self.fieldError('');
      self.requestError('');
      investmentService.updateRate({
        productId: self.product().productId,
        interestRate: Number(self.rawRate())
      }).then(function () {
        self.saveCompleted = true;
        document.getElementById('investmentUpdateDialog').close();
      }).catch(function (error) {
        if (error.status === 400) {
          self.fieldError(serverFieldMessage(error.body) || 'The interest rate was rejected. Check the value and try again.');
        } else if (error.status === 403) {
          self.requestError('You do not have permission.');
        } else if (error.status === 401) {
          self.requestError('Your session has expired. Please sign in again.');
        } else {
          self.requestError('Update status is unknown. Reload products before retrying.');
          self.requiresReload(true);
        }
      }).finally(function () { self.saving(false); });
    };
  }

  function serverFieldMessage(body) {
    if (!body || typeof body !== 'object') return '';
    var errors = body.fieldErrors || body.errors;
    if (typeof errors === 'string') return errors;
    if (Array.isArray(errors) && errors.length) return String(errors[0].defaultMessage || errors[0].message || errors[0]);
    if (errors && typeof errors === 'object') {
      var first = Object.keys(errors)[0];
      if (first) return String(errors[first]);
    }
    return body.message || body.detail || '';
  }

  return UpdateInterestDialog;
});
