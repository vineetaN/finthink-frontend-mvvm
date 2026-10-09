define([
  'knockout',
  'ojs/ojarraydataprovider',
  'ojs/ojbutton',
  'ojs/ojdialog',
  'ojs/ojinputnumber',
  'ojs/ojinputtext',
  'ojs/ojselectsingle',
  'ojs/ojdatetimepicker',
  'ojs/ojtable',
  'ojs/ojlabel',
  '../config/apiConfig',
  '../services/loanService',
  '../utils/loanUtils',
  '../utils/toastHelper'
], function (
  ko,
  ArrayDataProvider,
  ojButton,
  ojDialog,
  ojInputNumber,
  ojInputText,
  ojSelectSingle,
  ojDateTimePicker,
  ojTable,
  ojLabel,
  apiConfig,
  loanService,
  loanUtils,
  toastHelper
) {
  'use strict';

  function getDistinctValues(items, key) {
    var values = {};
    items.forEach(function (item) {
      var value = item && item[key];
      if (value !== undefined && value !== null && value !== '') {
        values[String(value)] = true;
      }
    });
    return Object.keys(values);
  }

  function LoanManagementViewModel() {
    var self = this;

    this.rows = ko.observableArray([]);
    this.loading = ko.observable(true);
    this.error = ko.observable('');
    this.toastMessage = ko.observable('');
    this.liveMessage = ko.observable('Loading loans');
    this.lastUpdated = ko.observable('');
    this.search = ko.observable('');
    this.customerIdFilter = ko.observable(null);
    this.loanTypeFilter = ko.observable('');
    this.statusFilter = ko.observable('');
    this.autopayFilter = ko.observable('');
    this.activeQuickFilters = ko.observableArray([]);
    this.columnState = ko.observable({
      loanId: true,
      customerId: true,
      accountNo: true,
      type: true,
      principal: true,
      outstanding: true,
      interestRate: true,
      emi: true,
      tenure: true,
      startDate: true,
      nextEmi: true,
      endDate: true,
      status: true,
      autopay: true
    });

    this.quickFilters = [
      { key: 'dueSoon', label: 'Next EMI within 7 days' },
      { key: 'pastDue', label: 'Next EMI date passed' },
      { key: 'autopayOff', label: 'Autopay off' },
      { key: 'highValue', label: 'High value' }
    ];

    this.loanTypeOptions = ko.pureComputed(function () {
      var options = [{ value: '', label: 'All' }];
      var source = apiConfig.LOAN_TYPES || [];
      source.forEach(function (item) {
        options.push({ value: item.value, label: item.label });
      });
      return new ArrayDataProvider(options, { keyAttributes: 'value' });
    });

    this.statusOptions = ko.pureComputed(function () {
      var options = [{ value: '', label: 'All' }];
      var seen = { '': true };
      self.rows().forEach(function (loan) {
        var value = String(loan.loanStatus || '').trim();
        var key = value.toUpperCase();
        if (!value || seen[key]) {
          return;
        }
        seen[key] = true;
        options.push({ value: value, label: value });
      });
      return new ArrayDataProvider(options, { keyAttributes: 'value' });
    });

    this.autopayOptions = new ArrayDataProvider([
      { value: '', label: 'All' },
      { value: 'enabled', label: 'Enabled' },
      { value: 'disabled', label: 'Disabled' }
    ], { keyAttributes: 'value' });
    this.loanTypePresetOptions = new ArrayDataProvider([
      { value: 'HOME', label: 'Home Loan' },
      { value: 'PERSONAL', label: 'Personal Loan' },
      { value: 'CAR', label: 'Car Loan' }
    ], { keyAttributes: 'value' });

    this.tableColumns = ko.pureComputed(function () {
      var state = self.columnState();
      var columns = [];
      if (state.loanId) columns.push({ headerText: 'Loan ID', field: 'loanId' });
      if (state.customerId) columns.push({ headerText: 'Customer ID', field: 'customerId' });
      if (state.accountNo) columns.push({ headerText: 'Account No', field: 'loanAccountNo' });
      if (state.type) columns.push({ headerText: 'Type', field: 'loanType' });
      if (state.principal) columns.push({ headerText: 'Principal', field: 'principalAmount' });
      if (state.outstanding) columns.push({ headerText: 'Outstanding', field: 'outstandingAmount' });
      if (state.interestRate) columns.push({ headerText: 'Interest Rate', field: 'interestRate' });
      if (state.emi) columns.push({ headerText: 'EMI', field: 'emiAmount' });
      if (state.tenure) columns.push({ headerText: 'Tenure', field: 'tenureMonths' });
      if (state.startDate) columns.push({ headerText: 'Start Date', field: 'loanStartDate' });
      if (state.nextEmi) columns.push({ headerText: 'Next EMI', field: 'nextEmiDate' });
      if (state.endDate) columns.push({ headerText: 'End Date', field: 'estimatedEndDate' });
      if (state.status) columns.push({ headerText: 'Status', field: 'loanStatus' });
      if (state.autopay) columns.push({ headerText: 'Autopay', field: 'autopayEnabled' });
      return columns;
    });

    this.filteredRows = ko.pureComputed(function () {
      var keyword = String(self.search() || '').trim().toLowerCase();
      var customerId = String(self.customerIdFilter() || '').trim();
      var typeFilter = String(self.loanTypeFilter() || '').trim();
      var statusFilter = String(self.statusFilter() || '').trim();
      var autopayFilter = String(self.autopayFilter() || '').trim();
      var matches = self.rows().filter(function (loan) {
        var loanAccount = (loan.loanAccountNo || '').toLowerCase();
        var matchesKeyword = !keyword || loanAccount.indexOf(keyword) !== -1 || String(loan.customerId || '').indexOf(keyword) !== -1;
        var matchesCustomer = !customerId || String(loan.customerId) === customerId;
        var matchesType = !typeFilter || String(loan.loanType || '').toUpperCase() === typeFilter.toUpperCase();
        var matchesStatus = !statusFilter || String(loan.loanStatus || '').trim().toUpperCase() === statusFilter.toUpperCase();
        var matchesAutopay = !autopayFilter || (autopayFilter === 'enabled' ? Boolean(loan.autopayEnabled) : !loan.autopayEnabled);

        var withinFilter = matchesKeyword && matchesCustomer && matchesType && matchesStatus && matchesAutopay;

        var dueSoon = isDueSoon(loan);
        var pastDue = isPastDue(loan);
        var autopayOff = !loan.autopayEnabled;
        var highValue = Number(loan.principalAmount) >= apiConfig.HIGH_VALUE_THRESHOLD;

        if (self.activeQuickFilters().indexOf('dueSoon') !== -1 && !(dueSoon && String(loan.loanStatus || '').toUpperCase() === 'ACTIVE')) {
          withinFilter = false;
        }
        if (self.activeQuickFilters().indexOf('pastDue') !== -1 && !(pastDue && String(loan.loanStatus || '').toUpperCase() === 'ACTIVE')) {
          withinFilter = false;
        }
        if (self.activeQuickFilters().indexOf('autopayOff') !== -1 && !autopayOff) {
          withinFilter = false;
        }
        if (self.activeQuickFilters().indexOf('highValue') !== -1 && !highValue) {
          withinFilter = false;
        }

        return withinFilter;
      });

      return matches.slice().sort(function (a, b) {
        return Number(b.loanId) - Number(a.loanId);
      });
    });

    this.tableDataProvider = ko.pureComputed(function () {
      return new ArrayDataProvider(self.filteredRows(), { keyAttributes: 'loanId' });
    });

    this.showingText = ko.pureComputed(function () {
      var rows = self.filteredRows();
      return 'Showing ' + (rows.length ? '1-' + rows.length : '0') + ' of ' + self.rows().length + ' loans';
    });

    this.summaryCards = [
      { title: 'Total loans', value: ko.pureComputed(function () { return self.filteredRows().length; }) },
      { title: 'Active loans', value: ko.pureComputed(function () {
        return self.filteredRows().filter(function (loan) { return String(loan.loanStatus || '').toUpperCase() === 'ACTIVE'; }).length;
      }) },
      { title: 'Total principal', value: ko.pureComputed(function () {
        return formatMoney(self.filteredRows().reduce(function (total, loan) { return total + Number(loan.principalAmount || 0); }, 0));
      }) },
      { title: 'Total outstanding', value: ko.pureComputed(function () {
        return formatMoney(self.filteredRows().reduce(function (total, loan) { return total + Number(loan.outstandingAmount || 0); }, 0));
      }) },
      { title: 'Monthly EMI total', value: ko.pureComputed(function () {
        return formatMoney(self.filteredRows().filter(function (loan) { return String(loan.loanStatus || '').toUpperCase() === 'ACTIVE'; }).reduce(function (total, loan) { return total + Number(loan.emiAmount || 0); }, 0));
      }) },
      { title: 'Average interest rate', value: ko.pureComputed(function () {
        var active = self.filteredRows().filter(function (loan) { return Number(loan.principalAmount) > 0; });
        if (!active.length) {
          return '0.00%';
        }
        var numerator = active.reduce(function (total, loan) { return total + (Number(loan.interestRate || 0) * Number(loan.principalAmount || 0)); }, 0);
        var denominator = active.reduce(function (total, loan) { return total + Number(loan.principalAmount || 0); }, 0);
        return ((numerator / denominator) || 0).toFixed(2) + '%';
      }) }
    ];

    this.form = {
      customerId: ko.observable(null),
      loanType: ko.observable('HOME'),
      principalAmount: ko.observable(null),
      interestRate: ko.observable(null),
      loanStartDate: ko.observable(''),
      tenureMonths: ko.observable(null),
      nextEmiDate: ko.observable('')
    };
    this.formErrors = ko.observable({});
      this.confirmText = ko.observable('');
    this.pendingCreate = ko.observable(null);

    this.estimateSummary = ko.pureComputed(function () {
      var principal = Number(self.form.principalAmount() || 0);
      var rate = Number(self.form.interestRate() || 0);
      var months = Number(self.form.tenureMonths() || 0);
      var startDate = self.form.loanStartDate();
      if (!principal || !rate || !months || !startDate) {
        return {
          endDate: '',
          emi: '',
          isVisible: false
        };
      }
      var emi = loanUtils.calculateIndicativeEmi(principal, rate, months);
      var endDate = addMonths(startDate, months);
      return {
        endDate: formatDateDisplay(endDate),
        emi: formatMoney(emi, apiConfig.loanCurrency),
        isVisible: true
      };
    });

    this.refresh = function () {
      self.loading(true);
      self.error('');
      self.lastUpdated('');
      self.liveMessage('Loading loans');
      return loanService.list()
        .then(function (items) {
          self.rows(items.map(function (loan) { return loanService.mapLoanResponse(loan); }));
          self.lastUpdated(new Date().toLocaleTimeString('en-GB', { hour12: false }));
          self.liveMessage('Loan list refreshed');
        })
        .catch(function (error) {
          self.error(error && error.message ? error.message : 'Unable to load loans.');
          self.liveMessage(self.error());
        })
        .finally(function () {
          self.loading(false);
        });
    };

    this.handleQuickFilterToggle = function (filterKey) {
      var list = self.activeQuickFilters();
      if (list.indexOf(filterKey) !== -1) {
        list = list.filter(function (item) { return item !== filterKey; });
      } else {
        list = list.concat([filterKey]);
      }
      self.activeQuickFilters(list);
    };

    this.clearFilters = function () {
      self.search('');
      self.customerIdFilter(null);
      self.loanTypeFilter('');
      self.statusFilter('');
      self.autopayFilter('');
      self.activeQuickFilters([]);
    };

    this.isQuickFilterActive = function (filterKey) {
      return self.activeQuickFilters().indexOf(filterKey) !== -1;
    };

    function formatMoney(value) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: apiConfig.loanCurrency || 'INR',
        maximumFractionDigits: 2
      }).format(Number(value || 0));
    }

    function formatDateDisplay(dateValue) {
      var parsed = loanUtils.parseDate(dateValue);
      if (!parsed) {
        return '';
      }
      return parsed.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }

    function addMonths(dateValue, months) {
      var parsed = loanUtils.parseDate(dateValue);
      if (!parsed || !Number(months)) {
        return null;
      }
      return new Date(parsed.getFullYear(), parsed.getMonth() + Number(months), parsed.getDate());
    }

    function isDueSoon(loan) {
      var due = loan.nextEmiDate;
      var status = String(loan.loanStatus || '').toUpperCase();
      if (!due || status !== 'ACTIVE') {
        return false;
      }
      var diff = loanUtils.differenceInDays(new Date().toISOString().slice(0, 10), due);
      return diff >= 0 && diff <= apiConfig.DUE_SOON_DAYS;
    }

    function isPastDue(loan) {
      var due = loan.nextEmiDate;
      var status = String(loan.loanStatus || '').toUpperCase();
      if (!due || status !== 'ACTIVE') {
        return false;
      }
      return loanUtils.differenceInDays(due, new Date().toISOString().slice(0, 10)) < 0;
    }

    this.exportCsv = function () {
      var rows = self.filteredRows();
      var columns = self.tableColumns();
      var header = columns.map(function (column) { return column.headerText; }).join(',');
      var lines = [header];

      rows.forEach(function (loan) {
        var fields = columns.map(function (column) {
          var value = loan[column.field];
          if (column.field === 'loanType') {
            value = String(loan.loanType || '');
          } else if (column.field === 'interestRate') {
            value = Number(loan.interestRate || 0);
          } else if (column.field === 'principalAmount' || column.field === 'outstandingAmount' || column.field === 'emiAmount') {
            value = Number(loan[column.field] || 0);
          } else if (column.field === 'autopayEnabled') {
            value = loan.autopayEnabled ? 'Enabled' : 'Disabled';
          }
          return loanUtils.escapeCsvCell(value);
        });
        lines.push(fields.join(','));
      });

      var csv = lines.join('\n');
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      var url = window.URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'loans-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      self.liveMessage('CSV export created');
    };

    this.openCreateDialog = function () {
      self.form.customerId(null);
      self.form.loanType('HOME');
      self.form.principalAmount(null);
      self.form.interestRate(null);
      self.form.loanStartDate('');
      self.form.tenureMonths(null);
      self.form.nextEmiDate('');
      self.formErrors({});
      self.pendingCreate(null);
      document.getElementById('loanCreateDialog').open();
      window.setTimeout(function () {
        var element = document.getElementById('loanCustomerIdInput');
        if (element && element.focus) {
          element.focus();
        }
      }, 0);
    };

    this.closeCreateDialog = function () {
      document.getElementById('loanCreateDialog').close();
      self.pendingCreate(null);
      self.formErrors({});
      document.getElementById('loanConfirmDialog').close();
    };

    this.closeConfirmCreateDialog = function () {
      document.getElementById('loanConfirmDialog').close();
    };

    this.validateCreateForm = function () {
      var values = {
        customerId: self.form.customerId(),
        loanType: self.form.loanType(),
        principalAmount: self.form.principalAmount(),
        interestRate: self.form.interestRate(),
        loanStartDate: self.form.loanStartDate(),
        tenureMonths: self.form.tenureMonths(),
        nextEmiDate: self.form.nextEmiDate()
      };

      var errors = {};
      var customerId = Number(values.customerId);
      if (!Number.isInteger(customerId) || customerId <= 0) {
        errors.customerId = 'Customer ID is required.';
      }
      if (!String(values.loanType || '').trim()) {
        errors.loanType = 'Please select a loan type.';
      }
      var principalAmount = Number(values.principalAmount);
      if (values.principalAmount === null || values.principalAmount === '' || !Number.isFinite(principalAmount) || principalAmount < 0.01) {
        errors.principalAmount = 'Principal amount must be at least 0.01.';
      }
      var interestRate = Number(values.interestRate);
      if (values.interestRate === null || values.interestRate === '' || !Number.isFinite(interestRate) || interestRate < 0 || interestRate > apiConfig.MAX_INTEREST_RATE) {
        errors.interestRate = 'Interest rate must be between 0 and ' + apiConfig.MAX_INTEREST_RATE + '.';
      }
      if (!values.loanStartDate) {
        errors.loanStartDate = 'Loan start date is required.';
      }
      var tenureMonths = Number(values.tenureMonths);
      if (values.tenureMonths === null || values.tenureMonths === '' || !Number.isInteger(tenureMonths) || tenureMonths <= 0 || tenureMonths > apiConfig.MAX_TENURE_MONTHS) {
        errors.tenureMonths = 'Tenure must be between 1 and ' + apiConfig.MAX_TENURE_MONTHS + ' months.';
      }
      if (!values.nextEmiDate) {
        errors.nextEmiDate = 'Next EMI date is required.';
      }
      if (values.loanStartDate && values.nextEmiDate && values.nextEmiDate < values.loanStartDate) {
        errors.nextEmiDate = 'Next EMI date cannot be before the loan start date.';
      }
      self.formErrors(errors);
      return Object.keys(errors).length === 0;
    };

    this.confirmCreate = function () {
      if (!self.validateCreateForm()) {
        return;
      }

      var typeValue = String(self.form.loanType() || '');
      var label = typeValue || 'Loan';
      self.confirmText('Create a ' + formatMoney(Number(self.form.principalAmount() || 0), apiConfig.loanCurrency) + ' ' + label + ' for customer ' + self.form.customerId() + ' at ' + Number(self.form.interestRate()) + '% for ' + self.form.tenureMonths() + ' months?');
      self.pendingCreate({
        customerId: Number(self.form.customerId()),
        loanType: typeValue,
        principalAmount: Number(self.form.principalAmount()),
        interestRate: Number(self.form.interestRate()),
        loanStartDate: self.form.loanStartDate(),
        tenureMonths: Number(self.form.tenureMonths()),
        nextEmiDate: self.form.nextEmiDate()
      });
      document.getElementById('loanConfirmDialog').open();
    };

    this.submitCreate = function () {
      if (!self.pendingCreate()) {
        return;
      }
      var payload = self.pendingCreate();
      document.getElementById('loanConfirmDialog').close();
      self.liveMessage('Creating loan');

      loanService.create(payload)
        .then(function () {
          self.closeCreateDialog();
          self.refresh();
          self.toastMessage('Loan created successfully');
          window.setTimeout(function () { self.toastMessage(''); }, 4000);
        })
        .catch(function (error) {
          document.getElementById('loanCreateDialog').open();
          self.formErrors({ server: error && error.message ? error.message : 'Unable to create loan.' });
          self.liveMessage(self.formErrors().server);
        });
    };

    this.connected = function () {
      document.title = 'Loan Management | FinThink Bank';
      self.refresh();
    };
  }

  return LoanManagementViewModel;
});
