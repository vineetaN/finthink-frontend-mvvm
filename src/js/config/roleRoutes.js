define([], function () {
  'use strict';

  return {
    roles: {
      ADMIN: { landingPage: 'adminDashboard' },
      CUSTOMER: { landingPage: 'dashboard' }
    },
    pages: [
      { path: 'adminDashboard', label: 'Overview', iconClass: 'oj-ux-ico-dashboard', roles: ['ADMIN'] },
      { path: 'auditLog', label: 'Audit Log', iconClass: 'oj-ux-ico-list', roles: ['ADMIN'] },
      { path: 'loanManagementAdmin', label: 'Loan Management', iconClass: 'oj-ux-ico-chart', roles: ['ADMIN'] },
      // UI role checks are for user experience only; the backend must enforce ADMIN on every /admin/* endpoint.
      { path: 'cardManagementAdmin', label: 'Card Management', iconClass: 'oj-ux-ico-object-card', roles: ['ADMIN'] },
      { path: 'rewardManagementAdmin', label: 'Reward Management', iconClass: 'oj-ux-ico-star', roles: ['ADMIN'] },
      // UI role checks are for user experience only; the backend must enforce ADMIN on every admin endpoint.
      { path: 'investmentManagementAdmin', label: 'Investment Management', iconClass: 'oj-ux-ico-chart-spark', roles: ['ADMIN'] },
      { path: 'dashboard', label: 'Dashboard', iconClass: 'oj-ux-ico-bargraph', roles: ['CUSTOMER'] },

      { path: 'cards', label: 'Cards', iconClass: 'oj-ux-ico-cc-card', roles: ['CUSTOMER'] },
      { path: 'loans', label: 'Loans', iconClass: 'oj-ux-ico-loan-request', roles: ['CUSTOMER'] },
      { path: 'transactions', label: 'Transactions', iconClass: 'oj-ux-ico-contact-send', roles: ['CUSTOMER'] },
      { path: 'notifications', label: 'Notifications', iconClass: 'oj-ux-ico-bell-ring-s', roles: ['CUSTOMER'] },
      { path: 'billers', label: 'Bill Payments', iconClass: 'oj-ux-ico-transactions', roles: ['CUSTOMER'] },
      { path: 'changePassword', label: 'Change Password', iconClass: 'oj-ux-ico-lock', roles: ['CUSTOMER', 'ADMIN'] },
      { path: 'customerSummary', label: 'Customer Summary', iconClass: 'oj-ux-ico-human-8', roles: ['CUSTOMER'] },
      { path: 'rewards', label: 'Rewards Catalogue', iconClass: 'oj-ux-ico-book', roles: ['CUSTOMER'] },
      { path: 'rewardsWallet', label: 'Rewards Wallet', iconClass: 'oj-ux-ico-wallet', roles: ['CUSTOMER'] },
      { path: 'beneficiaries', label: 'Beneficiaries', iconClass: 'oj-ux-ico-contact-group', roles: ['CUSTOMER'] },
      { path: 'fundTransfer', label: 'Fund Transfer', iconClass: 'oj-ux-ico-transfer-money', roles: ['CUSTOMER'] },
      { path: 'investments', label: 'View Investments', iconClass: 'oj-ux-ico-money-document', roles: ['CUSTOMER'] },
      { path: 'investmentDeposits', label: 'FD & RD', iconClass: 'oj-ux-ico-money-stack', roles: ['CUSTOMER'] },
      { path: 'mutualFunds', label: 'Mutual Funds', iconClass: 'oj-ux-ico-money-analytics', roles: ['CUSTOMER'] },
      { path: 'adminRewards', label: 'Admin Rewards', iconClass: 'oj-ux-ico-settings', roles: ['ADMIN'] },
      { path: 'adminInvestments', label: 'Investment Rates', iconClass: 'oj-ux-ico-settings', roles: ['ADMIN'] }
    ]
  };
});
