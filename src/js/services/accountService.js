define(['./apiClient'], function (apiClient) {
  'use strict';

  function getMyAccounts() {
    return apiClient.get('/banking-service/accounts/me');
  }

  return {
  getMyAccounts: getMyAccounts,

  getCustomerSummary: function (customerId) {
    return apiClient.get(
      '/banking-service/accounts/customer/' +
      encodeURIComponent(customerId) +
      '/summary'
    );
  }
};
});
