/**
 * Podium — visual ranking of cities by net savings.
 */

const MEDALS = ['🥇', '🥈', '🥉', '4th'];
const PODIUM_COLORS = [
    { bar: 'bg-amber-400',  text: 'text-amber-900',  border: 'border-amber-500',  glow: 'shadow-amber-200' },
    { bar: 'bg-slate-300',  text: 'text-slate-700',   border: 'border-slate-400',  glow: 'shadow-slate-200' },
    { bar: 'bg-amber-700',  text: 'text-amber-100',   border: 'border-amber-800',  glow: 'shadow-amber-300' },
    { bar: 'bg-slate-200',  text: 'text-slate-500',   border: 'border-slate-300',  glow: 'shadow-slate-100' },
];

const MAX_BAR_HEIGHT = 180;
const MIN_BAR_HEIGHT = 40;

function updatePodium() {
    const container = document.getElementById('podiumContainer');
    if (!container) return;
    if (!lastRawSavings || lastRawSavings.length === 0) return;

    const targetCurrency = document.getElementById('currencySelect').value;
    const sym = CURRENCY_SYMBOLS[targetCurrency] || targetCurrency + ' ';

    const cities = lastRawSavings.map((s, i) => {
        const native = s.currency === '£' ? 'GBP' : 'EUR';
        const converted = exchangeRates
            ? Math.round(convertCurrency(s.value, native, targetCurrency))
            : s.value;
        return {
            name: CITY_LABELS[i],
            savings: converted,
            color: CITY_COLORS[i],
        };
    });

    const ranked = [...cities].sort((a, b) => b.savings - a.savings);
    const maxSavings = Math.max(...ranked.map(c => c.savings), 1);

    // Podium order: Silver (2nd) | Gold (1st) | Bronze (3rd) | 4th
    const podiumOrder = ranked.length >= 4
        ? [ranked[1], ranked[0], ranked[2], ranked[3]]
        : ranked;

    let html = '';
    podiumOrder.forEach((city, visualIdx) => {
        const rank = ranked.indexOf(city);
        const medal = MEDALS[rank];
        const style = PODIUM_COLORS[rank];
        const ratio = Math.max(city.savings / maxSavings, 0.15);
        const barHeight = Math.round(MIN_BAR_HEIGHT + (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT) * ratio);
        const isGold = rank === 0;

        html += `
            <div class="flex flex-col items-center flex-1 min-w-0">
                <div class="text-2xl mb-1 ${isGold ? 'text-4xl animate-bounce-slow' : ''}">${medal}</div>
                <div class="text-xs font-black text-slate-700 mb-0.5 truncate max-w-full px-1">${city.name}</div>
                <div class="text-[11px] font-bold text-slate-500 mb-2">${sym}${city.savings.toLocaleString()}/mo</div>
                <div class="w-full rounded-t-xl ${style.bar} border-2 ${style.border} shadow-lg ${style.glow} flex items-end justify-center transition-all duration-700 ease-out relative"
                     style="height: ${barHeight}px;">
                    <span class="text-lg font-black ${style.text} mb-2">#${rank + 1}</span>
                </div>
            </div>`;
    });

    container.innerHTML = html;
    document.getElementById('podiumSection').classList.remove('hidden');
}
