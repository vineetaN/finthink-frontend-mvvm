define([
  'knockout',
  '../services/authService',
  '../utils/sessionService',
  '../utils/navigationService',
  'ojs/ojformlayout',
  'ojs/ojinputtext',
  'ojs/ojbutton',
  'ojs/ojprogress-circle'
], function (
  ko,
  authService,
  sessionService,
  navigationService
) {
  'use strict';

  function LoginViewModel() {
    var self = this;
    var RESEND_COOLDOWN_SECONDS = 60;
    var resendTimerId = null;

    self.username = ko.observable('');
    self.password = ko.observable('');
    self.otpCode = ko.observable('');
    self.verificationRequired = ko.observable(false);

    self.isSubmitting = ko.observable(false);
    self.errorMessage = ko.observable('');
    self.successMessage = ko.observable('');
    self.resendSeconds = ko.observable(0);

    self.canSubmit = ko.pureComputed(function () {
      return self.username().trim() !== ''
        && self.password().length >= 8
        && !self.isSubmitting();
    });

    self.canVerifyOtp = ko.pureComputed(function () {
      return /^[0-9]{6}$/.test(self.otpCode().trim())
        && !self.isSubmitting();
    });

    self.canResendOtp = ko.pureComputed(function () {
      return self.verificationRequired()
        && self.resendSeconds() === 0
        && !self.isSubmitting();
    });

    self.resendButtonLabel = ko.pureComputed(function () {
      if (self.resendSeconds() > 0) {
        return 'Resend OTP in ' + self.resendSeconds() + 's';
      }

      self.resendWaitMessage = ko.pureComputed(function () {
  return 'You can request a new OTP in '
    + self.resendSeconds()
    + ' seconds.';
});

      return 'Resend OTP';
    });

    function clearResendTimer() {
      if (resendTimerId !== null) {
        window.clearInterval(resendTimerId);
        resendTimerId = null;
      }
    }

    function startResendCountdown() {
      clearResendTimer();
      self.resendSeconds(RESEND_COOLDOWN_SECONDS);

      resendTimerId = window.setInterval(function () {
        var remainingSeconds = self.resendSeconds() - 1;

        if (remainingSeconds <= 0) {
          self.resendSeconds(0);
          clearResendTimer();
          return;
        }

        self.resendSeconds(remainingSeconds);
      }, 1000);
    }

    function saveSessionAndNavigate(response) {
      if (!response.token) {
        throw new Error('The sign-in response did not include a token.');
      }

      sessionService.saveSession(response);
      clearResendTimer();

      return navigationService.goTo('dashboard');
    }

    self.submit = function () {
      self.errorMessage('');
      self.successMessage('');

      if (!self.canSubmit()) {
        self.errorMessage(
          'Enter your username and a password with at least 8 characters.'
        );
        return;
      }

      self.isSubmitting(true);

      authService.login({
        username: self.username().trim(),
        password: self.password()
      })
        .then(function (response) {
          if (response.verificationRequired) {
            self.verificationRequired(true);
            self.otpCode('');
            self.successMessage(
              'A verification code has been sent to your registered email address.'
            );
            startResendCountdown();
            return;
          }

          return saveSessionAndNavigate(response);
        })
        .catch(function (error) {
          self.errorMessage(
            error.status === 401
              ? 'Invalid username or password.'
              : (error.message || 'Unable to sign in.')
          );
        })
        .finally(function () {
          self.isSubmitting(false);
        });
    };

    self.verifyOtp = function () {
      self.errorMessage('');
      self.successMessage('');

      if (!self.canVerifyOtp()) {
        self.errorMessage('Enter the six-digit verification code.');
        return;
      }

      self.isSubmitting(true);

      authService.verifyOtp({
        username: self.username().trim(),
        password: self.password(),
        code: self.otpCode().trim()
      })
        .then(function (response) {
          return saveSessionAndNavigate(response);
        })
        .catch(function (error) {
          self.errorMessage(
            error.status === 401
              ? 'Invalid or expired verification code.'
              : (error.message || 'Unable to verify the code.')
          );
        })
        .finally(function () {
          self.isSubmitting(false);
        });
    };

    self.resendOtp = function () {
      self.errorMessage('');
      self.successMessage('');

      if (!self.canResendOtp()) {
        return;
      }

      self.isSubmitting(true);

      authService.login({
        username: self.username().trim(),
        password: self.password()
      })
        .then(function (response) {
          if (!response.verificationRequired) {
            return saveSessionAndNavigate(response);
          }

          self.otpCode('');
          self.successMessage(
            'A new verification code has been sent to your registered email address.'
          );
          startResendCountdown();
        })
        .catch(function (error) {
          self.errorMessage(
            error.message || 'Unable to resend the verification code.'
          );
        })
        .finally(function () {
          self.isSubmitting(false);
        });
    };

    self.goToRegister = function () {
  navigationService.goTo('register');
};

self.goToForgotPassword = function () {
  navigationService.goTo('forgotPassword');
};

    self.connected = function () {
      document.title = 'Sign in | FinThink Bank';
    };

    self.disconnected = function () {
      clearResendTimer();
    };
  }

  return LoginViewModel;
});