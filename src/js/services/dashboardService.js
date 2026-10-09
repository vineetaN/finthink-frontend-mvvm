define([
  './auditLogService',
  './cardService',
  './investmentService',
  './loanService',
  './rewardService'
], function (auditLogService, cardService, investmentService, loanService, rewardService) {
  'use strict';

  function requireRows(rows, resourceName) {
    if (!Array.isArray(rows)) {
      throw new Error('Invalid ' + resourceName + ' response.');
    }
    return rows;
  }

  function loanStatusLabel(status) {
    return String(status || 'Unknown').trim().toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, function (character) { return character.toUpperCase(); });
  }

  function loansByStatus(rows) {
    var counts = {};
    rows.forEach(function (loan) {
      var status = loanStatusLabel(loan.loanStatus);
      counts[status] = (counts[status] || 0) + 1;
    });
    var groups = Object.keys(counts);
    return {
      groups: groups,
      items: groups.map(function (status) {
        return { id: 'loan-' + status, series: 'Loans', group: [status], value: counts[status] };
      })
    };
  }

  return {
    getSummary: function (key) {
      var rowsRequest;
      switch (key) {
        case 'totalLoans':
          rowsRequest = loanService.list();
          break;
        case 'activeCards':
          rowsRequest = cardService.list().then(function (rows) {
            return requireRows(rows, 'card list').filter(function (card) {
              return String(card.cardStatus || '').toUpperCase() === 'ACTIVE';
            });
          });
          break;
        case 'rewardOffers':
          rowsRequest = rewardService.listAdmin();
          break;
        case 'investmentProducts':
          rowsRequest = investmentService.products();
          break;
        default:
          return Promise.reject(new Error('Unknown dashboard metric.'));
      }
      return rowsRequest.then(function (rows) {
        return requireRows(rows, key).length.toLocaleString();
      });
    },
    getRecentAuditEvents: function () {
      return auditLogService.getPage({}, 0, 5, 'actionTime,desc').then(function (page) {
        if (!page || !Array.isArray(page.content)) {
          throw new Error('Invalid recent audit events response.');
        }
        return page.content.map(function (event) {
          var timestamp = event.actionTime ? new Date(event.actionTime) : null;
          return {
            id: event.auditId,
            action: event.action || 'Activity recorded',
            actor: event.actorUsername || (event.actorCustomerId ? 'Customer ' + event.actorCustomerId : 'System'),
            time: timestamp && !isNaN(timestamp.getTime())
              ? timestamp.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
              : '',
            type: event.moduleName || 'System'
          };
        });
      });
    },
    getLoansByStatus: function () {
      return loanService.list().then(function (rows) {
        return loansByStatus(requireRows(rows, 'loan list'));
      });
    }
  };
});
