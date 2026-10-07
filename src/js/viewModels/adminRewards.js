define([
  'knockout', '../services/rewardService', '../utils/authGuard',
  '../utils/sessionService', '../utils/navigationService',
  'ojs/ojbutton', 'ojs/ojprogress-circle'
], function (ko, rewardService, authGuard, sessionService, navigationService) {
  'use strict';

  function AdminRewardsViewModel() {
    var self = this;
    self.rewards = ko.observableArray([]);
    self.editingId = ko.observable(null);
    self.rewardName = ko.observable('');
    self.rewardType = ko.observable('CASHBACK');
    self.pointsRequired = ko.observable('');
    self.rewardValue = ko.observable('');
    self.startDate = ko.observable('');
    self.endDate = ko.observable('');
    self.isLoading = ko.observable(false);
    self.isBusy = ko.observable(false);
    self.errorMessage = ko.observable('');
    self.successMessage = ko.observable('');

    self.isEditing = ko.pureComputed(function () { return self.editingId() !== null; });
    self.formatMoney = function (value) {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
        .format(Number(value || 0));
    };

    self.clearForm = function () {
      self.editingId(null);
      self.rewardName('');
      self.rewardType('CASHBACK');
      self.pointsRequired('');
      self.rewardValue('');
      self.startDate('');
      self.endDate('');
    };

    self.edit = function (reward) {
      self.errorMessage('');
      self.successMessage('');
      self.editingId(reward.rewardId);
      self.rewardName(reward.rewardName);
      self.rewardType(reward.rewardType);
      self.pointsRequired(String(reward.pointsRequired));
      self.rewardValue(String(reward.rewardValue));
      self.startDate(reward.startDate);
      self.endDate(reward.endDate);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    self.load = function () {
      if (!authGuard.requireAuthentication()) return;
      if (!sessionService.isAdmin()) {
        navigationService.goTo('dashboard');
        return;
      }
      self.isLoading(true);
      self.errorMessage('');
      rewardService.listAdmin()
        .then(function (rewards) {
          if (!Array.isArray(rewards)) throw new Error('Invalid admin rewards response.');
          self.rewards(rewards);
        })
        .catch(function (error) { self.errorMessage(error.message || 'Unable to load rewards.'); })
        .finally(function () { self.isLoading(false); });
    };

    self.save = function () {
      if (self.isBusy()) return;
      self.errorMessage('');
      self.successMessage('');
      var points = Number(self.pointsRequired());
      var value = Number(self.rewardValue());
      if (!self.rewardName().trim() || self.rewardName().trim().length > 100 ||
          !Number.isSafeInteger(points) || points < 0 ||
          !Number.isFinite(value) || value < 0 ||
          !self.startDate() || !self.endDate() || self.endDate() < self.startDate()) {
        self.errorMessage('Enter a name, valid points and value, and a valid date range.');
        return;
      }

      var payload = {
        rewardName: self.rewardName().trim(),
        rewardType: self.rewardType(),
        pointsRequired: points,
        rewardValue: value,
        startDate: self.startDate(),
        endDate: self.endDate()
      };
      var request = self.isEditing()
        ? rewardService.update(self.editingId(), payload)
        : rewardService.create(payload);
      self.isBusy(true);
      request.then(function () {
        self.successMessage(self.isEditing() ? 'Reward updated.' : 'Reward created.');
        self.clearForm();
        return rewardService.listAdmin();
      }).then(function (rewards) { self.rewards(rewards); })
        .catch(function (error) { self.errorMessage(error.message || 'Unable to save reward.'); })
        .finally(function () { self.isBusy(false); });
    };

    self.toggleStatus = function (reward) {
      if (self.isBusy()) return;
      var next = reward.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      self.errorMessage('');
      self.successMessage('');
      self.isBusy(true);
      rewardService.setStatus(reward.rewardId, next)
        .then(function () {
          self.successMessage('Reward ' + next.toLowerCase() + '.');
          return rewardService.listAdmin();
        }).then(function (rewards) { self.rewards(rewards); })
        .catch(function (error) { self.errorMessage(error.message || 'Unable to change status.'); })
        .finally(function () { self.isBusy(false); });
    };

    self.connected = function () {
      document.title = 'Admin Rewards | FinThink Bank';
      self.load();
    };
  }

  return AdminRewardsViewModel;
});
