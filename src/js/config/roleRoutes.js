define([], function () {
  'use strict';

  return {
    roles: {
      ADMIN: { landingPage: 'adminDashboard' },
      CUSTOMER: { landingPage: 'adminDashboard' }
    },
    pages: [
      { path: 'adminDashboard', label: 'Overview', iconClass: 'oj-ux-ico-dashboard', roles: ['ADMIN'] },
      { path: 'auditLog', label: 'Audit Log', iconClass: 'oj-ux-ico-list', roles: ['ADMIN'] },
      { path: 'loanManagement', label: 'Loan Management', iconClass: 'oj-ux-ico-chart', roles: ['ADMIN'] },
      // UI role checks are for user experience only; the backend must enforce ADMIN on every /admin/* endpoint.
      { path: 'cardManagement', label: 'Card Management', iconClass: 'oj-ux-ico-object-card', roles: ['ADMIN'] },
      { path: 'rewardManagement', label: 'Reward Management', iconClass: 'oj-ux-ico-star', roles: ['ADMIN'] },
      // UI role checks are for user experience only; the backend must enforce ADMIN on every admin endpoint.
      { path: 'investmentManagement', label: 'Investment Management', iconClass: 'oj-ux-ico-chart-spark', roles: ['ADMIN'] },
      { path: 'dashboard', label: 'Customer Dashboard', iconClass: 'oj-ux-ico-contact-group', roles: ['CUSTOMER'] }
    ]
  };
});
