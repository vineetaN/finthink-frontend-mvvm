define(['knockout', 'ojs/ojarraydataprovider', 'ojs/ojvalidator-numberrange', '../config/apiConfig', '../services/rewardService'],
  function (ko, ArrayDataProvider, NumberRangeValidator, config, service) {
    'use strict';

    function empty() { return { rewardName: '', rewardType: null, pointsRequired: null, rewardValue: null, startDate: '', endDate: '' }; }
    function datePart(value) { return String(value || '').slice(0, 10); }
    function message(error) {
      if (error.status === 403) return 'You do not have permission.';
      if (error.status === 401) return 'Your session has expired. Please sign in again.';
      return error.message || 'Unable to save the reward. Please try again.';
    }

    function RewardForm(params) {
      var self = this;
      this.onSaved = params.onSaved;
      this.onStatus = params.onStatus;
      this.mode = ko.observable('create');
      this.selected = ko.observable(null);
      this.opened = ko.observable(false);
      this.saving = ko.observable(false);
      this.error = ko.observable('');
      this.fieldErrors = {};
      ['rewardName', 'rewardType', 'pointsRequired', 'rewardValue', 'startDate', 'endDate'].forEach(function (key) {
        self[key] = ko.observable(null);
        self.fieldErrors[key] = ko.observable('');
      });
      this.typeOptions = new ArrayDataProvider(config.rewardTypes.map(function (type) { return { value: type, label: type }; }), { keyAttributes: 'value' });
      this.pointsValidators = [new NumberRangeValidator({ min: 0 })];
      this.valueValidators = [new NumberRangeValidator({ min: 0 })];
      this.trigger = null;
      this.original = '';
      this.allowClose = false;

      this.values = function () {
        return {
          rewardName: self.rewardName(), rewardType: self.rewardType(), pointsRequired: self.pointsRequired(),
          rewardValue: self.rewardValue(), startDate: datePart(self.startDate()), endDate: datePart(self.endDate())
        };
      };
      this.open = function (reward, trigger) {
        var source = reward || empty();
        self.selected(reward || null);
        self.mode(reward ? 'edit' : 'create');
        self.trigger = trigger || document.activeElement;
        Object.keys(self.fieldErrors).forEach(function (key) {
          self[key](source[key] === undefined ? null : source[key]);
          self.fieldErrors[key]('');
        });
        self.error('');
        self.original = JSON.stringify(self.values());
        self.opened(true);
        var dialog = document.getElementById('rewardFormDialog');
        dialog.open();
        window.setTimeout(function () { document.getElementById('rewardNameInput').focus(); }, 0);
      };
      this.close = function () {
        if (self.saving()) return;
        if (JSON.stringify(self.values()) !== self.original && !window.confirm('Discard unsaved changes?')) return;
        self.allowClose = true;
        document.getElementById('rewardFormDialog').close();
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
      this.requestStatus = function (event) {
        if (self.selected()) self.onStatus(self.selected(), event.currentTarget);
      };
      this.validate = function () {
        var data = self.values();
        Object.keys(self.fieldErrors).forEach(function (key) { self.fieldErrors[key](''); });
        if (!String(data.rewardName || '').trim()) self.fieldErrors.rewardName('Enter a reward name.');
        else if (String(data.rewardName).trim().length > 100) self.fieldErrors.rewardName('Use 100 characters or fewer.');
        if (config.rewardTypes.indexOf(data.rewardType) === -1) self.fieldErrors.rewardType('Select a reward type.');
        if (data.pointsRequired === null || data.pointsRequired === '' || !Number.isInteger(Number(data.pointsRequired)) || Number(data.pointsRequired) < 0) self.fieldErrors.pointsRequired('Enter a whole number of 0 or more.');
        if (data.rewardValue === null || data.rewardValue === '' || !Number.isFinite(Number(data.rewardValue)) || Number(data.rewardValue) < 0 || !/^\d+(\.\d{1,2})?$/.test(String(data.rewardValue))) self.fieldErrors.rewardValue('Enter an amount of 0 or more with up to 2 decimal places.');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data.startDate)) self.fieldErrors.startDate('Select a start date.');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data.endDate)) self.fieldErrors.endDate('Select an end date.');
        else if (data.startDate && data.endDate < data.startDate) self.fieldErrors.endDate('End date cannot be before start date.');
        var invalid = Object.keys(self.fieldErrors).find(function (key) { return !!self.fieldErrors[key](); });
        if (invalid) document.getElementById('reward' + invalid.charAt(0).toUpperCase() + invalid.slice(1) + 'Input').focus();
        return !invalid;
      };
      this.submit = function () {
        if (self.saving() || !self.validate()) return;
        self.saving(true);
        self.error('');
        var data = self.values();
        var promise = self.mode() === 'edit' ? service.update(self.selected().rewardId, data) : service.create(data);
        promise.then(function () {
          self.original = JSON.stringify(self.values());
          self.saving(false);
          self.allowClose = true;
          document.getElementById('rewardFormDialog').close();
          self.onSaved(self.mode());
        }).catch(function (error) {
          var body = error.body || {};
          if (error.status === 400 && (body.fieldErrors || body.errors)) {
            var fieldErrors = body.fieldErrors || body.errors;
            if (Array.isArray(fieldErrors)) fieldErrors.forEach(function (entry) { if (self.fieldErrors[entry.field]) self.fieldErrors[entry.field](entry.message || 'Invalid value.'); });
            else Object.keys(fieldErrors).forEach(function (key) { if (self.fieldErrors[key]) self.fieldErrors[key](String(fieldErrors[key])); });
          }
          self.error(error.status === 400 ? 'Check the form and try again.' : message(error));
        }).finally(function () { self.saving(false); });
      };
    }
    return RewardForm;
  });
