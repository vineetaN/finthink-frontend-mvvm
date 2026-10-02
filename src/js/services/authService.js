define(['./apiClient'], function (apiClient) {
  'use strict';

  var AUTH_OPTIONS = {
    requiresAuth: false
  };

  return {
    register: function (payload) {
      return apiClient.post(
        '/identification-service/auth/userRegistration',
        payload,
        AUTH_OPTIONS
      );
    },

    login: function (payload) {
      return apiClient.post(
        '/identification-service/auth/userLogin',
        payload,
        AUTH_OPTIONS
      );
    },

    verifyOtp: function (payload) {
      return apiClient.post(
        '/identification-service/auth/userLogin',
        payload,
        AUTH_OPTIONS
      );
    }
  };
});