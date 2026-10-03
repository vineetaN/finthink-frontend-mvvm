define([
  'knockout',
  'ojs/ojarraydataprovider',
  'ojs/ojchart',
  '../services/dashboardService'
], function (ko, ArrayDataProvider, ojChart, dashboardService) {
  'use strict';

  function AdminDashboardViewModel() {
    var self = this;
    this.summaryCards = [
      { id: 'totalLoans', title: 'Total Loans', value: ko.observable(''), loading: ko.observable(true), error: ko.observable('') },
      { id: 'activeCards', title: 'Active Cards', value: ko.observable(''), loading: ko.observable(true), error: ko.observable('') },
      { id: 'rewardPointsIssued', title: 'Reward Points Issued', value: ko.observable(''), loading: ko.observable(true), error: ko.observable('') },
      { id: 'activeInvestments', title: 'Active Investments', value: ko.observable(''), loading: ko.observable(true), error: ko.observable('') }
    ];
    this.auditEvents = ko.observableArray([]);
    this.auditLoading = ko.observable(true);
    this.auditError = ko.observable('');
    this.chartLoading = ko.observable(true);
    this.chartError = ko.observable('');
    this.chartGroups = ko.observableArray([]);
    this.chartDataProvider = ko.observable(
      new ArrayDataProvider([], { keyAttributes: 'id' })
    );

    this.summaryCards.forEach(function (card) {
      dashboardService.getSummary(card.id)
        .then(function (value) { card.value(value); })
        .catch(function () { card.error('Unable to load this metric.'); })
        .finally(function () { card.loading(false); });
    });

    dashboardService.getRecentAuditEvents()
      .then(function (events) { self.auditEvents(events.slice(0, 5)); })
      .catch(function () { self.auditError('Unable to load recent audit events.'); })
      .finally(function () { self.auditLoading(false); });

    dashboardService.getLoansByStatus()
      .then(function (result) {
        self.chartGroups(result.groups);
        self.chartDataProvider(new ArrayDataProvider(result.items, { keyAttributes: 'id' }));
      })
      .catch(function () { self.chartError('Unable to load loan status data.'); })
      .finally(function () { self.chartLoading(false); });

    this.connected = function () {
      document.title = 'Admin Overview | FinThink Bank';
    };
  }

  return AdminDashboardViewModel;
});