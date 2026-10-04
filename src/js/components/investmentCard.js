define([], function () {
  'use strict';

  function formatRate(rate) { return Number(rate).toFixed(2) + '%'; }

  function InvestmentCard(params) {
    this.investment = params.investment;
    this.interestText = formatRate(params.investment.interestRate);
    this.penaltyText = 'Penalty: ' + formatRate(params.investment.prematurePenaltyRate);
    this.edit = function (event) { params.onUpdate(this.investment, event.currentTarget); }.bind(this);
  }

  return InvestmentCard;
});