define([
  'knockout',
  '../services/authService',
  '../utils/navigationService',
  'ojs/ojformlayout',
  'ojs/ojinputtext',
  'ojs/ojbutton',
  'ojs/ojprogress-circle'
], function (ko, authService, navigationService) {
  'use strict';

  function RegisterViewModel() {
    var self = this;

    self.username = ko.observable('');
    self.password = ko.observable('');
    self.firstName = ko.observable('');
    self.lastName = ko.observable('');
    self.email = ko.observable('');
    self.mobileNo = ko.observable('');

    self.isSubmitting = ko.observable(false);
    self.errorMessage = ko.observable('');
    self.successMessage = ko.observable('');

    self.canSubmit = ko.pureComputed(function () {
      return self.username().trim() !== ''
       && self.password().length >= 8
        && self.firstName().trim() !== ''
        && self.lastName().trim() !== ''
        && self.email().trim() !== ''
        && self.mobileNo().trim() !== ''
        && !self.isSubmitting();
    });

   self.validate = function () {
  if (!/^[a-zA-Z0-9_]+$/.test(self.username())) {
    return 'Username can contain only letters, numbers, and underscores.';
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}/.test(self.password())) {
    return 'Password must be 8+ characters with upper, lower, number, and special character.';
  }

  if (!/.+@.+\..+/.test(self.email())) {
    return 'Enter a valid email address.';
  }

  if (!/^\+[0-9]{8,15}$/.test(self.mobileNo().replace(/ /g, ''))) {
    return 'Enter a valid international mobile number.';
  }

  return '';
};

    self.submit = function () {
      self.errorMessage('');
      self.successMessage('');

      var validationError = self.validate();

      if (validationError) {
        self.errorMessage(validationError);
        return;
      }

      self.isSubmitting(true);

      authService.register({
        username: self.username().trim(),
        password: self.password(),
        firstName: self.firstName().trim(),
        lastName: self.lastName().trim(),
        email: self.email().trim(),
        mobileNo: self.mobileNo().replace(/\s/g, '')
      })
        .then(function () {
          self.successMessage('Registration successful. You can now sign in.');
        })
        .catch(function (error) {
          self.errorMessage(error.message || 'Registration failed.');
        })
        .finally(function () {
          self.isSubmitting(false);
        });
    };

    self.goToLogin = function () {
  navigationService.goTo('login');
};

    self.connected = function () {
      document.title = 'Create account | FinThink Bank';
    };
  }

  return RegisterViewModel;
});