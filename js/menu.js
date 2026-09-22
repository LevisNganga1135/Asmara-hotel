/**
 * menu.js — Asmara Hotel
 * Loaded exclusively on menu.html via <script src="js/menu.js" defer>
 *
 * Responsibilities:
 *  1. MENU_ITEMS  — authoritative dish data array
 *  2. renderMenu()  — build card DOM from a filtered array
 *  3. filterMenu()  — apply active category + search query
 *  4. Event wiring  — .filter-btn clicks, #menu-search input (debounced)
 *  5. Accessibility — result count announcer, keyboard-operable filter buttons
 */

'use strict';

/* ═════════════════════════════════════════════════════════════════════════════
   1. MENU DATA
   Each item has: id, name, price, priceValue (number for sorting), category,
   description, image, badge, spicy, allergens (informational string).

   Categories match data-filter attributes on .filter-btn elements:
     fish | sides | drinks
═════════════════════════════════════════════════════════════════════════════ */

/**
 * @typedef {{
 *   id:          string,
 *   name:        string,
 *   price:       string,
 *   priceValue:  number,
 *   category:    'fish'|'sides'|'drinks',
 *   description: string,
 *   image:       string,
 *   badge:       string,
 *   spicy:       boolean,
 *   allergens:   string
 * }} MenuItem
 */

const BACKEND_URL = window.ASMARA_HOTEL_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:'
    ? 'http://localhost:5000'
    : '');

let MENU_ITEMS = [];
window.MENU_ITEMS = MENU_ITEMS;

const LOCAL_MENU_ITEMS = [
    {
        id: 'asmara-kitfo',
        name: 'Asmara Kitfo (Steak Tartar)',
        price: 'KES 1,500',
        priceValue: 1500,
        category: 'fish',
        description: "Finely minced lean beef seasoned with mitmita chili blend and clarified spiced butter (nit'ir kibe). Served with minced spinach, cottage cheese, and authentic warm Injera.",
        image: 'images/asmara_kitfo.png',
        badge: 'Signature',
        spicy: true,
        allergens: 'Dairy'
    },
    {
        id: 'zilzil-tibsi',
        name: 'Zilzil Tibsi',
        price: 'KES 1,600',
        priceValue: 1600,
        category: 'fish',
        description: "Strips of tender beef fillet sizzled with green peppers, onions, tomatoes, and signature Asmara spices. Served in a traditional clay pot over hot charcoal.",
        image: 'images/zilzil_tibsi.png',
        badge: 'Bestseller',
        spicy: false,
        allergens: 'None'
    },
    {
        id: 'tsahli-tibsi',
        name: 'Tsahli Tibsi',
        price: 'KES 1,750',
        priceValue: 1750,
        category: 'fish',
        description: "Pan-fried tender goat meat (with ribs) sautéed with onions, green chilies, rosemary, and authentic Eritrean spices. Served sizzling hot.",
        image: 'images/tsahli_tibsi.png',
        badge: "Chef's Special",
        spicy: true,
        allergens: 'None'
    },
    {
        id: 'shiro-tegamino',
        name: 'Shiro Tegamino',
        price: 'KES 1,100',
        priceValue: 1100,
        category: 'fish',
        description: "Ground chickpeas and split peas simmered with garlic, onions, and berbere spices. Served bubbling hot in a traditional claypot with soft Injera.",
        image: 'images/shiro_tegamino.png',
        badge: 'Vegetarian Favourite',
        spicy: true,
        allergens: 'None'
    },
    {
        id: 'asmara-mixed-plate',
        name: 'Asmara Mixed Plate',
        price: 'KES 2,200',
        priceValue: 2200,
        category: 'fish',
        description: "A grand Eritrean/Ethiopian platter featuring Keyh Tibsi (beef stew), Minchet Abish (minced beef), Shiro, lentils, and assorted vegetables on sourdough Injera.",
        image: 'images/eritrean_injera_platter_1784108860298.png',
        badge: 'Traditional Platter',
        spicy: true,
        allergens: 'Gluten, Dairy'
    },
    {
        id: 'asmara-garlic-mushrooms',
        name: 'Asmara Garlic Mushrooms',
        price: 'KES 750',
        priceValue: 750,
        category: 'sides',
        description: "Fresh button mushrooms pan-fried in garlic butter and signature Asmara herbs, served with grilled artisan garlic bread.",
        image: 'images/asmara_garlic_mushrooms.png',
        badge: 'Popular',
        spicy: false,
        allergens: 'Gluten, Dairy'
    },
    {
        id: 'peri-peri-chicken-liver',
        name: 'Peri-Peri Chicken Liver',
        price: 'KES 850',
        priceValue: 850,
        category: 'sides',
        description: "Tender chicken livers pan-fried with hot peri-peri sauce and finished with fresh cream. Served alongside toasted garlic bread.",
        image: 'images/peri_peri_chicken_liver.png',
        badge: 'Spicy',
        spicy: true,
        allergens: 'Gluten, Dairy'
    },
    {
        id: 'merek-soup',
        name: 'Spicy Merek Soup',
        price: 'KES 600',
        priceValue: 600,
        category: 'sides',
        description: "A traditional goat-bone broth slow-simmered with onions, coriander, green chilies, and a proprietary blend of warm Eritrean spices.",
        image: 'images/merek_soup.png',
        badge: 'Hearty',
        spicy: true,
        allergens: 'None'
    },
    {
        id: 'tajiri-salad',
        name: 'Tajiri Salad',
        price: 'KES 950',
        priceValue: 950,
        category: 'sides',
        description: "Crisp mixed garden greens tossed with sliced artichoke hearts, sweet mango, roasted cashews, and a honey-lime dressing.",
        image: 'images/tajiri_salad.png',
        badge: 'Vibrant',
        spicy: false,
        allergens: 'Tree nuts'
    },
    {
        id: 'spiced-tea',
        name: 'Traditional Spiced Tea',
        price: 'KES 300',
        priceValue: 300,
        category: 'drinks',
        description: "Eritrean black tea brewed with crushed cardamom pods, cloves, and cinnamon bark. Warm, aromatic, and comforting.",
        image: 'images/spiced_tea.png',
        badge: 'Traditional',
        spicy: false,
        allergens: 'None'
    },
    {
        id: 'fresh-juice',
        name: 'Freshly Squeezed Mango Juice',
        price: 'KES 350',
        priceValue: 350,
        category: 'drinks',
        description: "Freshly squeezed sweet local mangoes, cold-pressed daily without added water or sugars.",
        image: 'images/fresh_juice.png',
        badge: '100% Organic',
        spicy: false,
        allergens: 'None'
    }
];

/* ═════════════════════════════════════════════════════════════════════════════
   2. SAFE ESCAPING
   All item content is authored in-file, but we escape defensively anyway
   so future data sources (CMS, API) can't inject markup.
═════════════════════════════════════════════════════════════════════════════ */

/**
 * Escape a value for safe insertion into HTML text content.
 * @param {*} val
 * @returns {string}
 */
function esc(val) {
    if (val === null || val === undefined) return '';
    return String(val)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#039;');
}

/* ═════════════════════════════════════════════════════════════════════════════
   3. CARD BUILDER
   Returns a fully-formed <article> element for one menu item.
   All dynamic content is escaped. No raw HTML injection from data.
═════════════════════════════════════════════════════════════════════════════ */

/**
 * Build a single menu card element.
 * @param {MenuItem} item
 * @returns {HTMLElement}
 */
function buildCard(item) {
    const article = document.createElement('article');
    article.className = 'card menu-card glass-dark rounded-xl overflow-hidden shadow-lg border border-white/10 transition-transform hover:-translate-y-1';
    article.setAttribute('data-category', item.category);
    article.setAttribute('data-id', item.id);

    // ── Image wrapper with lazy loading and error fallback ───────────────────
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'card-img-wrapper';

    const img = document.createElement('img');
    img.src     = item.image;
    img.alt     = item.name + ' — ' + item.category + ' at Asmara Hotel';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width   = 400;
    img.height  = 225;
    // Fallback: show a branded placeholder if the image fails to load.
    img.onerror = function () {
        this.onerror = null; // prevent infinite loop
        this.src = 'data:image/svg+xml,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225">' +
            '<rect width="400" height="225" fill="#FBF6EE"/>' +
            '<text x="50%" y="45%" text-anchor="middle" font-size="48" fill="#D9692D">🐟</text>' +
            '<text x="50%" y="68%" text-anchor="middle" font-size="14" fill="#4D4540" font-family="sans-serif">Image unavailable</text>' +
            '</svg>'
        );
        this.alt = item.name + ' (image unavailable)';
    };

    imgWrapper.appendChild(img);

    // ── Card body ─────────────────────────────────────────────────────────────
    const body = document.createElement('div');
    body.className = 'menu-card-body';
    body.style.cssText = 'padding: 1.25rem 1.5rem 1.5rem; display: flex; flex-direction: column; flex: 1;';

    // Title row — name + price
    const titleRow = document.createElement('div');
    titleRow.style.cssText = 'display:flex; justify-content:space-between; align-items:flex-start; gap:0.75rem; margin-bottom:0.5rem;';

    const heading = document.createElement('h3');
    heading.className = 'font-headline';
    heading.style.cssText = 'font-size:1.15rem; line-height:1.3; flex:1; color: var(--brand-gold);';
    heading.textContent = item.name; // textContent — no escaping needed for DOM text

    const price = document.createElement('span');
    price.className = 'menu-item-price text-brand-bg font-bold';
    price.setAttribute('aria-label', 'Price: ' + item.price);
    price.textContent = item.price;

    titleRow.appendChild(heading);
    titleRow.appendChild(price);

    // Description
    const desc = document.createElement('p');
    desc.style.cssText = 'font-size:0.875rem; color: rgba(251, 246, 238, 0.7); line-height:1.6; margin-bottom:1.25rem; flex:1;';
    desc.textContent = item.description;

    // Badge row
    const badgeRow = document.createElement('div');
    badgeRow.style.cssText = 'display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap; margin-top:auto;';

    const badge = document.createElement('span');
    badge.className = 'badge border border-white/20 bg-white/5 px-2 py-1 rounded text-xs text-brand-bg';
    badge.textContent = item.badge;
    badgeRow.appendChild(badge);

    if (item.spicy) {
        const spicyBadge = document.createElement('span');
        spicyBadge.className = 'badge px-2 py-1 rounded text-xs';
        spicyBadge.style.cssText = 'background-color:rgba(186,26,26,0.2); color:#ff6b6b; border: 1px solid rgba(186,26,26,0.3);';
        spicyBadge.setAttribute('aria-label', 'Contains chili — spicy dish');
        spicyBadge.textContent = '🌶 Spicy';
        badgeRow.appendChild(spicyBadge);
    }

    if (item.allergens && item.allergens !== 'None') {
        const allergenNote = document.createElement('span');
        allergenNote.style.cssText = 'font-size:0.7rem; color: rgba(251, 246, 238, 0.5); margin-left:auto;';
        allergenNote.setAttribute('aria-label', 'Allergens: ' + item.allergens);
        allergenNote.title = 'Contains: ' + item.allergens;
        allergenNote.textContent = '⚠ ' + item.allergens;
        badgeRow.appendChild(allergenNote);
    }

    body.appendChild(titleRow);
    body.appendChild(desc);
    body.appendChild(badgeRow);

    // Add to Cart Button (Phase 1)
    const orderRow = document.createElement('div');
    orderRow.style.cssText = 'margin-top: 1.25rem;';
    
    const addToCartBtn = document.createElement('button');
    addToCartBtn.className = 'btn-add-to-cart bg-brand-terracotta text-white w-full py-2.5 px-4 rounded-lg font-semibold text-sm hover:scale-[0.98] active:scale-95 transition-all flex justify-center items-center gap-2 glow-terracotta';
    addToCartBtn.setAttribute('data-id', item.id);
    addToCartBtn.innerHTML = '<span class="material-symbols-outlined text-base">shopping_cart</span> Add to Cart';
    
    addToCartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.Cart && typeof window.Cart.addItem === 'function') {
            window.Cart.addItem(item.id);
        } else {
            console.error('Cart module not initialized yet.');
        }
    });
    
    orderRow.appendChild(addToCartBtn);
    body.appendChild(orderRow);

    article.appendChild(imgWrapper);
    article.appendChild(body);

    return article;
}

/* ═════════════════════════════════════════════════════════════════════════════
   4. RENDER FUNCTION
   Clears #menu-grid and injects a DocumentFragment of cards.
   Updates the live-region result count for screen readers.
═════════════════════════════════════════════════════════════════════════════ */

/** @type {HTMLElement|null} — cached once on init */
let _grid = null;
/** @type {HTMLElement|null} — live region for screen reader announcements */
let _announcer = null;

/**
 * Render a filtered subset of items into #menu-grid.
 * @param {MenuItem[]} items
 */
function renderMenu(items) {
    if (!_grid) return;

    const fragment = document.createDocumentFragment();

    if (items.length === 0) {
        // Empty state — single cell spanning all columns.
        const empty = document.createElement('div');
        empty.className = 'menu-empty-state';
        // Inline style because grid-column span needs to work at all breakpoints.
        // The grid-3 class switches between 1 and 3 cols — we span 1 at mobile,
        // span all at desktop. Using -webkit-fill-available width as fallback.
        empty.style.cssText = [
            'grid-column: 1 / -1',
            'text-align: center',
            'padding: 4rem 2rem',
            'opacity: 0.65',
            'display: flex',
            'flex-direction: column',
            'align-items: center',
            'gap: 1rem',
        ].join(';');
        empty.innerHTML =
            '<span style="font-size:3rem;">🔍</span>' +
            '<p style="font-size:1.1rem;font-weight:600;">No dishes matched your search.</p>' +
            '<p style="font-size:0.9rem;">Try a different keyword or select <strong>All Items</strong> above.</p>';
        fragment.appendChild(empty);

        announce('No results found. Try adjusting your search or filter.');
    } else {
        items.forEach(item => fragment.appendChild(buildCard(item)));
        const label = items.length === 1
            ? '1 dish found'
            : items.length + ' dishes found';
        announce(label);
    }

    // Single DOM write.
    _grid.innerHTML = '';
    _grid.appendChild(fragment);
}

/**
 * Update the ARIA live region so screen readers announce result counts.
 * @param {string} message
 */
function announce(message) {
    if (_announcer) _announcer.textContent = message;
}

/* ═════════════════════════════════════════════════════════════════════════════
   5. FILTER & SEARCH
═════════════════════════════════════════════════════════════════════════════ */

/** Current active category filter. 'all' means no category restriction. */
let _activeCategory = 'all';

/** Current debounce timer handle. */
let _debounceTimer = null;

/**
 * Apply the active category and current search query, then re-render.
 * Reading the search value fresh on each call keeps state minimal.
 */
function applyFilters() {
    const searchInput = document.getElementById('menu-search');
    const rawQuery    = searchInput ? searchInput.value : '';
    const query       = rawQuery.trim().toLowerCase();

    let results = MENU_ITEMS;

    // Category filter.
    if (_activeCategory !== 'all') {
        results = results.filter(item => item.category === _activeCategory);
    }

    // Full-text search across name, description, badge, and allergens.
    if (query.length > 0) {
        results = results.filter(item =>
            item.name.toLowerCase().includes(query)        ||
            item.description.toLowerCase().includes(query) ||
            item.badge.toLowerCase().includes(query)       ||
            item.allergens.toLowerCase().includes(query)
        );
    }

    renderMenu(results);
}

/**
 * Debounced wrapper for applyFilters.
 * Waits 200ms after the user stops typing before running the filter —
 * avoids re-rendering on every single keystroke.
 */
function debouncedFilter() {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(applyFilters, 200);
}

/* ═════════════════════════════════════════════════════════════════════════════
   6. INIT — wire everything up on DOMContentLoaded
═════════════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    // Guard: only run on pages that have the menu grid.
    _grid = document.getElementById('menu-grid');
    if (!_grid) return;

    // ── ARIA live region ──────────────────────────────────────────────────────
    // Inject a visually-hidden element that screen readers will monitor.
    // Placed outside the grid so it isn't wiped on re-render.
    _announcer = document.createElement('div');
    _announcer.setAttribute('aria-live', 'polite');
    _announcer.setAttribute('aria-atomic', 'true');
    _announcer.style.cssText = [
        'position:absolute',
        'width:1px',
        'height:1px',
        'padding:0',
        'overflow:hidden',
        'clip:rect(0,0,0,0)',
        'white-space:nowrap',
        'border:0',
    ].join(';');
    document.body.appendChild(_announcer);

    // ── Search input ──────────────────────────────────────────────────────────
    const searchInput = document.getElementById('menu-search');
    if (searchInput) {
        searchInput.addEventListener('input', debouncedFilter);

        // Clear search with Escape key for quick reset.
        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                applyFilters();
                searchInput.blur();
            }
        });
    }

    // ── Filter buttons ────────────────────────────────────────────────────────
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        // Each button is already a <button> in the HTML so it's keyboard-operable
        // by default — no extra tabindex needed.

        btn.addEventListener('click', () => {
            // Only act if this isn't already the active filter.
            const newCategory = btn.dataset.filter || 'all';
            if (newCategory === _activeCategory) return;

            // Update active state visually and in state.
            filterBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');

            _activeCategory = newCategory;

            // Clear the search box when switching category so results
            // aren't confusingly filtered by both simultaneously on category change.
            // We intentionally keep the search if the user typed something first
            // and then clicks a filter — that's a "refine within category" pattern.
            // So we only clear if the search box is empty already.
            applyFilters();
        });
    });

    // Set initial ARIA pressed state to match the HTML default of data-filter="all".
    filterBtns.forEach(btn => {
        const isActive = btn.classList.contains('active');
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    // ── Initial render ────────────────────────────────────────────────────────
    if (_grid) {
        _grid.innerHTML = '<div class="col-span-full text-center py-16 opacity-75">Loading signature dishes...</div>';
    }

    fetch(`${BACKEND_URL}/api/dishes`)
        .then(res => {
            if (!res.ok) throw new Error('Failed to load dishes');
            return res.json();
        })
        .then(data => {
            MENU_ITEMS = data;
            window.MENU_ITEMS = data;
            renderMenu(MENU_ITEMS);
        })
        .catch(err => {
            console.warn('💥 Failed to load menu from server, falling back to local menu catalog:', err);
            MENU_ITEMS = LOCAL_MENU_ITEMS;
            window.MENU_ITEMS = LOCAL_MENU_ITEMS;
            renderMenu(MENU_ITEMS);
        });
});
