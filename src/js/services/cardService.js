define([
  '../config/apiConfig',
  'text!../data/cardMock.json',
  './apiClient'
], function (config, fixtureText, apiClient) {
  'use strict';

  var mockCards = JSON.parse(fixtureText).map(function (card) {
    return Object.assign({}, card);
  });

  // Admin card functions
  function mapCardResponse(raw) {
    raw = raw || {};
    return {
      cardId: raw.cardId,
      customerId: raw.customerId,
      accountId: raw.accountId,
      cardNumberMasked: String(raw.cardNumberMasked || ''),
      cardType: String(raw.cardType || '').toUpperCase(),
      expiryDate: String(raw.expiryDate || ''),
      cardStatus: String(raw.cardStatus || ''),
      dailyLimit: Number(raw.dailyLimit),
      internationalEnabled: raw.internationalEnabled === true
    };
  }

  function list() {
    if (config.useMockCardData) {
      return Promise.resolve(mockCards.map(mapCardResponse));
    }

    return apiClient.get(config.cardApiBaseUrl + '/cards').then(function (rows) {
      if (!Array.isArray(rows)) {
        throw new Error('Invalid card list response.');
      }
      return rows.map(mapCardResponse);
    });
  }

  function create(customerId, form) {
    var payload = {
      accountId: Number(form.accountId),
      cardNumber: String(form.cardNumber),
      cardType: String(form.cardType).toUpperCase(),
      expiryDate: String(form.expiryDate).slice(0, 10),
      dailyLimit: Number(form.dailyLimit),
      internationalEnabled: form.internationalEnabled === true
    };

    var endpoint = config.cardIssueEndpoint.replace(
      '{customerId}',
      encodeURIComponent(customerId)
    );
    return apiClient.post(endpoint, payload);
  }

  function action(actionName, cardId) {
    var pathTemplate = config.cardActionPaths[actionName];

    if (!pathTemplate) {
      return Promise.reject(new Error('Unsupported card action.'));
    }

    if (!config.useMockCardData) {
      return apiClient.patch(
        config.cardApiBaseUrl +
          pathTemplate.replace('{cardId}', encodeURIComponent(cardId))
      );
    }

    var card = mockCards.find(function (item) {
      return String(item.cardId) === String(cardId);
    });

    if (!card) {
      var missing = new Error('Card not found');
      missing.status = 404;
      return Promise.reject(missing);
    }

    card.cardStatus = actionName === 'freeze'
      ? config.cardStatuses.FROZEN
      : actionName === 'unfreeze'
        ? config.cardStatuses.ACTIVE
        : config.cardStatuses.BLOCKED;

    return Promise.resolve({});
  }

  // Customer card functions
  function getCards() {
    return apiClient.get('/banking-service/cards');
  }

  function getCard(cardId) {
    return apiClient.get('/banking-service/cards/' + cardId);
  }

  function requestCardNumberReveal(cardId) {
    return apiClient.post(
      '/banking-service/cards/' + encodeURIComponent(cardId) + '/number/reveal-requests'
    );
  }

  function revealCardNumber(cardId, challengeId, otp) {
    return apiClient.post(
      '/banking-service/cards/' + encodeURIComponent(cardId) + '/number/reveal',
      { challengeId: challengeId, otp: otp }
    );
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
    // Admin page
    list: list,
    create: create,
    freeze: function (id) { return action('freeze', id); },
    unfreeze: function (id) { return action('unfreeze', id); },
    block: function (id) { return action('block', id); },
    mapCardResponse: mapCardResponse,

    // Customer page
    getCards: getCards,
    getCard: getCard,
    requestCardNumberReveal: requestCardNumberReveal,
    revealCardNumber: revealCardNumber,
    getCardPaymentHistory: getCardPaymentHistory,
    initiateCardPayment: initiateCardPayment,
    verifyCardPaymentOtp: verifyCardPaymentOtp,
    resendCardPaymentOtp: resendCardPaymentOtp,
    freezeCard: freezeCard,
    unfreezeCard: unfreezeCard,
    blockCard: blockCard,
    updateDailyLimit: updateDailyLimit,
    updateInternationalUsage: updateInternationalUsage
  };
});
