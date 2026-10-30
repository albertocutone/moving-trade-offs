/**
 * Prompt — AI prompt generation, data collection from tables.
 * Builds 3 focused prompts for chunked API calls, each requesting compact
 * array-based output to minimize token usage.
 *
 * Compact format contract (arrays, positional fields — no repeated keys):
 *   Chunk 1 → ranking + justification + recommendations
 *   Chunk 2 → cross-analysis per city
 *   Chunk 3 → person-mapping + happiness scores
 */

/* ─── Data collection (unchanged) ────────────────────────── */

function collectTableData() {
    const rows = document.querySelectorAll('#tableBody tr');
    const headers = ['Income 1', 'Income 2', 'Rent+Bills', 'Childcare', 'Food/Misc', 'Transport', 'Other'];
    const scenarios = [];
    rows.forEach(row => {
        const city = row.dataset.city;
        const currency = row.dataset.currency;
        const inputs = row.querySelectorAll('input');
        const vals = Array.from(inputs).map(i => parseInt(i.value) || 0);
        const total = vals[0] + vals[1];
        const expenses = vals.slice(2).reduce((a, b) => a + b, 0);
        const obj = { city, currency };
        headers.forEach((h, i) => obj[h] = vals[i]);
        obj['Total Income'] = total;
        obj['Total Expenses'] = expenses;
        obj['Savings'] = total - expenses;
        scenarios.push(obj);
    });
    return scenarios;
}

function collectFamilySupportData() {
    const rows = document.querySelectorAll('#familySupportBody tr');
    const data = [];
    rows.forEach(row => {
        const city = row.dataset.city;
        const currency = row.dataset.currency;
        const visits = parseInt(row.querySelector('.fs-visits')?.value) || 0;
        const costPerTrip = parseInt(row.querySelector('.fs-cost')?.value) || 0;
        const extraHelp = parseInt(row.querySelector('.fs-help')?.value) || 0;
        const totalMonthly = Math.round((visits * costPerTrip) / 12 + extraHelp);
        data.push({ city, currency, visits, costPerTrip, extraHelp, totalMonthly });
    });
    return data;
}

function collectQualitativeData() {
    const params = [];
    const qRows = document.querySelectorAll('#qualitativeTable tbody tr');
    qRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 5) return;

        // Extract clean parameter name (excluding importance select text)
        const paramTextEl = cells[0].querySelector('.qual-param-text');
        const paramNameEl = cells[0].querySelector('.qual-param-name');
        let param;
        if (paramTextEl) {
            param = paramTextEl.innerText.trim();
        } else if (paramNameEl) {
            const emoji = cells[0].querySelector('.qual-param-emoji')?.textContent?.trim() || '';
            param = (emoji ? emoji + ' ' : '') + paramNameEl.textContent.trim();
        } else {
            param = cells[0].innerText.trim();
        }

        const importance = parseInt(cells[0].querySelector('.qual-importance')?.value) || 3;
        const cities = ['Manchester', 'Bologna', 'Florence Center', 'Florence Suburbs'];
        const entry = { parameter: param, importance };
        for (let i = 1; i < 5; i++) {
            const select = cells[i].querySelector('select.qual-rating');
            const span = cells[i].querySelector('span');
            const badge = select
                ? select.options[select.selectedIndex]?.textContent?.trim()
                : span?.innerText?.trim() || '';
            const desc = cells[i].querySelector('p')?.innerText?.trim() || '';
            entry[cities[i - 1]] = `${badge} — ${desc}`;
        }
        params.push(entry);
    });
    return params;
}

/* ─── Shared data context (used by all chunks) ───────────── */

function buildDataContext(quantData, qualData, familyData) {
    let ctx = `You are a financial analyst and consultant for families evaluating an international relocation.\n\n`;

    const familyUnit = collectFamilyUnitData();
    if (familyUnit.currentLocation || familyUnit.targetDestinations) {
        ctx += `## RELOCATION CONTEXT\n\n`;
        ctx += `- **Current Location:** ${familyUnit.currentLocation || 'N/A'}\n`;
        ctx += `- **Considering Moving To:** ${familyUnit.targetDestinations || 'N/A'}\n\n`;
    }

    if (familyData && familyData.length > 0) {
        ctx += `## FAMILY UNIT\n\n`;
        familyData.forEach(m => {
            const typeLabel = m.type === 'Child' ? '(Child)' : '(Adult)';
            const profStr = m.type === 'Child' ? '' : `, ${m.profession}`;
            const priStr = (m.priorities || []).join(', ') || 'N/A';
            const traitStr = (m.personalTraits || []).join(', ') || 'N/A';
            const hobbyStr = m.hobbies || 'N/A';
            const notesStr = m.notes ? ` Notes: ${m.notes}.` : '';
            ctx += `- **${m.name || 'Member ' + m.member}** ${typeLabel}: Age ${m.age}, ${m.gender}${profStr}. Race: ${m.race}. Origin: ${m.origin}. Location: ${m.location || 'N/A'}. Risk Tolerance: ${m.riskTolerance}. Priorities: ${priStr}. Personal Traits: ${traitStr}. Hobbies: ${hobbyStr}.${notesStr}\n`;
        });
        ctx += '\n---\n';
    }

    const weights = getScoringWeights();
    ctx += `\n## SCORING WEIGHTS (set by user)\n\n`;
    ctx += `- Quantitative weight: ${(weights.quant * 100).toFixed(0)}%\n`;
    ctx += `- Qualitative weight: ${(weights.qual * 100).toFixed(0)}%\n\n`;

    ctx += `\n## QUANTITATIVE DATA (monthly, net)\n\n`;
    quantData.forEach(s => {
        ctx += `### ${s.city} (${s.currency})\n`;
        ctx += `- Income 1: ${s.currency}${s['Income 1']}  |  Income 2: ${s.currency}${s['Income 2']}  →  Total: ${s.currency}${s['Total Income']}\n`;
        ctx += `- Rent: ${s.currency}${s['Rent+Bills']}  |  Childcare: ${s.currency}${s['Childcare']}  |  Food: ${s.currency}${s['Food/Misc']}  |  Transport: ${s.currency}${s['Transport']}  |  Other: ${s.currency}${s['Other']}  →  Expenses: ${s.currency}${s['Total Expenses']}\n`;
        ctx += `- **Net Savings: ${s.currency}${s['Savings']}/mo**\n\n`;
    });

    // Financial summary with red flags
    ctx += `### ⚠️ Financial Health Summary\n\n`;
    const sorted = [...quantData].sort((a, b) => b['Savings'] - a['Savings']);
    sorted.forEach(s => {
        if (s['Savings'] < 0) {
            ctx += `- 🔴 **${s.city}: ${s.currency}${s['Savings']}/mo — NEGATIVE SAVINGS (financially unsustainable, family loses money every month)**\n`;
        } else if (s['Savings'] < 500) {
            ctx += `- 🟡 ${s.city}: ${s.currency}${s['Savings']}/mo — dangerously thin buffer\n`;
        } else {
            ctx += `- 🟢 ${s.city}: ${s.currency}${s['Savings']}/mo — positive\n`;
        }
    });
    ctx += '\n';

    // Opportunity Cost of Family Support
    const fsData = collectFamilySupportData();
    if (fsData && fsData.length > 0) {
        ctx += `### 👨‍👩‍👦 Opportunity Cost of Family Support\n\n`;
        ctx += `This estimates the hidden cost of being far from the family support network (grandparent childcare, emergency help, travel to visit relatives).\n\n`;
        fsData.forEach(fs => {
            ctx += `- **${fs.city}**: ${fs.visits} visits/yr × ${fs.currency}${fs.costPerTrip}/trip + ${fs.currency}${fs.extraHelp}/mo extra paid help → **${fs.currency}${fs.totalMonthly}/mo opportunity cost**\n`;
        });
        ctx += '\n';
    }

    ctx += `---\n\n## QUALITATIVE DATA\n\n`;
    ctx += `Each parameter has a user-assigned importance weight (1-5). Higher weight = more influence on the final score.\n\n`;
    qualData.forEach(q => {
        const imp = q.importance || 3;
        ctx += `### ${q.parameter} [Importance: ${imp}/5]\n`;
        Object.entries(q).forEach(([k, v]) => {
            if (k !== 'parameter' && k !== 'importance') ctx += `- **${k}**: ${v}\n`;
        });
        ctx += '\n';
    });

    return ctx;
}

/* ─── Chunk 1: ranking + justification + recommendations ── */

function buildPromptChunk1(quantData, qualData, familyData) {
    const ctx = buildDataContext(quantData, qualData, familyData);
    const cityNames = quantData.map(s => s.city);

    return ctx + `---

## TASK

Analyze the data above and return a JSON object with three keys: "r" (ranking), "j" (justification), "rec" (recommendations).

IMPORTANT: Personal traits, risk tolerance, race, and regional origin are fundamental. Weigh them heavily for discrimination, integration, and quality of life. Be honest about prejudice.
IMPORTANT: Use the importance weights (1-5) assigned to each qualitative parameter. Parameters with weight 5 should have 5× the influence of parameters with weight 1 on the final scores and ranking.

## OUTPUT FORMAT — compact arrays, no commentary

{
  "r": [
    [1, "CityName", 8.2, "One-line tagline"]
  ],
  "j": "3–5 sentence paragraph explaining why #1 wins and why last-placed loses. Reference numbers, qualitative ratings, and personal traits.",
  "rec": {
    "do": [["Concrete action", "Data-driven reason"]],
    "dont": [["Action to avoid", "Data-driven reason"]],
    "watch": [["Risk or caveat", "Data-driven reason"]]
  }
}

### Field rules:
- **r**: Array of ALL ${cityNames.length} cities ordered best→worst. Fields: [rank, city, score(1-10), tagline]. Score = family total average from happiness analysis.
- **j**: The MOST IMPORTANT section. Weigh savings, qualitative factors, personal traits, risk tolerance, long-term trajectory. Do NOT simply pick highest-savings city — BUT a city with NEGATIVE net savings (expenses > income) is financially unsustainable and MUST be ranked below any city with positive savings, unless ALL cities have negative savings. Negative savings = the family loses money every month and will eventually go bankrupt. This is a hard constraint.
- **rec**: At least 2 items in each of do, dont, watch. Lead with most impactful.

Return ONLY the JSON object.`;
}

/* ─── Chunk 2: cross-analysis ─────────────────────────────── */

function buildPromptChunk2(quantData, qualData, familyData) {
    const ctx = buildDataContext(quantData, qualData, familyData);
    const cityNames = quantData.map(s => s.city);

    return ctx + `---

## TASK

For EACH of the ${cityNames.length} cities, write a cross-analysis combining economic data with qualitative factors. Explain how each family member's personal traits align or clash with the city.

IMPORTANT: Personal traits, risk tolerance, race, and regional origin are fundamental. Be honest about prejudice.
CRITICAL: If a city has NEGATIVE net savings (see Financial Health Summary), the cross-analysis MUST prominently highlight that the family is losing money every month and this scenario is financially unsustainable regardless of qualitative advantages.

## OUTPUT FORMAT — compact array, no commentary

Return a JSON array. Each element: [city, tagline, paragraph].

[
  ["CityName", "Short tagline e.g. High earnings high friction", "3–5 sentence analysis combining economic + qualitative data. Explain how each family member's traits align or clash."]
]

Include ALL ${cityNames.length} cities: ${cityNames.join(', ')}.

Return ONLY the JSON array.`;
}

/* ─── Chunk 3: person-mapping + happiness scores ──────────── */

function buildPromptChunk3(quantData, qualData, familyData) {
    const ctx = buildDataContext(quantData, qualData, familyData);
    const cityNames = quantData.map(s => s.city);
    const qualParamNames = qualData.map(q => q.parameter);

    return ctx + `---

## TASK

Produce two analyses:
1. **Person mapping**: For each qualitative parameter × city, describe the effect on EVERY family member.
2. **Happiness scores**: Rate each family member 1–10 per city across 3 time horizons (6mo, 1–3y, 5y+). Compute family totals and a verdict.

IMPORTANT: Personal traits, risk tolerance, race, and regional origin are fundamental. Be honest about prejudice.

## OUTPUT FORMAT — compact arrays, no commentary

{
  "pm": [
    ["Parameter Name", "emoji", [
      ["CityName", [["memberEmoji", "MemberName", "short effect sentence"]]
    ]]
  ],
  "hs": {
    "m": [
      ["memberEmoji", "MemberName", [["CityName", 6mo_score, 1_3y_score, 5y_score]]]
    ],
    "t": [["CityName", weightedAvgScore, "short label"]],
    "v": ["WinnerCity", winnerScore, "Short verdict sentence"]
  }
}

### Field rules:
- **pm**: One entry per qualitative parameter. Include ALL ${qualParamNames.length} parameters: ${qualParamNames.join(', ')}. For each parameter × city, list effect on EVERY family member individually. Use each person's actual name. Assign each member a UNIQUE emoji (🧔 👩 👧 👶 etc.) and keep it consistent across pm and hs.
- **hs.m**: Rate each person 1–10 per city across three time horizons. Scores: 6mo (settling in), 1_3y (established), 5y (long-term).
- **hs.t**: Family totals per city — weighted average (adults weigh more on financial factors, children on schooling/social). Fields: [city, score, label]. A city with NEGATIVE net savings MUST have its total score significantly penalized (at most 5/10) because the family cannot sustain itself there.
- **hs.v**: Verdict — [winnerCity, score, verdictText]. The winner MUST be a city with positive net savings, unless ALL cities have negative savings.

Return ONLY the JSON object.`;
}

/* ─── Generate & Copy (manual prompt feature) ────────────── */

function generatePrompt() {
    const quantData = collectTableData();
    const qualData = collectQualitativeData();
    const familyData = collectFamilyData();
    const promptText = buildPromptText(quantData, qualData, familyData);

    const textarea = document.getElementById('promptTextarea');
    const output = document.getElementById('promptOutput');
    if (textarea) textarea.value = promptText;
    if (output) output.classList.remove('hidden');

    navigator.clipboard.writeText(promptText).then(() => {
        const btn = document.getElementById('generatePromptBtn');
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Copied!';
            setTimeout(() => { btn.innerHTML = original; }, 2000);
        }
    }).catch(() => {});
}

function copyPrompt() {
    const textarea = document.getElementById('promptTextarea');
    if (!textarea || !textarea.value) return;
    navigator.clipboard.writeText(textarea.value).then(() => {
        const btn = document.getElementById('copyBtn');
        if (btn) {
            const original = btn.textContent;
            btn.textContent = '✓ Copied!';
            setTimeout(() => { btn.textContent = original; }, 2000);
        }
    }).catch(() => {});
}

/* ─── Full prompt (kept for manual "copy prompt" feature) ── */

function buildPromptText(quantData, qualData, familyData) {
    const ctx = buildDataContext(quantData, qualData, familyData);
    const qualParamNames = qualData.map(q => q.parameter);
    const cityNames = quantData.map(s => s.city);

    return ctx + `---

## OUTPUT FORMAT

Return your answer as a **single JSON object** (no markdown fences, no commentary — raw JSON only).

The JSON must conform exactly to this schema:

{
  "ranking": [
    {
      "rank": 1,
      "city": "CityName",
      "score": 8.2,
      "tagline": "One-line summary, e.g. The balanced sweet spot"
    }
  ],
  "justification": "3–5 sentence paragraph explaining why #1 wins and why the last-placed city loses. Reference actual numbers, qualitative ratings, and personal traits.",
  "recommendations": {
    "do": [
      { "action": "Concrete action", "reason": "Data-driven reason" }
    ],
    "dont": [
      { "action": "Action to avoid", "reason": "Data-driven reason" }
    ],
    "watch": [
      { "action": "Risk or caveat", "reason": "Data-driven reason" }
    ]
  },
  "cross_analysis": [
    {
      "city": "CityName",
      "tagline": "High earnings, high friction",
      "paragraph": "3–5 sentence analysis combining economic data with qualitative factors. Pay special attention to how each family member's personal traits align or clash with this city."
    }
  ],
  "person_mapping": [
    {
      "parameter": "Quality of Life",
      "emoji": "🌟",
      "cities": {
        "CityName": [
          { "emoji": "🧔", "name": "Alex", "effect": "Short sentence about how this parameter impacts this person in this city" }
        ]
      }
    }
  ],
  "happiness_scores": {
    "members": [
      {
        "emoji": "🧔",
        "name": "Alex",
        "scores": {
          "CityName": { "6mo": 7, "1_3y": 8, "5y": 8 }
        }
      }
    ],
    "family_total": {
      "CityName": { "score": 8.2, "label": "Perfect balance & safety" }
    },
    "verdict": {
      "winner": "CityName",
      "score": 8.2,
      "text": "Short verdict sentence"
    }
  }
}

### Field rules:
- **ranking**: Array of ALL ${cityNames.length} cities, ordered from best (#1) to worst. \`score\` = the family total average from happiness_scores (1–10). This drives the podium bar height.
- **justification**: The MOST IMPORTANT analytical section. Weigh savings, qualitative factors, personal traits, risk tolerance, and long-term trajectory together. Do NOT simply pick the highest-savings city — BUT a city with NEGATIVE net savings (expenses > income) is financially unsustainable and MUST be ranked below any city with positive savings, unless ALL cities have negative savings. Negative savings = the family loses money every month and will eventually go bankrupt.
- **recommendations**: At least 2 items in each of \`do\`, \`dont\`, and \`watch\`. Lead with the most impactful recommendation.
- **cross_analysis**: One entry per city. For EACH city, combine the economic data with qualitative factors and explain how each family member's traits/personality align or clash.
- **person_mapping**: One entry per qualitative parameter. You MUST include ALL ${qualParamNames.length} parameters: ${qualParamNames.join(', ')}. For each parameter × city, list the effect on EVERY family member individually. Use each person's actual name, never "Member 2". Assign each member a UNIQUE emoji (🧔 👩 👧 👶 etc.) and keep it consistent.
- **happiness_scores**: Rate each person 1–10 per city across three time horizons (6mo, 1_3y, 5y). \`family_total\` is a weighted average — adults weigh more on financial factors, children on schooling/social. A city with NEGATIVE net savings MUST have its total score significantly penalized (at most 5/10). The verdict winner MUST be a city with positive net savings unless ALL cities have negative savings.

IMPORTANT: Use the importance weights (1-5) assigned to each qualitative parameter. Parameters with weight 5 should have 5× the influence of parameters with weight 1 on scores and ranking.

Be direct, concrete, and data-driven. Return ONLY the JSON object.`;
}
