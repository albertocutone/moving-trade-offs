/**
 * Report — renders the AI report by filling a hardcoded HTML template
 * with JS-computed data (numbers summary) and LLM JSON (qualitative sections).
 */

const REPORT_CITY_COLORS = {
    'Manchester':       { bg: '#e0f2fe', border: '#0284c7', text: '#0284c7', flag: '🇬🇧' },
    'Bologna':       { bg: '#dcfce7', border: '#059669', text: '#059669', flag: '🇮🇹' },
    'Florence Center':  { bg: '#ffedd5', border: '#ea580c', text: '#ea580c', flag: '🇮🇹' },
    'Florence Suburbs': { bg: '#f1f5f9', border: '#475569', text: '#475569', flag: '🇮🇹' },
};

function getCityColor(city) {
    return REPORT_CITY_COLORS[city] || { bg: '#f1f5f9', border: '#475569', text: '#475569', flag: '' };
}

/**
 * Unpack compact array-based responses from 3 API chunks into the full
 * keyed-object format that renderReport() expects.
 *
 * Chunk 1: { r: [[rank,city,score,tagline],...], j: "...", rec: {do,dont,watch} }
 * Chunk 2: [[city,tagline,paragraph],...]
 * Chunk 3: { pm: [[param,emoji,[[city,[[mEmoji,mName,effect],...]],...]],...]
 *            hs: { m, t, v } }
 */
function unpackResponse(c1, c2, c3) {
    const ranking = (c1.r || []).map(r => ({
        rank: r[0], city: r[1], score: r[2], tagline: r[3]
    }));

    const justification = c1.j || '';

    const recommendations = { do: [], dont: [], watch: [] };
    ['do', 'dont', 'watch'].forEach(k => {
        recommendations[k] = (c1.rec?.[k] || []).map(a => ({
            action: a[0], reason: a[1]
        }));
    });

    const cross_analysis = (c2 || []).map(a => ({
        city: a[0], tagline: a[1], paragraph: a[2]
    }));

    const person_mapping = (c3.pm || []).map(p => {
        const cities = {};
        (p[2] || []).forEach(c => {
            cities[c[0]] = (c[1] || []).map(m => ({
                emoji: m[0], name: m[1], effect: m[2]
            }));
        });
        return { parameter: p[0], emoji: p[1], cities };
    });

    const hsRaw = c3.hs || {};
    const members = (hsRaw.m || []).map(m => {
        const scores = {};
        (m[2] || []).forEach(s => {
            scores[s[0]] = { '6mo': s[1], '1_3y': s[2], '5y': s[3] };
        });
        return { emoji: m[0], name: m[1], scores };
    });

    const family_total = {};
    (hsRaw.t || []).forEach(t => {
        family_total[t[0]] = { score: t[1], label: t[2] };
    });

    const v = hsRaw.v || [];
    const verdict = v.length >= 3
        ? { winner: v[0], score: v[1], text: v[2] }
        : null;

    return {
        ranking,
        justification,
        recommendations,
        cross_analysis,
        person_mapping,
        happiness_scores: { members, family_total, verdict },
    };
}

function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function renderReport(json, quantData, familySupportData, familyData, qualData) {
    const container = document.getElementById('reportContainer');
    container.classList.remove('hidden');
    container.innerHTML = '';

    // Download button
    const downloadBar = document.createElement('div');
    downloadBar.setAttribute('data-download-bar', '');
    downloadBar.style.cssText = 'display:flex;justify-content:flex-end;margin-bottom:1rem;';
    downloadBar.innerHTML = `
        <button onclick="downloadReportAsHtml()" class="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3"/>
            </svg>
            Download Report
        </button>`;
    container.appendChild(downloadBar);

    const sections = [
        renderPodium(json.ranking),
        renderJustification(json.justification),
        renderRecommendations(json.recommendations),
        renderCrossAnalysis(json.cross_analysis),
        renderInputData(familyData, qualData),
        renderNumbersSummary(quantData),
        renderFamilySupportSummary(familySupportData),
        renderReportCharts(quantData),
        renderPersonMapping(json.person_mapping, quantData),
        renderHappinessMatrix(json.happiness_scores, quantData),
    ];

    sections.forEach(html => {
        const div = document.createElement('div');
        div.className = 'mb-8';
        div.innerHTML = html;
        container.appendChild(div);
    });

    // Initialize Chart.js instances now that canvases are in the DOM
    initReportChartInstances(quantData);

    container.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Kick off podium animation after DOM is painted
    requestAnimationFrame(() => requestAnimationFrame(animatePodium));
}

/**
 * Build a self-contained standalone HTML page from the current report,
 * converting Chart.js canvases to static <img> elements and optimizing
 * layout to fit cleanly within A4 pages.
 */
function buildStandaloneReportHtml() {
    const container = document.getElementById('reportContainer');
    if (!container) return null;

    const clone = container.cloneNode(true);

    // Remove download button from clone
    const bar = clone.querySelector('[data-download-bar]');
    if (bar) bar.remove();

    // Convert every <canvas> to a static <img> with base64 data
    const origCanvases = container.querySelectorAll('canvas');
    const cloneCanvases = clone.querySelectorAll('canvas');
    cloneCanvases.forEach((cc, i) => {
        const oc = origCanvases[i];
        if (!oc) return;
        const img = document.createElement('img');
        try { img.src = oc.toDataURL('image/png', 1.0); } catch (_) { return; }
        img.style.width = '100%';
        img.style.height = 'auto';
        cc.parentNode.replaceChild(img, cc);
    });

    // Remove fixed heights on chart wrapper divs so images flow naturally
    clone.querySelectorAll('div[style]').forEach(el => {
        if (el.querySelector('img') && el.style.height) {
            el.style.height = 'auto';
            el.style.position = 'static';
        }
    });

    // Fix overflow containers — make all content visible (no scroll clipping)
    clone.querySelectorAll('.overflow-x-auto').forEach(el => {
        el.classList.remove('overflow-x-auto');
        el.style.overflow = 'visible';
    });

    // Force podium bars/medals/labels to their final visible state
    clone.querySelectorAll('.podium-bar').forEach(b => {
        const col = b.closest('.podium-col');
        if (col) b.style.height = col.dataset.targetH + 'px';
        b.style.animation = 'none';
    });
    clone.querySelectorAll('.podium-medal, .podium-name, .podium-score, .podium-rank-label')
        .forEach(el => { el.style.opacity = '1'; el.style.transform = 'scale(1)'; });

    const date = new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relocation Analysis Report</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap">
    <style>
        body { font-family: 'Inter', sans-serif; }

        .card {
            background: #fff;
            border-radius: 1rem;
            box-shadow: 0 1px 3px rgba(0,0,0,.1);
            border: 1px solid #e2e8f0;
            padding: 1.5rem;
        }

        /* Report-specific styles */
        .report-horizon-row { display:flex; justify-content:space-between; align-items:center; font-size:.7rem; margin-bottom:.1rem; padding:.15rem .35rem; border-bottom:1px solid #eee; }
        .report-horizon-row:last-child { border-bottom:none; }
        .report-score-bold { font-weight:bold; font-size:.8rem; }
        .report-total-row td { padding:.6rem .4rem; border-color:#334155; }
        .report-total-row td:first-child { background-color:#0f172a; color:#fff; font-weight:bold; }
        .report-winner-glow { border:2px solid #10b981 !important; border-radius:6px; background-color:#064e3b !important; }
        .report-stat-row { display:flex; justify-content:space-between; margin-bottom:.3rem; font-size:.8rem; color:#475569; }
        .report-stat-val { font-weight:bold; color:#1e293b; }

        /* Prevent any horizontal overflow */
        * { box-sizing: border-box; }
        table { width:100%; border-collapse:collapse; table-layout:fixed; }
        td, th { word-wrap:break-word; overflow-wrap:break-word; }
        img { max-width:100%; height:auto; display:block; }
        .overflow-x-auto { overflow:visible !important; }

        /* ── Print / PDF optimization ─────────── */
        @page { size:A4 portrait; margin:12mm; }

        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            .card {
                box-shadow: none;
                break-inside: avoid;
                page-break-inside: avoid;
            }
            .mb-8 {
                break-inside: avoid;
                page-break-inside: avoid;
            }
            h3 {
                break-after: avoid;
                page-break-after: avoid;
            }
            tr {
                break-inside: avoid;
                page-break-inside: avoid;
            }
            img {
                break-inside: avoid;
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body class="bg-white text-slate-900">
    <div style="max-width:700px; margin:0 auto; padding:2rem 1.5rem;">
        <header style="text-align:center; margin-bottom:2rem;">
            <h1 style="font-size:1.5rem; font-weight:900; letter-spacing:-0.025em; color:#0f172a; margin-bottom:0.25rem;">🏠 Relocation Analysis Report</h1>
            <p style="font-size:0.75rem; color:#94a3b8; font-weight:500;">Generated on ${date}</p>
        </header>
        ${clone.innerHTML}
        <footer style="margin-top:2rem; text-align:center; color:#94a3b8; font-size:9px; text-transform:uppercase; font-weight:700; letter-spacing:0.1em; padding-bottom:1.5rem;">
            Relocation Comparator &bull; Objective Analysis &bull; ${new Date().getFullYear()}
        </footer>
    </div>
</body>
</html>`;
}

function downloadReportAsHtml() {
    const html = buildStandaloneReportHtml();
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relocation-report.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/* ─── 1. Podium ──────────────────────────────────────────── */

function renderPodium(ranking) {
    if (!ranking || ranking.length === 0) return '';
    const medals = ['🥇', '🥈', '🥉', '4th', '5th'];
    const barBg = ['#fbbf24', '#cbd5e1', '#b45309', '#e2e8f0', '#e2e8f0'];
    const barBd = ['#f59e0b', '#94a3b8', '#92400e', '#cbd5e1', '#cbd5e1'];
    const numClr = ['#78350f', '#334155', '#fef3c7', '#64748b', '#64748b'];
    const maxH = 180, minH = 40;
    const maxScore = Math.max(...ranking.map(r => r.score)) || 1;

    const order = ranking.length >= 2
        ? [ranking[1], ranking[0], ...ranking.slice(2)]
        : [...ranking];

    let podiumHtml = '';
    order.forEach(city => {
        const rank = ranking.indexOf(city);
        const ratio = Math.max(city.score / maxScore, 0.15);
        const h = Math.round(minH + (maxH - minH) * ratio);
        const big = rank === 0;
        podiumHtml += `<div class="podium-col" data-rank="${rank}" data-target-h="${h}" style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:0;">
            <div class="podium-medal" style="font-size:${big ? '2.5rem' : '1.5rem'};margin-bottom:0.25rem;opacity:0;transform:scale(0);transition:opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.34,1.56,0.64,1);">${medals[rank] || ''}</div>
            <div class="podium-name" style="font-size:0.7rem;font-weight:900;color:#334155;margin-bottom:0.1rem;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 0.25rem;opacity:0;transition:opacity 0.35s ease-out;">${esc(city.city)}</div>
            <div class="podium-score" style="font-size:0.65rem;font-weight:700;color:#64748b;margin-bottom:0.5rem;opacity:0;transition:opacity 0.35s ease-out;">${city.score.toFixed(1)}/10</div>
            <div class="podium-bar" style="width:100%;border-radius:0.75rem 0.75rem 0 0;background:${barBg[rank]};border:2px solid ${barBd[rank]};box-shadow:0 4px 12px rgba(0,0,0,0.1);display:flex;align-items:flex-end;justify-content:center;height:0;overflow:hidden;">
                <span class="podium-rank-label" style="font-size:1.1rem;font-weight:900;color:${numClr[rank]};margin-bottom:0.5rem;opacity:0;transition:opacity 0.3s ease-out;">#${rank + 1}</span>
            </div>
        </div>`;
    });

    return `
    <h3 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
        <span class="w-7 h-7 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center text-sm font-black">1</span>
        Final Ranking
    </h3>
    <div class="card p-6 shadow-xl border-none">
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem;">
            <div style="width:2.5rem;height:2.5rem;background:#f59e0b;border-radius:0.75rem;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:1.1rem;">🏆</div>
            <div>
                <h4 style="font-size:1.1rem;font-weight:900;letter-spacing:-0.02em;margin:0;">Final Ranking</h4>
                <p style="font-size:0.65rem;color:#94a3b8;font-weight:500;margin:0;">Holistic family ranking — savings, qualitative factors, and personal fit combined</p>
            </div>
        </div>
        <div id="podiumStage" style="display:flex;align-items:flex-end;justify-content:center;gap:0.75rem;min-height:260px;">
            ${podiumHtml}
        </div>
    </div>`;
}

/**
 * Reveal a finished column: show rank label, name, score, medal.
 */
function revealCol(col, rank) {
    const rankLabel = col.querySelector('.podium-rank-label');
    const medal = col.querySelector('.podium-medal');
    const name = col.querySelector('.podium-name');
    const score = col.querySelector('.podium-score');
    if (rankLabel) rankLabel.style.opacity = '1';
    if (name) name.style.opacity = '1';
    if (score) score.style.opacity = '1';
    if (medal) {
        medal.style.opacity = '1';
        medal.style.transform = 'scale(1)';
    }
    if (rank === 0) {
        const bar = col.querySelector('.podium-bar');
        bar.style.boxShadow = '0 0 24px rgba(245,158,11,0.6), 0 4px 12px rgba(0,0,0,0.1)';
        setTimeout(() => {
            bar.style.transition = 'box-shadow 1.5s ease-out';
            bar.style.boxShadow = '0 0 0px rgba(245,158,11,0), 0 4px 12px rgba(0,0,0,0.1)';
        }, 800);
    }
}

/**
 * Animate the podium using requestAnimationFrame:
 *  - All bars grow at the same px/frame rate
 *  - When a bar hits its target, it stops and its placement is revealed
 *  - When 2 bars remain, they shake for 3s then complete instantly
 */
function animatePodium() {
    const stage = document.getElementById('podiumStage');
    if (!stage) return;

    const cols = Array.from(stage.querySelectorAll('.podium-col'));
    if (cols.length === 0) return;

    // Build state for each column
    const items = cols.map(col => ({
        col,
        bar: col.querySelector('.podium-bar'),
        rank: parseInt(col.dataset.rank, 10),
        targetH: parseInt(col.dataset.targetH, 10),
        currentH: 0,
        done: false,
    }));

    // Growth rate: tallest bar reaches target in ~3s at 60fps
    const maxTarget = Math.max(...items.map(it => it.targetH));
    const growthRate = maxTarget / (3.0 * 60); // px per frame

    let shaking = false;

    function tick() {
        // Count how many are still growing
        const active = items.filter(it => !it.done);

        // If we're down to 2: pause & shake
        if (active.length === 2 && !shaking) {
            shaking = true;

            // Add shake animation to the 2 remaining bars
            active.forEach(it => {
                it.bar.style.animation = 'podiumShake 0.12s ease-in-out infinite alternate';
            });

            // After 3 seconds: stop shaking, snap to final, reveal both
            setTimeout(() => {
                // Sort so we reveal the loser first, then the winner
                active.sort((a, b) => b.rank - a.rank);

                active.forEach(it => {
                    it.bar.style.animation = '';
                    it.bar.style.height = it.targetH + 'px';
                    it.currentH = it.targetH;
                    it.done = true;
                });

                // Reveal loser immediately, winner 300ms later
                revealCol(active[0].col, active[0].rank);
                setTimeout(() => {
                    revealCol(active[1].col, active[1].rank);
                }, 300);
            }, 3000);

            return; // stop the rAF loop
        }

        if (active.length === 0) return; // all done

        // Grow all active bars by the same amount
        items.forEach(it => {
            if (it.done) return;
            it.currentH = Math.min(it.currentH + growthRate, it.targetH);
            it.bar.style.height = it.currentH + 'px';

            if (it.currentH >= it.targetH) {
                it.done = true;
                revealCol(it.col, it.rank);
            }
        });

        requestAnimationFrame(tick);
    }

    // Start after a short initial pause
    setTimeout(() => requestAnimationFrame(tick), 400);
}

/* ─── 2. Justification ──────────────────────────────────── */

function renderJustification(text) {
    if (!text) return '';
    return `
    <h3 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
        <span class="w-7 h-7 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center text-sm font-black">2</span>
        🏆 Final Ranking for the Family
    </h3>
    <div class="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 leading-relaxed">
        <p>${esc(text)}</p>
    </div>`;
}

/* ─── 3. Recommendations ────────────────────────────────── */

function renderRecommendations(recs) {
    if (!recs) return '';

    function recCard(items, icon, bgClass, textClass) {
        return (items || []).map(item => `
            <div class="flex items-start gap-3 ${bgClass} rounded-xl p-4 border ${bgClass.replace('bg-', 'border-').replace('-50', '-100')}">
                <span class="text-lg flex-shrink-0">${icon}</span>
                <div>
                    <p class="font-bold ${textClass} text-sm">${esc(item.action)}</p>
                    <p class="text-xs ${textClass.replace('-800', '-700').replace('-700', '-700')} mt-1">${esc(item.reason)}</p>
                </div>
            </div>`).join('');
    }

    return `
    <h3 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
        <span class="w-7 h-7 bg-rose-100 text-rose-700 rounded-lg flex items-center justify-center text-sm font-black">3</span>
        Recommendations
    </h3>
    <div class="space-y-3">
        ${recCard(recs.do, '✅', 'bg-emerald-50', 'text-emerald-800')}
        ${recCard(recs.dont, '❌', 'bg-red-50', 'text-red-800')}
        ${recCard(recs.watch, '⚠️', 'bg-amber-50', 'text-amber-800')}
    </div>`;
}

/* ─── 4. Cross-Analysis ─────────────────────────────────── */

function renderCrossAnalysis(analysis) {
    if (!analysis || analysis.length === 0) return '';

    const cards = analysis.map(a => {
        const c = getCityColor(a.city);
        return `
        <div style="background-color:${c.bg};border-left:5px solid ${c.border};border-radius:0.75rem;padding:1.5rem;">
            <h4 style="color:${c.text};font-weight:900;font-size:1.1rem;margin:0 0 0.25rem 0;">${c.flag} ${esc(a.city)}</h4>
            <p style="font-style:italic;font-weight:600;margin-bottom:0.75rem;font-size:0.85rem;color:${c.text};">"${esc(a.tagline)}"</p>
            <p class="text-sm text-slate-600 leading-relaxed" style="margin:0;">${esc(a.paragraph)}</p>
        </div>`;
    }).join('');

    return `
    <h3 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
        <span class="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-sm font-black">4</span>
        Quant-Qual Cross-Analysis
    </h3>
    <div class="grid grid-cols-1 gap-4">${cards}</div>`;
}

/* ─── 4b. Input Data (JS-computed, no LLM) ──────────────── */

function renderInputData(familyData, qualData) {
    let html = '';

    if (familyData && familyData.length > 0) {
        const memberCards = familyData.map(m => {
            const priorities = (m.priorities || []).map(p =>
                `<span style="display:inline-block;background:#ffe4e6;color:#be123c;font-size:10px;font-weight:700;padding:2px 8px;border-radius:9999px;margin-right:4px;margin-bottom:2px;">${esc(p)}</span>`
            ).join('');
            const traits = (m.personalTraits || []).map(t =>
                `<span style="display:inline-block;background:#dbeafe;color:#1d4ed8;font-size:10px;font-weight:700;padding:2px 8px;border-radius:9999px;margin-right:4px;margin-bottom:2px;">${esc(t)}</span>`
            ).join('');

            return `
            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:0.75rem;padding:1rem;">
                <h5 style="font-weight:900;font-size:0.95rem;margin:0 0 0.5rem 0;color:#334155;">${esc(m.name || 'Member ' + m.member)}</h5>
                <div style="font-size:0.7rem;color:#64748b;line-height:1.6;">
                    <div><strong>Age:</strong> ${esc(String(m.age))} · <strong>Gender:</strong> ${esc(m.gender)} · <strong>Profession:</strong> ${esc(m.profession)}</div>
                    <div><strong>Race:</strong> ${esc(m.race)} · <strong>Origin:</strong> ${esc(m.origin)}</div>
                    <div><strong>Family Location:</strong> ${esc(m.location || 'N/A')} · <strong>Risk Tolerance:</strong> ${esc(m.riskTolerance)}</div>
                    ${priorities ? `<div style="margin-top:4px;"><strong>Priorities:</strong> ${priorities}</div>` : ''}
                    ${traits ? `<div style="margin-top:4px;"><strong>Traits:</strong> ${traits}</div>` : ''}
                    ${m.hobbies ? `<div><strong>Hobbies:</strong> ${esc(m.hobbies)}</div>` : ''}
                </div>
            </div>`;
        }).join('');

        html += `
        <div style="margin-bottom:1.5rem;">
            <h4 style="font-size:0.95rem;font-weight:800;display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;">
                <span style="font-size:1.1rem;">👨‍👩‍👧‍👦</span> Family Unit
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">${memberCards}</div>
        </div>`;
    }

    if (qualData && qualData.length > 0) {
        const cities = Object.keys(qualData[0]).filter(k => k !== 'parameter');
        const headerCells = cities.map(city => {
            const c = getCityColor(city);
            return `<th class="py-2 px-2 text-[10px] font-black uppercase" style="color:${c.text};">${c.flag || ''} ${esc(city)}</th>`;
        }).join('');

        const rows = qualData.map(q => {
            const imp = q.importance || 3;
            const impBadge = `<span style="display:inline-block;background:#f1f5f9;color:#64748b;font-size:9px;font-weight:700;padding:1px 5px;border-radius:4px;margin-left:4px;">⭐${imp}</span>`;
            const paramCell = `<td class="py-2 px-2 font-bold text-slate-700 text-xs">${esc(q.parameter)}${impBadge}</td>`;
            const valueCells = cities.map(city => {
                const val = q[city] || '—';
                return `<td class="py-2 px-2 text-[11px] text-slate-500">${esc(val)}</td>`;
            }).join('');
            return `<tr class="border-b border-slate-100">${paramCell}${valueCells}</tr>`;
        }).join('');

        html += `
        <div>
            <h4 style="font-size:0.95rem;font-weight:800;display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;">
                <span style="font-size:1.1rem;">📊</span> Qualitative Assessments
            </h4>
            <div class="overflow-x-auto">
                <table class="w-full text-xs border-collapse">
                    <thead>
                        <tr class="border-b-2 border-slate-200">
                            <th class="text-left py-2 px-2 text-[10px] font-black text-slate-400 uppercase w-36">Parameter</th>
                            ${headerCells}
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>`;
    }

    if (!html) return '';

    return `
    <h3 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
        <span class="w-7 h-7 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center text-sm font-black">📋</span>
        Input Data
    </h3>
    <div class="card p-6 shadow-sm" style="border:1px solid #e2e8f0;">${html}</div>`;
}

/* ─── 5. Numbers Summary (JS-computed, no LLM) ──────────── */

function renderNumbersSummary(quantData) {
    if (!quantData || quantData.length === 0) return '';

    const cards = quantData.map(s => {
        const c = getCityColor(s.city);
        const curr = s.currency;
        const savingsRate = s['Total Income'] > 0
            ? ((s['Savings'] / s['Total Income']) * 100).toFixed(1)
            : '0.0';
        const yearly = s['Savings'] * 12;

        return `
        <div style="background:#fff;border:1px solid ${c.border};border-radius:0.75rem;padding:1.25rem;">
            <h4 style="color:${c.text};font-weight:900;font-size:1rem;margin:0 0 0.75rem 0;">${c.flag} ${esc(s.city)}</h4>
            <div class="report-stat-row"><span>Net Savings/Mo:</span> <span class="report-stat-val">${curr}${s['Savings'].toLocaleString()}</span></div>
            <div class="report-stat-row"><span>Net Savings/Yr:</span> <span class="report-stat-val">${curr}${yearly.toLocaleString()}</span></div>
            <div class="report-stat-row"><span>Savings Rate:</span> <span class="report-stat-val">${savingsRate}%</span></div>
            <hr style="margin:10px 0;border:0;border-top:1px solid #eee;">
            <div class="report-stat-row"><span>Total Income:</span> <span class="report-stat-val">${curr}${s['Total Income'].toLocaleString()}</span></div>
            <div class="report-stat-row"><span>Total Expenses:</span> <span class="report-stat-val">${curr}${s['Total Expenses'].toLocaleString()}</span></div>
        </div>`;
    }).join('');

    return `
    <h3 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
        <span class="w-7 h-7 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-sm font-black">5</span>
        Numbers Summary
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-${Math.min(quantData.length, 4)} gap-4">${cards}</div>`;
}

/* ─── 5b. Family Support Opportunity Cost ────────────────── */

function renderFamilySupportSummary(fsData) {
    if (!fsData || fsData.length === 0) return '';

    const cards = fsData.map(fs => {
        const c = getCityColor(fs.city);
        const curr = fs.currency;
        const travelMonthly = Math.round((fs.visits * fs.costPerTrip) / 12);

        return `
        <div style="background:#fff;border:1px solid ${c.border};border-radius:0.75rem;padding:1.25rem;">
            <h4 style="color:${c.text};font-weight:900;font-size:1rem;margin:0 0 0.75rem 0;">${c.flag} ${esc(fs.city)}</h4>
            <div class="report-stat-row"><span>Visits to family/yr:</span> <span class="report-stat-val">${fs.visits}</span></div>
            <div class="report-stat-row"><span>Avg cost/trip:</span> <span class="report-stat-val">${curr}${fs.costPerTrip.toLocaleString()}</span></div>
            <div class="report-stat-row"><span>Travel cost/mo:</span> <span class="report-stat-val">${curr}${travelMonthly.toLocaleString()}</span></div>
            <hr style="margin:10px 0;border:0;border-top:1px solid #eee;">
            <div class="report-stat-row"><span>Extra paid help/mo:</span> <span class="report-stat-val">${curr}${fs.extraHelp.toLocaleString()}</span></div>
            <div class="report-stat-row" style="font-size:1rem;"><span style="font-weight:700;">Total opp. cost/mo:</span> <span class="report-stat-val" style="color:${fs.totalMonthly > 200 ? '#ef4444' : '#1e293b'};">${curr}${fs.totalMonthly.toLocaleString()}</span></div>
        </div>`;
    }).join('');

    return `
    <h3 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
        <span class="w-7 h-7 bg-rose-100 text-rose-700 rounded-lg flex items-center justify-center text-sm font-black">✦</span>
        Opportunity Cost of Family Support
    </h3>
    <p class="text-xs text-slate-400 mb-4">Hidden costs of distance from your family network — travel expenses and paid help replacing free family support.</p>
    <div class="grid grid-cols-1 md:grid-cols-${Math.min(fsData.length, 4)} gap-4">${cards}</div>`;
}

/* ─── 6. Financial Visualizations (charts) ──────────────── */

function renderReportCharts(quantData) {
    if (!quantData || quantData.length === 0) return '';
    const cities = quantData.map(s => s.city);

    const doughnutsHtml = cities.map((city, i) => {
        const c = getCityColor(city);
        return `
        <div class="text-center">
            <p class="text-sm font-bold mb-1" style="color:${c.text}">${c.flag} ${esc(city)}</p>
            <div style="position:relative;height:180px;"><canvas id="reportCanvasComp${i}"></canvas></div>
        </div>`;
    }).join('');

    const years = parseInt(document.getElementById('projectionYearsSelect')?.value) || 10;

    return `
    <h3 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
        <span class="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-sm font-black">6</span>
        Financial Visualizations
    </h3>
    <div class="card p-6 mb-6">
        <h4 class="text-base font-bold flex items-center gap-2 mb-4">
            <span class="w-2 h-6 bg-blue-600 rounded-full"></span> Net Savings Comparison
        </h4>
        <div style="position:relative;height:280px;"><canvas id="reportCanvasSavings"></canvas></div>
    </div>
    <div class="card p-6 mb-6">
        <h4 class="text-base font-bold flex items-center gap-2 mb-4">
            <span class="w-2 h-6 bg-emerald-600 rounded-full"></span> Expense Breakdown
        </h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">${doughnutsHtml}</div>
        <div class="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2">
            <span class="flex items-center gap-1.5 text-sm font-semibold text-slate-600"><span class="w-3.5 h-3.5 rounded-sm inline-block" style="background:#334155"></span>Rent</span>
            <span class="flex items-center gap-1.5 text-sm font-semibold text-slate-600"><span class="w-3.5 h-3.5 rounded-sm inline-block" style="background:#ef4444"></span>Childcare</span>
            <span class="flex items-center gap-1.5 text-sm font-semibold text-slate-600"><span class="w-3.5 h-3.5 rounded-sm inline-block" style="background:#f59e0b"></span>Food</span>
            <span class="flex items-center gap-1.5 text-sm font-semibold text-slate-600"><span class="w-3.5 h-3.5 rounded-sm inline-block" style="background:#10b981"></span>Transport</span>
            <span class="flex items-center gap-1.5 text-sm font-semibold text-slate-600"><span class="w-3.5 h-3.5 rounded-sm inline-block" style="background:#6366f1"></span>Other</span>
            <span class="flex items-center gap-1.5 text-sm font-semibold text-slate-600"><span class="w-3.5 h-3.5 rounded-sm inline-block" style="background:#2563eb"></span>Savings</span>
        </div>
    </div>
    <div class="card p-6">
        <h4 class="text-base font-bold flex items-center gap-2 mb-4">
            <span class="w-2 h-6 bg-violet-600 rounded-full"></span> Family Net Worth Projection (${years} Years)
        </h4>
        <div style="position:relative;height:320px;"><canvas id="reportCanvasNetWorth"></canvas></div>
    </div>`;
}

function initReportChartInstances(quantData) {
    if (!quantData || quantData.length === 0) return;
    const cities = quantData.map(s => s.city);
    const cityColors = ['#2563eb', '#10b981', '#f59e0b', '#64748b'];

    const targetCurrency = document.getElementById('currencySelect')?.value || 'EUR';
    const sym = CURRENCY_SYMBOLS[targetCurrency] || targetCurrency + ' ';
    const mult = getMultiplier();
    const periodLabel = getPeriodLabel();

    // Bar chart — Net Savings Comparison
    const savingsCanvas = document.getElementById('reportCanvasSavings');
    if (savingsCanvas) {
        const savingsConverted = quantData.map(s => {
            const native = s.currency === '£' ? 'GBP' : 'EUR';
            return exchangeRates
                ? Math.round(convertCurrency(s['Savings'], native, targetCurrency) * mult)
                : Math.round(s['Savings'] * mult);
        });
        new Chart(savingsCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: cities,
                datasets: [{ label: periodLabel + ' Net Savings', data: savingsConverted, backgroundColor: cityColors.slice(0, cities.length), borderRadius: 12 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { callback: v => sym + v.toLocaleString() } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // Doughnut charts — Expense Breakdown
    const doughnutColors = ['#334155', '#ef4444', '#f59e0b', '#10b981', '#6366f1', '#2563eb'];
    const doughnutLabels = ['Rent', 'Childcare', 'Food', 'Transport', 'Other', 'Savings'];
    quantData.forEach((s, i) => {
        const canvas = document.getElementById('reportCanvasComp' + i);
        if (!canvas) return;
        const data = [s['Rent+Bills'], s['Childcare'], s['Food/Misc'], s['Transport'], s['Other'], Math.max(0, s['Savings'])];
        new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: { labels: doughnutLabels, datasets: [{ data, backgroundColor: doughnutColors, borderWidth: 0, hoverOffset: 6 }] },
            options: {
                cutout: '65%', responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { bodyFont: { size: 11 }, callbacks: {
                        title: () => '',
                        label: ctx => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                            return ctx.label + ': ' + ctx.parsed.toLocaleString() + ' (' + pct + '%)';
                        }
                    }}
                }
            }
        });
    });

    // Line chart — Net Worth Projection
    const nwCanvas = document.getElementById('reportCanvasNetWorth');
    if (nwCanvas) {
        const years = parseInt(document.getElementById('projectionYearsSelect')?.value) || 10;
        const monthlySavings = quantData.map(s => {
            const native = s.currency === '£' ? 'GBP' : 'EUR';
            return exchangeRates ? convertCurrency(s['Savings'], native, targetCurrency) : s['Savings'];
        });
        const labels = [];
        for (let y = 0; y <= years; y++) labels.push('Year ' + y);
        new Chart(nwCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: cities.map((city, i) => ({
                    label: city, data: labels.map((_, y) => Math.round((monthlySavings[i] || 0) * 12 * y)),
                    borderColor: cityColors[i], backgroundColor: cityColors[i] + '18',
                    fill: false, tension: 0.3, pointRadius: 2, pointHoverRadius: 5, borderWidth: 2.5
                }))
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16, font: { size: 11, weight: 'bold' } } } },
                scales: {
                    x: { title: { display: true, text: 'Year', font: { size: 11, weight: 'bold' }, color: '#94a3b8' }, grid: { display: false } },
                    y: { beginAtZero: true, title: { display: true, text: 'Cumulative Net Savings (' + sym.trim() + ')', font: { size: 11, weight: 'bold' }, color: '#94a3b8' }, grid: { color: '#f1f5f9' }, ticks: { callback: v => sym + v.toLocaleString() } }
                }
            }
        });
    }
}

/* ─── 7. Person Mapping ─────────────────────────────────── */

function renderPersonMapping(mapping, quantData) {
    if (!mapping || mapping.length === 0) return '';
    const cities = quantData.map(s => s.city);

    const headerCells = cities.map(city => {
        const c = getCityColor(city);
        return `<th class="py-3 px-2 text-[10px] font-black uppercase" style="color:${c.text};">${c.flag} ${esc(city)}</th>`;
    }).join('');

    const rows = mapping.map(param => {
        const cityCells = cities.map(city => {
            const people = param.cities?.[city] || [];
            const content = people.map(p =>
                `${p.emoji} <strong>${esc(p.name)}</strong>: ${esc(p.effect)}`
            ).join('<br>');
            return `<td class="py-3 px-2 text-slate-600 text-[11px]">${content}</td>`;
        }).join('');

        return `<tr class="border-b border-slate-100">
            <td class="py-3 px-2 font-bold text-slate-700">${param.emoji || ''} ${esc(param.parameter)}</td>
            ${cityCells}
        </tr>`;
    }).join('');

    return `
    <h3 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
        <span class="w-7 h-7 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center text-sm font-black">7</span>
        Qualitative-to-Person Mapping
    </h3>
    <div class="overflow-x-auto">
        <table class="w-full text-[11px] border-collapse">
            <thead>
                <tr class="border-b-2 border-slate-200">
                    <th class="text-left py-3 px-2 text-[10px] font-black text-slate-400 uppercase w-36">Parameter</th>
                    ${headerCells}
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    </div>`;
}

/* ─── 8. Happiness Matrix ───────────────────────────────── */

function scoreEmoji(n) {
    if (n >= 9) return '🤩';
    if (n >= 7) return '😄';
    if (n >= 5) return '🙂';
    if (n >= 3) return '😟';
    return '😩';
}

function renderHappinessMatrix(happiness, quantData) {
    if (!happiness) return '';
    const cities = quantData.map(s => s.city);

    const headerCells = cities.map(city => {
        const c = getCityColor(city);
        return `<th style="background-color:#f8fafc;font-weight:600;text-align:center;padding:1rem;border:1px solid #e2e8f0;color:${c.text};">${esc(city)}</th>`;
    }).join('');

    const memberRows = (happiness.members || []).map(member => {
        const cityCells = cities.map(city => {
            const s = member.scores?.[city];
            if (!s) return '<td style="padding:0.75rem;border:1px solid #e2e8f0;">—</td>';
            return `<td style="padding:0.75rem;border:1px solid #e2e8f0;">
                <div class="report-horizon-row"><span>First 6 mo:</span> <span class="report-score-bold">${s['6mo']}/10 ${scoreEmoji(s['6mo'])}</span></div>
                <div class="report-horizon-row"><span>1–3 years:</span> <span class="report-score-bold">${s['1_3y']}/10 ${scoreEmoji(s['1_3y'])}</span></div>
                <div class="report-horizon-row"><span>5+ years:</span> <span class="report-score-bold">${s['5y']}/10 ${scoreEmoji(s['5y'])}</span></div>
            </td>`;
        }).join('');

        return `<tr>
            <td style="padding:1rem;border:1px solid #e2e8f0;font-weight:600;background-color:#f8fafc;">${member.emoji} <strong>${esc(member.name)}</strong></td>
            ${cityCells}
        </tr>`;
    }).join('');

    const familyTotal = happiness.family_total || {};
    const totalCells = cities.map(city => {
        const ft = familyTotal[city];
        if (!ft) return '<td style="padding:0.75rem;border:1px solid #334155;text-align:center;">—</td>';
        const isWinner = happiness.verdict?.winner === city;
        const cls = isWinner ? 'report-winner-glow' : '';
        const labelColor = isWinner ? '#a7f3d0' : '#94a3b8';
        return `<td class="${cls}" style="padding:0.75rem;border:1px solid #334155;text-align:center;">
            <div style="font-size:1.3rem;">${ft.score.toFixed(1)}/10 ${scoreEmoji(ft.score)}</div>
            <div style="font-size:0.7rem;font-weight:normal;margin-top:5px;color:${labelColor};">${esc(ft.label)}</div>
        </td>`;
    }).join('');

    let verdictHtml = '';
    if (happiness.verdict) {
        const v = happiness.verdict;
        verdictHtml = `
        <div style="text-align:center;margin-top:1.5rem;padding:1.5rem;background:#dcfce7;border:2px solid #10b981;border-radius:0.5rem;font-size:1.1rem;font-weight:bold;color:#065f46;">
            🏆 <strong>VERDICT: ${esc(v.winner).toUpperCase()} WINS.</strong> ${esc(v.text)}
        </div>`;
    }

    return `
    <h3 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
        <span class="w-7 h-7 bg-fuchsia-100 text-fuchsia-700 rounded-lg flex items-center justify-center text-sm font-black">8</span>
        🎯 Happiness Score Matrix
    </h3>
    <div class="bg-violet-50 rounded-xl p-4 mb-4 text-xs text-violet-700 leading-relaxed border border-violet-100" style="border-left:4px solid #cbd5e1;background:#f8fafc;color:#475569;font-style:italic;border-radius:0 0.5rem 0.5rem 0;">
        <p>Each family member is rated on a <strong>1–10 happiness scale</strong> for every city, across <strong>three time horizons</strong>: how they'd feel in the <strong>first 6 months</strong> (settling in), after <strong>1–3 years</strong> (established routines), and at <strong>5+ years</strong> (long-term life trajectory).</p>
        <p style="margin-top:0.5rem;"><strong>How scores are computed:</strong> Individual scores weigh each member's <em>personal traits</em>, <em>priorities</em>, and <em>hobbies</em> against each city's qualitative parameters (safety, weather, food, healthcare, integration, etc.) and financial sustainability (net savings, savings rate). For example, an introverted person scores higher in calm, walkable cities; a family-oriented person scores higher where extended family is nearby; career-focused members score higher where job markets are dynamic.</p>
        <p style="margin-top:0.5rem;">The <strong>Family Total</strong> is a <em>weighted average</em>: adults carry more weight on financial and career factors, children carry more weight on schooling, safety, and social environment. Cities with <strong>negative net savings</strong> are capped at 5/10 since the family cannot sustain itself there long-term.</p>
    </div>
    <div class="text-center mb-4 text-xs text-slate-500 font-medium">
        <strong>Score Legend:</strong> 🤩 9-10 Amazing · 😄 7-8 Great · 🙂 5-6 Decent · 😟 3-4 Poor · 😩 1-2 Miserable
    </div>
    <div class="overflow-x-auto">
        <table class="w-full text-xs border-collapse" style="border:1px solid #e2e8f0;">
            <thead>
                <tr>
                    <th style="background-color:#f8fafc;font-weight:600;text-align:center;padding:1rem;border:1px solid #e2e8f0;">Family Member</th>
                    ${headerCells}
                </tr>
            </thead>
            <tbody>
                ${memberRows}
                <tr class="report-total-row" style="background-color:#1e293b;color:#fff;font-weight:bold;">
                    <td style="padding:1rem;border:1px solid #334155;background-color:#0f172a;color:#fff;font-weight:bold;">👨‍👩‍👧‍👦 <strong>FAMILY TOTAL</strong></td>
                    ${totalCells}
                </tr>
            </tbody>
        </table>
    </div>
    ${verdictHtml}`;
}
