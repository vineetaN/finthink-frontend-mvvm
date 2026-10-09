define([], function () {
  'use strict';

  function money(value) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR'
    }).format(Number(value || 0));
  }

  function decimal(value, maxFractionDigits) {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: maxFractionDigits == null ? 4 : maxFractionDigits
    }).format(Number(value || 0));
  }

  function nav(value) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(Number(value || 0));
  }

  function date(value) {
    if (!value) return '—';
    var parsed = new Date(value + (value.length === 10 ? 'T00:00:00' : ''));
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  function validAmount(value) {
    return /^\d{1,13}(?:\.\d{1,2})?$/.test(String(value).trim()) && Number(value) >= 0.01;
  }

  return { money: money, nav: nav, decimal: decimal, date: date, validAmount: validAmount };
});
