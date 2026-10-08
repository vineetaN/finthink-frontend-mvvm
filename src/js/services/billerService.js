define(['./apiClient'], function (apiClient) {
  'use strict';

  var basePath = '/banking-service/api/billers';

  function getMyBillers() {
    return apiClient.get(basePath + '/me');
  }

  function getArchivedBillers() {
  return apiClient.get(basePath + '/archived');
}

function restoreBiller(billerId) {
  return apiClient.patch(basePath + '/' + billerId + '/restore');
}

  function addBiller(biller) {
    return apiClient.post(basePath, biller);
  }

  function deleteBiller(billerId) {
    return apiClient.remove(basePath + '/' + billerId);
  }

  function initiatePayment(billerId, payment) {
    return apiClient.post(
      basePath + '/' + billerId + '/payment-authorizations/initiate',
      payment
    );
  }

  function resendPaymentOtp(authorizationId) {
    return apiClient.post(
      basePath + '/payment-authorizations/' + authorizationId + '/resend'
    );
  }

  function verifyPayment(billerId, authorizationId, otp) {
    return apiClient.post(
      basePath + '/' + billerId +
        '/payment-authorizations/' + authorizationId + '/verify',
      { otp: otp }
    );
  }

  function permanentlyDeleteBiller(billerId) {
  return apiClient.remove(basePath + '/' + billerId + '/permanent');
}

function getPaymentHistory() {
  return apiClient.get(basePath + '/payments/history');
}

function getPaymentHistoryPage(page) {
  return apiClient.get(
    basePath + '/payments/history-page?page=' + encodeURIComponent(page)
  );
}

  return {
  getMyBillers: getMyBillers,
  getArchivedBillers: getArchivedBillers,
  restoreBiller: restoreBiller,
  addBiller: addBiller,
  deleteBiller: deleteBiller,
  initiatePayment: initiatePayment,
  resendPaymentOtp: resendPaymentOtp,
  verifyPayment: verifyPayment,
  permanentlyDeleteBiller: permanentlyDeleteBiller,
  getPaymentHistory: getPaymentHistory,
  getPaymentHistoryPage: getPaymentHistoryPage,
};
});