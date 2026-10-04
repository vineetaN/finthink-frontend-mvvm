define(['../config/apiConfig', 'text!../data/cardMock.json', './apiClient'], function (config, fixtureText, apiClient) {
  'use strict';
  var mockCards = JSON.parse(fixtureText).map(function (card) { return Object.assign({}, card); });
  function mapCardResponse(raw) {
    raw = raw || {};
    return { cardId: raw.cardId, customerId: raw.customerId, accountId: raw.accountId,
      cardNumberMasked: String(raw.cardNumberMasked || ''), cardType: String(raw.cardType || '').toUpperCase(),
      expiryDate: String(raw.expiryDate || ''), cardStatus: String(raw.cardStatus || ''),
      dailyLimit: Number(raw.dailyLimit), internationalEnabled: raw.internationalEnabled === true };
  }
  function list() {
    if (config.useMockCardData) return Promise.resolve(mockCards.map(mapCardResponse));
    return apiClient.get(config.cardApiBaseUrl + '/cards').then(function (rows) {
      if (!Array.isArray(rows)) throw new Error('Invalid card list response.');
      return rows.map(mapCardResponse);
    });
  }
  function action(actionName, cardId) {
    var pathTemplate = config.cardActionPaths[actionName];
    if (!pathTemplate) return Promise.reject(new Error('Unsupported card action.'));
    if (!config.useMockCardData) return apiClient.patch(config.cardApiBaseUrl + pathTemplate.replace('{cardId}', encodeURIComponent(cardId)));
    var card = mockCards.find(function (item) { return String(item.cardId) === String(cardId); });
    if (!card) { var missing = new Error('Card not found'); missing.status = 404; return Promise.reject(missing); }
    card.cardStatus = actionName === 'freeze' ? config.cardStatuses.FROZEN : actionName === 'unfreeze' ? config.cardStatuses.ACTIVE : config.cardStatuses.BLOCKED;
    return Promise.resolve({});
  }
  return { list: list, freeze: function (id) { return action('freeze', id); },
    unfreeze: function (id) { return action('unfreeze', id); }, block: function (id) { return action('block', id); }, mapCardResponse: mapCardResponse };
});
