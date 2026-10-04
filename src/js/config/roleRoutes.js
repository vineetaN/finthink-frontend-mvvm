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
      { path: 'loanManagement', label: 'Loan Management', iconClass: 'oj-ux-ico-credit-card', roles: ['ADMIN'] },
      { path: 'cardManagement', label: 'Card Management', iconClass: 'oj-ux-ico-card', roles: ['ADMIN'] },
      { path: 'rewardManagement', label: 'Reward Management', iconClass: 'oj-ux-ico-star', roles: ['ADMIN'] },
      { path: 'investmentManagement', label: 'Investment Management', iconClass: 'oj-ux-ico-funds', roles: ['ADMIN'] },
      { path: 'dashboard', label: 'Customer Dashboard', iconClass: 'oj-ux-ico-contact-group', roles: ['CUSTOMER'] }
    ]
  };
});