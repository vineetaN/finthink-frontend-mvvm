define([], function () {
  'use strict';

  return {
    content: [
      {
        auditId: 12793,
        actorCustomerId: 24,
        actorUsername: null,
        action: 'PAYMENT_SUCCESS',
        moduleName: 'PAYMENT',
        details: 'Payment successful. Reference: TRF20260926155044814C76ED',
        actionTime: '2026-09-26T15:50:44.525108',
        ipAddress: '0:0:0:0:0:0:0:1'
      },
      {
        auditId: 12792,
        actorCustomerId: 24,
        actorUsername: 'maria.s',
        action: 'PAYMENT_OTP_SENT',
        moduleName: 'PAYMENT',
        details: 'Payment verification code sent to the registered mobile number.',
        actionTime: '2026-09-26T15:49:18.120000',
        ipAddress: '127.0.0.1'
      },
      {
        auditId: 12791,
        actorCustomerId: 31,
        actorUsername: 'jlee',
        action: 'BILL_PAYMENT',
        moduleName: 'BILL_PAYMENT',
        details: 'Electric utility bill paid. Confirmation: BILL-20260926-8831',
        actionTime: '2026-09-26T14:11:03.000000',
        ipAddress: '192.168.1.18'
      },
      {
        auditId: 12790,
        actorCustomerId: 24,
        actorUsername: 'maria.s',
        action: 'TRANSFER',
        moduleName: 'FUND_TRANSFER',
        details: 'Transfer submitted to account ending 4012.',
        actionTime: '2026-09-26T12:08:37.800000',
        ipAddress: '127.0.0.1'
      },
      {
        auditId: 12789,
        actorCustomerId: 42,
        actorUsername: 'npatel',
        action: 'LOGIN',
        moduleName: 'AUTHENTICATION',
        details: 'Customer signed in successfully.',
        actionTime: '2026-09-26T09:32:11.000000',
        ipAddress: '10.0.0.24'
      },
      {
        auditId: 12788,
        actorCustomerId: 31,
        actorUsername: 'jlee',
        action: 'PAYMENT_SUCCESS',
        moduleName: 'PAYMENT',
        details: 'Payment successful. Reference: TRF2026092517290090812A11',
        actionTime: '2026-09-25T17:29:00.090000',
        ipAddress: '192.168.1.18'
      },
      {
        auditId: 12787,
        actorCustomerId: 42,
        actorUsername: 'npatel',
        action: 'TRANSFER',
        moduleName: 'FUND_TRANSFER',
        details: 'Transfer completed. Beneficiary: City Utilities.',
        actionTime: '2026-09-25T16:05:42.450000',
        ipAddress: null
      }
    ],
    number: 0,
    size: 20,
    totalElements: 7,
    totalPages: 1,
    first: true,
    last: true,
    empty: false,
    numberOfElements: 7
  };
});