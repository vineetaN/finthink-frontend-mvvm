define(['./apiClient'], function (apiClient) {
  'use strict';

  function getLoans() {
    return apiClient.get('/banking-service/loans');
  }

  function getLoan(loanId) {
    return apiClient.get('/banking-service/loans/' + loanId);
  }

  function getRepaymentSchedule(loanId) {
    return apiClient.get(
      '/banking-service/loans/' + loanId + '/repayments'
    );
  }

  function initiateAutoPay(loanId, accountId) {
  return apiClient.put(
    '/banking-service/loans/' + loanId + '/autopay/initiate',
    { accountId: accountId }
  );
}

function verifyAutoPayOtp(loanId, authorizationId, otp) {
  return apiClient.post(
    '/banking-service/loans/' + loanId +
      '/autopay/authorizations/' + authorizationId + '/verify',
    { otp: otp }
  );
}

function resendAutoPayOtp(authorizationId) {
  return apiClient.post(
    '/banking-service/loans/authorizations/' +
      authorizationId + '/resend'
  );
}

  return {
    getLoans: getLoans,
    getLoan: getLoan,
    getRepaymentSchedule: getRepaymentSchedule,
    initiateAutoPay: initiateAutoPay,
verifyAutoPayOtp: verifyAutoPayOtp,
resendAutoPayOtp: resendAutoPayOtp
  };
});