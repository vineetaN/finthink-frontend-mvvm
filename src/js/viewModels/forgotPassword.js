define([
  'knockout',
  '../services/authService',
  '../utils/navigationService',
  'ojs/ojinputtext'
], function (ko, authService, navigationService) {
  'use strict';

  function ForgotPasswordViewModel() {
    var self = this;
    var countdownTimer = null;

    self.step = ko.observable('username');
    self.username = ko.observable('');
    self.otp = ko.observable('');
    self.newPassword = ko.observable('');
    self.confirmPassword = ko.observable('');

    self.errorMessage = ko.observable('');
    self.infoMessage = ko.observable('');
    self.isSending = ko.observable(false);
    self.isResetting = ko.observable(false);
    self.resendSeconds = ko.observable(0);

    self.canSendCode = ko.pureComputed(function () {
      return self.username().trim().length > 0 &&
        !self.isSending();
    });

    self.canReset = ko.pureComputed(function () {
      return /^[0-9]{6}$/.test(self.otp().trim()) &&
        self.newPassword().length >= 8 &&
        self.newPassword().length <= 100 &&
        self.newPassword() === self.confirmPassword() &&
        !self.isResetting();
    });

    function stopCountdown() {
      if (countdownTimer !== null) {
        window.clearInterval(countdownTimer);
        countdownTimer = null;
      }
    }

    function startCountdown() {
      stopCountdown();
      self.resendSeconds(60);

      countdownTimer = window.setInterval(function () {
        var remaining = self.resendSeconds() - 1;
        self.resendSeconds(Math.max(0, remaining));

        if (remaining <= 0) {
          stopCountdown();
        }
      }, 1000);
    }

    self.sendCode = function () {
      if (!self.canSendCode()) return;

      self.isSending(true);
      self.errorMessage('');
      self.infoMessage('');

      authService.forgotPassword(self.username().trim())
        .then(function () {
          self.step('verify');
          self.otp('');
          self.infoMessage(
            'If this account exists, a verification code has been sent to its registered email.'
          );
          startCountdown();
        })
        .catch(function (error) {
          self.errorMessage(
            error.message || 'We could not process your request.'
          );
        })
        .finally(function () {
          self.isSending(false);
        });
    };

    self.resendCode = function () {
      if (self.step() !== 'verify' ||
          self.resendSeconds() > 0 ||
          self.isSending()) {
        return;
      }

      self.isSending(true);
      self.errorMessage('');
      self.infoMessage('');

      authService.forgotPassword(self.username().trim())
        .then(function () {
          self.otp('');
          self.infoMessage(
            'If this account exists, a new verification code has been sent.'
          );
          startCountdown();
        })
        .catch(function (error) {
          self.errorMessage(
            error.message || 'We could not process your request.'
          );
        })
        .finally(function () {
          self.isSending(false);
        });
    };

    self.resetPassword = function () {
      if (!self.canReset()) return;

      self.isResetting(true);
      self.errorMessage('');
      self.infoMessage('');

      authService.resetPassword(
        self.username().trim(),
        self.otp().trim(),
        self.newPassword()
      )
        .then(function () {
          stopCountdown();
          self.otp('');
          self.newPassword('');
          self.confirmPassword('');
          self.step('success');
        })
        .catch(function (error) {
          self.errorMessage(
            error.status === 401
              ? 'Invalid or expired verification code.'
              : (error.message || 'We could not reset your password.')
          );
        })
        .finally(function () {
          self.isResetting(false);
        });
    };

    self.goToSignIn = function () {
      navigationService.goTo('login');
    };

    self.changeUsername = function () {
  stopCountdown();
  self.resendSeconds(0);
  self.otp('');
  self.errorMessage('');
  self.infoMessage('');
  self.step('username');
};

    self.connected = function () {
      document.title = 'Forgot password | FinThink Bank';
    };

    self.disconnected = function () {
      stopCountdown();
      self.otp('');
      self.newPassword('');
      self.confirmPassword('');
    };
  }

  return ForgotPasswordViewModel;
});
