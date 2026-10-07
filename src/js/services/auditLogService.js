define([
  '../config/apiConfig',
  '../data/auditLogMock',
  './apiClient'
], function (apiConfig, mockPage, apiClient) {
  'use strict';

  function buildQueryParams(filters, page, size, sort) {
    var params = new URLSearchParams();
    var names = apiConfig.auditLogParameterNames;
    params.set(names.page, String(page));
    params.set(names.size, String(size));
    params.set(names.sort, sort || 'actionTime,desc');

    if (!apiConfig.CLIENT_SIDE_FILTERING) {
      filters = filters || {};
      [
        ['action', filters.action],
        ['module', filters.moduleName],
        ['customerId', filters.actorCustomerId],
        ['ipAddress', filters.ipAddress],
        ['fromDate', filters.fromDate],
        ['toDate', filters.toDate],
        ['search', filters.search]
      ].forEach(function (entry) {
        if (entry[1] !== undefined && entry[1] !== null && String(entry[1]).trim() !== '') {
          var value = String(entry[1]).trim();
          if (entry[0] === 'fromDate' && /^\d{4}-\d{2}-\d{2}$/.test(value)) value += 'T00:00:00.000';
          if (entry[0] === 'toDate' && /^\d{4}-\d{2}-\d{2}$/.test(value)) value += 'T23:59:59.999';
          params.set(names[entry[0]], value);
        }
      });
    }

    return params.toString();
  }

  function mapResponse(response) {
    response = response || {};
    var content = Array.isArray(response.content) ? response.content : [];
    return {
      content: content.map(function (row) {
        return {
          auditId: row.auditId,
          actorCustomerId: row.actorCustomerId,
          actorUsername: row.actorUsername,
          action: row.action || '',
          moduleName: row.moduleName || '',
          details: row.details || '',
          actionTime: row.actionTime || '',
          ipAddress: row.ipAddress
        };
      }),
      number: Number(response.number) || 0,
      size: Number(response.size) || 20,
      totalElements: Number(response.totalElements) || 0,
      totalPages: Number(response.totalPages) || 0,
      first: response.first === true,
      last: response.last === true,
      empty: content.length === 0,
      numberOfElements: content.length
    };
  }

  function matchesFilters(row, filters) {
    var details = String(row.details || '').toLowerCase();
    if (filters.action && row.action !== filters.action) return false;
    if (filters.moduleName && row.moduleName !== filters.moduleName) return false;
    if (filters.actorCustomerId && String(row.actorCustomerId) !== String(filters.actorCustomerId)) return false;
    if (filters.ipAddress && String(row.ipAddress || '').toLowerCase().indexOf(filters.ipAddress.toLowerCase()) === -1) return false;
    if (filters.search && details.indexOf(filters.search.toLowerCase()) === -1) return false;

    var rowTime = row.actionTime ? new Date(row.actionTime).getTime() : NaN;
    if (filters.fromDate && rowTime < new Date(filters.fromDate + 'T00:00:00').getTime()) return false;
    if (filters.toDate && rowTime > new Date(filters.toDate + 'T23:59:59.999').getTime()) return false;
    return true;
  }

  function getMockPage(filters, page, size, sort) {
    var rows = mockPage.content.slice();
    if (!apiConfig.CLIENT_SIDE_FILTERING) {
      rows = rows.filter(function (row) { return matchesFilters(row, filters || {}); });
    }
    var sortParts = String(sort || 'actionTime,desc').split(',');
    var sortField = sortParts[0];
    var sortDirection = sortParts[1] === 'asc' ? 1 : -1;
    rows.sort(function (left, right) {
      var leftValue = left[sortField];
      var rightValue = right[sortField];
      if (leftValue === rightValue) return 0;
      if (leftValue === null || leftValue === undefined) return -1 * sortDirection;
      if (rightValue === null || rightValue === undefined) return 1 * sortDirection;
      return (leftValue < rightValue ? -1 : 1) * sortDirection;
    });
    var totalElements = rows.length;
    var totalPages = Math.ceil(totalElements / size);
    var content = rows.slice(page * size, (page + 1) * size);
    return Promise.resolve(mapResponse({
      content: content,
      number: page,
      size: size,
      totalElements: totalElements,
      totalPages: totalPages,
      first: page === 0,
      last: page >= totalPages - 1
    }));
  }

  return {
    buildQueryParams: buildQueryParams,
    mapResponse: mapResponse,
    getPage: function (filters, page, size, sort) {
      if (apiConfig.useMockAuditLogData) {
        return getMockPage(filters, page, size, sort);
      }
      var query = buildQueryParams(filters, page, size, sort);
      return apiClient.get(apiConfig.auditLogEndpoint + '?' + query).then(mapResponse);
    }
  };
});
