/** Interactive charts for the public demo; no AI key is required. */
let savingsChart = null;
let breakdownCharts = [];
let netWorthChart = null;

const CITY_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#64748b'];
const CITY_LABELS = ['Manchester', 'Bologna', 'Florence Center', 'Florence Suburbs'];

function initCharts() {
    const yearSelect = document.getElementById('projectionYearsSelect');
    if (yearSelect && yearSelect.children.length === 0) {
        const frag = document.createDocumentFragment();
        for (let y = 1; y <= 50; y++) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            opt.selected = y === 10;
            frag.appendChild(opt);
        }
        yearSelect.appendChild(frag);
    }
    if (typeof Chart === 'undefined') return;
    savingsChart = new Chart(document.getElementById('canvasRisparmio'), {
        type: 'bar',
        data: { labels: CITY_LABELS, datasets: [{ label: 'Yearly Net Savings', data: [], backgroundColor: CITY_COLORS }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } },
        },
    });
    breakdownCharts = CITY_LABELS.map((city, i) => new Chart(document.getElementById('canvasComp' + i), {
        type: 'doughnut',
        data: {
            labels: ['Rent', 'Childcare', 'Food', 'Transport', 'Other', 'Savings'],
            datasets: [{ data: [], backgroundColor: ['#334155', '#f43f5e', '#fbbf24', '#8b5cf6', '#94a3b8', '#10b981'] }],
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
        },
    }));
    netWorthChart = new Chart(document.getElementById('canvasNetWorth'), {
        type: 'line',
        data: {
            labels: [],
            datasets: CITY_LABELS.map((city, i) => ({ label: city, data: [], borderColor: CITY_COLORS[i], backgroundColor: CITY_COLORS[i], tension: 0.1 })),
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, title: { display: true, text: 'Cumulative Net Savings' } } },
            plugins: { tooltip: { mode: 'index', intersect: false } },
        },
    });
}
