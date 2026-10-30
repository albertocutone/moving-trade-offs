/**
 * Family — family member CRUD (add, remove, renumber), data collection,
 * and interactive priority/trait selectors.
 */

let memberCount = 4;

/* ─── Priority & Trait definitions ───────────────────────── */

const PRIORITY_OPTIONS = [
    { value: 'Kids', emoji: '👶' },
    { value: 'Parents', emoji: '👨‍👩‍👦' },
    { value: 'Career', emoji: '💼' },
    { value: 'Free Time', emoji: '🏖️' },
    { value: 'Health', emoji: '💪' },
    { value: 'Travel', emoji: '✈️' },
    { value: 'Financial Security', emoji: '🏦' },
    { value: 'Social Life', emoji: '🎉' },
    { value: 'Personal Growth', emoji: '📚' },
    { value: 'Hobbies', emoji: '🎨' },
];

const TRAIT_PAIRS = [
    { pair: 'social',    a: { value: 'Introverted',     emoji: '🤫' }, b: { value: 'Extroverted',      emoji: '🎤' } },
    { pair: 'outlook',   a: { value: 'Optimist',        emoji: '☀️' }, b: { value: 'Pessimist',        emoji: '🌧️' } },
    { pair: 'planning',  a: { value: 'Spontaneous',     emoji: '🎲' }, b: { value: 'Planner',          emoji: '📋' } },
    { pair: 'autonomy',  a: { value: 'Independent',     emoji: '🦅' }, b: { value: 'Family-oriented',  emoji: '👨‍👩‍👧' } },
    { pair: 'risk',      a: { value: 'Adventurous',     emoji: '🧗' }, b: { value: 'Cautious',         emoji: '🛡️' } },
    { pair: 'emotion',   a: { value: 'Emotional',       emoji: '💖' }, b: { value: 'Rational',         emoji: '🧠' } },
    { pair: 'thinking',  a: { value: 'Creative',        emoji: '🎨' }, b: { value: 'Analytical',       emoji: '📊' } },
    { pair: 'role',      a: { value: 'Leader',           emoji: '👑' }, b: { value: 'Follower',         emoji: '🤝' } },
];

/* ─── HTML generators ────────────────────────────────────── */

function buildPrioritiesHTML() {
    const pills = PRIORITY_OPTIONS.map(p =>
        `<button type="button" data-value="${p.value}" class="priority-pill">${p.emoji} ${p.value}</button>`
    ).join('\n            ');
    return `<div class="mt-3">
        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Priorities <span class="font-medium text-slate-300">(pick up to 3)</span></label>
        <div class="member-priorities flex flex-wrap gap-1.5">
            ${pills}
        </div>
    </div>`;
}

function buildTraitsHTML() {
    const pairs = TRAIT_PAIRS.map(t =>
        `<div class="trait-pair" data-pair="${t.pair}">
                <button type="button" data-value="${t.a.value}" class="trait-btn">${t.a.emoji} ${t.a.value}</button>
                <button type="button" data-value="${t.b.value}" class="trait-btn">${t.b.emoji} ${t.b.value}</button>
            </div>`
    ).join('\n            ');
    return `<div class="mt-3">
        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Personal Traits <span class="font-medium text-slate-300">(opposites are exclusive)</span></label>
        <div class="member-trait-toggles flex flex-wrap gap-x-3 gap-y-1.5">
            ${pairs}
        </div>
    </div>`;
}

function buildMemberExtrasHTML() {
    return buildPrioritiesHTML() + buildTraitsHTML() + `<div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Hobbies</label>
            <input type="text" value="" class="member-hobbies w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all" placeholder="e.g. hiking, reading, cooking, gaming...">
        </div>
        <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Notes</label>
            <input type="text" value="" class="member-notes w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all" placeholder="Any additional info...">
        </div>
    </div>`;
}

/* ─── Inject extras into static HTML members ─────────────── */

function initMemberExtras() {
    document.querySelectorAll('.family-member').forEach(m => {
        // Inject Type select into second row
        if (!m.querySelector('.member-type')) {
            const grid = m.querySelector('.mt-3.grid');
            if (grid) {
                grid.className = grid.className.replace('grid-cols-[160px_1fr]', 'grid-cols-[100px_160px_1fr]');
                const age = parseInt(m.querySelector('.member-age')?.value) || 0;
                const isChild = age > 0 && age < 16;
                const typeDiv = document.createElement('div');
                typeDiv.innerHTML = `
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Type</label>
                    <select class="member-type w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all">
                        <option value="Adult" ${!isChild ? 'selected' : ''}>👤 Adult</option>
                        <option value="Child" ${isChild ? 'selected' : ''}>👶 Child</option>
                    </select>`;
                grid.insertBefore(typeDiv, grid.firstChild);
            }
        }

        // Inject priorities + traits + hobbies + notes
        if (!m.querySelector('.member-priorities')) {
            m.insertAdjacentHTML('beforeend', buildMemberExtrasHTML());
        }
    });
}

/* ─── Event delegation for priorities & traits ───────────── */

function initFamilyInteractions() {
    const card = document.getElementById('familyUnitCard');
    if (!card) return;

    card.addEventListener('click', (e) => {
        const pill = e.target.closest('.priority-pill');
        if (pill) {
            handlePriorityClick(pill);
            if (typeof debouncedSave === 'function') debouncedSave();
            return;
        }

        const traitBtn = e.target.closest('.trait-btn');
        if (traitBtn) {
            handleTraitClick(traitBtn);
            if (typeof debouncedSave === 'function') debouncedSave();
            return;
        }
    });
}

function handlePriorityClick(pill) {
    if (pill.classList.contains('disabled')) return;
    const container = pill.closest('.member-priorities');
    if (!container) return;

    if (pill.classList.contains('selected')) {
        pill.classList.remove('selected');
    } else {
        const selected = container.querySelectorAll('.priority-pill.selected');
        if (selected.length >= 3) return;
        pill.classList.add('selected');
    }
    updatePriorityStates(container);
}

function updatePriorityStates(container) {
    const selected = container.querySelectorAll('.priority-pill.selected');
    container.querySelectorAll('.priority-pill').forEach(p => {
        if (selected.length >= 3 && !p.classList.contains('selected')) {
            p.classList.add('disabled');
        } else {
            p.classList.remove('disabled');
        }
    });
}

function handleTraitClick(btn) {
    const pair = btn.closest('.trait-pair');
    if (!pair) return;

    if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
    } else {
        pair.querySelectorAll('.trait-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    }
}

/* ─── Scoring weight display ─────────────────────────────── */

function updateWeightDisplay() {
    const quant = parseInt(document.getElementById('scoringWeightQuant')?.value) || 40;
    const qual = 100 - quant;
    const quantLabel = document.getElementById('scoringWeightQuantLabel');
    const qualLabel = document.getElementById('scoringWeightQualLabel');
    const formulaQuant = document.getElementById('formulaQuantPct');
    const formulaQual = document.getElementById('formulaQualPct');
    if (quantLabel) quantLabel.textContent = quant + '%';
    if (qualLabel) qualLabel.textContent = qual + '%';
    if (formulaQuant) formulaQuant.textContent = (quant / 100).toFixed(2).replace(/0$/, '');
    if (formulaQual) formulaQual.textContent = (qual / 100).toFixed(2).replace(/0$/, '');
    if (typeof debouncedSave === 'function') debouncedSave();
}

function getScoringWeights() {
    const quant = parseInt(document.getElementById('scoringWeightQuant')?.value) || 40;
    return { quant: quant / 100, qual: (100 - quant) / 100 };
}

/* ─── CRUD ───────────────────────────────────────────────── */

function addFamilyMember() {
    memberCount++;
    const container = document.getElementById('familyMembers');
    const div = document.createElement('div');
    div.className = 'family-member border border-slate-200 rounded-xl p-4 mb-4 bg-slate-50/50';
    div.dataset.memberIndex = memberCount - 1;
    div.innerHTML = `
        <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-black text-slate-700">Member ${memberCount}</span>
            <button onclick="removeFamilyMember(this)" class="text-slate-300 hover:text-red-500 transition-colors remove-btn" title="Remove member">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Name</label>
                <input type="text" value="" class="member-name w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all" placeholder="Name">
            </div>
            <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Age</label>
                <input type="number" value="" class="member-age w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all" placeholder="Age">
            </div>
            <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Gender</label>
                <select class="member-gender w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Profession</label>
                <input type="text" value="" class="member-profession w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all" placeholder="Profession">
            </div>
            <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Race</label>
                <select class="member-race w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all">
                    <option value="European / White">European / White</option>
                    <option value="Black / African">Black / African</option>
                    <option value="South Asian">South Asian</option>
                    <option value="East Asian">East Asian</option>
                    <option value="Southeast Asian">Southeast Asian</option>
                    <option value="Middle Eastern / North African">Middle Eastern / North African</option>
                    <option value="Hispanic / Latino">Hispanic / Latino</option>
                    <option value="Mixed / Multiracial">Mixed / Multiracial</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Origin</label>
                <select class="member-origin w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all">
                    <optgroup label="Italy">
                        <option value="Italy — South">Italy — South</option>
                        <option value="Italy — Central">Italy — Central</option>
                        <option value="Italy — North">Italy — North</option>
                    </optgroup>
                    <optgroup label="United Kingdom">
                        <option value="UK — England">UK — England</option>
                        <option value="UK — Scotland">UK — Scotland</option>
                        <option value="UK — Wales">UK — Wales</option>
                        <option value="UK — Northern Ireland">UK — Northern Ireland</option>
                    </optgroup>
                    <optgroup label="Europe">
                        <option value="France">France</option>
                        <option value="Germany">Germany</option>
                        <option value="Spain">Spain</option>
                        <option value="Portugal">Portugal</option>
                        <option value="Eastern Europe">Eastern Europe</option>
                        <option value="Scandinavia">Scandinavia</option>
                        <option value="Other European">Other European</option>
                    </optgroup>
                    <optgroup label="Rest of World">
                        <option value="Middle East / North Africa">Middle East / North Africa</option>
                        <option value="Sub-Saharan Africa">Sub-Saharan Africa</option>
                        <option value="South Asia">South Asia</option>
                        <option value="East Asia">East Asia</option>
                        <option value="Southeast Asia">Southeast Asia</option>
                        <option value="Latin America">Latin America</option>
                        <option value="North America">North America</option>
                        <option value="Oceania">Oceania</option>
                        <option value="Other">Other</option>
                    </optgroup>
                </select>
            </div>
        </div>
        <div class="mt-3 grid grid-cols-[100px_160px_1fr] gap-3">
              <div>
                  <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Type</label>
                  <select class="member-type w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all">
                      <option value="Adult" selected>👤 Adult</option>
                      <option value="Child">👶 Child</option>
                  </select>
              </div>
              <div>
                  <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Risk Tolerance</label>
                  <select class="member-risk-tolerance w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all">
                      <option value="High">🟢 High</option>
                      <option value="Moderate" selected>🟡 Moderate</option>
                      <option value="Low">🔴 Low</option>
                      <option value="N/A">⬜ N/A</option>
                  </select>
              </div>
              <div>
                  <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Family Location</label>
                  <input type="text" value="" class="member-location w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all" placeholder="e.g. Bristol, Italy">
              </div>
        </div>
        ${buildMemberExtrasHTML()}
    `;
    container.appendChild(div);
    updateRemoveButtons();
}

function removeFamilyMember(btn) {
    const member = btn.closest('.family-member');
    member.remove();
    renumberMembers();
    updateRemoveButtons();
}

function renumberMembers() {
    const members = document.querySelectorAll('.family-member');
    memberCount = members.length;
    members.forEach((m, i) => {
        m.dataset.memberIndex = i;
        m.querySelector('.text-sm.font-black').textContent = `Member ${i + 1}`;
    });
}

function updateRemoveButtons() {
    const members = document.querySelectorAll('.family-member');
    members.forEach((m) => {
        const btn = m.querySelector('.remove-btn');
        if (members.length <= 1) {
            btn.classList.add('hidden');
        } else {
            btn.classList.remove('hidden');
        }
    });
}

/* ─── Data collection ────────────────────────────────────── */

function collectFamilyData() {
    const members = document.querySelectorAll('.family-member');
    const data = [];
    members.forEach((m, i) => {
        const name = m.querySelector('.member-name')?.value || '';
        const age = m.querySelector('.member-age')?.value || '';
        const type = m.querySelector('.member-type')?.value || 'Adult';
        const gender = m.querySelector('.member-gender')?.value || '';
        const profession = m.querySelector('.member-profession')?.value || '';
        const race = m.querySelector('.member-race')?.value || '';
        const origin = m.querySelector('.member-origin')?.value || '';
        const location = m.querySelector('.member-location')?.value || '';
        const riskTolerance = m.querySelector('.member-risk-tolerance')?.value || '';
        const priorities = Array.from(m.querySelectorAll('.priority-pill.selected')).map(p => p.dataset.value);
        const personalTraits = Array.from(m.querySelectorAll('.trait-btn.selected')).map(t => t.dataset.value);
        const hobbies = m.querySelector('.member-hobbies')?.value || '';
        const notes = m.querySelector('.member-notes')?.value || '';
        if (name || age || profession || priorities.length || personalTraits.length) {
            data.push({ member: i + 1, name, age, type, gender, profession, race, origin, location, riskTolerance, priorities, personalTraits, hobbies, notes });
        }
    });
    return data;
}

function collectFamilyUnitData() {
    return {
        currentLocation: document.getElementById('familyCurrentLocation')?.value || '',
        targetDestinations: document.getElementById('familyTargetDestinations')?.value || '',
    };
}
