/**
 * Cache — persists all user-entered data to localStorage so that
 * reloading the page always shows exactly what the user last saw.
 * Cached values overwrite the HTML defaults on every page load.
 */

const CACHE_KEY = 'reloc_portfolio_v2';

/* ─── Save ────────────────────────────────────────────────── */

function saveCache() {
    const data = {
        familyUnit:    gatherFamilyUnitState(),
        family:        gatherFamilyState(),
        quantitative:  gatherQuantitativeState(),
        familySupport: gatherFamilySupportState(),
        qualitative:   gatherQualitativeState(),
        qualitativeDeleted: _deletedQualKeys,
        controls:      gatherControlsState(),
        importanceVersion: 2,
    };
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('Cache: save failed', e);
    }
}

function gatherFamilyUnitState() {
    return {
        currentLocation: document.getElementById('familyCurrentLocation')?.value ?? '',
        targetDestinations: document.getElementById('familyTargetDestinations')?.value ?? '',
    };
}

function gatherFamilyState() {
    return Array.from(document.querySelectorAll('.family-member')).map(m => ({
        name:           m.querySelector('.member-name')?.value ?? '',
        age:            m.querySelector('.member-age')?.value ?? '',
        type:           m.querySelector('.member-type')?.value ?? 'Adult',
        gender:         m.querySelector('.member-gender')?.value ?? '',
        profession:     m.querySelector('.member-profession')?.value ?? '',
        race:           m.querySelector('.member-race')?.value ?? '',
        origin:         m.querySelector('.member-origin')?.value ?? '',
        location:       m.querySelector('.member-location')?.value ?? '',
        riskTolerance:  m.querySelector('.member-risk-tolerance')?.value ?? '',
        priorities:     Array.from(m.querySelectorAll('.priority-pill.selected')).map(p => p.dataset.value),
        personalTraits: Array.from(m.querySelectorAll('.trait-btn.selected')).map(t => t.dataset.value),
        hobbies:        m.querySelector('.member-hobbies')?.value ?? '',
        notes:          m.querySelector('.member-notes')?.value ?? '',
    }));
}

function gatherQuantitativeState() {
    const out = {};
    document.querySelectorAll('#tableBody tr').forEach(row => {
        out[row.dataset.city] = Array.from(row.querySelectorAll('input')).map(i => i.value);
    });
    return out;
}

function gatherFamilySupportState() {
    const out = {};
    document.querySelectorAll('#familySupportBody tr').forEach(row => {
        out[row.dataset.city] = [
            row.querySelector('.fs-visits')?.value || '0',
            row.querySelector('.fs-cost')?.value || '0',
            row.querySelector('.fs-help')?.value || '0',
        ];
    });
    return out;
}

function gatherQualitativeState() {
    return Array.from(document.querySelectorAll('#qualitativeTable tbody tr')).map(row => {
        const first = row.querySelector('td');
        const isAdded = !!first.querySelector('.qual-param-name');

        const cells = [];
        const tds = row.querySelectorAll('td');
        for (let i = 1; i < tds.length; i++) {
            const td = tds[i];
            const sel = td.querySelector('select.qual-rating');
            const desc = td.querySelector('p');
            cells.push({
                rating:      sel ? sel.value : null,
                description: desc ? desc.textContent.trim() : '',
            });
        }

        const importance = first.querySelector('.qual-importance')?.value || '3';

        if (isAdded) {
            return {
                isAdded:   true,
                paramName: first.querySelector('.qual-param-name')?.textContent.trim() ?? '',
                emoji:     first.querySelector('.qual-param-emoji')?.textContent.trim() ?? '📌',
                cells,
                importance,
            };
        }
        const paramText = first.querySelector('.qual-param-text')?.textContent?.trim() || first.textContent.trim();
        return { isAdded: false, paramKey: paramText, cells, importance };
    });
}

function gatherControlsState() {
    return {
        period:          document.getElementById('periodSelect')?.value ?? '12',
        currency:        document.getElementById('currencySelect')?.value ?? 'EUR',
        projectionYears: document.getElementById('projectionYearsSelect')?.value ?? '10',
        scoringWeightQuant: document.getElementById('scoringWeightQuant')?.value ?? '40',
    };
}

/* ─── Restore ─────────────────────────────────────────────── */

function restoreCache() {
    let data;
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return false;
        data = JSON.parse(raw);
    } catch (e) {
        console.warn('Cache: restore failed', e);
        return false;
    }

    if (data.familyUnit)   restoreFamilyUnit(data.familyUnit);
    if (data.family)        restoreFamily(data.family);
    if (data.quantitative)  restoreQuantitative(data.quantitative);
    if (data.familySupport) restoreFamilySupport(data.familySupport);
    if (data.qualitativeDeleted) _deletedQualKeys = data.qualitativeDeleted;
    const hasNewImportance = !!data.importanceVersion;
    if (data.qualitative)   restoreQualitative(data.qualitative, data.qualitativeDeleted || [], hasNewImportance);
    if (data.controls)      restoreControls(data.controls);

    return true;
}

function restoreFamilyUnit(data) {
    const loc = document.getElementById('familyCurrentLocation');
    const dest = document.getElementById('familyTargetDestinations');
    if (loc && data.currentLocation !== undefined) loc.value = data.currentLocation;
    if (dest && data.targetDestinations !== undefined) dest.value = data.targetDestinations;
}

function restoreFamily(list) {
    const container = document.getElementById('familyMembers');
    if (!container || !list.length) return;

    container.innerHTML = '';
    memberCount = 0;

    list.forEach((m, i) => {
        addFamilyMember();
        const el = container.querySelectorAll('.family-member')[i];
        if (!el) return;
        const set = (sel, v) => {
            const e = el.querySelector(sel);
            if (e && v !== undefined) e.value = v;
        };
        set('.member-name',           m.name);
        set('.member-age',            m.age);
        set('.member-gender',         m.gender);
        set('.member-profession',     m.profession);
        set('.member-race',           m.race);
        set('.member-origin',         m.origin);
        set('.member-location',       m.location);
        set('.member-risk-tolerance', m.riskTolerance);
        set('.member-type',           m.type);
        set('.member-hobbies',        m.hobbies);
        set('.member-notes',          m.notes);
        if (m.priorities && m.priorities.length) {
            m.priorities.forEach(val => {
                const pill = el.querySelector(`.priority-pill[data-value="${val}"]`);
                if (pill) pill.classList.add('selected');
            });
            const pc = el.querySelector('.member-priorities');
            if (pc) updatePriorityStates(pc);
        }
        if (m.personalTraits && m.personalTraits.length) {
            m.personalTraits.forEach(val => {
                const btn = el.querySelector(`.trait-btn[data-value="${val}"]`);
                if (btn) btn.classList.add('selected');
            });
        }
    });
    updateRemoveButtons();
}

function restoreQuantitative(map) {
    document.querySelectorAll('#tableBody tr').forEach(row => {
        const vals = map[row.dataset.city];
        if (!vals) return;
        const inputs = row.querySelectorAll('input');
        vals.forEach((v, i) => { if (inputs[i]) inputs[i].value = v; });
    });
}

function restoreFamilySupport(map) {
    document.querySelectorAll('#familySupportBody tr').forEach(row => {
        const vals = map[row.dataset.city];
        if (!vals) return;
        const visits = row.querySelector('.fs-visits');
        const cost = row.querySelector('.fs-cost');
        const help = row.querySelector('.fs-help');
        if (visits && vals[0] !== undefined) visits.value = vals[0];
        if (cost && vals[1] !== undefined) cost.value = vals[1];
        if (help && vals[2] !== undefined) help.value = vals[2];
    });
}

function restoreQualitative(qualRows, deletedKeys, restoreImportance) {
    const tbody = document.querySelector('#qualitativeTable tbody');
    if (!tbody) return;

    const deletedSet = new Set(deletedKeys || []);

    // Build a map of original DOM rows keyed by their parameter text
    const domMap = new Map();
    Array.from(tbody.querySelectorAll('tr')).forEach(row => {
        if (!row.querySelector('.qual-param-name')) {
            const td = row.querySelector('td');
            const key = td.querySelector('.qual-param-text')?.textContent?.trim() || td.textContent.trim();
            domMap.set(key, row);
        }
    });

    const cachedOriginals = qualRows.filter(r => !r.isAdded);
    const cachedAdded     = qualRows.filter(r => r.isAdded);

    // Remove only rows the user explicitly deleted (tracked by key)
    domMap.forEach((row, key) => {
        if (deletedSet.has(key)) row.remove();
    });

    // Update kept original rows with cached values
    cachedOriginals.forEach(cached => {
        const row = domMap.get(cached.paramKey);
        if (!row) return;
        applyQualCells(row, cached.cells);
        if (restoreImportance) {
            const impSel = row.querySelector('.qual-importance');
            if (impSel && cached.importance) impSel.value = cached.importance;
        }
    });

    // Recreate user-added rows
    cachedAdded.forEach(rd => {
        addQualitativeRow(true);
        const newRow = tbody.lastElementChild;
        const ns = newRow.querySelector('.qual-param-name');
        const es = newRow.querySelector('.qual-param-emoji');
        if (ns) ns.textContent = rd.paramName;
        if (es) es.textContent = rd.emoji;
        applyQualCells(newRow, rd.cells);
        const impSel = newRow.querySelector('.qual-importance');
        if (impSel && rd.importance) impSel.value = rd.importance;
    });
}

function applyQualCells(row, cellsData) {
    const tds = row.querySelectorAll('td');
    cellsData.forEach((cd, ci) => {
        const td = tds[ci + 1];
        if (!td) return;
        const sel = td.querySelector('select.qual-rating');
        if (sel && cd.rating) {
            sel.value = cd.rating;
            const r = ratingByValue(cd.rating);
            applyRatingStyle(sel, r);
            applyCellStyle(td, r);
        }
        const desc = td.querySelector('p');
        if (desc && cd.description) desc.textContent = cd.description;
    });
}

function restoreControls(c) {
    if (c.period) {
        const el = document.getElementById('periodSelect');
        if (el) el.value = c.period;
    }
    if (c.currency) {
        const el = document.getElementById('currencySelect');
        if (el) el.value = c.currency;
    }
    // projectionYears options are populated by initCharts(), so defer
    if (c.projectionYears) window._cachedProjectionYears = c.projectionYears;
    if (c.scoringWeightQuant) {
        const el = document.getElementById('scoringWeightQuant');
        if (el) { el.value = c.scoringWeightQuant; updateWeightDisplay(); }
    }
}

/* ─── Auto-save wiring ────────────────────────────────────── */

let _saveTimer = null;

function debouncedSave() {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(saveCache, 300);
}

function attachCacheListeners() {
    // Family section — input + change covers text fields and selects
    const family = document.getElementById('familyUnitCard');
    if (family) {
        family.addEventListener('input',  debouncedSave);
        family.addEventListener('change', debouncedSave);
    }

    // Quantitative table
    const tBody = document.getElementById('tableBody');
    if (tBody) tBody.addEventListener('input', debouncedSave);

    // Family support table
    const fsBody = document.getElementById('familySupportBody');
    if (fsBody) fsBody.addEventListener('input', debouncedSave);

    // Qualitative table (selects fire change, contenteditable fires input)
    const qual = document.getElementById('qualitativeTable');
    if (qual) {
        qual.addEventListener('input',  debouncedSave);
        qual.addEventListener('change', debouncedSave);
    }

    // Control dropdowns
    ['periodSelect', 'currencySelect', 'projectionYearsSelect'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', debouncedSave);
    });

    // Structural changes (add/remove family members or qualitative rows)
    const observeChildren = (el) => {
        if (!el) return;
        new MutationObserver(debouncedSave).observe(el, { childList: true });
    };
    observeChildren(document.getElementById('familyMembers'));
    observeChildren(document.querySelector('#qualitativeTable tbody'));
}

/* ─── Clear / reset ───────────────────────────────────────── */

function clearCache() {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem('reloc_cache_v1');
    localStorage.removeItem('gemini_api_key');
    location.reload();
}
