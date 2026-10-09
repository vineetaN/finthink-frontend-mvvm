define([
  'knockout',
  '../services/authService',
  '../utils/authGuard',
  '../utils/sessionService',
  '../utils/navigationService',
  'ojs/ojinputtext'
], function (ko, authService, authGuard, sessionService, navigationService) {
  'use strict';

  function ChangePasswordViewModel() {
    var self = this;
    var countdownTimer = null;

    self.step = ko.observable('current');
    self.currentPassword = ko.observable('');
    self.otp = ko.observable('');
    self.newPassword = ko.observable('');
    self.confirmPassword = ko.observable('');

    self.errorMessage = ko.observable('');
    self.infoMessage = ko.observable('');
    self.isSending = ko.observable(false);
    self.isConfirming = ko.observable(false);
    self.resendSeconds = ko.observable(0);

    self.canSendCode = ko.pureComputed(function () {
      return self.currentPassword().trim().length > 0 &&
        !self.isSending();
    });

    self.canConfirm = ko.pureComputed(function () {
      return /^\d{6}$/.test(self.otp().trim()) &&
        self.newPassword().length >= 8 &&
        self.newPassword().length <= 100 &&
        self.newPassword() === self.confirmPassword() &&
        !self.isConfirming();
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

      authService.startPasswordChange(self.currentPassword())
        .then(function () {
          self.step('verify');
          self.otp('');
          self.infoMessage('A verification code was sent to your registered email.');
          startCountdown();
        })
        .catch(function (error) {
          self.errorMessage(
            error.message || 'We could not send the verification code.'
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

      authService.startPasswordChange(self.currentPassword())
        .then(function () {
          self.otp('');
          self.infoMessage('A new verification code was sent successfully.');
          startCountdown();
        })
        .catch(function (error) {
          self.errorMessage(
            error.message || 'We could not resend the verification code.'
          );
        })
        .finally(function () {
          self.isSending(false);
        });
    };

    self.confirmChange = function () {
      if (!self.canConfirm()) return;

      self.isConfirming(true);
      self.errorMessage('');

      authService.confirmPasswordChange(
        self.otp().trim(),
        self.newPassword()
      )
        .then(function () {
          stopCountdown();
          self.currentPassword('');
          self.otp('');
          self.newPassword('');
          self.confirmPassword('');
          sessionService.clearSession();
          self.step('success');
        })
        .catch(function (error) {
          self.errorMessage(
            error.message || 'We could not change your password.'
          );
        })
        .finally(function () {
          self.isConfirming(false);
        });
    };

    self.goToSignIn = function () {
      navigationService.goTo('login');
    };

    self.connected = function () {
      authGuard.requireAuthentication();
    };

    self.disconnected = function () {
      stopCountdown();
      self.currentPassword('');
      self.otp('');
      self.newPassword('');
      self.confirmPassword('');
    };
  }

  return ChangePasswordViewModel;
});
