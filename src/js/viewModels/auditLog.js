define([
    'knockout',
    'ojs/ojarraydataprovider',
    'ojs/ojconverter-datetime',
    'ojs/ojbutton',
    'ojs/ojtable',
    'ojs/ojpagingcontrol',
    'ojs/ojdialog',
    'ojs/ojinputtext',
    'ojs/ojselectsingle',
    'ojs/ojdatetimepicker',
    'ojs/ojlabel',
    'ojs/ojprogress-circle',
    '../config/apiConfig',
    '../services/auditLogService'
  ], function (
    ko,
    ArrayDataProvider,
    DateTimeConverter,
    ojButton,
    ojTable,
    ojPagingControl,
    ojDialog,
    ojInputText,
    ojSelectSingle,
    ojDateTimePicker,
    ojLabel,
    ojProgressCircle,
    apiConfig,
    auditLogService
  ) {
    'use strict';

    var dateConverter = new DateTimeConverter.IntlDateTimeConverter({
      pattern: 'dd MMM yyyy, HH:mm:ss'
    });

    function optionProvider(configValues, rows, label) {
      var values = configValues.slice();
      rows.forEach(function (row) {
        var value = row[label === 'Action' ? 'action' : 'moduleName'];
        if (value && values.indexOf(value) === -1) values.push(value);
      });
      values.sort();
      var options = [{ value: '', label: 'All ' + label.toLowerCase() + 's' }];
      values.forEach(function (value) { options.push({ value: value, label: value }); });
      return new ArrayDataProvider(options, { keyAttributes: 'value' });
    }

    function createPagingModel(loadPage) {
      var listeners = {};
      var currentPage = 0;
      var pageSize = 20;
      var totalElements = 0;
      var totalPages = 0;

      function emit(type, detail) {
        (listeners[type] || []).slice().forEach(function (listener) {
          listener(detail || {});
        });
      }

      function updateSummary(page, size, total, pageCount) {
        var pageCountChanged = totalPages !== pageCount;
        currentPage = page;
        pageSize = size;
        totalElements = total;
        totalPages = pageCount;
        emit('page', { page: currentPage, pageSize: pageSize });
        if (pageCountChanged) emit('pageCount', { pageCount: totalPages });
      }

      return {
        getPage: function () { return currentPage; },
        getPageCount: function () { return totalPages; },
        getStartItemIndex: function () { return totalElements ? currentPage * pageSize : 0; },
        getEndItemIndex: function () {
          return totalElements ? Math.min((currentPage + 1) * pageSize, totalElements) - 1 : -1;
        },
        totalSize: function () { return totalElements; },
        totalSizeConfidence: function () { return 'actual'; },
        on: function (type, listener) {
          listeners[type] = listeners[type] || [];
          listeners[type].push(listener);
          return listener;
        },
        off: function (type, listener) {
          listeners[type] = (listeners[type] || []).filter(function (item) { return item !== listener; });
        },
        setPage: function (page, options) {
          options = options || {};
          var requestedSize = Number(options.pageSize) || pageSize;
          var requestedPage = requestedSize !== pageSize ? 0 : Math.max(0, Number(page) || 0);
          return loadPage(requestedPage, requestedSize).then(function (result) {
            updateSummary(result.number, requestedSize, result.totalElements, result.totalPages);
          });
        },
        updateSummary: updateSummary
      };
    }

    function AuditLogViewModel() {
      var self = this;
      this.loading = ko.observable(false);
      this.error = ko.observable('');
      this.filterError = ko.observable('');
      this.copyMessage = ko.observable('');
      this.totalElements = ko.observable(0);
      this.pageNumber = ko.observable(0);
      this.pageSize = ko.observable(20);
      this.pageSizeOptions = new ArrayDataProvider(
        apiConfig.auditLogPageSizes.map(function (size) { return { value: size, label: String(size) }; }),
        { keyAttributes: 'value' }
      );

      this.search = ko.observable('');
      this.action = ko.observable('');
      this.moduleName = ko.observable('');
      this.actorCustomerId = ko.observable('');
      this.fromDate = ko.observable('');
      this.toDate = ko.observable('');
      this.ipAddress = ko.observable('');
      this.rows = ko.observableArray([]);
      this.tableDataProvider = new ArrayDataProvider(this.rows, { keyAttributes: 'auditId' });
      this.actionOptions = ko.observable(optionProvider(apiConfig.auditLogActions, [], 'Action'));
      this.moduleOptions = ko.observable(optionProvider(apiConfig.auditLogModules, [], 'Module'));
      this.selectedEntry = ko.observable(null);
      this.sort = ko.observable('actionTime,desc');
      this.appliedFilters = ko.observable({});

      this.columns = ko.observableArray([
        { headerText: 'Audit ID', field: 'auditId', sortable: 'enabled' },
        { headerText: 'Date & Time', field: 'actionTime', template: 'dateCell', sortable: 'enabled' },
        { headerText: 'Customer ID', field: 'actorCustomerId', sortable: 'enabled' },
        { headerText: 'Username', field: 'actorUsername', template: 'usernameCell' },
        { headerText: 'Action', field: 'action', template: 'actionCell', sortable: 'enabled' },
        { headerText: 'Module', field: 'moduleName', sortable: 'enabled' },
        { headerText: 'Details', field: 'details', template: 'detailsCell' },
        { headerText: 'IP Address', field: 'ipAddress', template: 'ipCell' }
      ]);

      this.pagingModel = createPagingModel(function (page, size) {
        return self.loadPage(page, size);
      });

      this.activeFilters = ko.pureComputed(function () {
        var filters = self.appliedFilters();
        return [
          { key: 'search', label: 'Search', value: filters.search },
          { key: 'action', label: 'Action', value: filters.action },
          { key: 'moduleName', label: 'Module', value: filters.moduleName },
          { key: 'actorCustomerId', label: 'Customer ID', value: filters.actorCustomerId },
          { key: 'fromDate', label: 'From', value: filters.fromDate },
          { key: 'toDate', label: 'To', value: filters.toDate },
          { key: 'ipAddress', label: 'IP Address', value: filters.ipAddress }
        ].filter(function (filter) { return filter.value !== undefined && filter.value !== null && String(filter.value).trim() !== ''; });
      });

      this.showingText = ko.pureComputed(function () {
        var count = self.rows().length;
        if (!count) return 'Showing 0-0 of ' + self.totalElements();
        var start = self.pageNumber() * self.pageSize() + 1;
        return 'Showing ' + start + '-' + (start + count - 1) + ' of ' + self.totalElements();
      });

      this.liveMessage = ko.pureComputed(function () {
        if (self.loading()) return 'Loading audit logs.';
        if (self.error()) return self.error();
        return self.showingText();
      });

      this.loadPage = function (page, size) {
        self.loading(true);
        self.error('');
        var requestedFilters = self.appliedFilters();
        return auditLogService.getPage(requestedFilters, page, size, self.sort())
          .then(function (result) {
            var allRows = result.content;
            self.actionOptions(optionProvider(apiConfig.auditLogActions, allRows, 'Action'));
            self.moduleOptions(optionProvider(apiConfig.auditLogModules, allRows, 'Module'));
            var visibleRows = apiConfig.CLIENT_SIDE_FILTERING ? allRows.filter(function (row) {
              return matchesClientFilters(row, requestedFilters);
            }) : allRows;
            self.rows(visibleRows);
            self.columns(self.columns().slice());
            self.totalElements(result.totalElements);
            self.pageNumber(result.number);
            self.pageSize(size);
            return result;
          })
          .catch(function (error) {
            self.error(error && error.message ? error.message : 'Unable to load audit logs.');
            throw error;
          })
          .finally(function () { self.loading(false); });
      };

      this.refresh = function () {
        self.error('');
        return self.pagingModel.setPage(self.pageNumber(), { pageSize: self.pageSize() }).catch(function () {});
      };

      this.applyFilters = function () {
        self.filterError('');
        if (self.actorCustomerId() && !/^\d+$/.test(String(self.actorCustomerId()).trim())) {
          self.filterError('Customer ID must contain digits only.');
          return;
        }
        if (self.fromDate() && self.toDate() && self.fromDate() > self.toDate()) {
          self.filterError('From date must not be after To date.');
          return;
        }
        self.appliedFilters({
          search: String(self.search() || '').trim(),
          action: self.action() || '',
          moduleName: self.moduleName() || '',
          actorCustomerId: String(self.actorCustomerId() || '').trim(),
          fromDate: self.fromDate() || '',
          toDate: self.toDate() || '',
          ipAddress: String(self.ipAddress() || '').trim()
        });
        self.pagingModel.setPage(0, { pageSize: self.pageSize() }).catch(function () {});
      };

      this.clearFilters = function () {
        self.search('');
        self.action('');
        self.moduleName('');
        self.actorCustomerId('');
        self.fromDate('');
        self.toDate('');
        self.ipAddress('');
        self.filterError('');
        self.appliedFilters({});
        self.pagingModel.setPage(0, { pageSize: self.pageSize() }).catch(function () {});
      };

      this.removeFilter = function (event) {
        var key = event.currentTarget.getAttribute('data-filter-key');
        if (key && typeof self[key] === 'function') self[key]('');
        self.applyFilters();
      };

      this.changePageSize = function (event) {
        var size = Number(event.detail.value);
        if (apiConfig.auditLogPageSizes.indexOf(size) !== -1) {
          self.pageSize(size);
          self.pagingModel.setPage(0, { pageSize: size }).catch(function () {});
        }
      };

      this.onFilterKeydown = function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          self.applyFilters();
        }
      };

      this.handleSort = function (event) {
        var detail = event.detail || {};
        if (!detail.header || !detail.direction) return;
        var direction = detail.direction === 'ascending' ? 'asc' : 'desc';
        self.sort(detail.header + ',' + direction);
        self.pagingModel.setPage(0, { pageSize: self.pageSize() }).catch(function () {});
      };

      this.openDetail = function (event) {
        var entry = event.detail && event.detail.context && event.detail.context.item && event.detail.context.item.data;
        if (!entry && event.detail && event.detail.context) entry = event.detail.context.data;
        if (!entry) return;
        self.selectedEntry(entry);
        document.getElementById('auditDetailDialog').open();
      };

      this.closeDetail = function () {
        document.getElementById('auditDetailDialog').close();
      };

      this.formatDate = function (value) {
        if (!value) return '-';
        try { return dateConverter.format(value); } catch (error) { return value; }
      };

      this.actionClass = function (action) {
        if (String(action || '').indexOf('OTP') !== -1) return 'audit-action-chip audit-action-otp';
        if (/PAYMENT|TRANSFER|BILL_PAYMENT/.test(String(action || ''))) return 'audit-action-chip audit-action-success';
        return 'audit-action-chip audit-action-auth';
      };

      this.copyValue = function (value, label) {
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
          self.copyMessage('Clipboard access is unavailable.');
          return;
        }
        navigator.clipboard.writeText(String(value === null || value === undefined ? '' : value))
          .then(function () { self.copyMessage(label + ' copied.'); })
          .catch(function () { self.copyMessage('Unable to copy ' + label.toLowerCase() + '.'); });
      };

      this.copyAuditId = function () {
        if (self.selectedEntry()) self.copyValue(self.selectedEntry().auditId, 'Audit ID');
      };
      this.copyDetails = function () {
        if (self.selectedEntry()) self.copyValue(self.selectedEntry().details, 'Details');
      };

      this.exportCsv = function () {
        var headers = ['Audit ID', 'Date & Time', 'Customer ID', 'Username', 'Action', 'Module', 'Details', 'IP Address'];
        var lines = [headers].concat(self.rows().map(function (row) {
          return [row.auditId, self.formatDate(row.actionTime), row.actorCustomerId, row.actorUsername,
            row.action, row.moduleName, row.details, row.ipAddress];
        }));
        var csv = lines.map(function (line) {
          return line.map(function (value) {
            var text = String(value === null || value === undefined ? '' : value);
            if (/^[=+\-@]/.test(text)) text = "'" + text;
            return '"' + text.replace(/"/g, '""') + '"';
          }).join(',');
        }).join('\r\n');
        var url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        var link = document.createElement('a');
        link.href = url;
        link.download = 'audit-logs-page-' + (self.pageNumber() + 1) + '.csv';
        link.click();
        URL.revokeObjectURL(url);
      };

      this.connected = function () {
        document.title = 'Audit Log | FinThink Bank';
        self.pagingModel.setPage(0, { pageSize: 20 }).catch(function () {});
      };
    }

    function matchesClientFilters(row, filters) {
      filters = filters || {};
      if (filters.action && row.action !== filters.action) return false;
      if (filters.moduleName && row.moduleName !== filters.moduleName) return false;
      if (filters.actorCustomerId && String(row.actorCustomerId) !== String(filters.actorCustomerId)) return false;
      if (filters.ipAddress && String(row.ipAddress || '').toLowerCase().indexOf(filters.ipAddress.toLowerCase()) === -1) return false;
      if (filters.search && String(row.details || '').toLowerCase().indexOf(filters.search.toLowerCase()) === -1) return false;
      var timestamp = row.actionTime ? new Date(row.actionTime).getTime() : NaN;
      if (filters.fromDate && timestamp < new Date(filters.fromDate + 'T00:00:00').getTime()) return false;
      if (filters.toDate && timestamp > new Date(filters.toDate + 'T23:59:59.999').getTime()) return false;
      return true;
    }

  return AuditLogViewModel;
});
