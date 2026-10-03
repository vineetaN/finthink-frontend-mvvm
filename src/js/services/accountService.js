define(['./apiClient'], function (apiClient) {
  'use strict';

  function getMyAccounts() {
    return apiClient.get('/banking-service/accounts/me');
  }

  return {
    getMyAccounts: getMyAccounts
  };
});