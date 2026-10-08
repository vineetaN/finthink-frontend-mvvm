define([
  'knockout', 'ojs/ojarraydataprovider', 'text!../components/rewardCard.html', 'text!../components/rewardForm.html',
  '../components/rewardCard', '../components/rewardForm', '../services/rewardService', '../config/apiConfig',
  'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojinputtext', 'ojs/ojinputnumber', 'ojs/ojselectsingle',
  'ojs/ojdatetimepicker', 'ojs/ojlabel', 'ojs/ojprogress-circle'
], function (ko, ArrayDataProvider, cardTemplate, formTemplate, RewardCard, RewardForm, service, config) {
  'use strict';

  if (!ko.components.isRegistered('reward-card')) ko.components.register('reward-card', { viewModel: RewardCard, template: cardTemplate });
  if (!ko.components.isRegistered('reward-form')) ko.components.register('reward-form', {
    viewModel: function (params) { return params.model; }, template: formTemplate
  });

  function options(values) {
    return new ArrayDataProvider([{ value: '', label: 'All' }].concat(values.map(function (value) { return { value: value, label: value }; })), { keyAttributes: 'value' });
  }
  function errorMessage(error) {
    if (error.status === 403) return 'You do not have permission.';
    if (error.status === 401) return 'Your session has expired. Please sign in again.';
    return error.message || 'Unable to load rewards.';
  }

  function RewardManagementViewModel() {
    var self = this;
    this.rewards = ko.observableArray([]);
    this.search = ko.observable('');
    this.typeFilter = ko.observable('');
    this.statusFilter = ko.observable('');
    this.loading = ko.observable(true);
    this.error = ko.observable('');
    this.liveMessage = ko.observable('');
    this.toast = ko.observable('');
    this.busyIds = ko.observableArray([]);
    this.currency = config.rewardCurrency;
    this.typeOptions = options(config.rewardTypes);
    this.statusOptions = options(['ACTIVE', 'INACTIVE']);
    this.filteredRewards = ko.pureComputed(function () {
      var search = String(self.search() || '').trim().toLowerCase();
      return self.rewards().filter(function (item) {
        return (!search || item.rewardName.toLowerCase().indexOf(search) !== -1) &&
          (!self.typeFilter() || item.rewardType === self.typeFilter()) &&
          (!self.statusFilter() || item.status === self.statusFilter());
      });
    });
    this.showingText = ko.pureComputed(function () { return 'Showing ' + self.filteredRewards().length + ' of ' + self.rewards().length + ' rewards'; });
    this.busyFor = function (rewardId) { return ko.pureComputed(function () { return self.busyIds.indexOf(rewardId) !== -1; }); };
    this.form = new RewardForm({
      onSaved: function (mode) { self.notify(mode === 'edit' ? 'Reward updated' : 'Reward created'); self.refresh(); },
      onStatus: function (reward, trigger) { self.askStatus(reward, trigger); }
    });
    this.confirmReward = ko.observable(null);
    this.confirmAction = ko.pureComputed(function () { return self.confirmReward() && self.confirmReward().status === 'ACTIVE' ? 'Deactivate' : 'Activate'; });
    this.confirmMessage = ko.pureComputed(function () {
      var reward = self.confirmReward();
      if (!reward) return '';
      return self.confirmAction() + " '" + reward.rewardName + "'? " + (reward.status === 'ACTIVE' ? 'Customers will no longer be able to redeem it.' : 'Customers will be able to redeem it.');
    });
    this.confirmTrigger = null;
    this.notify = function (message) {
      self.toast(message); self.liveMessage(message);
      window.clearTimeout(self.toastTimer);
      self.toastTimer = window.setTimeout(function () { self.toast(''); }, 5000);
    };
    this.refresh = function () {
      self.loading(true); self.error(''); self.liveMessage('Loading rewards');
      return service.listAdmin().then(function (rows) {
        if (!Array.isArray(rows)) throw new Error('Invalid admin rewards response.');
        self.rewards(rows.map(function (item) {
          return Object.assign({}, item, { status: String(item.status || '').toUpperCase() });
        }));
        self.liveMessage(self.showingText());
      }).catch(function (error) {
        self.error(errorMessage(error)); self.liveMessage(self.error());
      }).finally(function () { self.loading(false); });
    };
    this.create = function (event) { self.form.open(null, event.currentTarget); };
    this.edit = function (reward, trigger) { self.form.open(Object.assign({}, reward), trigger); };
    this.askStatus = function (reward, trigger) {
      self.confirmReward(reward); self.confirmTrigger = trigger;
      document.getElementById('rewardConfirmDialog').open();
      window.setTimeout(function () { document.getElementById('rewardConfirmButton').focus(); }, 0);
    };
    this.closeConfirm = function () { document.getElementById('rewardConfirmDialog').close(); };
    this.confirmClosed = function () { if (self.confirmTrigger && self.confirmTrigger.isConnected) self.confirmTrigger.focus(); };
    this.applyStatus = function () {
      var reward = self.confirmReward();
      if (!reward) return;
      self.closeConfirm();
      var next = reward.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      self.busyIds.push(reward.rewardId);
      service.setStatus(reward.rewardId, next).then(function () {
        if (self.form.selected() && self.form.selected().rewardId === reward.rewardId) {
          self.form.selected(Object.assign({}, self.form.selected(), { status: next }));
        }
        self.notify(next === 'ACTIVE' ? 'Reward activated' : 'Reward deactivated');
        self.rewards(self.rewards().map(function (item) {
          return item.rewardId === reward.rewardId ? Object.assign({}, item, { status: next }) : item;
        }));
        return self.refresh();
      }).catch(function (error) { self.notify(errorMessage(error)); })
        .finally(function () { self.busyIds.remove(reward.rewardId); });
    };
    this.connected = function () { document.title = 'Reward Management | FinThink Bank'; self.refresh(); };
    this.disconnected = function () { window.clearTimeout(self.toastTimer); };
  }
  return RewardManagementViewModel;
});
