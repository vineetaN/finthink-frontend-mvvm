define(['knockout', 'ojs/ojarraydataprovider', '../services/cardService'],
  function (ko, ArrayDataProvider, service) {
    'use strict';

    var fields = ['customerId', 'accountId', 'cardNumber', 'cardType', 'expiryDate', 'dailyLimit'];
    function empty() {
      return {
        customerId: '',
        accountId: '',
        cardNumber: '',
        cardType: null,
        expiryDate: '',
        dailyLimit: null,
        internationalEnabled: false
      };
    }
    function message(error) {
      if (error.status === 403) return 'You do not have permission.';
      if (error.status === 401) return 'Your session has expired. Please sign in again.';
      return error.message || 'Unable to release the card. Please try again.';
    }
    function CardCreateForm(params) {
      var self = this;
      this.onSaved = params.onSaved;
      this.opened = ko.observable(false);
      this.saving = ko.observable(false);
      this.error = ko.observable('');
      this.fieldErrors = {};
      fields.forEach(function (key) {
        self[key] = ko.observable(null);
        self.fieldErrors[key] = ko.observable('');
      });
      this.internationalEnabled = ko.observable(false);
      this.typeOptions = new ArrayDataProvider([
        { value: 'DEBIT', label: 'DEBIT' },
        { value: 'CREDIT', label: 'CREDIT' }
      ], { keyAttributes: 'value' });
      this.trigger = null;
      this.original = '';
      this.allowClose = false;

      this.values = function () {
        var data = {};
        fields.forEach(function (key) { data[key] = self[key](); });
        data.internationalEnabled = self.internationalEnabled();
        return data;
      };
      this.open = function (trigger) {
        var source = empty();
        self.trigger = trigger || document.activeElement;
        fields.forEach(function (key) {
          self[key](source[key]);
          self.fieldErrors[key]('');
        });
        self.internationalEnabled(source.internationalEnabled);
        self.error('');
        self.original = JSON.stringify(self.values());
        self.opened(true);
        document.getElementById('cardCreateFormDialog').open();
        window.setTimeout(function () { document.getElementById('cardCustomerIdInput').focus(); }, 0);
      };
      this.close = function () {
        if (self.saving()) return;
        if (JSON.stringify(self.values()) !== self.original && !window.confirm('Discard unsaved changes?')) return;
        self.allowClose = true;
        document.getElementById('cardCreateFormDialog').close();
      };
      this.closed = function () {
        self.allowClose = false;
        self.opened(false);
        if (self.trigger && self.trigger.isConnected) self.trigger.focus();
      };
      this.beforeClose = function (event) {
        if (self.allowClose) return;
        if (self.saving() || (JSON.stringify(self.values()) !== self.original && !window.confirm('Discard unsaved changes?'))) event.preventDefault();
      };
      this.validate = function () {
        var data = self.values();
        var today = new Date();
        var todayString = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        fields.forEach(function (key) { self.fieldErrors[key](''); });
        if (!/^[1-9]\d*$/.test(String(data.customerId || ''))) self.fieldErrors.customerId('Enter a valid customer ID.');
        if (!/^[1-9]\d*$/.test(String(data.accountId || ''))) self.fieldErrors.accountId('Enter a valid account ID.');
        if (!/^\d{12,19}$/.test(String(data.cardNumber || ''))) self.fieldErrors.cardNumber('Enter a card number with 12 to 19 digits.');
        if (['DEBIT', 'CREDIT'].indexOf(data.cardType) === -1) self.fieldErrors.cardType('Select a card type.');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.expiryDate || ''))) self.fieldErrors.expiryDate('Select an expiry date.');
        else if (data.expiryDate <= todayString) self.fieldErrors.expiryDate('Expiry date must be in the future.');
        if (data.dailyLimit === null || data.dailyLimit === '' || !Number.isFinite(Number(data.dailyLimit)) || Number(data.dailyLimit) < 0 || !/^\d+(\.\d{1,2})?$/.test(String(data.dailyLimit))) self.fieldErrors.dailyLimit('Enter a non-negative amount with up to 2 decimal places.');
        var invalid = fields.find(function (key) { return !!self.fieldErrors[key](); });
        if (invalid) document.getElementById('card' + invalid.charAt(0).toUpperCase() + invalid.slice(1) + 'Input').focus();
        return !invalid;
      };
      this.submit = function () {
        if (self.saving() || !self.validate()) return;
        self.saving(true);
        self.error('');
        var data = self.values();
        service.create(data.customerId, data).then(function () {
          self.original = JSON.stringify(self.values());
          self.saving(false);
          self.allowClose = true;
          document.getElementById('cardCreateFormDialog').close();
          self.onSaved();
        }).catch(function (error) {
          var body = error.body || {};
          var fieldErrors = body.fieldErrors || body.errors;
          if (error.status === 400 && fieldErrors) {
            if (Array.isArray(fieldErrors)) fieldErrors.forEach(function (entry) {
              if (self.fieldErrors[entry.field]) self.fieldErrors[entry.field](entry.message || 'Invalid value.');
            });
            else Object.keys(fieldErrors).forEach(function (key) {
              if (self.fieldErrors[key]) self.fieldErrors[key](String(fieldErrors[key]));
            });
          }
          self.error(error.status === 400 ? 'Check the form and try again.' : message(error));
        }).finally(function () { self.saving(false); });
      };
    }
    return CardCreateForm;
  });
