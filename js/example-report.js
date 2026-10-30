/**
 * Example AI Report — lazily injected into #exampleReportContainer
 * only when the user opens the <details> element, avoiding ~600 lines
 * of HTML parsing on initial page load.
 */

(function () {
    const details = document.querySelector('details:has(#exampleReportContainer)');
    if (!details) return;

    let loaded = false;
    details.addEventListener('toggle', function () {
        if (loaded || !details.open) return;
        loaded = true;
        injectExampleReport();
    });
})();

function injectExampleReport() {
    const container = document.getElementById('exampleReportContainer');
    if (!container) return;

    container.innerHTML = `
<div class="bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200 rounded-xl p-4 mb-6 flex items-start gap-3">
    <span class="text-lg">💡</span>
    <p class="text-xs text-violet-700 leading-relaxed"><strong>This is a static example.</strong> The actual AI report will vary based on the LLM you use and the data you enter. Generate your own prompt above and paste it into ChatGPT, Gemini, or Claude for a personalised analysis.</p>
</div>

<!-- 1. Final Ranking (Podium) -->
<div class="mb-8">
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
        <div id="examplePodiumContainer" style="display:flex;align-items:flex-end;justify-content:center;gap:0.75rem;min-height:260px;">
        </div>
    </div>
</div>

<!-- 2. Final Ranking for the Family (Justification) -->
<div class="mb-8">
    <h3 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
        <span class="w-7 h-7 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center text-sm font-black">2</span>
        🏆 Final Ranking for the Family
    </h3>
    <div class="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 leading-relaxed">
        <p class="mb-2"><strong>Padova takes #1</strong> not because it has the highest savings — London does, at £3,900/mo vs €1,500 — but because it delivers the best <em>holistic</em> outcome for this specific family. Alberto's introversion and need for sunshine are well-served by Padova's calm, walkable environment (✅ Top in 5/10 qualitative categories). Martina's extroverted personality and desire for family proximity align perfectly with the community-oriented culture and easy access to southern Italy. The children benefit from top-rated safety, healthcare, and food quality — all rated ✅ Top.</p>
        <p class="mb-2"><strong>London lands #2:</strong> the financial muscle is undeniable (2.6× Padova's savings), but Alberto's mental health risk with grey weather and the family's happiness scores declining long-term (5.8/10) make it a strong earner but a weaker home. <strong>Rome Center is #3:</strong> beautiful weather and zero discrimination, but €700/mo savings is dangerously thin for a family of four (16% savings rate). <strong>Rome Suburbs finishes last:</strong> it captures neither Rome's vibrancy nor a small city's walkability, and the family happiness score drops to 4.3/10 long-term — the lowest of all options.</p>
    </div>
</div>

<!-- 3. Recommendations -->
<div class="mb-8">
    <h3 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
        <span class="w-7 h-7 bg-rose-100 text-rose-700 rounded-lg flex items-center justify-center text-sm font-black">3</span>
        Recommendations
    </h3>
    <div class="space-y-3">
        <div class="flex items-start gap-3 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <span class="text-lg flex-shrink-0">✅</span>
            <div>
                <p class="font-bold text-emerald-800 text-sm">DO: Seriously consider Padova as the primary relocation target</p>
                <p class="text-xs text-emerald-700 mt-1">It ranks ✅ Top in 5/10 qualitative categories and offers the best balance of savings (€1,500/mo), safety, healthcare, and food quality. The €2,400/mo savings gap vs London narrows significantly when accounting for childcare savings, lower stress, and better health outcomes.</p>
            </div>
        </div>
        <div class="flex items-start gap-3 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <span class="text-lg flex-shrink-0">✅</span>
            <div>
                <p class="font-bold text-emerald-800 text-sm">DO: Negotiate a remote/hybrid UK salary if moving to Italy</p>
                <p class="text-xs text-emerald-700 mt-1">As a Software Engineer, Alberto could potentially retain 60-80% of his London salary working remotely for a UK company. This would close the savings gap to nearly zero while gaining all of Italy's qualitative advantages.</p>
            </div>
        </div>
        <div class="flex items-start gap-3 bg-red-50 rounded-xl p-4 border border-red-100">
            <span class="text-lg flex-shrink-0">❌</span>
            <div>
                <p class="font-bold text-red-800 text-sm">DON'T: Move to Rome Center with current income levels</p>
                <p class="text-xs text-red-700 mt-1">€700/mo savings for a family of four is dangerously thin. One unexpected expense (car repair, medical bill, job loss) could wipe out months of savings. The rent-to-income ratio of 37% is unsustainable.</p>
            </div>
        </div>
        <div class="flex items-start gap-3 bg-red-50 rounded-xl p-4 border border-red-100">
            <span class="text-lg flex-shrink-0">❌</span>
            <div>
                <p class="font-bold text-red-800 text-sm">DON'T: Choose Rome Suburbs expecting "the best of both worlds"</p>
                <p class="text-xs text-red-700 mt-1">It captures neither Rome's cultural vibrancy nor a small city's walkability. Transport costs surge to €500/mo, and isolation risks are high — especially for the wife's extroverted personality and the family's need for community.</p>
            </div>
        </div>
        <div class="flex items-start gap-3 bg-amber-50 rounded-xl p-4 border border-amber-100">
            <span class="text-lg flex-shrink-0">⚠️</span>
            <div>
                <p class="font-bold text-amber-800 text-sm">WATCH OUT: Alberto's mental health in London long-term</p>
                <p class="text-xs text-amber-700 mt-1">His stated need for sunshine directly conflicts with London's climate. Seasonal Affective Disorder (SAD) affects ~30% of UK residents. The financial gains may be offset by therapy, light therapy, and reduced productivity if his mental health declines.</p>
            </div>
        </div>
        <div class="flex items-start gap-3 bg-amber-50 rounded-xl p-4 border border-amber-100">
            <span class="text-lg flex-shrink-0">⚠️</span>
            <div>
                <p class="font-bold text-amber-800 text-sm">WATCH OUT: Italian salary stagnation over 10+ years</p>
                <p class="text-xs text-amber-700 mt-1">Italy's tech salaries grow at ~2-3%/year vs UK's 5-8%. By age 44, Alberto's London salary could be £120k+ while his Italian equivalent may plateau at €45-50k. Factor in long-term wealth accumulation, pension contributions, and property equity.</p>
            </div>
        </div>
    </div>
</div>

<!-- 4. Quant-Qual Cross-Analysis -->
<div class="mb-8">
    <h3 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
        <span class="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-sm font-black">4</span>
        Quant-Qual Cross-Analysis
    </h3>
    <div class="grid grid-cols-1 gap-4">
        <div style="background-color: #e0f2fe; border-left: 5px solid #0284c7; border-radius: 0.75rem; padding: 1.5rem;">
            <h4 style="color: #0284c7; font-weight: 900; font-size: 1.1rem; margin: 0 0 0.25rem 0;">🇬🇧 London</h4>
            <p style="font-style: italic; font-weight: 600; margin-bottom: 0.75rem; font-size: 0.85rem; color: #0369a1;">"High earnings, high friction"</p>
            <p class="text-sm text-slate-600 leading-relaxed" style="margin: 0;">The financial advantage is undeniable, but the qualitative picture reveals a harsh reality: the NHS is collapsing (❌), weather is grey and depressing (❌), and the cost of living creates a treadmill effect. Alberto's need for sunshine for mental health directly clashes with London's 1,500 hours of annual sunlight (vs Rome's 2,500+). His wife's extroversion and need for community may thrive in London's multicultural environment, but her closeness to parents suffers enormously. The children benefit from natural bilingualism but childcare costs eat £1,500/mo — and quality varies wildly by postcode.</p>
        </div>
        <div style="background-color: #dcfce7; border-left: 5px solid #059669; border-radius: 0.75rem; padding: 1.5rem;">
            <h4 style="color: #059669; font-weight: 900; font-size: 1.1rem; margin: 0 0 0.25rem 0;">🇮🇹 Padova</h4>
            <p style="font-style: italic; font-weight: 600; margin-bottom: 0.75rem; font-size: 0.85rem; color: #047857;">"The balanced sweet spot"</p>
            <p class="text-sm text-slate-600 leading-relaxed" style="margin: 0;">Despite saving €2,400/mo less than London, Padova scores ✅ Top in 5 out of 10 qualitative parameters (quality of life, schools, safety, healthcare, food). For Alberto's introverted personality, a calm walkable city is ideal. For his wife, the proximity to family (both from southern Italy — easy train to Rome/Naples) and the community-oriented culture match her traits perfectly. Childcare at €600/mo frees up budget, and the university-city vibe offers multicultural exposure. The main risk: career stagnation for Alberto (salary glass ceiling in Italy's tech scene).</p>
        </div>
        <div style="background-color: #ffedd5; border-left: 5px solid #ea580c; border-radius: 0.75rem; padding: 1.5rem;">
            <h4 style="color: #ea580c; font-weight: 900; font-size: 1.1rem; margin: 0 0 0.25rem 0;">🇮🇹 Rome Center</h4>
            <p style="font-style: italic; font-weight: 600; margin-bottom: 0.75rem; font-size: 0.85rem; color: #c2410c;">"Beautiful but unsustainable"</p>
            <p class="text-sm text-slate-600 leading-relaxed" style="margin: 0;">Only €700/mo savings is precarious for a young family. Rent at €1,600 is near-London levels without London salaries. Safety is ❌ Critical, and the chaotic daily life contradicts Alberto's need for analytical calm. However, the weather is ✅ Top for mental health, and the southern Italian diaspora means zero discrimination for the family. Rome's food scene and cultural richness are unmatched — but these benefits don't compensate for the financial squeeze.</p>
        </div>
        <div style="background-color: #f1f5f9; border-left: 5px solid #475569; border-radius: 0.75rem; padding: 1.5rem;">
            <h4 style="color: #475569; font-weight: 900; font-size: 1.1rem; margin: 0 0 0.25rem 0;">🇮🇹 Rome Suburbs</h4>
            <p style="font-style: italic; font-weight: 600; margin-bottom: 0.75rem; font-size: 0.85rem; color: #334155;">"Quiet but isolated"</p>
            <p class="text-sm text-slate-600 leading-relaxed" style="margin: 0;">Saves €600/mo more than Rome Center, mostly from rent (€1,000 vs €1,600). But the qualitative trade-offs are severe: car-dependence (transport jumps to €500), low quality of life, critical healthcare access, and isolation risk. For the wife's extroverted personality and need for community, suburban isolation could be detrimental. The children lose walkable amenities and extracurricular options.</p>
        </div>
    </div>
</div>

<!-- 5. Numbers Summary -->
<div class="mb-8">
    <h3 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
        <span class="w-7 h-7 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-sm font-black">5</span>
        Numbers Summary
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div style="background: #fff; border: 1px solid #0284c7; border-radius: 0.75rem; padding: 1.25rem;">
            <h4 style="color: #0284c7; font-weight: 900; font-size: 1rem; margin: 0 0 0.75rem 0;">🇬🇧 London</h4>
            <div class="report-stat-row"><span>Net Savings/Mo:</span> <span class="report-stat-val">£3,900</span></div>
            <div class="report-stat-row"><span>Net Savings/Yr:</span> <span class="report-stat-val">£46,800</span></div>
            <div class="report-stat-row"><span>Savings Rate:</span> <span class="report-stat-val">47.6%</span></div>
            <hr style="margin: 10px 0; border: 0; border-top: 1px solid #eee;">
            <p style="font-size: 0.8rem; color: #64748b; margin: 0;"><strong>Key Observation:</strong> Generates over 2.5× the annual savings of the best Italian option, but childcare (£1,500) and rent (£1,500) consume a massive portion of gross income.</p>
        </div>
        <div style="background: #fff; border: 1px solid #059669; border-radius: 0.75rem; padding: 1.25rem;">
            <h4 style="color: #059669; font-weight: 900; font-size: 1rem; margin: 0 0 0.75rem 0;">🇮🇹 Padova</h4>
            <div class="report-stat-row"><span>Net Savings/Mo:</span> <span class="report-stat-val">€1,500</span></div>
            <div class="report-stat-row"><span>Net Savings/Yr:</span> <span class="report-stat-val">€18,000</span></div>
            <div class="report-stat-row"><span>Savings Rate:</span> <span class="report-stat-val">34.5%</span></div>
            <hr style="margin: 10px 0; border: 0; border-top: 1px solid #eee;">
            <p style="font-size: 0.8rem; color: #64748b; margin: 0;"><strong>Key Observation:</strong> Highly efficient. Rent is reasonable (€1,100), yielding the best savings rate in Italy while fully funding top-tier regional amenities.</p>
        </div>
        <div style="background: #fff; border: 1px solid #ea580c; border-radius: 0.75rem; padding: 1.25rem;">
            <h4 style="color: #ea580c; font-weight: 900; font-size: 1rem; margin: 0 0 0.75rem 0;">🇮🇹 Rome Center</h4>
            <div class="report-stat-row"><span>Net Savings/Mo:</span> <span class="report-stat-val">€700</span></div>
            <div class="report-stat-row"><span>Net Savings/Yr:</span> <span class="report-stat-val">€8,400</span></div>
            <div class="report-stat-row"><span>Savings Rate:</span> <span class="report-stat-val">16.1%</span></div>
            <hr style="margin: 10px 0; border: 0; border-top: 1px solid #eee;">
            <p style="font-size: 0.8rem; color: #64748b; margin: 0;"><strong>Key Observation:</strong> Financially hazardous. The €1,600 rent creates a dangerously low 16% savings rate, leaving the family highly vulnerable to unexpected expenses.</p>
        </div>
        <div style="background: #fff; border: 1px solid #475569; border-radius: 0.75rem; padding: 1.25rem;">
            <h4 style="color: #475569; font-weight: 900; font-size: 1rem; margin: 0 0 0.75rem 0;">🇮🇹 Rome Suburbs</h4>
            <div class="report-stat-row"><span>Net Savings/Mo:</span> <span class="report-stat-val">€1,300</span></div>
            <div class="report-stat-row"><span>Net Savings/Yr:</span> <span class="report-stat-val">€15,600</span></div>
            <div class="report-stat-row"><span>Savings Rate:</span> <span class="report-stat-val">29.9%</span></div>
            <hr style="margin: 10px 0; border: 0; border-top: 1px solid #eee;">
            <p style="font-size: 0.8rem; color: #64748b; margin: 0;"><strong>Key Observation:</strong> Moving to the suburbs recovers €600/month compared to the center, but transportation costs (€500) eat into the benefits due to car reliance.</p>
        </div>
    </div>
    <div class="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 leading-relaxed">
        <p class="mb-2"><strong>Key observations:</strong> London dominates economically with <strong>£3,900/mo</strong> in net savings — roughly <strong>2.6× Padova</strong> and <strong>5.6× Rome Center</strong> when converted to the same currency (at ~€1.17/£). The biggest expense differentiator is <strong>childcare</strong>: £1,500 in London vs €600 in Padova (60% lower). Rent also drops significantly: London's £1,500 vs Padova's €1,100 (27% less). However, Italian total household income (€4,350) is <strong>47% lower</strong> than London's (£8,200 ≈ €9,600), which is the primary driver of the savings gap.</p>
        <p><strong>Rome Center</strong> is the weakest scenario: rent is nearly as high as London (€1,600) but income is Italian-level, leaving only €700/mo — a dangerously thin buffer for a family of four.</p>
    </div>
</div>

<!-- 6. Qualitative-to-Person Mapping -->
<div class="mb-8">
    <h3 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
        <span class="w-7 h-7 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center text-sm font-black">6</span>
        Qualitative-to-Person Mapping
    </h3>
    <div class="overflow-x-auto">
        <table class="w-full text-[11px] border-collapse">
            <thead>
                <tr class="border-b-2 border-slate-200">
                    <th class="text-left py-3 px-2 text-[10px] font-black text-slate-400 uppercase w-36">Parameter</th>
                    <th class="py-3 px-2 text-[10px] font-black text-blue-600 uppercase">🇬🇧 London</th>
                    <th class="py-3 px-2 text-[10px] font-black text-emerald-600 uppercase">🇮🇹 Padova</th>
                    <th class="py-3 px-2 text-[10px] font-black text-amber-600 uppercase">🇮🇹 Rome Center</th>
                    <th class="py-3 px-2 text-[10px] font-black text-slate-500 uppercase">🇮🇹 Rome Suburbs</th>
                </tr>
            </thead>
            <tbody>
                <tr class="border-b border-slate-100">
                    <td class="py-3 px-2 font-bold text-slate-700">🌟 Quality of Life</td>
                    <td class="py-3 px-2 text-slate-600">
                        🧔 Alberto: High stress, long commutes erode his introvert energy<br>
                        👩 Martina: World-class cultural scene but <span class="text-amber-600 font-semibold">relentless pace</span> conflicts with nurturing lifestyle<br>
                        👧 Sofia: Limited outdoor space, park access requires transit<br>
                        👶 Marco: Urban noise and pollution not ideal for infant development
                    </td>
                    <td class="py-3 px-2 text-emerald-700 font-medium bg-emerald-50/30">
                        🧔 Alberto: <span class="text-emerald-700 font-semibold">Ideal</span> — walkable, calm, matches introverted temperament<br>
                        👩 Martina: Family-oriented pace, strong community, can nurture at her rhythm<br>
                        👧 Sofia: Safe streets, parks within walking distance, playgrounds everywhere<br>
                        👶 Marco: Clean air, quiet environment, ideal for early development
                    </td>
                    <td class="py-3 px-2 text-slate-600">
                        🧔 Alberto: Beautiful but <span class="text-amber-600 font-semibold">chaotic</span> — daily friction clashes with analytical temperament<br>
                        👩 Martina: Vibrant social life but stressful logistics with two small kids<br>
                        👧 Sofia: Rich stimulation but traffic danger and constant supervision needed<br>
                        👶 Marco: Air quality concerns in central areas
                    </td>
                    <td class="py-3 px-2 text-slate-600">
                        🧔 Alberto: Quiet but <span class="text-red-600 font-semibold">car-dependent monotony</span> — risks apathy<br>
                        👩 Martina: Isolated — few amenities, limited social life for extrovert<br>
                        👧 Sofia: Green space but fewer peers and activities nearby<br>
                        👶 Marco: Cleaner air but limited infant services
                    </td>
                </tr>
                <tr class="border-b border-slate-100">
                    <td class="py-3 px-2 font-bold text-slate-700">🎓 School & Education</td>
                    <td class="py-3 px-2 text-slate-600">
                        👧 Sofia: Natural bilingualism (English/Italian at home) — <span class="text-blue-600 font-semibold">major advantage</span><br>
                        👶 Marco: Same bilingual benefit when older<br>
                        🧔👩 Parents: Childcare cost £1,500/mo is a heavy burden
                    </td>
                    <td class="py-3 px-2 text-emerald-700 font-medium bg-emerald-50/30">
                        👧 Sofia: Excellent public pre-schools, walkable<br>
                        👶 Marco: Affordable nurseries (€300/child)<br>
                        🧔👩 Parents: University city culture benefits kids long-term
                    </td>
                    <td class="py-3 px-2 text-slate-600">
                        👧 Sofia: Good private options, expensive<br>
                        👶 Marco: Waitlists for public nurseries<br>
                        🧔👩 Parents: Traffic-heavy school runs add daily stress
                    </td>
                    <td class="py-3 px-2 text-slate-600">
                        👧 Sofia: Fewer extracurricular options<br>
                        👶 Marco: Limited choice of nurseries<br>
                        🧔👩 Parents: Must drive everywhere for kids' activities
                    </td>
                </tr>
                <tr class="border-b border-slate-100">
                    <td class="py-3 px-2 font-bold text-slate-700">🛡️ Safety</td>
                    <td class="py-3 px-2 text-slate-600">
                        👧👶 Children: Safe in good neighborhoods, but area-dependent<br>
                        👩 Martina: Urban alertness required, especially evenings<br>
                        🧔 Alberto: Manageable — tech hubs are in safe zones
                    </td>
                    <td class="py-3 px-2 text-emerald-700 font-medium bg-emerald-50/30">
                        👧👶 Children: <span class="text-emerald-700 font-semibold">Safest option</span> — can play outside freely<br>
                        👩 Martina: Walks alone safely at any hour<br>
                        🧔 Alberto: Bike commute is safe and pleasant
                    </td>
                    <td class="py-3 px-2 text-slate-600">
                        👧👶 Children: Must supervise constantly in public<br>
                        👩 Martina: Pickpocket/scooter theft risk<br>
                        🧔 Alberto: <span class="text-red-600 font-semibold">Car theft common</span> — adds stress
                    </td>
                    <td class="py-3 px-2 text-slate-600">
                        👧👶 Children: Quiet but isolated after dark<br>
                        👩 Martina: Feels safe but limited street life<br>
                        🧔 Alberto: Car vigilance needed
                    </td>
                </tr>
                <tr class="border-b border-slate-100">
                    <td class="py-3 px-2 font-bold text-slate-700">🚀 Future Prospects</td>
                    <td class="py-3 px-2 text-blue-700 font-medium bg-blue-50/30">
                        🧔 Alberto: <span class="text-blue-700 font-semibold">Maximum career growth</span> — hyper-dynamic tech market, salary £120k+ by 44<br>
                        👩 Martina: Strong teacher demand, good pension, but wages plateau fast<br>
                        👧 Sofia: World-class university pipeline (Oxbridge, Imperial, UCL)<br>
                        👶 Marco: Best long-term wealth accumulation for the family
                    </td>
                    <td class="py-3 px-2 text-slate-600">
                        🧔 Alberto: Stable but <span class="text-amber-600 font-semibold">salary glass ceiling</span> — Italian tech tops out at €45-50k<br>
                        👩 Martina: Solid public teaching career, excellent pension system<br>
                        👧 Sofia: Good university (Padova is top-tier in Italy) but limited international scope<br>
                        👶 Marco: Comfortable middle-class trajectory, lower wealth ceiling
                    </td>
                    <td class="py-3 px-2 text-slate-600">
                        🧔 Alberto: Difficult vertical growth without political-social network<br>
                        👩 Martina: High competition for teaching positions in Rome<br>
                        👧 Sofia: Many school options but quality varies wildly<br>
                        👶 Marco: <span class="text-red-600 font-semibold">Limited upward mobility</span> for the family long-term
                    </td>
                    <td class="py-3 px-2 text-slate-600">
                        🧔 Alberto: Same as Rome Center, plus commute time erosion<br>
                        👩 Martina: Fewer schools = fewer teaching openings<br>
                        👧 Sofia: Must commute into city for any serious extracurricular<br>
                        👶 Marco: Suburban stagnation risk
                    </td>
                </tr>
                <tr class="border-b border-slate-100">
                    <td class="py-3 px-2 font-bold text-slate-700">🏥 Healthcare</td>
                    <td class="py-3 px-2 text-slate-600">
                        🧔 Alberto: Long waits for any specialist<br>
                        👩 Martina: Postnatal support scarce on NHS<br>
                        👧 Sofia: Pediatric waits 6-12 weeks<br>
                        👶 Marco: <span class="text-red-600 font-semibold">Critical</span> — infant needs fast access
                    </td>
                    <td class="py-3 px-2 text-emerald-700 font-medium bg-emerald-50/30">
                        🧔 Alberto: Excellent local hospitals<br>
                        👩 Martina: Strong preventive care system<br>
                        👧 Sofia: Top pediatric services<br>
                        👶 Marco: <span class="text-emerald-700 font-semibold">Best option</span> — rapid infant care access
                    </td>
                    <td class="py-3 px-2 text-slate-600">
                        🧔 Alberto: Good specialist access, slow bureaucracy<br>
                        👩 Martina: Centers of excellence nearby<br>
                        👧 Sofia: Adequate pediatrics<br>
                        👶 Marco: Decent but slow ER response
                    </td>
                    <td class="py-3 px-2 text-slate-600">
                        🧔 Alberto: Far from major hospitals<br>
                        👩 Martina: Limited nearby options<br>
                        👧 Sofia: Must drive for pediatrician<br>
                        👶 Marco: <span class="text-red-600 font-semibold">Risk</span> — emergency distance is concerning
                    </td>
                </tr>
                <tr class="border-b border-slate-100">
                    <td class="py-3 px-2 font-bold text-slate-700">☀️ Weather</td>
                    <td class="py-3 px-2 text-slate-600">
                        🧔 Alberto: <span class="text-red-600 font-semibold">Critical</span> — needs sunshine for mental health<br>
                        👩 Martina: Negative — cooking/outdoor life limited<br>
                        👧 Sofia: Low vitamin D, less outdoor play<br>
                        👶 Marco: Less natural light exposure
                    </td>
                    <td class="py-3 px-2 text-slate-600">
                        🧔 Alberto: Mixed — foggy winters may still affect mood<br>
                        👩 Martina: OK — good spring/autumn for family outings<br>
                        👧 Sofia: Good outdoor conditions most of year<br>
                        👶 Marco: Adequate sun exposure
                    </td>
                    <td class="py-3 px-2 text-emerald-700 font-medium bg-emerald-50/30">
                        🧔 Alberto: <span class="text-emerald-700 font-semibold">Ideal</span> — 300+ sunny days, direct mental health boost<br>
                        👩 Martina: Thrives — outdoor markets, community life<br>
                        👧 Sofia: Maximum outdoor play time<br>
                        👶 Marco: Optimal vitamin D and fresh air
                    </td>
                    <td class="py-3 px-2 text-emerald-700 font-medium bg-emerald-50/30">
                        🧔 Alberto: Excellent — same climate + cleaner air<br>
                        👩 Martina: Good weather but fewer people around<br>
                        👧 Sofia: Great outdoor space<br>
                        👶 Marco: Best air quality of all options
                    </td>
                </tr>
                <tr class="border-b border-slate-100">
                    <td class="py-3 px-2 font-bold text-slate-700">🍕 Food</td>
                    <td class="py-3 px-2 text-slate-600">
                        👩 Martina: Multicultural ingredients available, but <span class="text-amber-600 font-semibold">daily quality is average</span> — frustrating for someone who loves cooking<br>
                        🧔 Alberto: Expensive eating out<br>
                        👧👶 Children: Processed kids' food culture
                    </td>
                    <td class="py-3 px-2 text-emerald-700 font-medium bg-emerald-50/30">
                        👩 Martina: <span class="text-emerald-700 font-semibold">Paradise</span> — fresh markets, Veneto tradition, she can express her passion for cooking<br>
                        🧔 Alberto: Affordable trattorias for family dinners<br>
                        👧👶 Children: Best food quality for growing kids
                    </td>
                    <td class="py-3 px-2 text-emerald-700 font-medium bg-emerald-50/30">
                        👩 Martina: World-class food scene, Roman cuisine<br>
                        🧔 Alberto: Street food culture, social dining<br>
                        👧👶 Children: Excellent fresh produce access
                    </td>
                    <td class="py-3 px-2 text-slate-600">
                        👩 Martina: Good home cooking but <span class="text-amber-600 font-semibold">fewer markets nearby</span><br>
                        🧔 Alberto: Must drive for restaurants<br>
                        👧👶 Children: Adequate but less variety
                    </td>
                </tr>
                <tr class="border-b border-slate-100">
                    <td class="py-3 px-2 font-bold text-slate-700">🤝 Integration</td>
                    <td class="py-3 px-2 text-blue-700 font-medium bg-blue-50/30">
                        🧔 Alberto: <span class="text-blue-700 font-semibold">Thrives in multicultural tech scene</span><br>
                        👩 Martina: Strong Italian community, easy to find friends<br>
                        👧👶 Children: Natural integration through school
                    </td>
                    <td class="py-3 px-2 text-slate-600">
                        🧔 Alberto: Introvert-friendly but tight social circles<br>
                        👩 Martina: <span class="text-amber-600 font-semibold">May struggle</span> to enter established Veneto networks without family there<br>
                        👧👶 Children: School integration is smooth
                    </td>
                    <td class="py-3 px-2 text-slate-600">
                        🧔 Alberto: Bureaucracy friction when returning from abroad<br>
                        👩 Martina: Chaotic but welcoming — southern origins help<br>
                        👧👶 Children: Easy integration, large southern community
                    </td>
                    <td class="py-3 px-2 text-slate-600">
                        🧔 Alberto: <span class="text-red-600 font-semibold">Isolation risk</span> — introvert in suburban setting = potential loneliness<br>
                        👩 Martina: Insular communities, hard to break in<br>
                        👧👶 Children: Fewer peers in immediate area
                    </td>
                </tr>
                <tr class="border-b border-slate-100">
                    <td class="py-3 px-2 font-bold text-slate-700">🚫 Discrimination</td>
                    <td class="py-3 px-2 text-slate-600">
                        🧔 Alberto: Italian accent well-regarded in tech; no professional stigma<br>
                        👩 Martina: Occasional stereotyping as "Mediterranean" but generally positive<br>
                        👧 Sofia: Mixed-culture kids are the norm in London schools<br>
                        👶 Marco: No issues — cosmopolitan city
                    </td>
                    <td class="py-3 px-2 text-slate-600">
                        🧔 Alberto: Southern Italian origin may trigger mild <span class="text-amber-600 font-semibold">"terrone" prejudice</span> in some Veneto circles<br>
                        👩 Martina: Same — but university city is more open-minded than rural Veneto<br>
                        👧 Sofia: Kids integrate easily regardless of origin<br>
                        👶 Marco: No issues at infant age
                    </td>
                    <td class="py-3 px-2 text-emerald-700 font-medium bg-emerald-50/30">
                        🧔 Alberto: <span class="text-emerald-700 font-semibold">Zero friction</span> — massive Southern diaspora, feels like home<br>
                        👩 Martina: Completely at home — southern origins are the norm<br>
                        👧 Sofia: Large southern community, many peers with same background<br>
                        👶 Marco: No issues whatsoever
                    </td>
                    <td class="py-3 px-2 text-emerald-700 font-medium bg-emerald-50/30">
                        🧔 Alberto: Same as Rome Center — large Southern community<br>
                        👩 Martina: No stigma attached to origins<br>
                        👧 Sofia: Accepted without question<br>
                        👶 Marco: No issues
                    </td>
                </tr>
                <tr>
                    <td class="py-3 px-2 font-bold text-slate-700">🏛️ Political Orientation</td>
                    <td class="py-3 px-2 text-slate-600">
                        🧔 Alberto: Progressive tech sector aligns with his analytical worldview<br>
                        👩 Martina: Labour policies support teachers and families — <span class="text-blue-600 font-semibold">positive for her profession</span><br>
                        👧👶 Children: Strong multicultural/anti-discrimination policies in schools
                    </td>
                    <td class="py-3 px-2 text-slate-600">
                        🧔 Alberto: Centre-left city within centre-right Veneto — comfortable bubble<br>
                        👩 Martina: University-city progressiveness matches her social values<br>
                        👧👶 Children: Good integration policies in public schools
                    </td>
                    <td class="py-3 px-2 text-slate-600">
                        🧔 Alberto: Historically left-wing city — aligns with progressive values<br>
                        👩 Martina: Strong civic engagement culture, pro-family policies<br>
                        👧👶 Children: Progressive education policies
                    </td>
                    <td class="py-3 px-2 text-slate-600">
                        🧔 Alberto: More conservative suburban areas — <span class="text-amber-600 font-semibold">potential cultural friction</span><br>
                        👩 Martina: Mixed political leanings vary by municipality<br>
                        👧👶 Children: Less diverse school environment
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

<!-- 7. Happiness Score Matrix -->
<div>
    <h3 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
        <span class="w-7 h-7 bg-fuchsia-100 text-fuchsia-700 rounded-lg flex items-center justify-center text-sm font-black">7</span>
        🎯 Happiness Score Matrix
    </h3>
    <div class="bg-violet-50 rounded-xl p-4 mb-4 text-xs text-violet-700 leading-relaxed border border-violet-100" style="border-left: 4px solid #cbd5e1; background: #f8fafc; color: #475569; font-style: italic; border-radius: 0 0.5rem 0.5rem 0;">
        <p>Each family member is rated on a 1–10 happiness scale for every city, across <strong>three time horizons</strong>: how they'd feel in the <strong>first 6 months</strong> (settling in), after <strong>1–3 years</strong> (established routines), and at <strong>5+ years</strong> (long-term life trajectory). The <strong>Family Total</strong> row is a weighted average — adults count more for financial factors, children count more for schooling and social factors.</p>
    </div>
    <div class="text-center mb-4 text-xs text-slate-500 font-medium">
        <strong>Score Legend:</strong> 🤩 9-10 Amazing · 😄 7-8 Great · 🙂 5-6 Decent · 😟 3-4 Poor · 😩 1-2 Miserable
    </div>
    <div class="overflow-x-auto">
        <table class="w-full text-xs border-collapse" style="border: 1px solid #e2e8f0;">
            <thead>
                <tr>
                    <th style="background-color: #f8fafc; font-weight: 600; text-align: center; padding: 1rem; border: 1px solid #e2e8f0;">Family Member</th>
                    <th style="background-color: #f8fafc; font-weight: 600; text-align: center; padding: 1rem; border: 1px solid #e2e8f0; color: #0284c7;">London</th>
                    <th style="background-color: #f8fafc; font-weight: 600; text-align: center; padding: 1rem; border: 1px solid #e2e8f0; color: #059669;">Padova</th>
                    <th style="background-color: #f8fafc; font-weight: 600; text-align: center; padding: 1rem; border: 1px solid #e2e8f0; color: #ea580c;">Rome Center</th>
                    <th style="background-color: #f8fafc; font-weight: 600; text-align: center; padding: 1rem; border: 1px solid #e2e8f0; color: #475569;">Rome Suburbs</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="padding: 1rem; border: 1px solid #e2e8f0; font-weight: 600; background-color: #f8fafc;">🧔 <strong>Alberto</strong></td>
                    <td style="padding: 0.75rem; border: 1px solid #e2e8f0;">
                        <div class="report-horizon-row"><span>First 6 mo:</span> <span class="report-score-bold">7/10 😄</span></div>
                        <div class="report-horizon-row"><span>1–3 years:</span> <span class="report-score-bold">6/10 🙂</span></div>
                        <div class="report-horizon-row"><span>5+ years:</span> <span class="report-score-bold">5/10 🙂</span></div>
                    </td>
                    <td style="padding: 0.75rem; border: 1px solid #e2e8f0;">
                        <div class="report-horizon-row"><span>First 6 mo:</span> <span class="report-score-bold">7/10 😄</span></div>
                        <div class="report-horizon-row"><span>1–3 years:</span> <span class="report-score-bold">8/10 😄</span></div>
                        <div class="report-horizon-row"><span>5+ years:</span> <span class="report-score-bold">8/10 😄</span></div>
                    </td>
                    <td style="padding: 0.75rem; border: 1px solid #e2e8f0;">
                        <div class="report-horizon-row"><span>First 6 mo:</span> <span class="report-score-bold">7/10 😄</span></div>
                        <div class="report-horizon-row"><span>1–3 years:</span> <span class="report-score-bold">6/10 🙂</span></div>
                        <div class="report-horizon-row"><span>5+ years:</span> <span class="report-score-bold">5/10 🙂</span></div>
                    </td>
                    <td style="padding: 0.75rem; border: 1px solid #e2e8f0;">
                        <div class="report-horizon-row"><span>First 6 mo:</span> <span class="report-score-bold">5/10 🙂</span></div>
                        <div class="report-horizon-row"><span>1–3 years:</span> <span class="report-score-bold">4/10 😟</span></div>
                        <div class="report-horizon-row"><span>5+ years:</span> <span class="report-score-bold">4/10 😟</span></div>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 1rem; border: 1px solid #e2e8f0; font-weight: 600; background-color: #f8fafc;">👩 <strong>Martina</strong></td>
                    <td style="padding: 0.75rem; border: 1px solid #e2e8f0;">
                        <div class="report-horizon-row"><span>First 6 mo:</span> <span class="report-score-bold">6/10 🙂</span></div>
                        <div class="report-horizon-row"><span>1–3 years:</span> <span class="report-score-bold">5/10 🙂</span></div>
                        <div class="report-horizon-row"><span>5+ years:</span> <span class="report-score-bold">4/10 😟</span></div>
                    </td>
                    <td style="padding: 0.75rem; border: 1px solid #e2e8f0;">
                        <div class="report-horizon-row"><span>First 6 mo:</span> <span class="report-score-bold">8/10 😄</span></div>
                        <div class="report-horizon-row"><span>1–3 years:</span> <span class="report-score-bold">9/10 🤩</span></div>
                        <div class="report-horizon-row"><span>5+ years:</span> <span class="report-score-bold">8/10 😄</span></div>
                    </td>
                    <td style="padding: 0.75rem; border: 1px solid #e2e8f0;">
                        <div class="report-horizon-row"><span>First 6 mo:</span> <span class="report-score-bold">8/10 😄</span></div>
                        <div class="report-horizon-row"><span>1–3 years:</span> <span class="report-score-bold">7/10 😄</span></div>
                        <div class="report-horizon-row"><span>5+ years:</span> <span class="report-score-bold">6/10 🙂</span></div>
                    </td>
                    <td style="padding: 0.75rem; border: 1px solid #e2e8f0;">
                        <div class="report-horizon-row"><span>First 6 mo:</span> <span class="report-score-bold">5/10 🙂</span></div>
                        <div class="report-horizon-row"><span>1–3 years:</span> <span class="report-score-bold">4/10 😟</span></div>
                        <div class="report-horizon-row"><span>5+ years:</span> <span class="report-score-bold">3/10 😟</span></div>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 1rem; border: 1px solid #e2e8f0; font-weight: 600; background-color: #f8fafc;">👧 <strong>Sofia</strong> <span style="font-weight:normal;color:#94a3b8;">(3yo)</span></td>
                    <td style="padding: 0.75rem; border: 1px solid #e2e8f0;">
                        <div class="report-horizon-row"><span>First 6 mo:</span> <span class="report-score-bold">6/10 🙂</span></div>
                        <div class="report-horizon-row"><span>1–3 years:</span> <span class="report-score-bold">7/10 😄</span></div>
                        <div class="report-horizon-row"><span>5+ years:</span> <span class="report-score-bold">7/10 😄</span></div>
                    </td>
                    <td style="padding: 0.75rem; border: 1px solid #e2e8f0;">
                        <div class="report-horizon-row"><span>First 6 mo:</span> <span class="report-score-bold">8/10 😄</span></div>
                        <div class="report-horizon-row"><span>1–3 years:</span> <span class="report-score-bold">9/10 🤩</span></div>
                        <div class="report-horizon-row"><span>5+ years:</span> <span class="report-score-bold">8/10 😄</span></div>
                    </td>
                    <td style="padding: 0.75rem; border: 1px solid #e2e8f0;">
                        <div class="report-horizon-row"><span>First 6 mo:</span> <span class="report-score-bold">7/10 😄</span></div>
                        <div class="report-horizon-row"><span>1–3 years:</span> <span class="report-score-bold">7/10 😄</span></div>
                        <div class="report-horizon-row"><span>5+ years:</span> <span class="report-score-bold">6/10 🙂</span></div>
                    </td>
                    <td style="padding: 0.75rem; border: 1px solid #e2e8f0;">
                        <div class="report-horizon-row"><span>First 6 mo:</span> <span class="report-score-bold">6/10 🙂</span></div>
                        <div class="report-horizon-row"><span>1–3 years:</span> <span class="report-score-bold">5/10 🙂</span></div>
                        <div class="report-horizon-row"><span>5+ years:</span> <span class="report-score-bold">5/10 🙂</span></div>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 1rem; border: 1px solid #e2e8f0; font-weight: 600; background-color: #f8fafc;">👶 <strong>Marco</strong> <span style="font-weight:normal;color:#94a3b8;">(1yo)</span></td>
                    <td style="padding: 0.75rem; border: 1px solid #e2e8f0;">
                        <div class="report-horizon-row"><span>First 6 mo:</span> <span class="report-score-bold">6/10 🙂</span></div>
                        <div class="report-horizon-row"><span>1–3 years:</span> <span class="report-score-bold">6/10 🙂</span></div>
                        <div class="report-horizon-row"><span>5+ years:</span> <span class="report-score-bold">7/10 😄</span></div>
                    </td>
                    <td style="padding: 0.75rem; border: 1px solid #e2e8f0;">
                        <div class="report-horizon-row"><span>First 6 mo:</span> <span class="report-score-bold">8/10 😄</span></div>
                        <div class="report-horizon-row"><span>1–3 years:</span> <span class="report-score-bold">9/10 🤩</span></div>
                        <div class="report-horizon-row"><span>5+ years:</span> <span class="report-score-bold">8/10 😄</span></div>
                    </td>
                    <td style="padding: 0.75rem; border: 1px solid #e2e8f0;">
                        <div class="report-horizon-row"><span>First 6 mo:</span> <span class="report-score-bold">7/10 😄</span></div>
                        <div class="report-horizon-row"><span>1–3 years:</span> <span class="report-score-bold">7/10 😄</span></div>
                        <div class="report-horizon-row"><span>5+ years:</span> <span class="report-score-bold">6/10 🙂</span></div>
                    </td>
                    <td style="padding: 0.75rem; border: 1px solid #e2e8f0;">
                        <div class="report-horizon-row"><span>First 6 mo:</span> <span class="report-score-bold">6/10 🙂</span></div>
                        <div class="report-horizon-row"><span>1–3 years:</span> <span class="report-score-bold">5/10 🙂</span></div>
                        <div class="report-horizon-row"><span>5+ years:</span> <span class="report-score-bold">5/10 🙂</span></div>
                    </td>
                </tr>
                <tr class="report-total-row" style="background-color: #1e293b; color: #fff; font-weight: bold;">
                    <td style="padding: 1rem; border: 1px solid #334155; background-color: #0f172a; color: #fff; font-weight: bold;">👨‍👩‍👧‍👦 <strong>FAMILY TOTAL</strong></td>
                    <td style="padding: 0.75rem; border: 1px solid #334155; text-align: center;">
                        <div style="font-size: 1.3rem;">6.0/10 🙂</div>
                        <div style="font-size: 0.7rem; font-weight: normal; margin-top: 5px; color: #94a3b8;">High wealth, high anxiety</div>
                    </td>
                    <td class="report-winner-glow" style="padding: 0.75rem; border: 1px solid #334155; text-align: center;">
                        <div style="font-size: 1.3rem;">8.2/10 🤩</div>
                        <div style="font-size: 0.7rem; font-weight: normal; margin-top: 5px; color: #a7f3d0;">Perfect balance & safety</div>
                    </td>
                    <td style="padding: 0.75rem; border: 1px solid #334155; text-align: center;">
                        <div style="font-size: 1.3rem;">6.6/10 🙂</div>
                        <div style="font-size: 0.7rem; font-weight: normal; margin-top: 5px; color: #94a3b8;">Financial & logistical stress</div>
                    </td>
                    <td style="padding: 0.75rem; border: 1px solid #334155; text-align: center;">
                        <div style="font-size: 1.3rem;">4.8/10 😟</div>
                        <div style="font-size: 0.7rem; font-weight: normal; margin-top: 5px; color: #94a3b8;">Safe but severely isolated</div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <div style="text-align: center; margin-top: 1.5rem; padding: 1.5rem; background: #dcfce7; border: 2px solid #10b981; border-radius: 0.5rem; font-size: 1.1rem; font-weight: bold; color: #065f46;">
        🏆 <strong>VERDICT: PADOVA WINS.</strong> With a family average score of 8.2/10, it is the only city that successfully balances financial stability (€1,500/mo savings), safety, healthcare, and community — the factors that matter most for this specific family's long-term happiness.
    </div>
</div>
`;

    // Render the example podium
    renderExamplePodium('examplePodiumContainer');
}

function renderExamplePodium(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;

    var ranked = [
        { name: 'Padova',       score: 8.2 },
        { name: 'London',       score: 6.6 },
        { name: 'Rome Center',  score: 6.5 },
        { name: 'Rome Suburbs', score: 4.9 }
    ];
    var medals  = ['🥇','🥈','🥉','4th'];
    var barBg   = ['#fbbf24','#cbd5e1','#b45309','#e2e8f0'];
    var barBd   = ['#f59e0b','#94a3b8','#92400e','#cbd5e1'];
    var numClr  = ['#78350f','#334155','#fef3c7','#64748b'];
    var maxH = 180, minH = 40;
    var maxScore = Math.max.apply(null, ranked.map(function(c){return c.score})) || 1;
    var order = [ranked[1], ranked[0], ranked[2], ranked[3]];
    var html = '';
    order.forEach(function(city){
        var rank  = ranked.indexOf(city);
        var ratio = Math.max(city.score / maxScore, 0.15);
        var h     = Math.round(minH + (maxH - minH) * ratio);
        var big   = rank === 0;
        html += '<div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:0;">'
          + '<div style="font-size:' + (big ? '2.5rem' : '1.5rem') + ';margin-bottom:0.25rem;">' + medals[rank] + '</div>'
          + '<div style="font-size:0.7rem;font-weight:900;color:#334155;margin-bottom:0.1rem;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 0.25rem;">' + city.name + '</div>'
          + '<div style="font-size:0.65rem;font-weight:700;color:#64748b;margin-bottom:0.5rem;">' + city.score.toFixed(1) + '/10</div>'
          + '<div style="width:100%;border-radius:0.75rem 0.75rem 0 0;background:' + barBg[rank] + ';border:2px solid ' + barBd[rank] + ';box-shadow:0 4px 12px rgba(0,0,0,0.1);display:flex;align-items:flex-end;justify-content:center;height:' + h + 'px;">'
          + '<span style="font-size:1.1rem;font-weight:900;color:' + numClr[rank] + ';margin-bottom:0.5rem;">#' + (rank+1) + '</span>'
          + '</div></div>';
    });
    el.innerHTML = html;
}
