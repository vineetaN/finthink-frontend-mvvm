define(['./apiClient'], function (apiClient) {
  'use strict';

  var base = '/investment-service/api/investments';
  function idPath(id) { return encodeURIComponent(id); }

  return {
    active: function () { return apiClient.post(base + '/customer/getInvestment'); },
    previewFd: function (payload) { return apiClient.post(base + '/fd/preview', payload); },
    createFd: function (payload) { return apiClient.post(base + '/fd', payload); },
    createRd: function (payload) { return apiClient.post(base + '/rd', payload); },
    closePremature: function (id, customerId) {
      return apiClient.post(base + '/' + idPath(id) + '/close-premature', { customerId: customerId });
    },
    funds: function (category, riskLevel) {
      var query = [];
      if (category) query.push('category=' + encodeURIComponent(category));
      if (riskLevel) query.push('riskLevel=' + encodeURIComponent(riskLevel));
      return apiClient.get(base + '/mutual-funds' + (query.length ? '?' + query.join('&') : ''));
    },
    previewFund: function (payload) { return apiClient.post(base + '/mutual-fund/preview', payload); },
    buyFund: function (payload) { return apiClient.post(base + '/mutual-fund/buy', payload); },
    startSip: function (payload) { return apiClient.post(base + '/mutual-fund/sip/start', payload); },
    redeemFund: function (id, unitsToRedeem) {
      return apiClient.post(base + '/mutual-fund/' + idPath(id) + '/redeem',
        unitsToRedeem == null ? {} : { unitsToRedeem: unitsToRedeem });
    },
    valuation: function (id) { return apiClient.get(base + '/mutual-fund/' + idPath(id) + '/valuation'); },
    products: function () { return apiClient.get(base + '/admin/getInvestment'); },
    updateRate: function (payload) { return apiClient.post(base + '/admin/updateInterestRate', payload); }
  };
});
