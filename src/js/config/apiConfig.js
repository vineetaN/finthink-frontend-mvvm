define([], function () {
  'use strict';

  return {
    apiGatewayBaseUrl: '',
    //API Gateway base URL for local development, uncomment the below line and comment the above line to use local API Gateway
    //sapiGatewayBaseUrl: 'http://localhost:8080',
    rewardEndpoint: '/audit-admin-service/admin/rewards',
    useMockRewardData: false,
    rewardTypes: ['CASHBACK', 'VOUCHER', 'OFFER'],
    rewardCurrency: 'INR',
    rewardStatusField: 'status',
    cardApiBaseUrl: '/audit-admin-service/admin',
    cardIssueEndpoint: '/banking-service/admin/cards/customers/{customerId}',
    cardActionPaths: { freeze: '/cards/{cardId}/freeze', unfreeze: '/cards/{cardId}/unfreeze', block: '/cards/{cardId}/block' },
    cardStatuses: { ACTIVE: 'ACTIVE', FROZEN: 'FROZEN', BLOCKED: 'BLOCKED' },
    cardCurrency: 'INR',
    useMockCardData: false,
    investmentBaseUrl: '/investment-service/api/investments/admin',
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
    },
    loanApiBaseUrl: '/audit-admin-service/admin',
    loanEndpoint: '/loans',
    useMockLoanData: false,
    loanCurrency: 'INR',
    LOAN_TYPES: [
      { value: 'HOME', label: 'Home Loan', icon: 'home' },
      { value: 'PERSONAL', label: 'Personal Loan', icon: 'person' },
      { value: 'CAR', label: 'Car Loan', icon: 'car' }
    ],
    NORMALIZE_LOAN_TYPE: true,
    MAX_LOAN_TYPE_LENGTH: 50,
    MAX_INTEREST_RATE: 100,
    MAX_TENURE_MONTHS: 480,
    DUE_SOON_DAYS: 7,
    HIGH_VALUE_THRESHOLD: 2500000,
    AUTO_REFRESH_SECONDS: 60
  };
});
