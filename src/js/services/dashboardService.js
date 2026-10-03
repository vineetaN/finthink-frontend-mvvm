define([
  '../config/apiConfig',
  '../data/adminDashboardMock',
  './apiClient'
], function (apiConfig, mockData, apiClient) {
  'use strict';

  function load(key) {
    if (apiConfig.useMockDashboardData) {
      return Promise.resolve(mockData[key]);
    }
    return apiClient.get(apiConfig.dashboardEndpoints[key]);
  }

  return {
    getSummary: function (key) { return load(key); },
    getRecentAuditEvents: function () { return load('recentAuditEvents'); },
    getLoansByStatus: function () { return load('loansByStatus'); }
  };
});