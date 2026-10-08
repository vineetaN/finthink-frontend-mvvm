define([
  'knockout',
  '../services/accountService',
  '../services/transactionService',
  '../utils/authGuard'
], function (ko, accountService, transactionService, authGuard) {
  'use strict';

  function TransactionsViewModel() {
    const self = this;

    self.accounts = ko.observableArray([]);
    self.selectedAccountId = ko.observable('');
    self.isLoadingAccounts = ko.observable(false);
    self.accountsError = ko.observable('');

    self.transactions = ko.observableArray([]);
    self.isLoadingTransactions = ko.observable(false);
    self.transactionsError = ko.observable('');
    self.hasLoadedTransactions = ko.observable(false);

    self.currentPage = ko.observable(0);
    self.totalPages = ko.observable(0);
    self.totalRecords = ko.observable(0);

    self.isDownloadingStatement = ko.observable(false);
    self.downloadError = ko.observable('');
    self.downloadSuccessMessage = ko.observable('');

    self.filterType = ko.observable('');
    self.filterCategory = ko.observable('');
    self.filterStatus = ko.observable('');
    self.filterFromDate = ko.observable('');
    self.filterToDate = ko.observable('');

    self.selectedAccount = ko.pureComputed(function () {
      return self.accounts().find(function (account) {
        return String(account.accountId) === String(self.selectedAccountId());
      }) || null;
    });

    self.formatCurrency = function (amount) {
      if (amount === null || amount === undefined) {
        return '—';
      }

      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
      }).format(amount);
    };

    self.formatDateTime = function (value) {
      if (!value) {
        return '—';
      }

      return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(value));
    };

    self.loadTransactions = function () {
      const accountId = self.selectedAccountId();

      if (!accountId) {
        self.transactions([]);
        self.hasLoadedTransactions(false);
        return;
      }

      self.isLoadingTransactions(true);
      self.transactionsError('');

      return transactionService.getTransactions(accountId, {
        page: self.currentPage(),
        size: 10,
        type: self.filterType(),
        category: self.filterCategory(),
        status: self.filterStatus(),
        fromDate: self.filterFromDate(),
        toDate: self.filterToDate()
      })
        .then(function (response) {
          self.transactions(
            Array.isArray(response.transactions) ? response.transactions : []
          );

          self.hasLoadedTransactions(true);
          self.currentPage(response.page || 0);
          self.totalPages(response.totalPages || 0);
          self.totalRecords(response.totalRecords || 0);
        })
        .catch(function (error) {
          self.transactions([]);
          self.transactionsError(
            error.message || 'We could not load your transactions.'
          );
        })
        .finally(function () {
          self.isLoadingTransactions(false);
        });
    };

    self.applyFilters = function () {
      if (
        self.filterFromDate() &&
        self.filterToDate() &&
        self.filterFromDate() > self.filterToDate()
      ) {
        self.transactionsError('From date cannot be after to date.');
        return;
      }

      self.currentPage(0);
      self.loadTransactions();
    };

    self.clearFilters = function () {
      self.filterType('');
      self.filterCategory('');
      self.filterStatus('');
      self.filterFromDate('');
      self.filterToDate('');
      self.currentPage(0);
      self.loadTransactions();
    };

    self.downloadPdfStatement = function () {
      const accountId = self.selectedAccountId();

      if (!accountId) {
        self.downloadError('Please choose an account first.');
        return;
      }

      self.isDownloadingStatement(true);
      self.downloadError('');
      self.downloadSuccessMessage('');

      return transactionService.downloadStatement(accountId, {
        type: self.filterType(),
        category: self.filterCategory(),
        status: self.filterStatus(),
        fromDate: self.filterFromDate(),
        toDate: self.filterToDate()
      })
        .then(function () {
          self.downloadSuccessMessage(
            'Your PDF statement has been downloaded successfully.'
          );
        })
        .catch(function (error) {
          self.downloadError(
            error.message || 'We could not download your PDF statement.'
          );
        })
        .finally(function () {
          self.isDownloadingStatement(false);
        });
    };

    self.goToPreviousPage = function () {
      if (self.currentPage() <= 0) {
        return;
      }

      self.currentPage(self.currentPage() - 1);
      self.loadTransactions();
    };

    self.goToNextPage = function () {
      if (self.currentPage() >= self.totalPages() - 1) {
        return;
      }

      self.currentPage(self.currentPage() + 1);
      self.loadTransactions();
    };

    self.loadAccounts = function () {
      self.isLoadingAccounts(true);
      self.accountsError('');

      return accountService.getMyAccounts()
        .then(function (response) {
          const activeAccounts = Array.isArray(response)
            ? response.filter(function (account) {
                return account.status === 'ACTIVE';
              }).map(function (account) {
                return {
                  accountId: account.accountId,
                  accountType: account.accountType || 'Account',
                  accountMasked: account.accountMasked || '—',
                  availableBalance: account.availableBalance,
                  accountLabel:
                    (account.accountType || 'Account') +
                    ' • ' +
                    (account.accountMasked || '—')
                };
              })
            : [];

          self.accounts(activeAccounts);

          if (activeAccounts.length === 1) {
            self.selectedAccountId(activeAccounts[0].accountId);
          }
        })
        .catch(function (error) {
          self.accounts([]);
          self.accountsError(
            error.message || 'We could not load your accounts.'
          );
        })
        .finally(function () {
          self.isLoadingAccounts(false);
        });
    };

    self.selectedAccountId.subscribe(function () {
      self.currentPage(0);
      self.loadTransactions();
    });

    self.connected = function () {
      if (!authGuard.requireAuthentication()) {
        return;
      }

      self.loadAccounts();
    };
  }

  return TransactionsViewModel;
});