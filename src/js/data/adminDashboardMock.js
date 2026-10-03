define([], function () {
  'use strict';

  return {
    totalLoans: '1,284',
    activeCards: '8,462',
    rewardPointsIssued: '2.4M',
    activeInvestments: '3,118',
    recentAuditEvents: [
      { id: 'evt-1048', action: 'Loan application approved', actor: 'Mitnick_1', time: 'Today, 10:42 AM', type: 'Loan' },
      { id: 'evt-1047', action: 'Card limit updated', actor: 'Mitnick_1', time: 'Today, 10:18 AM', type: 'Card' },
      { id: 'evt-1046', action: 'Customer profile reviewed', actor: 'Riya_S', time: 'Today, 9:56 AM', type: 'Customer' },
      { id: 'evt-1045', action: 'Reward points adjusted', actor: 'Mitnick_1', time: 'Yesterday, 4:31 PM', type: 'Rewards' },
      { id: 'evt-1044', action: 'Investment account opened', actor: 'Dev_P', time: 'Yesterday, 3:07 PM', type: 'Investment' }
    ],
    loansByStatus: {
      groups: ['Approved', 'Pending', 'Rejected', 'In review'],
      items: [
        { id: 'loan-approved', series: 'Loans', group: ['Approved'], value: 486 },
        { id: 'loan-pending', series: 'Loans', group: ['Pending'], value: 218 },
        { id: 'loan-rejected', series: 'Loans', group: ['Rejected'], value: 94 },
        { id: 'loan-review', series: 'Loans', group: ['In review'], value: 132 }
      ]
    }
  };
});