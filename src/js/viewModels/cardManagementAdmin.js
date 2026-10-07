define(['knockout', 'text!../components/bankCard.html', 'text!../components/cardCreateForm.html', '../components/bankCard', '../components/cardCreateForm', '../services/cardService', '../config/apiConfig', '../utils/toastHelper', 'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojprogress-circle', 'ojs/ojinputtext', 'ojs/ojinputnumber', 'ojs/ojselectsingle', 'ojs/ojdatetimepicker', 'ojs/ojlabel'],
  function (ko, cardTemplate, formTemplate, BankCard, CardCreateForm, service, config, toastHelper) {
    'use strict';
    if (!ko.components.isRegistered('bank-card')) ko.components.register('bank-card', { viewModel: BankCard, template: cardTemplate });
    if (!ko.components.isRegistered('card-create-form')) ko.components.register('card-create-form', {
      viewModel: function (params) { return params.model; }, template: formTemplate
    });
    function CardManagementViewModel() {
      var self = this;
      this.cards = ko.observableArray([]); this.loading = ko.observable(true); this.error = ko.observable('');
      this.liveMessage = ko.observable(''); this.toast = ko.observable(''); this.currency = config.cardCurrency;
      this.busyIds = ko.observableArray([]); this.atStart = ko.observable(true); this.atEnd = ko.observable(true);
      this.confirmCard = ko.observable(null); this.confirmAction = ko.observable('');
      this.blockAcknowledged = ko.observable(false); this.submitting = ko.observable(false); this.confirmTrigger = null;
      this.toastHelper = toastHelper.create(this.toast, this.liveMessage);
      this.form = new CardCreateForm({
        onSaved: function () { self.notify('Card released'); self.refresh(); }
      });
      this.canConfirm = ko.pureComputed(function () { return !self.submitting() && (self.confirmAction() !== 'block' || self.blockAcknowledged()); });
      this.confirmMessage = ko.pureComputed(function () {
        var card = self.confirmCard(), action = self.confirmAction();
        if (!card) return '';
        var suffix = String(card.cardNumberMasked).slice(-4);
        if (action === 'freeze') return 'Freeze card ending ' + suffix + ' for customer ' + card.customerId + '? The card will not work for transactions until it is unfrozen.';
        if (action === 'unfreeze') return 'Unfreeze card ending ' + suffix + ' for customer ' + card.customerId + '?';
        return 'Block card ending ' + suffix + ' for customer ' + card.customerId + '? Blocking is permanent and cannot be undone from this screen.';
      });
      this.busyFor = function (id) { return ko.pureComputed(function () { return self.busyIds.indexOf(id) !== -1; }); };
      this.notify = function (message) { self.toastHelper.show(message); };
      this.updateScroll = function () {
        var row = document.getElementById('bankCardRow'); if (!row) return;
        self.atStart(row.scrollLeft <= 2); self.atEnd(row.scrollLeft + row.clientWidth >= row.scrollWidth - 2);
      };
      this.scrollCards = function (direction) { var row = document.getElementById('bankCardRow'); if (row) row.scrollBy({ left: direction * 340, behavior: 'smooth' }); };
      this.scrollLeft = function () { self.scrollCards(-1); }; this.scrollRight = function () { self.scrollCards(1); };
      this.create = function (event) { self.form.open(event.currentTarget); };
      this.rowKeydown = function (event) { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); self.scrollCards(event.key === 'ArrowLeft' ? -1 : 1); } };
      this.refresh = function () {
        self.loading(true); self.error(''); self.liveMessage('Loading cards');
        return service.list().then(function (rows) {
          rows.forEach(function (card) { if (['ACTIVE', 'FROZEN', 'BLOCKED'].indexOf(card.cardStatus) === -1) console.warn('Unknown card status for card ID ' + card.cardId); });
          self.cards(rows); self.liveMessage(rows.length + ' cards loaded'); window.setTimeout(self.updateScroll, 0);
        }).catch(function (err) {
          self.error(err.status === 403 ? 'You do not have permission' : err.status === 401 ? 'Your session has expired. Please sign in again.' : 'Unable to load cards.');
          self.liveMessage(self.error());
        }).finally(function () { self.loading(false); });
      };
      this.askAction = function (card, action, trigger) {
        self.confirmCard(card); self.confirmAction(action); self.blockAcknowledged(false); self.submitting(false); self.confirmTrigger = trigger;
        document.getElementById('cardConfirmDialog').open();
      };
      this.dialogOpened = function () { window.setTimeout(function () { var first = document.querySelector('#cardConfirmDialog input[type="checkbox"]') || document.getElementById('cardConfirmButton'); if (first) first.focus(); }, 0); };
      this.closeConfirm = function () { if (!self.submitting()) document.getElementById('cardConfirmDialog').close(); };
      this.confirmClosed = function () {
        self.blockAcknowledged(false); self.confirmCard(null); self.confirmAction('');
        if (self.confirmTrigger && self.confirmTrigger.isConnected) self.confirmTrigger.focus();
      };
      this.applyAction = function () {
        var card = self.confirmCard(), action = self.confirmAction();
        if (!card || !self.canConfirm()) return;
        self.submitting(true); self.busyIds.push(card.cardId); self.liveMessage(action + ' request in progress for card ending ' + String(card.cardNumberMasked).slice(-4));
        service[action](card.cardId).then(function () {
          self.notify(action === 'freeze' ? 'Card frozen' : action === 'unfreeze' ? 'Card unfrozen' : 'Card blocked');
          document.getElementById('cardConfirmDialog').close();
          return self.refresh();
        }).catch(function (err) {
          var message;
          if (err.status === 401) message = 'Your session has expired. Please sign in again.';
          else if (err.status === 403) message = 'You do not have permission';
          else if (err.status === 404) message = 'Card not found';
          else if (err.status === 400 || err.status === 409) message = (err.body && (err.body.message || err.body.error || err.body.detail)) || err.message || 'Unable to update card.';
          else message = 'Unable to update card. Check your connection and retry.';
          self.notify(message);
          if (err.status === 404 || err.status === 400 || err.status === 409) self.refresh();
        }).finally(function () { self.busyIds.remove(card.cardId); self.submitting(false); });
      };
      this.connected = function () { document.title = 'Card Management | FinThink Bank'; self.refresh(); };
      this.disconnected = function () { self.toastHelper.clear(); };
    }
    return CardManagementViewModel;
  });
