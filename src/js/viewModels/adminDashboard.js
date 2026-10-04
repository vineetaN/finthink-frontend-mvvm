define([
  'knockout',
  'ojs/ojarraydataprovider',
  'ojs/ojchart',
  '../services/dashboardService',
  '../utils/sessionService',
  '../utils/navigationService'
], function (ko, ArrayDataProvider, ojChart, dashboardService, sessionService, navigationService) {
  'use strict';

  function AdminDashboardViewModel() {
    var self = this;
    this.summaryCards = [
      { id: 'totalLoans', title: 'Total Loans', value: ko.observable(''), loading: ko.observable(true), error: ko.observable('') },
      { id: 'activeCards', title: 'Active Cards', value: ko.observable(''), loading: ko.observable(true), error: ko.observable('') },
      { id: 'rewardPointsIssued', title: 'Reward Points Issued', value: ko.observable(''), loading: ko.observable(true), error: ko.observable('') },
      { id: 'activeInvestments', title: 'Active Investments', value: ko.observable(''), loading: ko.observable(true), error: ko.observable('') }
    ];
    this.adminName = sessionService.username;
    this.auditEvents = ko.observableArray([]);
    this.auditLoading = ko.observable(true);
    this.auditError = ko.observable('');
    this.auditCount = ko.observable('');
    this.chartLoading = ko.observable(true);
    this.chartError = ko.observable('');
    this.chartGroups = ko.observableArray([]);
    this.chartDataProvider = ko.observable(
      new ArrayDataProvider([], { keyAttributes: 'id' })
    );

    this.moduleCards = [
      { title: 'Audit Logs', icon: 'oj-ux-ico-list', accent: 'module-tile-audit', value: this.auditCount, note: 'recent events', loading: this.auditLoading, error: this.auditError, route: 'auditLog' },
      { title: 'Card Management', icon: 'oj-ux-ico-card', accent: 'module-tile-cards', value: this.summaryCards[1].value, note: 'active cards', loading: this.summaryCards[1].loading, error: this.summaryCards[1].error, route: 'cardManagement' },
      { title: 'Loan Management', icon: 'oj-ux-ico-credit-card', accent: 'module-tile-loans', value: this.summaryCards[0].value, note: 'total loans', loading: this.summaryCards[0].loading, error: this.summaryCards[0].error, route: 'loanManagement' },
      { title: 'Investment Management', icon: 'oj-ux-ico-funds', accent: 'module-tile-investments', value: this.summaryCards[3].value, note: 'active investments', loading: this.summaryCards[3].loading, error: this.summaryCards[3].error, route: 'investmentManagement' },
      { title: 'Reward Management', icon: 'oj-ux-ico-star', accent: 'module-tile-rewards', value: this.summaryCards[2].value, note: 'points issued', loading: this.summaryCards[2].loading, error: this.summaryCards[2].error, route: 'rewardManagement' }
    ].map(function (card) {
      card.navigate = function () { navigationService.goTo(card.route); };
      return card;
    });

    this.summaryCards.forEach(function (card) {
      dashboardService.getSummary(card.id)
        .then(function (value) { card.value(value); })
        .catch(function () { card.error('Unable to load this metric.'); })
        .finally(function () { card.loading(false); });
    });

    dashboardService.getRecentAuditEvents()
      .then(function (events) {
        self.auditEvents(events.slice(0, 5));
        self.auditCount(String(events.length));
      })
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