/* ───────────────────────────────────────────────────────
   Qualitative Analysis — editable dropdowns + descriptions
                          + importance weight per parameter
   ─────────────────────────────────────────────────────── */

const RATING_OPTIONS = [
    { value: 'top',      label: '✅ Top',      bg: 'bg-emerald-100', text: 'text-emerald-700', cellBg: 'bg-emerald-50/40', descText: 'text-emerald-700', descWeight: 'font-medium' },
    { value: 'medium',   label: '⚠️ Medium',   bg: 'bg-amber-100',   text: 'text-amber-700',   cellBg: null,               descText: 'text-slate-500',   descWeight: '' },
    { value: 'low',      label: '➖ Low',      bg: 'bg-slate-100',   text: 'text-slate-500',   cellBg: null,               descText: 'text-slate-500',   descWeight: '' },
    { value: 'critical', label: '❌ Critical', bg: 'bg-red-100',     text: 'text-red-600',     cellBg: null,               descText: 'text-slate-500',   descWeight: '' },
];

const ALL_BG   = RATING_OPTIONS.map(r => r.bg);
const ALL_TEXT  = RATING_OPTIONS.map(r => r.text);
const ALL_CELL  = RATING_OPTIONS.filter(r => r.cellBg).map(r => r.cellBg);
const ALL_DESC  = [...new Set(RATING_OPTIONS.map(r => r.descText))];
const ALL_WEIGHT = ['font-medium'];

function ratingByValue(v) {
    return RATING_OPTIONS.find(r => r.value === v) || RATING_OPTIONS[1];
}

function detectCurrentValue(spanText) {
    const t = spanText.toLowerCase();
    if (t.includes('critical'))          return 'critical';
    if (t.includes('low'))              return 'low';
    if (t.includes('medium'))           return 'medium';
    if (t.includes('top') || t.includes('good')) return 'top';
    return null;
}

function applyRatingStyle(select, rating) {
    select.classList.remove(...ALL_BG, ...ALL_TEXT);
    select.classList.add(rating.bg, rating.text);
}

function applyCellStyle(td, rating) {
    td.classList.remove(...ALL_CELL);
    if (rating.cellBg) td.classList.add(rating.cellBg);

    const desc = td.querySelector('.qual-desc');
    if (desc) {
        desc.classList.remove(...ALL_DESC, ...ALL_WEIGHT);
        desc.classList.add(rating.descText);
        if (rating.descWeight) desc.classList.add(rating.descWeight);
    }
}

function buildRatingSelect(initialValue) {
    const rating = ratingByValue(initialValue);
    const select = document.createElement('select');
    select.className = 'qual-rating text-xs font-bold px-2 py-1 rounded-full border-none focus:outline-none focus:ring-2 cursor-pointer';
    RATING_OPTIONS.forEach(opt => {
        const o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label;
        if (opt.value === initialValue) o.selected = true;
        select.appendChild(o);
    });
    applyRatingStyle(select, rating);
    select.addEventListener('change', function () {
        const r = ratingByValue(this.value);
        applyRatingStyle(this, r);
        applyCellStyle(this.closest('td'), r);
    });
    return select;
}

/* ─── Importance weight selector (1-5) ───────────────────── */

const IMPORTANCE_OPTIONS = [
    { value: '1', label: '1 — Very Low' },
    { value: '2', label: '2 — Low' },
    { value: '3', label: '3 — Medium' },
    { value: '4', label: '4 — High' },
    { value: '5', label: '5 — Very High' },
];

function buildImportanceSelect(defaultValue) {
    const select = document.createElement('select');
    select.className = 'qual-importance text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-200 cursor-pointer';
    IMPORTANCE_OPTIONS.forEach(opt => {
        const o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label;
        if (opt.value === String(defaultValue)) o.selected = true;
        select.appendChild(o);
    });
    return select;
}

/* ─── Default importance weights per parameter ────────────── */

const DEFAULT_IMPORTANCE = {
    'Quality of Life':      4,
    'School & Education':   4,
    'Safety':               5,
    'Future Prospects':     3,
    'Healthcare':           5,
    'Family Support':       5,
    'Weather':              2,
    'Food':                 2,
    'Integration':          3,
    'Discrimination':       3,
    'Political Orientation': 1,
};

function getDefaultImportance(paramText) {
    if (!paramText) return 3;
    const clean = paramText.replace(/^[\s\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Component}\uFE0F\u200D]+/gu, '').trim();
    return DEFAULT_IMPORTANCE[clean] || 3;
}

/* ─── Init: convert static HTML badges → dropdowns ───────── */

function initQualitativeDropdowns() {
    const table = document.getElementById('qualitativeTable');
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');

    rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        const paramCell = cells[0];

        if (paramCell && !paramCell.querySelector('.qual-param-text') && !paramCell.querySelector('.qual-param-name')) {
            const existing = paramCell.innerHTML;
            paramCell.innerHTML = `<div class="flex items-center gap-1.5"><span class="qual-param-text flex-1">${existing}</span><button onclick="removeQualitativeRow(this)" class="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0" title="Remove row"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button></div>`;
        }

        if (paramCell && !paramCell.querySelector('.qual-importance')) {
            const paramText = paramCell.querySelector('.qual-param-text')?.textContent?.trim() || paramCell.textContent.trim();
            const defaultImp = getDefaultImportance(paramText);
            const wrapper = document.createElement('div');
            wrapper.className = 'mt-1';
            wrapper.appendChild(buildImportanceSelect(defaultImp));
            paramCell.appendChild(wrapper);
        }

        for (let idx = 1; idx < cells.length; idx++) {
            const td = cells[idx];
            const span = td.querySelector('span.text-xs.font-bold');
            if (!span) continue;

            const currentValue = detectCurrentValue(span.textContent);
            if (!currentValue) continue;

            const rating = ratingByValue(currentValue);
            const select = buildRatingSelect(currentValue);
            span.replaceWith(select);

            const desc = td.querySelector('p');
            if (desc) {
                desc.classList.add('qual-desc');
                desc.setAttribute('contenteditable', 'true');
                desc.style.cursor = 'text';
            }

            applyCellStyle(td, rating);
        }
    });
}

function addQualitativeRow(skipFocus) {
    const tbody = document.querySelector('#qualitativeTable tbody');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-100 hover:bg-slate-50/50 transition-colors';

    // Parameter name cell (editable) + importance
    const nameTd = document.createElement('td');
    nameTd.className = 'py-4 px-3 font-bold text-sm text-slate-700';
    nameTd.innerHTML = `
        <div class="flex items-center gap-1.5">
            <span class="mr-1.5 qual-param-emoji" contenteditable="true" title="Click to change emoji">📌</span>
            <span class="qual-param-name flex-1" contenteditable="true" style="cursor:text;outline:none;" data-placeholder="Parameter name">New Parameter</span>
            <button onclick="removeQualitativeRow(this)" class="text-slate-300 hover:text-red-500 transition-colors ml-1 flex-shrink-0" title="Remove row">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>`;

    // Add importance select
    const impWrapper = document.createElement('div');
    impWrapper.className = 'mt-1';
    impWrapper.appendChild(buildImportanceSelect(3));
    nameTd.appendChild(impWrapper);

    tr.appendChild(nameTd);

    // One city cell per column
    const defaultRating = 'medium';
    for (let i = 0; i < 4; i++) {
        const td = document.createElement('td');
        td.className = 'py-4 px-3';

        const select = buildRatingSelect(defaultRating);
        td.appendChild(select);

        const desc = document.createElement('p');
        desc.className = 'qual-desc text-[11px] text-slate-500 leading-relaxed mt-2';
        desc.setAttribute('contenteditable', 'true');
        desc.style.cursor = 'text';
        desc.textContent = 'Click to add description…';
        td.appendChild(desc);

        applyCellStyle(td, ratingByValue(defaultRating));
        tr.appendChild(td);
    }

    tbody.appendChild(tr);

    if (!skipFocus) {
        const nameSpan = tr.querySelector('.qual-param-name');
        if (nameSpan) {
            nameSpan.focus();
            const range = document.createRange();
            range.selectNodeContents(nameSpan);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
        }
    }
}

let _deletedQualKeys = [];

function removeQualitativeRow(btn) {
    const row = btn.closest('tr');
    if (row) {
        const td = row.querySelector('td');
        const isAdded = !!td?.querySelector('.qual-param-name');
        if (!isAdded) {
            const key = td?.querySelector('.qual-param-text')?.textContent?.trim() || td?.textContent?.trim();
            if (key) _deletedQualKeys.push(key);
        }
        row.remove();
        if (typeof debouncedSave === 'function') debouncedSave();
    }
}

document.addEventListener('DOMContentLoaded', initQualitativeDropdowns);
