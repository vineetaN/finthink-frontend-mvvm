define(['./apiClient'], function (apiClient) {
  'use strict';

  function getCards() {
    return apiClient.get('/banking-service/cards');
  }

  function getCard(cardId) {
    return apiClient.get('/banking-service/cards/' + cardId);
  }
   
  function getCardPaymentHistory(cardId) {
  return apiClient.get('/banking-service/cards/' + cardId + '/payments');
}

function initiateCardPayment(cardId, payload) {
  return apiClient.post(
    '/banking-service/cards/' + cardId + '/payments/initiate',
    payload
  );
}

function verifyCardPaymentOtp(authorizationId, otp) {
  return apiClient.post(
    '/banking-service/cards/payment-authorizations/' +
      authorizationId + '/verify',
    { otp: otp }
  );
}

function resendCardPaymentOtp(authorizationId) {
  return apiClient.post(
    '/banking-service/cards/payment-authorizations/' +
      authorizationId + '/resend'
  );
}


  function freezeCard(cardId) {
    return apiClient.patch('/banking-service/cards/' + cardId + '/freeze');
  }

  function unfreezeCard(cardId) {
    return apiClient.patch('/banking-service/cards/' + cardId + '/unfreeze');
  }

  function blockCard(cardId) {
    return apiClient.patch('/banking-service/cards/' + cardId + '/block');
  }

  function updateDailyLimit(cardId, dailyLimit) {
  return apiClient.patch(
    '/banking-service/cards/' + cardId + '/daily-limit',
    { dailyLimit: dailyLimit }
  );
}

function updateInternationalUsage(cardId, internationalEnabled) {
  return apiClient.patch(
    '/banking-service/cards/' + cardId + '/international-usage',
    { internationalEnabled: internationalEnabled }
  );
}

  return {
    getCards: getCards,
    getCard: getCard,
    freezeCard: freezeCard,
    unfreezeCard: unfreezeCard,
    blockCard: blockCard,
    updateDailyLimit: updateDailyLimit,
updateInternationalUsage: updateInternationalUsage,
    getCardPaymentHistory: getCardPaymentHistory,
    initiateCardPayment: initiateCardPayment,
verifyCardPaymentOtp: verifyCardPaymentOtp,
resendCardPaymentOtp: resendCardPaymentOtp

  };
});