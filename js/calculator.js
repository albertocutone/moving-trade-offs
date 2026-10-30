/**
 * Calculator — core calculation logic, period/currency change handlers.
 * Auto-triggers on input changes (debounced).
 */

let lastRawSavings = [];
let _calcTimer = null;
let _fsTimer = null;

function debouncedCalculation() {
    clearTimeout(_calcTimer);
    _calcTimer = setTimeout(performCalculation, 250);
}

function debouncedFamilySupport() {
    clearTimeout(_fsTimer);
    _fsTimer = setTimeout(computeFamilySupport, 250);
}

function attachAutoCalcListeners() {
    const tBody = document.getElementById('tableBody');
    if (tBody) tBody.addEventListener('input', debouncedCalculation);

    const fsBody = document.getElementById('familySupportBody');
    if (fsBody) fsBody.addEventListener('input', debouncedFamilySupport);
}

function getMultiplier() {
    return parseInt(document.getElementById('periodSelect').value) || 1;
}

function getPeriodLabel() {
    const m = getMultiplier();
    return { 1: 'Monthly', 3: 'Quarterly', 6: 'Semi-annual', 12: 'Yearly' }[m] || 'Monthly';
}

function applyConversion(targetCurrency) {
    if (!exchangeRates || lastRawSavings.length === 0) return;
    const sym = CURRENCY_SYMBOLS[targetCurrency] || targetCurrency + ' ';
    const mult = getMultiplier();
    const converted = lastRawSavings.map(s => {
        const native = s.currency === '£' ? 'GBP' : 'EUR';
        return Math.round(convertCurrency(s.value, native, targetCurrency) * mult);
    });
    if (savingsChart) {
        const label = getPeriodLabel() + ' Net Savings';
        savingsChart.data.datasets[0].data = converted;
        savingsChart.data.datasets[0].label = label;
        savingsChart.options.scales.y.ticks = {
            callback: v => sym + v.toLocaleString()
        };
        savingsChart.options.plugins.tooltip = {
            callbacks: {
                label: ctx => sym + ctx.parsed.y.toLocaleString()
            }
        };
        savingsChart.update();
    }
    updateNetWorthProjection();
}

function onPeriodChange() {
    if (lastRawSavings.length === 0) return;
    const selectedCurrency = document.getElementById('currencySelect').value;
    if (exchangeRates) {
        applyConversion(selectedCurrency);
    }
}

function onCurrencyChange() {
    const target = document.getElementById('currencySelect').value;
    if (!exchangeRates) {
        alert('Exchange rates not loaded yet. Try again in a few seconds.');
        document.getElementById('currencySelect').value = 'EUR';
        return;
    }
    document.getElementById('rateInfo').classList.remove('hidden');
    applyConversion(target);
}

function performCalculation() {
    const rows = document.querySelectorAll('#tableBody tr');
    const savingsData = [];
    lastRawSavings = [];

    rows.forEach((row, index) => {
        const inputs = row.querySelectorAll('input');
        const incHim = parseFloat(inputs[0].value) || 0;
        const incHer = parseFloat(inputs[1].value) || 0;
        const rent = parseFloat(inputs[2].value) || 0;
        const childcare = parseFloat(inputs[3].value) || 0;
        const food = parseFloat(inputs[4].value) || 0;
        const transport = parseFloat(inputs[5].value) || 0;
        const other = parseFloat(inputs[6].value) || 0;

        const totalIncome = incHim + incHer;
        const totalExpenses = rent + childcare + food + transport + other;
        const savings = totalIncome - totalExpenses;

        const resultCell = row.querySelector('.result');
        const currency = row.dataset.currency || '€';
        resultCell.innerText = currency + ' ' + savings.toLocaleString();
        resultCell.className = `py-3 px-2 bg-slate-50 font-black text-center align-middle text-lg result ${savings < 0 ? 'text-red-500' : 'text-slate-900'}`;

        savingsData.push(savings);
        lastRawSavings.push({ value: savings, currency: currency });

        if (breakdownCharts[index]) {
            breakdownCharts[index].data.datasets[0].data = [rent, childcare, food, transport, other, Math.max(0, savings)];
            breakdownCharts[index].update();
        }
    });

    const selectedCurrency = document.getElementById('currencySelect').value;
    if (exchangeRates) {
        applyConversion(selectedCurrency);
    } else {
        if (savingsChart) {
            savingsChart.data.datasets[0].data = savingsData;
            savingsChart.update();
        }
        updateNetWorthProjection();
    }
}

function updateNetWorthProjection() {
    if (!netWorthChart || lastRawSavings.length === 0) return;

    const years = parseInt(document.getElementById('projectionYearsSelect').value) || 10;
    const targetCurrency = document.getElementById('currencySelect').value;
    const sym = CURRENCY_SYMBOLS[targetCurrency] || targetCurrency + ' ';

    const monthlySavings = lastRawSavings.map(s => {
        const native = s.currency === '£' ? 'GBP' : 'EUR';
        return exchangeRates
            ? convertCurrency(s.value, native, targetCurrency)
            : s.value;
    });

    const labels = [];
    for (let y = 0; y <= years; y++) labels.push('Year ' + y);

    netWorthChart.data.labels = labels;
    netWorthChart.data.datasets.forEach((ds, i) => {
        const monthly = monthlySavings[i] || 0;
        ds.data = labels.map((_, y) => Math.round(monthly * 12 * y));
    });

    netWorthChart.options.scales.y.title.text = 'Cumulative Net Savings (' + sym.trim() + ')';
    netWorthChart.options.scales.y.ticks = {
        callback: v => sym + v.toLocaleString()
    };
    netWorthChart.options.plugins.tooltip = {
        mode: 'index',
        intersect: false,
        callbacks: {
            label: ctx => ctx.dataset.label + ': ' + sym + ctx.parsed.y.toLocaleString()
        }
    };

    netWorthChart.update();
}

function computeFamilySupport() {
    const rows = document.querySelectorAll('#familySupportBody tr');
    rows.forEach(row => {
        const visits = parseInt(row.querySelector('.fs-visits')?.value) || 0;
        const costPerTrip = parseInt(row.querySelector('.fs-cost')?.value) || 0;
        const extraHelp = parseInt(row.querySelector('.fs-help')?.value) || 0;
        const total = Math.round((visits * costPerTrip) / 12 + extraHelp);
        const currency = row.dataset.currency || '€';
        const resultCell = row.querySelector('.fs-result');
        resultCell.innerText = currency + ' ' + total.toLocaleString();
        resultCell.className = `py-3 px-2 bg-slate-50 font-black text-center align-middle text-lg fs-result ${total > 200 ? 'text-red-500' : 'text-slate-900'}`;
    });
}
