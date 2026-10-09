define(['knockout', 'ojs/ojconverter-number', 'ojs/ojconverter-datetime'], function (ko, NumberConverter, DateTimeConverter) {
  'use strict';
  var points = new Intl.NumberFormat('en-IN');
  var dateConverter = new DateTimeConverter.IntlDateTimeConverter({ pattern: 'dd MMM yyyy' });

  function RewardCard(params) {
    this.reward = params.reward;
    this.busy = params.busy;
    this.onEdit = params.onEdit;
    this.onStatus = params.onStatus;
    this.currencyConverter = new NumberConverter.IntlNumberConverter({ style: 'currency', currency: params.currency,
      minimumFractionDigits: 2, maximumFractionDigits: 2 });
    this.pointsText = points.format(this.reward.pointsRequired) + ' pts';
    this.valueText = this.currencyConverter.format(this.reward.rewardValue);
    this.startText = dateConverter.format(this.reward.startDate);
    this.endText = dateConverter.format(this.reward.endDate);
    var today = new Date();
    var localToday = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
    this.expired = this.reward.endDate < localToday;
    this.active = this.reward.status === 'ACTIVE';
    this.typeClass = 'reward-chip reward-chip-' + this.reward.rewardType.toLowerCase();
    this.edit = function (event) { params.onEdit(this.reward, event.currentTarget); }.bind(this);
    this.toggle = function (event) { params.onStatus(this.reward, event.currentTarget); }.bind(this);
  }
  return RewardCard;
});
