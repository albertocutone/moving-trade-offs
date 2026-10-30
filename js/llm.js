/**
 * LLM — Gemini API client.
 * Sends the structured prompt to Gemini and returns the parsed JSON response.
 */

const GEMINI_MODELS = [
    'gemini-2.5-pro',     // lower free-tier RPD (25) but better quality
    'gemini-2.5-flash',   // higher free-tier RPD (500)
    'gemini-2.0-flash',   // last resort
];
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_RETRIES = 1;
const BASE_DELAY_MS = 2000;

function initLLM() {
    const input = document.getElementById('geminiApiKey');
    const section = document.getElementById('apiKeySection');
    if (!input) return;

    // Remove keys saved by earlier versions; never persist credentials.
    try { localStorage.removeItem('gemini_api_key'); } catch (_) {}
    input.value = '';
    if (section) section.classList.remove('hidden');

}

function isValidApiKey(key) {
    return typeof key === 'string' && key.length > 0 && key.startsWith('AIza');
}

function getApiKey() {
    const input = document.getElementById('geminiApiKey');
    const uiKey = input?.value?.trim() || '';
    if (uiKey) return uiKey;
    return '';
}

function showLLMStatus(msg, isSpinner) {
    const el = document.getElementById('llmStatus');
    el.classList.remove('hidden');
    el.innerHTML = isSpinner
        ? `<svg class="animate-spin h-4 w-4 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> ${msg}`
        : msg;
}

function hideLLMStatus() {
    document.getElementById('llmStatus').classList.add('hidden');
}

function showLLMError(msg) {
    const el = document.getElementById('llmError');
    el.classList.remove('hidden');
    el.textContent = msg;
}

function hideLLMError() {
    document.getElementById('llmError').classList.add('hidden');
}

async function callGeminiModel(model, promptText, key) {
    const url = `${GEMINI_BASE}/${model}:generateContent`;
    const body = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 65536,
            responseMimeType: 'application/json',
        },
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = String(err?.error?.message || `HTTP ${res.status}`).split(key).join('[redacted]');
        const retryMatch = msg.match(/retry in ([\d.]+)s/i);
        const retryAfterSec = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : null;
        throw { status: res.status, message: msg, retryAfterSec, model };
    }

    const data = await res.json();
    const finishReason = data?.candidates?.[0]?.finishReason;
    if (finishReason === 'MAX_TOKENS') {
        throw new Error(
            'Gemini response was truncated (hit token limit). '
            + 'The prompt or expected output may be too large.'
        );
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw { status: 0, message: 'Empty response', model };

    const usage = data?.usageMetadata || {};
    return {
        text,
        usage: {
            promptTokens: usage.promptTokenCount || 0,
            outputTokens: usage.candidatesTokenCount || 0,
            totalTokens: usage.totalTokenCount || 0,
        },
    };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function callGeminiWithRetry(promptText, statusCallback) {
    const key = getApiKey();
    if (!key) {
        throw new Error(
            'Missing API key. Paste your own Gemini key into the API key field. '
            + 'Get a free key at https://aistudio.google.com/apikey'
        );
    }
    if (!isValidApiKey(key)) {
        throw new Error(
            'Invalid API key format — Gemini keys start with "AIza". '
            + 'Check the API key field.'
        );
    }

    for (let mi = 0; mi < GEMINI_MODELS.length; mi++) {
        const model = GEMINI_MODELS[mi];
        const nextModel = GEMINI_MODELS[mi + 1];

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const result = await callGeminiModel(model, promptText, key);
                return { ...result, modelUsed: model };
            } catch (err) {
                const isOverloaded = err.status === 503 || err.status === 429
                    || (err.message && /high demand|overloaded|resource.*exhausted/i.test(err.message));

                if (!isOverloaded) throw err;

                const delaySec = err.retryAfterSec || Math.min(BASE_DELAY_MS / 1000 * Math.pow(2, attempt), 60);
                const isLastAttempt = attempt === MAX_RETRIES - 1;

                if (isLastAttempt && nextModel) {
                    if (statusCallback) statusCallback(`⚠️ ${model} overloaded after ${MAX_RETRIES} retries, switching to ${nextModel}…`);
                    console.warn(`[LLM] ${model} overloaded after ${MAX_RETRIES} attempts, falling back to ${nextModel}`);
                    break;
                }
                if (isLastAttempt && !nextModel) {
                    throw new Error(
                        `All models (${GEMINI_MODELS.join(', ')}) are overloaded after ${MAX_RETRIES} retries each. `
                        + 'Google servers are under heavy load. Please try again in a few minutes.'
                    );
                }

                if (statusCallback) statusCallback(`⏳ ${model} overloaded — retry ${attempt + 1}/${MAX_RETRIES} in ${Math.ceil(delaySec)}s…`);
                console.warn(`[LLM] ${model} overloaded (${err.status}), retrying in ${delaySec}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
                await sleep(delaySec * 1000);
            }
        }
    }
}

async function callGemini(promptText, statusCallback) {
    const result = await callGeminiWithRetry(promptText, statusCallback);
    const { text, usage, modelUsed } = result;

    if (modelUsed !== GEMINI_MODELS[0]) {
        console.info(`[LLM] Response served by fallback model: ${modelUsed}`);
    }

    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

    if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
        const start = cleaned.indexOf('{');
        if (start !== -1) {
            cleaned = cleaned.substring(start);
        }
    }

    try {
        const parsed = JSON.parse(cleaned);
        parsed.__usage = usage;
        parsed.__model = modelUsed;
        return parsed;
    } catch (e) {
        throw new Error(
            `${modelUsed} returned invalid JSON. Please try again.`
        );
    }
}

function renderPromptStats(stats) {
    const container = document.getElementById('promptStatsContainer');
    if (!container) return;
    container.classList.remove('hidden');

    const totals = stats.chunks.reduce((acc, c) => ({
        promptTokens: acc.promptTokens + c.usage.promptTokens,
        outputTokens: acc.outputTokens + c.usage.outputTokens,
        totalTokens: acc.totalTokens + c.usage.totalTokens,
        promptChars: acc.promptChars + c.promptChars,
    }), { promptTokens: 0, outputTokens: 0, totalTokens: 0, promptChars: 0 });

    const fmtMs = ms => ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
    const fmtNum = n => n.toLocaleString();

    let html = `
    <div class="flex items-center gap-2 mb-3">
        <span class="text-sm font-black text-slate-700">📊 Prompt Stats</span>
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">(dev)</span>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div class="bg-violet-50 rounded-lg p-3 text-center">
            <div class="text-lg font-black text-violet-700">${fmtNum(totals.totalTokens)}</div>
            <div class="text-[10px] font-bold text-violet-400 uppercase">Total Tokens</div>
        </div>
        <div class="bg-blue-50 rounded-lg p-3 text-center">
            <div class="text-lg font-black text-blue-700">${fmtNum(totals.promptTokens)}</div>
            <div class="text-[10px] font-bold text-blue-400 uppercase">Prompt Tokens</div>
        </div>
        <div class="bg-emerald-50 rounded-lg p-3 text-center">
            <div class="text-lg font-black text-emerald-700">${fmtNum(totals.outputTokens)}</div>
            <div class="text-[10px] font-bold text-emerald-400 uppercase">Output Tokens</div>
        </div>
        <div class="bg-amber-50 rounded-lg p-3 text-center">
            <div class="text-lg font-black text-amber-700">${fmtMs(stats.totalMs)}</div>
            <div class="text-[10px] font-bold text-amber-400 uppercase">Total Time</div>
        </div>
    </div>
    <table class="w-full text-xs">
        <thead>
            <tr class="border-b border-slate-200 text-left">
                <th class="py-1.5 font-bold text-slate-500">Chunk</th>
                <th class="py-1.5 font-bold text-slate-500 text-right">Prompt chars</th>
                <th class="py-1.5 font-bold text-slate-500 text-right">Prompt tkns</th>
                <th class="py-1.5 font-bold text-slate-500 text-right">Output tkns</th>
                <th class="py-1.5 font-bold text-slate-500 text-right">Total tkns</th>
                <th class="py-1.5 font-bold text-slate-500 text-right">Time</th>
            </tr>
        </thead>
        <tbody>`;

    stats.chunks.forEach(c => {
        html += `
            <tr class="border-b border-slate-100">
                <td class="py-1.5 font-semibold text-slate-700">${c.label}</td>
                <td class="py-1.5 text-right font-mono text-slate-500">${fmtNum(c.promptChars)}</td>
                <td class="py-1.5 text-right font-mono text-blue-600">${fmtNum(c.usage.promptTokens)}</td>
                <td class="py-1.5 text-right font-mono text-emerald-600">${fmtNum(c.usage.outputTokens)}</td>
                <td class="py-1.5 text-right font-mono text-violet-600">${fmtNum(c.usage.totalTokens)}</td>
                <td class="py-1.5 text-right font-mono text-amber-600">${fmtMs(c.ms)}</td>
            </tr>`;
    });

    html += `
        </tbody>
    </table>`;

    container.innerHTML = html;
    console.log('[Prompt Stats]', { totals, chunks: stats.chunks, totalMs: stats.totalMs });
}

async function generateReport() {
    const btn = document.getElementById('generateReportBtn');
    hideLLMError();
    hideLLMStatus();

    try {
        btn.disabled = true;
        btn.style.opacity = '0.6';
        showLLMStatus('Collecting data and building prompt…', true);

        const quantData = collectTableData();
        const qualData = collectQualitativeData();
        const familyData = collectFamilyData();
        const familySupportData = collectFamilySupportData();

        const prompt = buildPromptText(quantData, qualData, familyData);

        const stats = { chunks: [], totalStart: performance.now() };
        const statusCb = (msg) => showLLMStatus(msg, true);

        showLLMStatus('⚡ Analyzing all data in one shot…', true);
        const t0 = performance.now();
        const json = await callGemini(prompt, statusCb);
        stats.chunks.push({ label: 'Full analysis', ms: performance.now() - t0, promptChars: prompt.length, usage: json.__usage, model: json.__model });

        stats.totalMs = performance.now() - stats.totalStart;

        renderReport(json, quantData, familySupportData, familyData, qualData);
        renderPromptStats(stats);

        hideLLMStatus();
        showLLMStatus('✅ Report generated successfully', false);
        setTimeout(hideLLMStatus, 3000);
    } catch (err) {
        hideLLMStatus();
        showLLMError(err.message);
    } finally {
        btn.disabled = false;
        btn.style.opacity = '1';
    }
}
