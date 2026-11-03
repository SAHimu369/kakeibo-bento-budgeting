/* =========================================================
   Kakeibo Bento Glass — app logic
   ========================================================= */

'use strict';

/* -------------------- constants -------------------- */
const STORAGE_KEY     = 'kakeibo_offline_state';
const DEFAULT_BG      = 'https://cdn.pixabay.com/photo/2024/02/06/15/40/living-room-8557308_1280.jpg';
const DEFAULT_ORDER   = ['hero', 'baseline', 'savings', 'chart', 'pillars', 'ledger', 'reflection'];
const DEFAULT_SPANS   = { hero: 2, baseline: 1, savings: 1, chart: 2, pillars: 2, ledger: 3, reflection: 1 };
const PILLARS         = ['needs', 'wants', 'culture', 'extra'];

const TUTORIAL_SLIDES = [
    {
        title: 'Welcome to Kakeibo Bento',
        body:  'Kakeibo is the Japanese art of mindful household budgeting. This offline app tracks your daily expenses across the four Kakeibo pillars: Needs, Wants, Culture, and Extra.'
    },
    {
        title: 'Set Your Baseline',
        body:  "Click 'Budget Setup' to enter your monthly income, fixed costs (rent, bills), and savings target. The app calculates your safe daily spending allowance from what's left."
    },
    {
        title: 'Log Your Expenses',
        body:  "Use 'Log Expense' to record every purchase. Tag it with the right pillar and add a mindfulness note explaining why. The ledger and donut chart update instantly."
    },
    {
        title: 'Make It Yours',
        body:  'Use the coin button to change your currency symbol, and the image button to swap the background (URL or uploaded file). Both are saved in your browser.'
    },
    {
        title: 'Customize Your Bento',
        body:  "Click 'Edit Layout' to reorder cards by dragging, or resize them by dragging the ⤢ handle in the corner. Your layout is saved automatically in this browser."
    },
    {
        title: 'Reflect & Improve',
        body:  'At the end of each month, fill in the Reflect (改善) note. Ask: How much is available? How much did I save? How much did I spend? How can I improve next month?'
    }
];

/* -------------------- state -------------------- */
let appState = {
    budget:        { income: 4500, fixed: 1800, savingsTarget: 900 },
    reflection:    'Cook meal prep on Sunday to keep the Wants category under control.',
    transactions:  [],
    tutorialSeen:  false,
    currency:      '$',
    bgImage:       DEFAULT_BG,
    theme:         'dark',
    layout: {
        order: [...DEFAULT_ORDER],
        spans: { ...DEFAULT_SPANS }
    }
};

let isEditLayoutMode   = false;
let isResizing         = false;
let draggedCardId      = null;
let currentTutorialStep = 0;
let hasWarnedStorage   = false;

/* -------------------- init -------------------- */
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('input-date').value = new Date().toISOString().split('T')[0];

    loadState();
    applyTheme();
    applySavedLayout();
    applyBgToBody();

    setupDragAndDrop();
    setupHandleResizing();
    setupLedgerDelegation();
    setupModalDismissal();

    renderApp();

    if (!appState.tutorialSeen) openTutorialModal(0);
});

/* -------------------- persistence -------------------- */
function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            appState = { ...appState, ...parsed };
        } catch (e) {
            console.warn('Could not parse saved state:', e);
        }
    }

    // --- sanity checks so a corrupted entry can never crash the app ---
    if (!appState.budget || typeof appState.budget !== 'object') {
        appState.budget = { income: 0, fixed: 0, savingsTarget: 0 };
    }
    if (!Array.isArray(appState.transactions)) appState.transactions = [];
    if (typeof appState.reflection   !== 'string') appState.reflection   = '';
    if (typeof appState.currency     !== 'string' || !appState.currency) appState.currency = '$';
    if (typeof appState.bgImage      !== 'string' || !appState.bgImage)  appState.bgImage  = DEFAULT_BG;
    if (typeof appState.theme        !== 'string') appState.theme        = 'dark';
    if (typeof appState.tutorialSeen !== 'boolean') appState.tutorialSeen = false;

    if (!appState.layout || typeof appState.layout !== 'object') {
        appState.layout = { order: [...DEFAULT_ORDER], spans: { ...DEFAULT_SPANS } };
    }
    if (!Array.isArray(appState.layout.order)) appState.layout.order = [...DEFAULT_ORDER];
    if (!appState.layout.spans || typeof appState.layout.spans !== 'object') {
        appState.layout.spans = { ...DEFAULT_SPANS };
    }

    if (!saved) resetSampleData(false);
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
        return true;
    } catch (e) {
        if (!hasWarnedStorage && (e.name === 'QuotaExceededError' || e.code === 22)) {
            hasWarnedStorage = true;
            alert(
                'Storage is full — your changes may not be saved. ' +
                'Try a smaller background image or use "Reset to Default" in the background menu.'
            );
        }
        console.error('saveState failed:', e);
        return false;
    }
}

/* -------------------- helpers -------------------- */
function fmt(amount) {
    const sym = appState.currency || '$';
    const n   = parseFloat(amount) || 0;
    return sym + n.toFixed(2);
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
}

function escapeCssUrl(url) {
    return String(url).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]/g, '');
}

function safeCategory(cat) {
    return PILLARS.includes(cat) ? cat : 'extra';
}

/* -------------------- theme -------------------- */
function applyTheme() {
    if (appState.theme === 'light') {
        document.documentElement.classList.remove('dark');
    } else {
        document.documentElement.classList.add('dark');
    }
}

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    appState.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    saveState();
}

/* -------------------- background -------------------- */
function applyBgToBody() {
    const url = appState.bgImage || DEFAULT_BG;
    document.documentElement.style.setProperty('--bg-image', `url("${escapeCssUrl(url)}")`);

    const preview = document.getElementById('bg-preview');
    if (preview) {
        preview.style.backgroundImage = `url("${escapeCssUrl(url)}")`;
        preview.textContent = '';
    }
}

function openBgModal() {
    applyBgToBody();
    document.getElementById('input-bg-url').value  = '';
    document.getElementById('input-bg-file').value = '';
    openModal('modal-bg');
}

function closeBgModal() { closeModal('modal-bg'); }

function applyBgUrl() {
    const url = document.getElementById('input-bg-url').value.trim();
    if (!url) { alert('Please enter an image URL.'); return; }
    appState.bgImage = url;
    saveState();
    applyBgToBody();
    closeBgModal();
}

function handleBgFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        event.target.value = '';
        return;
    }
    // Accept up to 12 MB — it will be compressed before storage.
    if (file.size > 12 * 1024 * 1024) {
        alert('Image is larger than 12 MB. Please choose a smaller one.');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const compressed = await compressImage(e.target.result);
            const prevBg = appState.bgImage;
            appState.bgImage = compressed;

            if (!saveState()) {
                appState.bgImage = prevBg;
                alert('Could not save the image — browser storage is full.');
                return;
            }
            applyBgToBody();
            closeBgModal();
        } catch (err) {
            console.error(err);
            alert('Failed to process the image.');
        }
    };
    reader.onerror = () => alert('Failed to read the image file.');
    reader.readAsDataURL(file);
}

/* Downscale + re-encode as JPEG to keep localStorage happy. */
function compressImage(dataUrl, maxDim = 1600, quality = 0.82) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
                const ratio = Math.min(maxDim / width, maxDim / height);
                width  = Math.round(width  * ratio);
                height = Math.round(height * ratio);
            }
            const canvas = document.createElement('canvas');
            canvas.width  = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
}

function resetBg() {
    appState.bgImage = DEFAULT_BG;
    saveState();
    applyBgToBody();
    closeBgModal();
}

/* -------------------- layout editing -------------------- */
function toggleEditLayout() {
    isEditLayoutMode = !isEditLayoutMode;
    document.body.classList.toggle('edit-layout-mode', isEditLayoutMode);

    const btnText = document.getElementById('txt-edit-layout');
    if (btnText) btnText.textContent = isEditLayoutMode ? 'Save Layout' : 'Edit Layout';

    document.querySelectorAll('.bento-grid .glass-card').forEach(card => {
        card.setAttribute('draggable', isEditLayoutMode ? 'true' : 'false');
    });
}

function applySavedLayout() {
    const grid = document.getElementById('main-bento-grid');
    if (!grid || !appState.layout) return;

    const { order, spans } = appState.layout;

    if (spans) {
        Object.keys(spans).forEach(cardId => {
            const card = document.querySelector(`[data-card-id="${cardId}"]`);
            if (card) setCardSpan(card, spans[cardId]);
        });
    }

    if (Array.isArray(order)) {
        order.forEach(cardId => {
            const card = document.querySelector(`[data-card-id="${cardId}"]`);
            if (card) grid.appendChild(card);
        });
    }
}

function setCardSpan(card, span) {
    span = Math.max(1, Math.min(4, parseInt(span, 10) || 1));

    card.classList.remove('col-span-2', 'col-span-3', 'col-span-4');
    if (span === 2) card.classList.add('col-span-2');
    if (span === 3) card.classList.add('col-span-3');
    if (span === 4) card.classList.add('col-span-4');

    const cardId = card.getAttribute('data-card-id');
    if (cardId && appState.layout.spans) {
        appState.layout.spans[cardId] = span;
    }
}

function setupDragAndDrop() {
    const grid = document.getElementById('main-bento-grid');
    if (!grid) return;

    grid.addEventListener('dragstart', (e) => {
        if (!isEditLayoutMode || isResizing) {
            e.preventDefault();
            return;
        }
        const card = e.target.closest('.glass-card');
        if (card) {
            draggedCardId = card.getAttribute('data-card-id');
            e.dataTransfer.effectAllowed = 'move';
        }
    });

    grid.addEventListener('dragover', (e) => {
        if (!isEditLayoutMode || isResizing) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });

    grid.addEventListener('drop', (e) => {
        if (!isEditLayoutMode || isResizing || !draggedCardId) return;
        e.preventDefault();
        const targetCard = e.target.closest('.glass-card');
        if (targetCard) {
            const targetCardId = targetCard.getAttribute('data-card-id');
            if (targetCardId && targetCardId !== draggedCardId) {
                swapCardPositions(draggedCardId, targetCardId);
            }
        }
        draggedCardId = null;
    });

    grid.addEventListener('dragend', () => { draggedCardId = null; });
}

function swapCardPositions(idA, idB) {
    const grid  = document.getElementById('main-bento-grid');
    const cardA = document.querySelector(`[data-card-id="${idA}"]`);
    const cardB = document.querySelector(`[data-card-id="${idB}"]`);
    if (!grid || !cardA || !cardB) return;

    const children = Array.from(grid.children);
    const indexA   = children.indexOf(cardA);
    const indexB   = children.indexOf(cardB);

    if (indexA < indexB) grid.insertBefore(cardB, cardA);
    else                 grid.insertBefore(cardA, cardB);

    appState.layout.order = Array.from(grid.querySelectorAll('.glass-card'))
        .map(c => c.getAttribute('data-card-id'));
    saveState();
}

function setupHandleResizing() {
    document.querySelectorAll('.card-resize-handle').forEach(handle => {
        handle.addEventListener('pointerdown', (e) => {
            if (!isEditLayoutMode) return;

            e.stopPropagation();
            e.preventDefault();

            const card = handle.closest('.glass-card');
            if (!card) return;

            isResizing = true;
            // Critical: take the card out of draggable state so the browser's
            // native HTML5 drag pipeline can't cancel this pointer gesture.
            card.setAttribute('draggable', 'false');

            try { handle.setPointerCapture(e.pointerId); } catch (_) {}

            const startX      = e.clientX;
            const cardId      = card.getAttribute('data-card-id');
            const initialSpan = (appState.layout.spans && appState.layout.spans[cardId]) || 1;

            const onPointerMove = (moveEvent) => {
                const deltaX = moveEvent.clientX - startX;
                let targetSpan = initialSpan;
                if (deltaX >  60) targetSpan = Math.min(4, initialSpan + 1);
                if (deltaX > 160) targetSpan = Math.min(4, initialSpan + 2);
                if (deltaX < -60) targetSpan = Math.max(1, initialSpan - 1);
                if (deltaX < -160) targetSpan = Math.max(1, initialSpan - 2);
                setCardSpan(card, targetSpan);
            };

            const endResize = () => {
                handle.removeEventListener('pointermove',   onPointerMove);
                handle.removeEventListener('pointerup',     endResize);
                handle.removeEventListener('pointercancel', endResize);
                try {
                    if (handle.hasPointerCapture(e.pointerId)) {
                        handle.releasePointerCapture(e.pointerId);
                    }
                } catch (_) {}
                if (isEditLayoutMode) card.setAttribute('draggable', 'true');
                isResizing = false;
                saveState();
            };

            handle.addEventListener('pointermove',   onPointerMove);
            handle.addEventListener('pointerup',     endResize);
            handle.addEventListener('pointercancel', endResize);
        });
    });
}

/* -------------------- render -------------------- */
function renderApp() {
    const now          = new Date();
    const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay   = now.getDate();
    const daysLeft     = daysInMonth - currentDay + 1;

    const income      = parseFloat(appState.budget.income)        || 0;
    const fixed       = parseFloat(appState.budget.fixed)         || 0;
    const savingsGoal = parseFloat(appState.budget.savingsTarget) || 0;

    const availablePool = Math.max(0, income - fixed - savingsGoal);
    const totalSpent    = appState.transactions.reduce((s, tx) => s + (parseFloat(tx.amount) || 0), 0);
    const remainingPool = availablePool - totalSpent;
    const safeDaily     = daysLeft > 0 ? remainingPool / daysLeft : 0;

    const categorySums = { needs: 0, wants: 0, culture: 0, extra: 0 };
    appState.transactions.forEach(tx => {
        const cat = safeCategory(tx.category);
        categorySums[cat] += parseFloat(tx.amount) || 0;
    });

    /* --- Hero KPI --- */
    const hero = document.getElementById('card-hero');
    if (hero) hero.classList.toggle('over-budget', remainingPool < 0);

    document.getElementById('kpi-daily-allowance').textContent = fmt(Math.max(0, safeDaily));
    document.getElementById('badge-days-left').textContent     = `${daysLeft} Days Left`;

    const poolSpentPercent = availablePool > 0
        ? Math.min(100, Math.max(0, (totalSpent / availablePool) * 100))
        : 100;
    document.getElementById('kpi-pool-percent').textContent = `${poolSpentPercent.toFixed(1)}%`;
    document.getElementById('kpi-pool-bar').style.width     = `${poolSpentPercent}%`;

    const overBy = remainingPool < 0 ? ` • Over by ${fmt(-remainingPool)}` : '';
    document.getElementById('kpi-daily-subtitle').textContent =
        `Monthly Variable Pool: ${fmt(availablePool)} (${fmt(totalSpent)} spent)${overBy}`;

    /* --- Baseline / savings --- */
    document.getElementById('kpi-income').textContent      = fmt(income);
    document.getElementById('kpi-fixed-costs').textContent = '-' + fmt(fixed);
    document.getElementById('kpi-savings').textContent     = fmt(savingsGoal);

    const savingsPercent = income > 0 ? ((savingsGoal / income) * 100).toFixed(0) : 0;
    document.getElementById('kpi-savings-status').textContent =
        `${savingsPercent}% of Income Allocated`;

    /* --- Pillar totals --- */
    document.getElementById('bar-amt-needs').textContent   = fmt(categorySums.needs);
    document.getElementById('bar-amt-wants').textContent   = fmt(categorySums.wants);
    document.getElementById('bar-amt-culture').textContent = fmt(categorySums.culture);
    document.getElementById('bar-amt-extra').textContent   = fmt(categorySums.extra);
    document.getElementById('chart-total-text').textContent = `Total Spent: ${fmt(totalSpent)}`;

    /* --- Journal --- */
    document.getElementById('journal-q1').textContent = fmt(income - fixed);
    document.getElementById('journal-q2').textContent = fmt(savingsGoal);
    document.getElementById('journal-q3').textContent = fmt(totalSpent);

    /* --- Reflection --- */
    const reflectionInput = document.getElementById('reflection-note');
    if (reflectionInput && document.activeElement !== reflectionInput) {
        reflectionInput.value = appState.reflection || '';
    }

    /* --- Currency labels in modals --- */
    document.querySelectorAll('.currency-label').forEach(el => {
        el.textContent = appState.currency;
    });

    renderNativeChart(categorySums);
    renderLedger();
}

function renderNativeChart(sums) {
    const total         = PILLARS.reduce((s, p) => s + sums[p], 0);
    const circumference = 2 * Math.PI * 30;
    let   offset        = 0;

    PILLARS.forEach(p => {
        const circle = document.getElementById(`c-${p}`);
        if (!circle) return;

        if (total === 0) {
            circle.setAttribute('stroke-dasharray', `0 ${circumference}`);
            return;
        }

        const seg = (sums[p] / total) * circumference;
        circle.setAttribute('stroke-dasharray',  `${seg} ${circumference - seg}`);
        circle.setAttribute('stroke-dashoffset', -offset);
        offset += seg;
    });
}

function renderLedger() {
    const listEl = document.getElementById('transaction-list');
    if (!listEl) return;

    if (appState.transactions.length === 0) {
        listEl.innerHTML = `<div class="tx-empty">No transactions recorded.</div>`;
        return;
    }

    const sorted = [...appState.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    listEl.innerHTML = sorted.map(tx => {
        const cat = safeCategory(tx.category);
        return `
            <div class="transaction-item">
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <span class="tag tag-${cat}">${cat}</span>
                    <div>
                        <div class="tx-title">${escapeHtml(tx.title)}</div>
                        <div class="tx-meta">${escapeHtml(tx.date)}${tx.note ? ' • ' + escapeHtml(tx.note) : ''}</div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <span class="tx-amount">-${fmt(tx.amount)}</span>
                    <button type="button" class="tx-delete" data-tx-id="${escapeHtml(tx.id)}" aria-label="Delete transaction">&times;</button>
                </div>
            </div>
        `;
    }).join('');
}

function setupLedgerDelegation() {
    const listEl = document.getElementById('transaction-list');
    if (!listEl) return;

    listEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.tx-delete');
        if (!btn) return;
        const id = btn.dataset.txId;
        if (id) deleteTransaction(id);
    });
}

/* -------------------- modal helpers -------------------- */
function openModal(id)  { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function setupModalDismissal() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active')
                .forEach(m => m.classList.remove('active'));
        }
    });
}

/* -------------------- add / budget -------------------- */
function openAddModal()  { openModal('modal-add'); }
function closeAddModal() { closeModal('modal-add'); }

function openBudgetModal() {
    document.getElementById('cfg-income').value  = appState.budget.income;
    document.getElementById('cfg-fixed').value   = appState.budget.fixed;
    document.getElementById('cfg-savings').value = appState.budget.savingsTarget;
    openModal('modal-budget');
}
function closeBudgetModal() { closeModal('modal-budget'); }

function handleAddTransaction(e) {
    e.preventDefault();
    const title    = document.getElementById('input-title').value.trim();
    const amount   = parseFloat(document.getElementById('input-amount').value);
    const category = safeCategory(document.getElementById('input-category').value);
    const date     = document.getElementById('input-date').value;
    const note     = document.getElementById('input-note').value.trim();

    if (!title || isNaN(amount) || amount <= 0) return;

    appState.transactions.push({
        id: Date.now().toString(),
        title, amount, category, date, note
    });
    saveState();
    renderApp();
    closeAddModal();

    document.getElementById('input-title').value  = '';
    document.getElementById('input-amount').value = '';
    document.getElementById('input-note').value   = '';
}

function handleSaveBudget(e) {
    e.preventDefault();
    appState.budget = {
        income:        parseFloat(document.getElementById('cfg-income').value)  || 0,
        fixed:         parseFloat(document.getElementById('cfg-fixed').value)   || 0,
        savingsTarget: parseFloat(document.getElementById('cfg-savings').value) || 0
    };
    saveState();
    renderApp();
    closeBudgetModal();
}

function deleteTransaction(id) {
    appState.transactions = appState.transactions.filter(tx => tx.id !== id);
    saveState();
    renderApp();
}

/* -------------------- reflection -------------------- */
function saveReflection() {
    appState.reflection = document.getElementById('reflection-note').value;
    saveState();
}

/* -------------------- tutorial -------------------- */
function openTutorialModal(step = 0) {
    currentTutorialStep = step;
    renderTutorialSlide();
    openModal('modal-tutorial');
}

function closeTutorialModal() {
    closeModal('modal-tutorial');
    appState.tutorialSeen = true;
    saveState();
}

function renderTutorialSlide() {
    const slide = TUTORIAL_SLIDES[currentTutorialStep];
    document.getElementById('tutorial-content').innerHTML = `
        <h3>${escapeHtml(slide.title)}</h3>
        <p>${escapeHtml(slide.body)}</p>
    `;

    document.getElementById('tut-prev-btn').style.visibility =
        currentTutorialStep === 0 ? 'hidden' : 'visible';

    document.getElementById('tut-next-btn').innerHTML =
        currentTutorialStep === TUTORIAL_SLIDES.length - 1 ? 'Get Started' : 'Next &rarr;';
}

function nextTutorialStep() {
    if (currentTutorialStep < TUTORIAL_SLIDES.length - 1) {
        currentTutorialStep++;
        renderTutorialSlide();
    } else {
        closeTutorialModal();
    }
}

function prevTutorialStep() {
    if (currentTutorialStep > 0) {
        currentTutorialStep--;
        renderTutorialSlide();
    }
}

/* -------------------- currency -------------------- */
function openCurrencyModal() {
    const preview = document.getElementById('currency-preview-amount');
    const input   = document.getElementById('input-currency-custom');

    if (preview) preview.textContent = fmt(1234.56);
    if (input) {
        input.value = '';
        // Local input handler (no global document listener)
        input.oninput = (e) => {
            const val = e.target.value.trim() || appState.currency || '$';
            if (preview) preview.textContent = val + (1234.56).toFixed(2);
        };
    }

    openModal('modal-currency');
}

function closeCurrencyModal() { closeModal('modal-currency'); }

function applyCurrency(sym) {
    if (!sym) return;
    appState.currency = sym;
    saveState();
    renderApp();
    closeCurrencyModal();
}

function applyCustomCurrency() {
    const val = document.getElementById('input-currency-custom').value.trim();
    if (!val) { alert('Please enter a symbol or code.'); return; }
    applyCurrency(val);
}

/* -------------------- reset -------------------- */
function resetSampleData(persist = true) {
    if (persist && !confirm('Reset all data to sample values? This will clear your transactions, budget, and reflection.')) {
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    appState.budget       = { income: 4500, fixed: 1800, savingsTarget: 900 };
    appState.reflection   = 'Cook meal prep on Sunday to keep the Wants category under control.';
    appState.transactions = [
        { id: '1', date: today, title: 'Organic Groceries',      amount: 84.50, category: 'needs',   note: 'Weekly fresh essentials' },
        { id: '2', date: today, title: 'Coffee & Pastry',        amount: 9.20,  category: 'wants',   note: 'Morning treat' },
        { id: '3', date: today, title: 'Architecture Magazine',  amount: 18.00, category: 'culture', note: 'Design inspiration' },
        { id: '4', date: today, title: 'Bicycle Lock',           amount: 24.00, category: 'extra',   note: 'Replacement key lost' }
    ];

    if (persist) {
        saveState();
        renderApp();
    }
}