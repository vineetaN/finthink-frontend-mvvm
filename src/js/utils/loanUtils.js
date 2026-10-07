(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.loanUtils = factory();
  }
}(this, function () {
  'use strict';

  function parseDate(dateValue) {
    if (!dateValue) {
      return null;
    }

    var trimmed = String(dateValue).trim();
    if (!trimmed) {
      return null;
    }

    var parsed = new Date(trimmed + 'T00:00:00');
    if (Number.isNaN(parsed.getTime())) {
      parsed = new Date(trimmed);
    }

    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  }

  function formatDateDisplay(value) {
    var parsed = parseDate(value);
    if (!parsed) {
      return '';
    }

    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function formatDateIso(value) {
    var parsed = parseDate(value);
    if (!parsed) {
      return '';
    }

    var year = parsed.getFullYear();
    var month = String(parsed.getMonth() + 1).padStart(2, '0');
    var day = String(parsed.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function addMonths(dateValue, months) {
    var parsed = parseDate(dateValue);
    if (!parsed) {
      return null;
    }

    var target = new Date(parsed.getFullYear(), parsed.getMonth() + months, parsed.getDate());
    return target;
  }

  function differenceInDays(fromValue, toValue) {
    var fromDate = parseDate(fromValue);
    var toDate = parseDate(toValue);
    if (!fromDate || !toDate) {
      return 0;
    }
    var difference = toDate.getTime() - fromDate.getTime();
    return Math.round(difference / 86400000);
  }

  function calculateIndicativeEmi(principalAmount, annualInterestRate, tenureMonths) {
    var principal = Number(principalAmount) || 0;
    var months = Number(tenureMonths) || 0;
    var rate = Number(annualInterestRate) || 0;

    if (principal <= 0 || months <= 0) {
      return 0;
    }

    if (rate <= 0) {
      return principal / months;
    }

    var monthlyRate = rate / 100 / 12;
    var numerator = principal * monthlyRate;
    var denominator = 1 - Math.pow(1 + monthlyRate, -months);

    if (denominator === 0) {
      return principal / months;
    }

    return numerator / denominator;
  }

  function buildRepaymentSchedule(principalAmount, annualInterestRate, tenureMonths, startDate) {
    var principal = Number(principalAmount) || 0;
    var months = Number(tenureMonths) || 0;
    var start = parseDate(startDate);
    if (!start || principal <= 0 || months <= 0) {
      return [];
    }

    var monthlyRate = (Number(annualInterestRate) || 0) / 100 / 12;
    var emi = calculateIndicativeEmi(principal, annualInterestRate, months);
    var balance = principal;
    var rows = [];

    for (var index = 1; index <= Math.min(months, 12); index += 1) {
      var interest = balance * monthlyRate;
      var principalPart = Math.max(0, emi - interest);
      if (balance < principalPart) {
        principalPart = balance;
      }
      balance = Math.max(0, balance - principalPart);
      var dueDate = addMonths(startDate, index - 1);
      rows.push({
        no: index,
        dueDate: formatDateIso(dueDate),
        emi: emi,
        principalPart: principalPart,
        interestPart: interest,
        balance: balance
      });
    }

    return rows;
  }

  function escapeCsvCell(value) {
    var text = value === null || value === undefined ? '' : String(value);
    text = text.replace(/\r\n|\r|\n/g, ' ');
    if (/[",\n]/.test(text)) {
      text = '"' + text.replace(/"/g, '""') + '"';
    }
    if (text.match(/^[=+\-@]/)) {
      text = "'" + text;
    }
    return text;
  }

  function normalizeLoanType(value, shouldNormalize) {
    var source = value === undefined || value === null ? '' : String(value).trim();
    if (!source) {
      return '';
    }

    if (shouldNormalize !== false) {
      return source.toUpperCase().replace(/\s+/g, '_');
    }

    return source;
  }

  return {
    parseDate: parseDate,
    formatDateDisplay: formatDateDisplay,
    formatDateIso: formatDateIso,
    addMonths: addMonths,
    differenceInDays: differenceInDays,
    calculateIndicativeEmi: calculateIndicativeEmi,
    buildRepaymentSchedule: buildRepaymentSchedule,
    escapeCsvCell: escapeCsvCell,
    normalizeLoanType: normalizeLoanType
  };
}));
