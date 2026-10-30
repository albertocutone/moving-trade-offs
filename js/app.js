/**
 * App — entry point. Initializes all components on DOM ready.
 * Uses DOMContentLoaded instead of window.onload for faster startup
 * (doesn't wait for images, fonts, external resources to finish loading).
 */

document.addEventListener('DOMContentLoaded', () => {
    initMemberExtras();
    const hadCache = restoreCache();
    initFamilyInteractions();

    initCharts();

    // Restore projection years after initCharts populates the selector
    if (window._cachedProjectionYears) {
        const sel = document.getElementById('projectionYearsSelect');
        if (sel) sel.value = window._cachedProjectionYears;
        delete window._cachedProjectionYears;
    }

    fetchExchangeRates();
    updateRemoveButtons();
    attachCacheListeners();
    attachAutoCalcListeners();
    initLLM();

    performCalculation();
    computeFamilySupport();
});
