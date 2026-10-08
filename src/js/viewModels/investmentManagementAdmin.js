define([
  'knockout', 'ojs/ojarraydataprovider', 'text!../components/investmentCard.html', 'text!../components/updateInterestDialog.html',
  '../components/investmentCard', '../components/updateInterestDialog', '../services/investmentService', '../utils/toastHelper',
  'ojs/ojbutton', 'ojs/ojinputtext', 'ojs/ojselectsingle', 'ojs/ojlabel'
], function (ko, ArrayDataProvider, cardTemplate, dialogTemplate, InvestmentCard, UpdateInterestDialog, service, toastHelper) {
  'use strict';

  if (!ko.components.isRegistered('investment-card')) ko.components.register('investment-card', { viewModel: InvestmentCard, template: cardTemplate });
  if (!ko.components.isRegistered('update-interest-dialog')) ko.components.register('update-interest-dialog', {
    viewModel: function (params) { return params.model; }, template: dialogTemplate
  });

  function InvestmentManagementViewModel() {
    var self = this;
    this.products = ko.observableArray([]);
    this.search = ko.observable('');
    this.statusFilter = ko.observable('All');
    this.statusOptions = new ArrayDataProvider([
      { value: 'All', label: 'All' }, { value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }
    ], { keyAttributes: 'value' });
    this.loading = ko.observable(true);
    this.error = ko.observable('');
    this.liveMessage = ko.observable('');
    this.toast = ko.observable('');
    this.atStart = ko.observable(true);
    this.atEnd = ko.observable(true);
    this.searchInputChanged = function (event) { self.search(String(event.detail.value || '')); };
    this.notify = toastHelper.create(this.toast, this.liveMessage);
    this.filteredProducts = ko.pureComputed(function () {
      var search = String(self.search() || '').trim().toLowerCase();
      return self.products().filter(function (product) {
        var statusMatches = self.statusFilter() === 'All' || (self.statusFilter() === 'Active' ? product.active : !product.active);
        return statusMatches && (!search || product.investmentName.toLowerCase().indexOf(search) !== -1);
      });
    });
    this.showingText = ko.pureComputed(function () {
      return 'Showing ' + self.filteredProducts().length + ' of ' + self.products().length + ' products';
    });
    this.updateDialog = new UpdateInterestDialog({
      onSaved: function (productId) {
        self.notify.show('Interest rate updated');
        return self.refresh(true).then(function () {
          function focusUpdatedAction(attempt) {
            var action = document.querySelector('.investment-card[data-product-id="' + productId + '"] oj-button');
            if (action && action.classList.contains('oj-complete')) {
              action.focus();
            } else if (attempt < 5) {
              window.setTimeout(function () { focusUpdatedAction(attempt + 1); }, 50);
            } else {
              var refreshButton = document.querySelector('.investment-heading oj-button');
              if (refreshButton && refreshButton.classList.contains('oj-complete')) refreshButton.focus();
            }
          }
          focusUpdatedAction(0);
        });
      },
      onReload: function (productId) {
        return service.products().then(function (rows) {
          self.products(rows);
          self.liveMessage(self.showingText());
          window.setTimeout(self.updateScroll, 0);
          return rows.find(function (product) { return product.productId === Number(productId); });
        });
      }
    });
    this.updateScroll = function () {
      var row = document.getElementById('investmentCardRow');
      if (!row) return;
      self.atStart(row.scrollLeft <= 2);
      self.atEnd(row.scrollLeft + row.clientWidth >= row.scrollWidth - 2);
    };
    this.scrollCards = function (direction) {
      var row = document.getElementById('investmentCardRow');
      if (row) row.scrollBy({ left: direction * 296, behavior: 'smooth' });
    };
    this.scrollLeft = function () { self.scrollCards(-1); };
    this.scrollRight = function () { self.scrollCards(1); };
    this.rowKeydown = function (event) {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        self.scrollCards(event.key === 'ArrowLeft' ? -1 : 1);
      }
    };
    this.scrollSubscription = this.filteredProducts.subscribe(function () { window.setTimeout(self.updateScroll, 0); });
    this.refresh = function (silent) {
      if (!silent) self.loading(true);
      self.error('');
      self.liveMessage('Loading investment products');
      return service.products().then(function (rows) {
        self.products(rows);
        self.liveMessage(self.showingText());
        window.setTimeout(self.updateScroll, 0);
      }).catch(function (error) {
        var message = error.status === 403 ? 'You do not have permission.' :
          error.status === 401 ? 'Your session has expired. Please sign in again.' :
          error.message || 'Unable to load investment products.';
        self.error(message);
        self.liveMessage(message);
      }).finally(function () { if (!silent) self.loading(false); });
    };
    this.openUpdate = function (product, trigger) { self.updateDialog.open(product, trigger); };
    this.connected = function () { document.title = 'Investment Management | FinThink Bank'; self.refresh(); };
    this.disconnected = function () { self.notify.clear(); self.scrollSubscription.dispose(); };
  }

  return InvestmentManagementViewModel;
});
