define(['./apiClient'], function (apiClient) {
  'use strict';

  return {
    getCustomerSummary: function (customerId) {
      return apiClient.get(
        '/banking-service/accounts/customer/' + encodeURIComponent(customerId) + '/summary'
      );
    }
  };
});
