define(['./apiClient'], function (apiClient) {
  'use strict';

  function buildQuery(filters) {
    filters = filters || {};

    const query = new URLSearchParams();
    query.set('page', filters.page || 0);
    query.set('size', filters.size || 10);

    if (filters.type) {
      query.set('type', filters.type);
    }

    if (filters.category) {
      query.set('category', filters.category);
    }

    if (filters.status) {
      query.set('status', filters.status);
    }

    if (filters.fromDate) {
      query.set('fromDate', filters.fromDate);
    }

    if (filters.toDate) {
      query.set('toDate', filters.toDate);
    }

    return query.toString();
  }

  function getTransactions(accountId, filters) {
    return apiClient.get(
      '/banking-service/accounts/' +
      accountId +
      '/transactions?' +
      buildQuery(filters)
    );
  }

  function downloadStatement(accountId, filters) {
    return apiClient.download(
      '/banking-service/accounts/' +
      accountId +
      '/transactions/statement.pdf?' +
      buildQuery({
        type: filters.type,
        category: filters.category,
        status: filters.status,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        page: 0,
        size: 500
      }),
      'FinThink_Statement_' +
      new Date().toISOString().slice(0, 10) +
      '.pdf'
    );
  }

  return {
    getTransactions: getTransactions,
    downloadStatement: downloadStatement
  };
});