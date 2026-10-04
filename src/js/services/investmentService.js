define(['../config/apiConfig', 'text!../data/investmentMock.json', './apiClient'], function (config, fixtureText, apiClient) {
  'use strict';

  var mockInvestments = JSON.parse(fixtureText).map(function (item) { return Object.assign({}, item); });

  function mapInvestmentResponse(raw) {
    raw = raw || {};
    return {
      productId: Number(raw.productId),
      investmentName: String(raw.investmentName || ''),
      interestRate: Number(raw.interestRate),
      active: raw.active === 'Y',
      prematurePenaltyRate: Number(raw.prematurePenaltyRate)
    };
  }

  function list() {
    if (config.useMockInvestmentData) return Promise.resolve(mockInvestments.map(mapInvestmentResponse));
    return apiClient.get(config.investmentBaseUrl + '/getInvestment').then(function (rows) {
      if (!Array.isArray(rows)) throw new Error('Invalid investment list response.');
      return rows.map(mapInvestmentResponse);
    });
  }

  function updateInterestRate(productId, interestRate) {
    var payload = { productId: Number(productId), interestRate: Number(interestRate) };
    if (!config.useMockInvestmentData) return apiClient.post(config.investmentBaseUrl + '/updateInterestRate', payload);
    var product = mockInvestments.find(function (item) { return Number(item.productId) === payload.productId; });
    if (!product) return Promise.reject(new Error('Investment product not found.'));
    product.interestRate = payload.interestRate;
    return Promise.resolve({});
  }

  return { list: list, updateInterestRate: updateInterestRate, mapInvestmentResponse: mapInvestmentResponse };
});