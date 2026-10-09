define(['./apiClient'], function (apiClient) {
  'use strict';

  var base = '/banking-service/api/payments';

  return {
    initiate: function (payload) {
      return apiClient.post(base + '/initiate', payload);
    },
    verifyOtp: function (paymentId, otp) {
      return apiClient.post(base + '/' + encodeURIComponent(paymentId) + '/verify-otp', {
        otp: otp
      });
    }
  };
});
