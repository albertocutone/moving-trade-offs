/**
 * Currency — exchange rate fetching and conversion utilities.
 */

// Illustrative fallback rates, not current market quotes.
let exchangeRates = { EUR: 1, GBP: 0.85, USD: 1.1, CHF: 0.95 };
let ratesBaseCurrency = 'EUR';

const CURRENCY_SYMBOLS = { EUR: '€', GBP: '£', USD: '$', CHF: 'CHF ' };

async function fetchExchangeRates() {
    document.getElementById('rateInfo').textContent = 'Illustrative exchange rates while live rates load';
    document.getElementById('rateInfo').classList.remove('hidden');
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/EUR');
        const data = await res.json();
        if (data.result !== 'success') throw new Error('Exchange-rate service unavailable');
        if (data.result === 'success') {
            exchangeRates = data.rates;
            const dateStr = data.time_last_update_utc
                ? new Date(data.time_last_update_utc).toLocaleDateString('en-GB')
                : '';
            document.getElementById('rateInfo').textContent = `Live rates updated: ${dateStr}`;
            document.getElementById('rateInfo').classList.remove('hidden');
            if (typeof performCalculation === 'function') performCalculation();
        }
    } catch (e) {
        document.getElementById('rateInfo').textContent = 'Illustrative fallback exchange rates — live rates unavailable';
        document.getElementById('rateInfo').classList.remove('hidden');
    }
}

function convertCurrency(amount, fromCurrency, toCurrency) {
    if (!exchangeRates || fromCurrency === toCurrency) return amount;
    const fromRate = fromCurrency === 'EUR' ? 1 : exchangeRates[fromCurrency];
    const toRate = toCurrency === 'EUR' ? 1 : exchangeRates[toCurrency];
    if (!fromRate || !toRate) return amount;
    return (amount / fromRate) * toRate;
}
