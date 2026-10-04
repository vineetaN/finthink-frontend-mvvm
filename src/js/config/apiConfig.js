define([], function () {
  'use strict';

  return {
    apiGatewayBaseUrl: 'http://localhost:8080',
    rewardEndpoint: '/audit-admin-service/admin/rewards',
    useMockRewardData: false,
    rewardTypes: ['CASHBACK', 'VOUCHER', 'OFFER'],
    rewardCurrency: 'INR',
    rewardStatusField: 'status',
    investmentBaseUrl: 'http://localhost:8080/investment-service/api/investments/admin',
    useMockInvestmentData: false,
    MAX_INTEREST_RATE: 100,
    auditLogEndpoint: '/audit-admin-service/admin/audit-logs',
    useMockAuditLogData: false,
    CLIENT_SIDE_FILTERING: true,
    auditLogPageSizes: [10, 20, 50],
    auditLogActions: ['LOGIN', 'TRANSFER', 'BILL_PAYMENT', 'PAYMENT_OTP_SENT', 'PAYMENT_SUCCESS'],
    auditLogModules: ['AUTHENTICATION', 'FUND_TRANSFER', 'BILL_PAYMENT', 'PAYMENT'],
    auditLogParameterNames: {
      page: 'page',
      size: 'size',
      sort: 'sort',
      action: 'action',
      module: 'moduleName',
      customerId: 'actorCustomerId',
      ipAddress: 'ipAddress',
      fromDate: 'fromDate',
      toDate: 'toDate',
      search: 'search'
    }
  };
});
