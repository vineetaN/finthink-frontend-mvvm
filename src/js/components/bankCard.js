define(['ojs/ojconverter-number'], function (NumberConverter) {
  'use strict';
  function BankCard(params) {
    var self = this;
    this.card = params.card; this.busy = params.busy; this.onAction = params.onAction;
    this.lastFour = String(this.card.cardNumberMasked).slice(-4);
    var dateParts = String(this.card.expiryDate).split('-');
    this.expiryText = dateParts.length >= 2 ? dateParts[1] + '/' + dateParts[0].slice(-2) : this.card.expiryDate;
    var today = new Date();
    var localToday = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
    this.expired = !!this.card.expiryDate && this.card.expiryDate.slice(0, 10) < localToday;
    this.currencyConverter = new NumberConverter.IntlNumberConverter({ style: 'currency', currency: params.currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    this.limitText = this.currencyConverter.format(this.card.dailyLimit);
    this.knownStatus = ['ACTIVE', 'FROZEN', 'BLOCKED'].indexOf(this.card.cardStatus) !== -1;
    this.cardClass = 'bank-card-type-' + (this.card.cardType === 'CREDIT' ? 'credit' : 'debit') + (this.card.cardStatus === 'FROZEN' ? ' bank-card-frozen' : '') + (this.card.cardStatus === 'BLOCKED' ? ' bank-card-blocked' : '') + (this.knownStatus ? '' : ' bank-card-unknown');
    this.statusClass = 'bank-card-status-' + (this.knownStatus ? this.card.cardStatus.toLowerCase() : 'unknown');
    this.freeze = function (event) { params.onAction(self.card, self.card.cardStatus === 'ACTIVE' ? 'freeze' : 'unfreeze', event.currentTarget); };
    this.block = function (event) { params.onAction(self.card, 'block', event.currentTarget); };
  }
  return BankCard;
});
