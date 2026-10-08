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
    var resendTimerId = null;

    self.username = ko.observable('');
    self.password = ko.observable('');
    self.firstName = ko.observable('');
    self.lastName = ko.observable('');
    self.email = ko.observable('');
    self.mobileNo = ko.observable('');
    self.otp = ko.observable('');
    self.registrationStep = ko.observable('details');

    self.isSendingOtp = ko.observable(false);
    self.isSubmitting = ko.observable(false);
    self.resendSeconds = ko.observable(0);
    self.errorMessage = ko.observable('');
    self.infoMessage = ko.observable('');
    self.successMessage = ko.observable('');

    self.canSendCode = ko.pureComputed(function () {
      return self.username().trim() !== '' &&
        self.password().length >= 8 &&
        self.firstName().trim() !== '' &&
        self.lastName().trim() !== '' &&
        self.email().trim() !== '' &&
        self.mobileNo().trim() !== '' &&
        !self.isSendingOtp() && !self.isSubmitting();
    });

    self.canRegister = ko.pureComputed(function () {
      return self.registrationStep() === 'verify' &&
        /^\d{6}$/.test(self.otp().trim()) &&
        !self.isSubmitting() && !self.isSendingOtp();
    });

    self.canResendCode = ko.pureComputed(function () {
      return self.registrationStep() === 'verify' &&
        self.resendSeconds() === 0 &&
        !self.isSendingOtp() && !self.isSubmitting();
    });

    self.validate = function () {
      if (!self.username().trim() || !self.firstName().trim() ||
          !self.lastName().trim() || !self.email().trim() ||
          !self.mobileNo().trim() || !self.password()) {
        return 'Complete all required fields before requesting a code.';
      }
      if (!/^[a-zA-Z0-9_]+$/.test(self.username().trim())) {
        return 'Username can contain only letters, numbers, and underscores.';
      }
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,100}$/.test(self.password())) {
        return 'Password must be 8–100 characters with upper, lower, number, and special character.';
      }
      if (!/.+@.+\..+/.test(self.email().trim())) {
        return 'Enter a valid email address.';
      }
      if (!/^\+[0-9]{8,15}$/.test(self.mobileNo().replace(/\s/g, ''))) {
        return 'Enter a valid international mobile number.';
      }
      return '';
    };

    function clearResendTimer() {
      if (resendTimerId !== null) {
        window.clearInterval(resendTimerId);
        resendTimerId = null;
      }
    }

    function startResendCountdown() {
      clearResendTimer();
      self.resendSeconds(60);
      resendTimerId = window.setInterval(function () {
        var remaining = self.resendSeconds() - 1;
        self.resendSeconds(Math.max(0, remaining));
        if (remaining <= 0) {
          clearResendTimer();
        }
      }, 1000);
    }

    function sendCode() {
      self.errorMessage('');
      self.infoMessage('');
      var validationError = self.validate();
      if (validationError) {
        self.errorMessage(validationError);
        return;
      }

      self.isSendingOtp(true);
      return authService.sendRegistrationOtp(self.email().trim())
        .then(function () {
          self.registrationStep('verify');
          self.otp('');
          self.infoMessage('A verification code was sent to your email address.');
          startResendCountdown();
        })
        .catch(function (error) {
          self.errorMessage(error.status === 409
            ? 'This email is already registered. Use a different email or sign in.'
            : (error.message || 'We could not send the verification code.'));
        })
        .finally(function () {
          self.isSendingOtp(false);
        });
    }

    self.sendCode = function () {
      if (self.registrationStep() === 'details' && self.canSendCode()) {
        return sendCode();
      }
    };

    self.resendCode = function () {
      if (self.canResendCode()) {
        return sendCode();
      }
    };

    self.changeDetails = function () {
      if (self.isSendingOtp() || self.isSubmitting()) {
        return;
      }
      self.registrationStep('details');
      self.otp('');
      self.infoMessage('');
      self.errorMessage('');
    };

    self.submit = function () {
      self.errorMessage('');
      if (!self.canRegister()) {
        self.errorMessage('Enter the six-digit verification code.');
        return;
      }

      self.isSubmitting(true);
      return authService.register({
        username: self.username().trim(),
        password: self.password(),
        firstName: self.firstName().trim(),
        lastName: self.lastName().trim(),
        email: self.email().trim(),
        mobileNo: self.mobileNo().replace(/\s/g, ''),
        otp: self.otp().trim()
      })
        .then(function () {
          self.password('');
          self.otp('');
          self.infoMessage('');
          self.registrationStep('success');
          self.successMessage('Registration successful. You can now sign in.');
          clearResendTimer();
        })
        .catch(function (error) {
          self.errorMessage(error.status === 401
            ? 'Invalid or expired registration code. Request a new code and try again.'
            : error.status === 409
              ? 'This username or email is already registered.'
              : (error.message || 'Registration failed.'));
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

    self.disconnected = function () {
      clearResendTimer();
      self.password('');
      self.otp('');
    };
  }

  return RegisterViewModel;
});
