/* =========================================================
   my online meal – script.js
   Works with your existing index.html and style.css.
   It adds:
   - working navbar links (smooth scroll)
   - an ORDER NOW window with a menu, cart and checkout form
   - "ORDER NOW" buttons on each service box
   - a cart counter in the navbar
   - a contact form window
   Its own styles are added by this file, so style.css stays unchanged.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ---------- Settings you can change ---------- */
  const CONFIG = {
    currency: '$',
    taxRate: 0.05,          // 5% tax
    deliveryFee: 2.5,
    freeDeliveryOver: 25,   // free delivery from this subtotal
    maxQty: 20,
    storageKey: 'my-online-meal-cart',
  };

  const CATEGORIES = [
    { id: 'meals',  label: 'Meals' },
    { id: 'fries',  label: 'French fries' },
    { id: 'fruits', label: 'Healthy fruits' },
  ];

  /* ---------- Menu: edit, add or remove items here ---------- */
  const MENU = [
    { id: 'margherita',    name: 'Margherita Pizza',    category: 'meals',  price: 9.5, emoji: '🍕' },
    { id: 'cheeseburger',  name: 'Cheese Burger',       category: 'meals',  price: 7.5, emoji: '🍔' },
    { id: 'veg-wrap',      name: 'Veggie Wrap',         category: 'meals',  price: 6.5, emoji: '🌯' },
    { id: 'creamy-pasta',  name: 'Creamy Pasta',        category: 'meals',  price: 8.5, emoji: '🍝' },

    { id: 'classic-fries', name: 'Classic French Fries', category: 'fries', price: 3.5, emoji: '🍟' },
    { id: 'cheesy-fries',  name: 'Cheesy Fries',        category: 'fries',  price: 4.5, emoji: '🧀' },
    { id: 'peri-fries',    name: 'Peri Peri Fries',     category: 'fries',  price: 4.5, emoji: '🌶️' },

    { id: 'fruit-bowl',    name: 'Mixed Fruit Bowl',    category: 'fruits', price: 5,   emoji: '🍓' },
    { id: 'mango-shake',   name: 'Mango Shake',         category: 'fruits', price: 4.5, emoji: '🥭' },
    { id: 'orange-juice',  name: 'Fresh Orange Juice',  category: 'fruits', price: 3.5, emoji: '🍊' },
    { id: 'watermelon',    name: 'Watermelon Cup',      category: 'fruits', price: 3,   emoji: '🍉' },
  ];

  /* ---------- Small helpers ---------- */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const money = (n) => CONFIG.currency + n.toFixed(2);
  const round2 = (n) => Math.round(n * 100) / 100;
  const byId = (id) => MENU.find((m) => m.id === id);

  /* ---------- State (cart is saved in the browser) ---------- */
  function loadCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '{}');
      const cart = {};
      Object.entries(raw).forEach(([id, qty]) => {
        if (byId(id) && Number.isInteger(qty) && qty > 0) cart[id] = Math.min(qty, CONFIG.maxQty);
      });
      return cart;
    } catch (err) {
      return {};
    }
  }

  function saveCart() {
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(state.cart)); } catch (err) { /* ignore */ }
  }

  const state = { cart: loadCart(), category: 'meals', view: 'menu' };

  /* =========================================================
     Styles for the order window (added from JavaScript)
     ========================================================= */
  const style = document.createElement('style');
  style.textContent = `
    .mom-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(0,0,0,.6); }
    .mom-overlay[hidden] { display: none; }
    .mom-modal { width: 100%; max-width: 560px; max-height: calc(100vh - 32px); display: flex; flex-direction: column; background: #fff; color: #222; border: 2px solid brown; border-radius: 20px; overflow: hidden; }
    .mom-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 18px; background: rgb(255,238,238); border-bottom: 2px solid brown; }
    .mom-head h2 { font-size: 1.4rem; color: brown; }
    .mom-close { width: 36px; height: 36px; border: 2px solid brown; border-radius: 50%; background: #fff; color: brown; font-size: 1.4rem; line-height: 1; cursor: pointer; }
    .mom-body { flex: 1; overflow-y: auto; padding: 16px 18px; }
    .mom-foot { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 14px 18px; background: rgb(255,238,238); border-top: 2px solid brown; }

    .mom-btn { padding: 8px 20px; border: 2px solid brown; border-radius: 10px; background: brown; color: #fff; font: inherit; cursor: pointer; }
    .mom-btn.alt { background: #fff; color: brown; }
    .mom-btn.small { padding: 4px 16px; }
    .mom-btn[disabled] { opacity: .5; cursor: not-allowed; }

    .mom-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
    .mom-tab { padding: 5px 16px; border: 2px solid brown; border-radius: 20px; background: #fff; color: brown; font: inherit; cursor: pointer; }
    .mom-tab[aria-pressed="true"] { background: brown; color: #fff; }

    .mom-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px dashed #b98; }
    .mom-emoji { width: 44px; font-size: 2rem; text-align: center; }
    .mom-name { flex: 1; }
    .mom-price { font-size: .9rem; color: #555; }
    .mom-step { display: inline-flex; align-items: center; border: 2px solid brown; border-radius: 20px; overflow: hidden; }
    .mom-step button { width: 30px; height: 30px; border: 0; background: rgb(255,238,238); color: brown; font-size: 1.1rem; font-weight: bold; cursor: pointer; }
    .mom-step output { min-width: 30px; text-align: center; font-weight: bold; }

    .mom-summary { margin-bottom: 16px; padding: 10px 14px; background: rgb(255,238,238); border-radius: 12px; }
    .mom-line { display: flex; justify-content: space-between; gap: 12px; padding: 3px 0; }
    .mom-line.total { margin-top: 6px; padding-top: 8px; border-top: 2px solid brown; font-weight: bold; font-size: 1.1rem; }

    .mom-field { margin-bottom: 12px; }
    .mom-field label, .mom-pay legend { display: block; margin-bottom: 4px; font-weight: bold; }
    .mom-field input, .mom-field textarea { width: 100%; padding: 8px 12px; border: 2px solid brown; border-radius: 10px; font: inherit; resize: vertical; }
    .mom-field [aria-invalid="true"] { border-color: #b00020; background: #fff5f5; }
    .mom-err { margin-top: 3px; font-size: .85rem; font-weight: bold; color: #b00020; }
    .mom-pay { display: flex; flex-wrap: wrap; gap: 10px; margin: 0 0 8px; border: 0; }
    .mom-pay legend { width: 100%; }
    .mom-pay label { flex: 1 1 180px; display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 2px solid brown; border-radius: 10px; cursor: pointer; }
    .mom-note { font-size: .85rem; color: #555; }

    .mom-done { text-align: center; padding: 10px 0; }
    .mom-done .mark { width: 64px; height: 64px; margin: 0 auto 12px; display: grid; place-items: center; font-size: 2rem; color: #fff; background: seagreen; border-radius: 50%; }
    .mom-done h3 { font-size: 1.5rem; margin-bottom: 8px; }
    .mom-empty { padding: 24px 0; text-align: center; color: #555; }

    .mom-modal :focus-visible { outline: 3px solid #1a73e8; outline-offset: 2px; }
  `;
  document.head.appendChild(style);

  /* =========================================================
     Build the order window
     ========================================================= */
  const overlay = document.createElement('div');
  overlay.className = 'mom-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="mom-modal" role="dialog" aria-modal="true" aria-labelledby="momTitle">
      <div class="mom-head">
        <h2 id="momTitle"></h2>
        <button type="button" class="mom-close" data-action="close" aria-label="Close">&times;</button>
      </div>
      <div class="mom-body" id="momBody"></div>
      <div class="mom-foot" id="momFoot"></div>
    </div>`;
  document.body.appendChild(overlay);

  const titleEl = $('#momTitle', overlay);
  const bodyEl  = $('#momBody', overlay);
  const footEl  = $('#momFoot', overlay);
  const closeBtn = $('.mom-close', overlay);

  /* ---------- Cart maths ---------- */
  function cartLines() {
    return Object.entries(state.cart).map(([id, qty]) => {
      const d = byId(id);
      return { d, qty, line: round2(d.price * qty) };
    });
  }
  const itemCount = () => Object.values(state.cart).reduce((a, b) => a + b, 0);

  function totals() {
    const subtotal = round2(cartLines().reduce((s, l) => s + l.line, 0));
    const delivery = subtotal === 0 ? 0 : (subtotal >= CONFIG.freeDeliveryOver ? 0 : CONFIG.deliveryFee);
    const tax = round2(subtotal * CONFIG.taxRate);
    const total = round2(subtotal + delivery + tax);
    return { subtotal, delivery, tax, total };
  }

  /* ---------- Navbar cart link ---------- */
  const navList = $('#navbar ul');
  let cartLink = null;
  if (navList) {
    const li = document.createElement('li');
    li.className = 'item';
    cartLink = document.createElement('a');
    cartLink.href = '#';
    li.appendChild(cartLink);
    navList.appendChild(li);
    cartLink.addEventListener('click', (e) => { e.preventDefault(); openModal('menu'); });
  }

  function updateBadge() {
    if (!cartLink) return;
    const n = itemCount();
    cartLink.textContent = `cart (${n})`;
    cartLink.setAttribute('aria-label', `Open order, ${n} ${n === 1 ? 'item' : 'items'} in cart`);
  }

  /* =========================================================
     Views inside the window
     ========================================================= */
  function qtyHTML(d) {
    const q = state.cart[d.id] || 0;
    if (!q) {
      return `<button type="button" class="mom-btn small" data-action="add" data-id="${d.id}" aria-label="Add ${d.name}">Add</button>`;
    }
    return `
      <div class="mom-step" role="group" aria-label="${d.name} quantity">
        <button type="button" data-action="dec" data-id="${d.id}" aria-label="Remove one ${d.name}">&minus;</button>
        <output>${q}</output>
        <button type="button" data-action="inc" data-id="${d.id}" aria-label="Add one more ${d.name}">+</button>
      </div>`;
  }

  function renderMenuView() {
    state.view = 'menu';
    titleEl.textContent = 'Order your meal';

    const tabs = CATEGORIES.map((c) =>
      `<button type="button" class="mom-tab" data-action="tab" data-value="${c.id}" aria-pressed="${state.category === c.id}">${c.label}</button>`
    ).join('');

    const rows = MENU.filter((d) => d.category === state.category).map((d) => `
      <div class="mom-row">
        <span class="mom-emoji" aria-hidden="true">${d.emoji}</span>
        <div class="mom-name"><strong>${d.name}</strong><div class="mom-price">${money(d.price)}</div></div>
        <div class="mom-qty" data-qty-for="${d.id}">${qtyHTML(d)}</div>
      </div>`).join('');

    bodyEl.innerHTML = `<div class="mom-tabs" role="group" aria-label="Menu categories">${tabs}</div>${rows}`;
    footEl.innerHTML = `
      <div>Items: <strong id="momCount">0</strong> &nbsp; Subtotal: <strong id="momSub">${money(0)}</strong></div>
      <button type="button" class="mom-btn" id="momNext" data-action="next">Continue</button>`;
    updateFoot();
  }

  function updateFoot() {
    if (state.view !== 'menu') return;
    $('#momCount', footEl).textContent = itemCount();
    $('#momSub', footEl).textContent = money(totals().subtotal);
    $('#momNext', footEl).disabled = itemCount() === 0;
  }

  const field = (id, label, type, extra = '') => `
    <div class="mom-field">
      <label for="${id}">${label}</label>
      <input id="${id}" type="${type}" ${extra} aria-describedby="${id}Err">
      <div class="mom-err" id="${id}Err"></div>
    </div>`;

  const area = (id, label, rows = 3) => `
    <div class="mom-field">
      <label for="${id}">${label}</label>
      <textarea id="${id}" rows="${rows}" aria-describedby="${id}Err"></textarea>
      <div class="mom-err" id="${id}Err"></div>
    </div>`;

  function renderCheckoutView() {
    state.view = 'checkout';
    titleEl.textContent = 'Delivery details';
    const t = totals();

    const items = cartLines().map(({ d, qty, line }) =>
      `<div class="mom-line"><span>${qty} × ${d.name}</span><span>${money(line)}</span></div>`
    ).join('');

    bodyEl.innerHTML = `
      <div class="mom-summary">
        ${items}
        <div class="mom-line"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
        <div class="mom-line"><span>Delivery</span><span>${t.delivery === 0 ? 'Free' : money(t.delivery)}</span></div>
        <div class="mom-line"><span>Tax</span><span>${money(t.tax)}</span></div>
        <div class="mom-line total"><span>Total</span><span>${money(t.total)}</span></div>
      </div>
      <form id="momForm" data-form="order" novalidate>
        ${field('momName', 'Full name', 'text', 'autocomplete="name"')}
        ${field('momPhone', 'Phone number', 'tel', 'autocomplete="tel" inputmode="tel"')}
        ${area('momAddress', 'Delivery address')}
        <fieldset class="mom-pay">
          <legend>Payment</legend>
          <label><input type="radio" name="pay" value="Cash on delivery" checked> Cash on delivery</label>
          <label><input type="radio" name="pay" value="Pay online"> Pay online</label>
        </fieldset>
        <p class="mom-note">This is a demo. No payment is taken and no real order is sent.</p>
      </form>`;

    footEl.innerHTML = `
      <button type="button" class="mom-btn alt" data-action="back">Back</button>
      <button type="submit" form="momForm" class="mom-btn">Place order (${money(t.total)})</button>`;
  }

  function renderDoneView(order) {
    state.view = 'done';
    titleEl.textContent = 'Order placed';
    bodyEl.innerHTML = `
      <div class="mom-done">
        <div class="mark" aria-hidden="true">&#10003;</div>
        <h3 tabindex="-1" id="momDoneHead">Thank you!</h3>
        <p id="momDoneMsg"></p>
      </div>`;
    $('#momDoneMsg', bodyEl).textContent =
      `${order.name}, your order ${order.id} (${money(order.total)}) is being prepared. Payment: ${order.pay}.`;
    footEl.innerHTML = `<span></span><button type="button" class="mom-btn" data-action="close">Close</button>`;
  }

  function renderContactView() {
    state.view = 'contact';
    titleEl.textContent = 'Contact us';
    bodyEl.innerHTML = `
      <form id="momForm" data-form="contact" novalidate>
        ${field('momCName', 'Your name', 'text', 'autocomplete="name"')}
        ${field('momCEmail', 'Email', 'email', 'autocomplete="email"')}
        ${area('momCMsg', 'Message', 4)}
      </form>`;
    footEl.innerHTML = `
      <button type="button" class="mom-btn alt" data-action="close">Cancel</button>
      <button type="submit" form="momForm" class="mom-btn">Send message</button>`;
  }

  function renderContactDone() {
    state.view = 'contact-done';
    titleEl.textContent = 'Message sent';
    bodyEl.innerHTML = `
      <div class="mom-done">
        <div class="mark" aria-hidden="true">&#10003;</div>
        <h3 tabindex="-1" id="momDoneHead">Thanks for writing to us.</h3>
        <p>We will reply as soon as we can.</p>
      </div>`;
    footEl.innerHTML = `<span></span><button type="button" class="mom-btn" data-action="close">Close</button>`;
  }

  function show(view) {
    if (view === 'menu') renderMenuView();
    else if (view === 'checkout') renderCheckoutView();
    else if (view === 'contact') renderContactView();
    bodyEl.scrollTop = 0;
    const first = $('input, textarea', bodyEl);
    if (first && (view === 'checkout' || view === 'contact')) first.focus();
  }

  /* =========================================================
     Open / close
     ========================================================= */
  let lastFocused = null;

  function openModal(view) {
    if (overlay.hidden) lastFocused = document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    show(view);
    if (view === 'menu') closeBtn.focus();
  }

  function closeModal() {
    overlay.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  /* =========================================================
     Cart actions
     ========================================================= */
  function setQty(id, qty) {
    const next = Math.max(0, Math.min(CONFIG.maxQty, qty));
    if (next === 0) delete state.cart[id];
    else state.cart[id] = next;
    saveCart();
    updateBadge();

    const holder = $(`[data-qty-for="${id}"]`, bodyEl);
    if (holder) holder.innerHTML = qtyHTML(byId(id));
    updateFoot();
  }

  function focusQty(id, action) {
    const btn = $(`[data-qty-for="${id}"] [data-action="${action}"]`, bodyEl);
    if (btn) btn.focus();
  }

  /* =========================================================
     Forms
     ========================================================= */
  const rules = {
    order: [
      { id: 'momName',    test: (v) => v.trim().length >= 2, msg: 'Enter your full name.' },
      { id: 'momPhone',   test: (v) => /^\+?[\d\s\-()]{7,16}$/.test(v.trim()), msg: 'Enter a valid phone number.' },
      { id: 'momAddress', test: (v) => v.trim().length >= 8, msg: 'Enter your full delivery address.' },
    ],
    contact: [
      { id: 'momCName',  test: (v) => v.trim().length >= 2, msg: 'Enter your name.' },
      { id: 'momCEmail', test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), msg: 'Enter a valid email address.' },
      { id: 'momCMsg',   test: (v) => v.trim().length >= 5, msg: 'Write a short message.' },
    ],
  };

  function validateForm(kind) {
    let firstBad = null;
    rules[kind].forEach((r) => {
      const input = $('#' + r.id, bodyEl);
      const err = $('#' + r.id + 'Err', bodyEl);
      const ok = r.test(input.value);
      err.textContent = ok ? '' : r.msg;
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok && !firstBad) firstBad = input;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  function placeOrder() {
    const t = totals();
    const order = {
      id: 'MOM-' + Math.floor(10000 + Math.random() * 90000),
      name: $('#momName', bodyEl).value.trim(),
      pay: $('input[name="pay"]:checked', bodyEl).value,
      total: t.total,
    };
    state.cart = {};
    saveCart();
    updateBadge();
    renderDoneView(order);
    $('#momDoneHead', bodyEl).focus();
  }

  overlay.addEventListener('submit', (e) => {
    e.preventDefault();
    const kind = e.target.dataset.form;
    if (!kind || !validateForm(kind)) return;

    if (kind === 'order') {
      if (itemCount() === 0) { show('menu'); return; }
      placeOrder();
    } else {
      renderContactDone();
      $('#momDoneHead', bodyEl).focus();
    }
  });

  /* =========================================================
     Click handling inside the window
     ========================================================= */
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) { closeModal(); return; }

    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id, value } = btn.dataset;

    switch (action) {
      case 'tab':
        state.category = value;
        renderMenuView();
        $(`[data-action="tab"][data-value="${value}"]`, bodyEl).focus();
        break;
      case 'add':
      case 'inc':
        setQty(id, (state.cart[id] || 0) + 1);
        focusQty(id, 'inc');
        break;
      case 'dec':
        setQty(id, (state.cart[id] || 0) - 1);
        focusQty(id, state.cart[id] ? 'dec' : 'add');
        break;
      case 'next':
        if (itemCount() > 0) show('checkout');
        break;
      case 'back':
        show('menu');
        break;
      case 'close':
        closeModal();
        break;
      default:
        break;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (overlay.hidden) return;

    if (e.key === 'Escape') { closeModal(); return; }

    if (e.key === 'Tab') {
      const focusable = $$('button, input, textarea, select, [href]', overlay)
        .filter((n) => !n.disabled && n.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* =========================================================
     Connect the page you already have
     ========================================================= */
  function scrollToEl(selector) {
    const target = $(selector);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Navbar links – matched by their text
  const routes = {
    'home':       () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    'main':       () => scrollToEl('#services-container'),
    'items':      () => openModal('menu'),
    'about us':   () => scrollToEl('#client-section'),
    'contact us': () => openModal('contact'),
  };

  $$('#navbar li.item a').forEach((a) => {
    const route = routes[a.textContent.trim().toLowerCase()];
    if (!route) return;
    a.addEventListener('click', (e) => { e.preventDefault(); route(); });
  });

  // Big ORDER NOW button in the home section
  const heroBtn = $('#home .BTN');
  if (heroBtn) heroBtn.addEventListener('click', () => { state.category = 'meals'; openModal('menu'); });

  // An ORDER NOW button inside each service box
  const boxCategory = {
    'food ordering': 'meals',
    'french fries': 'fries',
    'healthy fruits': 'fruits',
  };

  $$('#services .box').forEach((box) => {
    const heading = $('h2', box);
    const category = heading && boxCategory[heading.textContent.trim().toLowerCase()];
    if (!category) return;

    const wrap = document.createElement('div');
    wrap.style.textAlign = 'center';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'BTN';           // uses your existing button style
    btn.textContent = 'ORDER NOW';
    btn.addEventListener('click', () => { state.category = category; openModal('menu'); });
    wrap.appendChild(btn);
    box.appendChild(wrap);
  });

  updateBadge();
});