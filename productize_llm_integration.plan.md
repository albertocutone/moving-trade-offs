> **Historical implementation plan.** The current demo keeps visitor API keys in memory and sends them in a request header. See README.md for current setup and privacy behavior.

## Context

The current `prompt.js` asks the LLM to generate a full self-contained HTML report (layout, CSS, JS, animations). This is wasteful and unpredictable — the report template already exists in `example-report.html`. The LLM should only return **structured JSON** with heuristic/qualitative content. The hardcoded JS fills the template with both computed data and LLM output.

## Architecture

```mermaid
flowchart TD
    subgraph "User Input"
        A1[Family members]
        A2[Quantitative table]
        A3[Qualitative table]
    end

    subgraph "JS Engine — hardcoded"
        B1["collectTableData()"]
        B2["performCalculation()"]
        B3["Charts: bar, doughnuts, projections"]
        B4["Numbers: savings, rates, comparisons"]
    end

    subgraph "LLM — heuristics only"
        C1["Prompt = data only\n(no layout instructions)"]
        C2["Gemini API"]
        C3["Returns JSON:\n• ranking + justification\n• recommendations\n• cross-analysis text\n• person mapping\n• happiness scores"]
    end

    subgraph "Report Template — hardcoded HTML"
        D1["§1 Numbers Summary\n← JS charts + computed data"]
        D2["§2 Cross-Analysis\n← LLM text"]
        D3["§3 Person Mapping\n← LLM text"]
        D4["§4 Recommendations\n← LLM text"]
        D5["§5 Happiness Matrix\n← LLM scores"]
    end

    A1 & A2 & A3 --> B1
    B1 --> B2 --> B3 & B4
    A1 & A2 & A3 --> C1 --> C2 --> C3
    B3 & B4 --> D1
    C3 --> D2 & D3 & D4 & D5
```

```mermaid
flowchart LR
    subgraph "Current prompt.js (BEFORE)"
        P1["280 lines of HTML/CSS/JS\nlayout instructions\nanimation specs\npodium template code"]
    end
    subgraph "New prompt.js (AFTER)"
        P2["Send: family + quant + qual DATA\nAsk: return JSON with\nrankings, text, scores\nNo layout instructions"]
    end
    P1 -. "replace" .-> P2
```

---

## Phase 1: Remove "Calculate & Update Analysis" button
- Delete button from `index.html` (~line 447–451)
- Auto-trigger `performCalculation()` on input changes (debounced)
- Remove blur overlays — charts render immediately

## Phase 2: Rewrite the prompt
- Strip all HTML/CSS/JS generation instructions from `buildPromptText()`
- Keep the data collection (family, quant, qual) — that stays
- New prompt says: "Analyze this data. Return a JSON object with these keys:" and defines the schema (ranking, justification, recommendations, cross-analysis, person-mapping, happiness-scores)
- The LLM returns **JSON only**, not HTML

## Phase 3: Add Gemini API client
- Create `js/llm.js` — calls `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- API key input field in UI, held in memory only
- "Generate Report" button replaces "Generate Prompt" + clipboard flow

## Phase 4: Build the report renderer
- Create `js/report.js` — takes the hardcoded template (based on `example-report.html`) and populates it:
  - **Numbers Summary**: filled by JS (computed savings, rates, charts moved here)
  - **Cross-Analysis, Person Mapping, Recommendations, Happiness Matrix**: filled from LLM JSON response
- Renders inline in the page where the current AI Report section is

---

## Gemini API Key — Setup

1. Go to [Google AI Studio → API Keys](https://aistudio.google.com/apikey)
2. Click **"Create API Key"**
3. Select or create a Google Cloud project
4. Copy the key (format: `AIza...`)
5. Paste it into the app's API key field (held in memory only)
6. The app calls: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent` with the `x-goog-api-key` request header
7. **Later (cloud)**: move the key server-side, swap the URL to your proxy endpoint

---

## Files

| File | Action |
|------|--------|
| `index.html` | Remove calc button + overlays, add API key input, add report container |
| `js/prompt.js` | Rewrite: keep data collectors, new prompt asks for JSON output only |
| `js/llm.js` | **New** — Gemini API client |
| `js/report.js` | **New** — fills hardcoded template with JS data + LLM JSON |
| `js/calculator.js` | Add auto-trigger on input change |
| `js/app.js` | Wire new modules |