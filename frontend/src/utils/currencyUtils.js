/**
 * Currency utility functions for displaying proper currency symbols
 */

const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CNY: '¥',
  KRW: '₩',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  SGD: 'S$',
  HKD: 'HK$',
  NZD: 'NZ$',
  ZAR: 'R',
  BRL: 'R$',
  MXN: 'MX$',
  THB: '฿',
  RUB: '₽',
  PLN: 'zł',
  TRY: '₺',
  AED: 'د.إ',
  SAR: '﷼',
  MYR: 'RM',
  PHP: '₱',
  IDR: 'Rp',
  VND: '₫',
  TWD: 'NT$',
  ARS: 'AR$',
  CLP: 'CL$',
  COP: 'COL$',
  EGP: 'E£',
  NGN: '₦',
  PKR: '₨',
  LKR: '₨',
  BDT: '৳',
  NPR: 'रू',
};

/**
 * Get the currency symbol for a given currency code
 * @param {string} currencyCode - ISO 4217 currency code (e.g., 'USD', 'INR', 'EUR')
 * @returns {string} The currency symbol (e.g., '$', '₹', '€')
 */
export const getCurrencySymbol = (currencyCode) => {
  if (!currencyCode) return '$';
  return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || currencyCode;
};

/**
 * Format an amount with the proper currency symbol
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - ISO 4217 currency code (e.g., 'USD', 'INR', 'EUR')
 * @returns {string} Formatted amount string (e.g., '₹12,500.00', '$45.00')
 */
export const formatCurrency = (amount, currencyCode) => {
  const symbol = getCurrencySymbol(currencyCode);
  const formattedAmount = Number(amount).toFixed(2);
  return `${symbol}${formattedAmount}`;
};
