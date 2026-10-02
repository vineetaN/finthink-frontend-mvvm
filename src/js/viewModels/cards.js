define([
  'knockout',
  '../services/cardService',
  '../utils/authGuard'
], function (ko, cardService, authGuard) {
  'use strict';

  function CardsViewModel() {
    const self = this;

    self.cards = ko.observableArray([]);
    self.isLoading = ko.observable(false);
    self.errorMessage = ko.observable('');
    self.hasLoaded = ko.observable(false);
    self.selectedCard = ko.observable(null);
self.isDetailLoading = ko.observable(false);
self.detailError = ko.observable('');
self.isActionLoading = ko.observable(false);
self.actionMessage = ko.observable('');
self.actionError = ko.observable('');
self.cardPayments = ko.observableArray([]);
self.isPaymentHistoryLoading = ko.observable(false);
self.paymentHistoryError = ko.observable('');
self.paymentMerchantName = ko.observable('');
self.paymentAmount = ko.observable('');
self.paymentInternational = ko.observable(false);
self.cardPaymentOtp = ko.observable('');
self.isOtpVerifying = ko.observable(false);
self.paymentCompletionMessage = ko.observable('');
self.paymentDialogOpen = ko.observable(false);
self.paymentStep = ko.observable('form');
self.paymentReceipt = ko.observable(null);

self.isPaymentSubmitting = ko.observable(false);
self.paymentError = ko.observable('');
self.paymentInitiationMessage = ko.observable('');
self.paymentAuthorizationId = ko.observable('');
self.paymentVerificationRequired = ko.observable(false);

self.isSettingsOpen = ko.observable(false);
self.newDailyLimit = ko.observable('');
self.newInternationalUsage = ko.observable(false);
self.isSavingSettings = ko.observable(false);
self.settingsError = ko.observable('');
self.settingsSuccess = ko.observable('');

let paymentOtpTimerId = null;

self.paymentOtpResendSeconds = ko.observable(0);
self.isResendingPaymentOtp = ko.observable(false);
self.paymentOtpResendMessage = ko.observable('');
self.canResendPaymentOtp = ko.pureComputed(function () {
  return self.paymentVerificationRequired() &&
    self.paymentOtpResendSeconds() === 0 &&
    !self.isResendingPaymentOtp();
});

self.canVerifyCardPaymentOtp = ko.pureComputed(function () {
  return /^\d{6}$/.test(self.cardPaymentOtp());
});

self.canInitiatePayment = ko.pureComputed(function () {
  const merchantName = self.paymentMerchantName().trim();
  const amount = Number(self.paymentAmount());

  return merchantName.length > 0 && Number.isFinite(amount) && amount > 0;
});

    self.formatCurrency = function (amount) {
      if (amount === null || amount === undefined) {
        return '—';
      }

      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
      }).format(amount);
    };

    self.loadCards = function () {
      self.isLoading(true);
      self.errorMessage('');

      return cardService.getCards()
        .then(function (response) {
          self.cards(Array.isArray(response) ? response : []);
          self.hasLoaded(true);
        })
        .catch(function (error) {
          self.cards([]);
          self.errorMessage(error.message || 'We could not load your cards. Please try again.');
        })
        .finally(function () {
          self.isLoading(false);
        });
    };

 
     self.formatDateTime = function (value) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
};

self.loadCardPaymentHistory = function (cardId) {
  self.isPaymentHistoryLoading(true);
  self.paymentHistoryError('');
  self.cardPayments([]);

  return cardService.getCardPaymentHistory(cardId)
    .then(function (response) {
      self.cardPayments(Array.isArray(response) ? response : []);
    })
    .catch(function (error) {
      self.paymentHistoryError(
        error.message || 'We could not load card payment history.'
      );
    })
    .finally(function () {
      self.isPaymentHistoryLoading(false);
    });
};


self.clearPaymentOtpCountdown = function () {
  if (paymentOtpTimerId) {
    window.clearInterval(paymentOtpTimerId);
    paymentOtpTimerId = null;
  }

  self.paymentOtpResendSeconds(0);
};

self.startPaymentOtpCountdown = function () {
  self.clearPaymentOtpCountdown();
  self.paymentOtpResendSeconds(60);

  paymentOtpTimerId = window.setInterval(function () {
    const nextSecond = self.paymentOtpResendSeconds() - 1;

    if (nextSecond <= 0) {
      self.clearPaymentOtpCountdown();
      return;
    }

    self.paymentOtpResendSeconds(nextSecond);
  }, 1000);
};

self.resendCardPaymentOtp = function () {
  if (!self.canResendPaymentOtp() || !self.paymentAuthorizationId()) {
    return;
  }

  self.isResendingPaymentOtp(true);
  self.paymentError('');

  self.paymentOtpResendMessage('');

  return cardService.resendCardPaymentOtp(self.paymentAuthorizationId())
    .then(function (response) {
      self.cardPaymentOtp('');

      self.paymentInitiationMessage(
        response.message || 'A new OTP has been sent to your registered email.'
      );
      self.startPaymentOtpCountdown();
    })
    .catch(function (error) {
      self.paymentError(
        error.message || 'We could not resend the verification code.'
      );
    })
    .finally(function () {
      self.isResendingPaymentOtp(false);
    });
};

self.initiateCardPayment = function () {
  const card = self.selectedCard();
  const merchantName = self.paymentMerchantName().trim();
  const amount = Number(self.paymentAmount());

  if (!card || !self.canInitiatePayment() || self.isPaymentSubmitting()) {
    return;
  }

  self.isPaymentSubmitting(true);
  self.paymentError('');
  self.paymentInitiationMessage('');

  return cardService.initiateCardPayment(card.cardId, {
    merchantName: merchantName,
    amount: amount,
    internationalPayment: self.paymentInternational()
  })
    .then(function (response) {
      if (!response.authorizationId || !response.verificationRequired) {
        throw new Error('Payment verification could not be started.');
      }

      self.paymentAuthorizationId(response.authorizationId);
      self.paymentVerificationRequired(true);
      self.paymentStep('otp');
      self.startPaymentOtpCountdown();
      self.paymentInitiationMessage(
        response.message || 'An OTP has been sent to your registered email.'
      );
    })
    .catch(function (error) {
      self.paymentError(
        error.message || 'We could not start this payment. Please try again.'
      );
    })
    .finally(function () {
      self.isPaymentSubmitting(false);
    });
};


self.openPaymentDialog = function () {
  self.paymentError('');
  self.paymentInitiationMessage('');
  self.paymentCompletionMessage('');
  self.paymentAuthorizationId('');
  self.paymentVerificationRequired(false);
  self.cardPaymentOtp('');
  self.paymentReceipt(null);
  self.paymentStep('form');
  self.paymentDialogOpen(true);
};

self.closePaymentDialog = function () {
  self.paymentDialogOpen(false);
  self.paymentStep('form');
  self.paymentError('');
  self.clearPaymentOtpCountdown();
  self.paymentOtpResendMessage('');
};

self.showPaymentReview = function () {
  if (self.canInitiatePayment()) {
    self.paymentError('');
    self.paymentStep('review');
  }
};

self.editPayment = function () {
  self.paymentStep('form');
};



self.verifyCardPaymentOtp = function () {
  const card = self.selectedCard();
  const otp = self.cardPaymentOtp().trim();

  if (!card ||
      !self.paymentAuthorizationId() ||
      !self.canVerifyCardPaymentOtp() ||
      self.isOtpVerifying()) {
    return;
  }

  self.isOtpVerifying(true);
  self.paymentError('');

  return cardService.verifyCardPaymentOtp(
    self.paymentAuthorizationId(),
    otp
  )
    .then(function (response) {
      self.paymentVerificationRequired(false);
      self.paymentAuthorizationId('');
      self.cardPaymentOtp('');
      self.paymentReceipt(response);
      self.paymentStep('success');

      const updatedCard = Object.assign({}, card, {
  availableBalance: response.remainingAvailableBalance,
  remainingDailyLimit: response.remainingDailyLimit
});

      self.selectedCard(updatedCard);
      self.updateCardInList(updatedCard);
      self.loadCardPaymentHistory(card.cardId);
    })
    .catch(function (error) {
      self.paymentError(
        error.status === 400
          ? 'Invalid or expired verification code.'
          : (error.message || 'We could not verify this payment.')
      );
    })
    .finally(function () {
      self.isOtpVerifying(false);
    });
};



self.openCardDetails = function (card) {
  self.isDetailLoading(true);
  self.detailError('');
  self.selectedCard(null);

  return cardService.getCard(card.cardId)
    .then(function (response) {
      self.selectedCard(response);
      self.loadCardPaymentHistory(response.cardId);
    })
    .catch(function (error) {
      self.detailError(error.message || 'We could not load this card.');
    })
    .finally(function () {
      self.isDetailLoading(false);
    });
};

self.closeCardDetails = function () {
  self.selectedCard(null);
  self.detailError('');
  self.cardPayments([]);
self.paymentHistoryError('');
self.paymentMerchantName('');
self.paymentAmount('');
self.paymentInternational(false);
self.paymentError('');
self.paymentInitiationMessage('');
self.paymentAuthorizationId('');
self.paymentVerificationRequired(false);
self.cardPaymentOtp('');
self.paymentCompletionMessage('');
self.paymentDialogOpen(false);
self.paymentStep('form');
self.paymentReceipt(null);
self.clearPaymentOtpCountdown();
self.paymentOtpResendMessage('');
};



self.updateCardInList = function (updatedCard) {
  self.cards(self.cards().map(function (card) {
    return card.cardId === updatedCard.cardId ? updatedCard : card;
  }));
};


self.saveCardSettings = function () {
  const card = self.selectedCard();
  const newDailyLimit = Number(self.newDailyLimit());
  const newInternationalUsage = self.newInternationalUsage();

  if (!card || self.isSavingSettings()) {
    return;
  }

  if (!Number.isFinite(newDailyLimit) || newDailyLimit < 0) {
    self.settingsError('Enter a valid daily spending limit.');
    return;
  }

  const dailyLimitChanged = newDailyLimit !== Number(card.dailyLimit);
  const internationalUsageChanged =
    newInternationalUsage !== card.internationalEnabled;

  if (!dailyLimitChanged && !internationalUsageChanged) {
    self.settingsError('No settings have been changed.');
    return;
  }

  const changes = [];

  if (dailyLimitChanged) {
    changes.push(
      'Daily limit: ' +
      self.formatCurrency(card.dailyLimit) +
      ' → ' +
      self.formatCurrency(newDailyLimit)
    );
  }

  if (internationalUsageChanged) {
    changes.push(
      'International usage: ' +
      (newInternationalUsage ? 'Enable' : 'Disable')
    );
  }

  if (!window.confirm(
    'Please confirm these card setting changes:\n\n' + changes.join('\n')
  )) {
    return;
  }

  self.isSavingSettings(true);
  self.settingsError('');
  self.settingsSuccess('');

  let updatedCard = card;
  let request = Promise.resolve();

  if (dailyLimitChanged) {
    request = request.then(function () {
      return cardService.updateDailyLimit(card.cardId, newDailyLimit);
    }).then(function (response) {
      updatedCard = response;
    });
  }

  if (internationalUsageChanged) {
    request = request.then(function () {
      return cardService.updateInternationalUsage(
        card.cardId,
        newInternationalUsage
      );
    }).then(function (response) {
      updatedCard = response;
    });
  }

  return request
    .then(function () {
      self.selectedCard(updatedCard);
      self.updateCardInList(updatedCard);
      self.newDailyLimit(updatedCard.dailyLimit);
      self.newInternationalUsage(updatedCard.internationalEnabled);
      self.settingsSuccess('Your card settings have been updated successfully.');
    })
    .catch(function (error) {
      self.settingsError(
        error.message || 'We could not update your card settings.'
      );
    })
    .finally(function () {
      self.isSavingSettings(false);
    });
};

self.performCardAction = function (action) {
  const card = self.selectedCard();

  if (!card || self.isActionLoading()) {
    return;
  }

  const actionLabels = {
    freeze: 'freeze',
    unfreeze: 'unfreeze',
    block: 'permanently block'
  };

  if (!window.confirm(
    'Are you sure you want to ' + actionLabels[action] + ' this card?'
  )) {
    return;
  }

  self.isActionLoading(true);
  self.actionMessage('');
  self.actionError('');

  let request;

  if (action === 'freeze') {
    request = cardService.freezeCard(card.cardId);
  } else if (action === 'unfreeze') {
    request = cardService.unfreezeCard(card.cardId);
  } else {
    request = cardService.blockCard(card.cardId);
  }

  return request
    .then(function (updatedCard) {
      self.selectedCard(updatedCard);
      self.updateCardInList(updatedCard);
      self.actionMessage(
        action === 'block'
          ? 'Your card has been blocked.'
          : 'Your card has been ' + actionLabels[action] + 'd.'
      );
    })
    .catch(function (error) {
      self.actionError(error.message || 'We could not update this card. Please try again.');
    })
    .finally(function () {
      self.isActionLoading(false);
    });
};

self.openCardSettings = function () {
  const card = self.selectedCard();

  if (!card) {
    return;
  }

  self.newDailyLimit(card.dailyLimit);
  self.newInternationalUsage(card.internationalEnabled);
  self.settingsError('');
  self.settingsSuccess('');
  self.isSettingsOpen(true);
};

self.closeCardSettings = function () {
  if (self.isSavingSettings()) {
    return;
  }

  self.isSettingsOpen(false);
  self.settingsError('');
  self.settingsSuccess('');
};


    self.connected = function () {
      if (!authGuard.requireAuthentication()) {
        return;
      }

      self.loadCards();
    };
  }

  return CardsViewModel;
});