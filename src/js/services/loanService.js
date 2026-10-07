define([
  '../config/apiConfig',
  'text!../data/loanMock.json',
  './apiClient'
], function (config, fixtureText, apiClient) {
  'use strict';

  var fixture = JSON.parse(fixtureText || '[]');
  var mockLoans = fixture.map(function (item) {
    return Object.assign({}, item);
  });

  function numberOrZero(value) {
    var numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  function mapLoanResponse(raw) {
    raw = raw || {};
    return {
      loanId: raw.loanId !== undefined && raw.loanId !== null ? Number(raw.loanId) : null,
      customerId: raw.customerId !== undefined && raw.customerId !== null ? Number(raw.customerId) : null,
      loanAccountNo: raw.loanAccountNo || '',
      loanType: raw.loanType !== undefined && raw.loanType !== null ? String(raw.loanType) : '',
      principalAmount: numberOrZero(raw.principalAmount),
      outstandingAmount: numberOrZero(raw.outstandingAmount),
      interestRate: numberOrZero(raw.interestRate),
      emiAmount: numberOrZero(raw.emiAmount),
      totalScheduledInterestAmount: numberOrZero(raw.totalScheduledInterestAmount),
      totalScheduledRepaymentAmount: numberOrZero(raw.totalScheduledRepaymentAmount),
      loanStartDate: raw.loanStartDate || '',
      tenureMonths: raw.tenureMonths !== undefined && raw.tenureMonths !== null ? Number(raw.tenureMonths) : 0,
      estimatedEndDate: raw.estimatedEndDate || '',
      nextEmiDate: raw.nextEmiDate || '',
      loanStatus: raw.loanStatus || '',
      autopayAccountId: raw.autopayAccountId !== undefined && raw.autopayAccountId !== null ? raw.autopayAccountId : null,
      autopayEnabled: Boolean(raw.autopayEnabled)
    };
  }

  function extractLoanList(rows) {
    if (Array.isArray(rows)) {
      return rows;
    }
    if (!rows || typeof rows !== 'object') {
      return [];
    }

    var candidates = [rows.data, rows.content, rows.items, rows.loans, rows.result, rows.records];
    for (var index = 0; index < candidates.length; index += 1) {
      if (Array.isArray(candidates[index])) {
        return candidates[index];
      }
    }

    if (rows.loanList && Array.isArray(rows.loanList)) {
      return rows.loanList;
    }

    return [];
  }

  function normalizeLoanType(value, shouldNormalize) {
    var source = value === undefined || value === null ? '' : String(value).trim();
    if (!source) {
      return '';
    }

    if (shouldNormalize !== false) {
      return source.toUpperCase().replace(/\s+/g, '_');
    }

    return source;
  }

  function buildPayload(form) {
    return {
      customerId: Number(form.customerId),
      loanType: normalizeLoanType(form.loanType, config.NORMALIZE_LOAN_TYPE !== false),
      principalAmount: Number(form.principalAmount),
      interestRate: Number(form.interestRate),
      loanStartDate: String(form.loanStartDate || '').slice(0, 10),
      tenureMonths: Number(form.tenureMonths),
      nextEmiDate: String(form.nextEmiDate || '').slice(0, 10)
    };
  }

  function list() {
    if (config.useMockLoanData) {
      return Promise.resolve(mockLoans.map(mapLoanResponse));
    }

    return apiClient.get(config.loanApiBaseUrl + config.loanEndpoint).then(function (rows) {
      var loanRows = extractLoanList(rows);
      if (!Array.isArray(loanRows)) {
        throw new Error('Invalid loan list response.');
      }
      return loanRows.map(mapLoanResponse);
    });
  }

  function create(form) {
    var payload = buildPayload(form);

    if (config.useMockLoanData) {
      var nextId = mockLoans.reduce(function (maxId, item) {
        return Math.max(maxId, Number(item.loanId) || 0);
      }, 6000) + 1;
      var typeName = String(payload.loanType || 'HOME');
      var createdLoan = {
        loanId: nextId,
        customerId: payload.customerId,
        loanAccountNo: 'LN-' + typeName + '-' + new Date(payload.loanStartDate).getFullYear() + '-' + String(nextId).slice(-3),
        loanType: typeName,
        principalAmount: payload.principalAmount,
        outstandingAmount: payload.principalAmount,
        interestRate: payload.interestRate,
        emiAmount: Math.round(payload.principalAmount / payload.tenureMonths),
        totalScheduledInterestAmount: payload.principalAmount * (payload.interestRate / 100),
        totalScheduledRepaymentAmount: payload.principalAmount + (payload.principalAmount * (payload.interestRate / 100)),
        loanStartDate: payload.loanStartDate,
        tenureMonths: payload.tenureMonths,
        estimatedEndDate: payload.loanStartDate,
        nextEmiDate: payload.nextEmiDate,
        loanStatus: 'ACTIVE',
        autopayAccountId: null,
        autopayEnabled: false
      };
      mockLoans.push(createdLoan);
      return Promise.resolve(mapLoanResponse(createdLoan));
    }

    return apiClient.post(config.loanApiBaseUrl + config.loanEndpoint, payload).then(function (row) {
      if (row && typeof row === 'object' && !Array.isArray(row)) {
        return mapLoanResponse(row.data || row.loan || row.result || row.record || row);
      }
      return mapLoanResponse(row);
    });
  }

  return {
    list: list,
    create: create,
    mapLoanResponse: mapLoanResponse,
    buildPayload: buildPayload,
    normalizeLoanType: normalizeLoanType
  };
});
