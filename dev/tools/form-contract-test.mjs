import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const script = fs.readFileSync(new URL('../../main.js', import.meta.url), 'utf8');

class FakeClassList {
  constructor() { this.values = new Set(); }
  add(...names) { names.forEach((name) => this.values.add(name)); }
  remove(...names) { names.forEach((name) => this.values.delete(name)); }
  contains(name) { return this.values.has(name); }
  toggle(name, force) {
    const next = force === undefined ? !this.values.has(name) : Boolean(force);
    if (next) this.values.add(name);
    else this.values.delete(name);
    return next;
  }
}

class FakeElement {
  constructor() {
    this.dataset = {};
    this.attributes = new Map();
    this.listeners = new Map();
    this.classList = new FakeClassList();
    this.textContent = '';
  }
  addEventListener(type, listener, options = {}) {
    const listeners = this.listeners.get(type) || [];
    listeners.push({ listener, once: Boolean(options?.once) });
    this.listeners.set(type, listeners);
  }
  dispatchEvent(event) {
    const listeners = [...(this.listeners.get(event.type) || [])];
    listeners.forEach(({ listener, once }) => {
      if (once) this.listeners.set(event.type, (this.listeners.get(event.type) || []).filter((item) => item.listener !== listener));
      listener.call(this, event);
    });
    return true;
  }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  hasAttribute(name) { return this.attributes.has(name); }
  closest() { return null; }
}

class FakeButton extends FakeElement {
  constructor() {
    super();
    this.disabled = false;
    this.innerHTML = 'Check my date &amp; get pricing <span>↗</span>';
    this.dataset.ctaLocation = 'form';
  }
}

class FakeField extends FakeElement {
  constructor(values) {
    super();
    this.value = '';
    this.options = values.map((value) => ({ value }));
  }
}

class FakeStatus extends FakeElement {}

class FakeForm extends FakeElement {
  constructor() {
    super();
    this.id = 'availability-form';
    this.method = 'POST';
    this.dataset.ctaLocation = 'form';
    this.attributes.set('action', 'https://formspree.io/f/maqrwpqr');
    this.attributes.set('aria-describedby', '');
    this.valid = true;
    this.reportCount = 0;
    this.resetCount = 0;
    this.button = new FakeButton();
    this.status = new FakeStatus();
    this.fields = new Map([
      ['form_context', 'homepage_availability'],
      ['name', 'QA Person'],
      ['email', 'qa.person@example.com'],
      ['mobile', '+1 202 555 0100'],
      ['event_type', 'Private celebration'],
      ['event_date', '2026-10-18'],
      ['venue_city', 'Alexandria, VA'],
      ['coverage_hours', '4–6 hours'],
      ['guest_count', '125'],
      ['package_interest', 'Signature Event Story'],
      ['budget', '$1,495–$2,094'],
      ['must_have', 'Keynote and family reactions'],
      ['notes', 'QA only'],
      ['referral_source', 'Google']
    ]);
  }
  querySelector(selector) {
    if (selector.includes('[data-form-status]') || selector.includes('[aria-live=')) return this.status;
    if (selector.includes('button[type="submit"]') || selector.includes('input[type="submit"]')) return this.button;
    return null;
  }
  checkValidity() { return this.valid; }
  reportValidity() { this.reportCount += 1; }
  reset() { this.resetCount += 1; }
  append(element) { this.status = element; }
}

class FakeFormData {
  constructor(form) { this.values = new Map(form.fields); }
  get(name) { return this.values.get(name) ?? null; }
  set(name, value) { this.values.set(name, String(value)); }
  delete(name) { this.values.delete(name); }
  entries() { return this.values.entries(); }
  [Symbol.iterator]() { return this.values[Symbol.iterator](); }
}

class FakeStorage {
  constructor(initial = {}) { this.values = new Map(Object.entries(initial)); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

class FakeEvent {
  constructor(type, init = {}) { this.type = type; Object.assign(this, init); }
  preventDefault() { this.defaultPrevented = true; }
}

const makeHarness = ({ response = 'success', valid = true } = {}) => {
  const form = new FakeForm();
  form.valid = valid;
  const eventTypeField = new FakeField(['', 'Private celebration', 'Keynote / conference', 'Live performance', 'Wedding']);
  const packageField = new FakeField(['', 'Essential Event Film', 'Signature Event Story', 'Legacy Event Collection']);
  const documentListeners = new Map();
  const analytics = [];
  const requests = [];
  const warnings = [];
  const redirects = [];
  let resolveDeferred;
  const deferred = new Promise((resolve) => { resolveDeferred = resolve; });
  const firstTouch = JSON.stringify({
    utm_source: 'trusted_referral',
    utm_campaign: 'prior_campaign',
    initial_landing_page: '/proof/',
    initial_referrer: 'https://partner.example/referral',
    captured_at: '2026-07-01T00:00:00.000Z'
  });
  const localStorage = new FakeStorage({ archangel_first_touch_v1: firstTouch });
  const sessionStorage = new FakeStorage();

  const document = {
    referrer: 'https://google.com/search?q=event+video',
    hidden: false,
    documentElement: {},
    body: { classList: new FakeClassList() },
    addEventListener(type, listener) { documentListeners.set(type, listener); },
    querySelector(selector) {
      if (selector === '#availability-form [name="package_interest"]') return packageField;
      if (selector === '#availability-form [name="event_type"]') return eventTypeField;
      if (selector === '#year') return null;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '#inquiry-form, #availability-form, form[data-lead-form]') return [form];
      return [];
    },
    getElementById(id) { return id === 'form-status' ? form.status : null; },
    createElement() { return new FakeStatus(); }
  };

  const nativeSetTimeout = globalThis.setTimeout;
  const nativeClearTimeout = globalThis.clearTimeout;
  const location = {
    pathname: '/',
    search: '?utm_source=google&utm_medium=cpc&utm_campaign=event%0Alaunch&gclid=GCLID-123&gbraid=GBRAID-7&wbraid=WBRAID-9',
    href: 'https://archangelcinema.com/?utm_source=google&utm_medium=cpc&utm_campaign=event%0Alaunch&gclid=GCLID-123&gbraid=GBRAID-7&wbraid=WBRAID-9',
    origin: 'https://archangelcinema.com',
    protocol: 'https:',
    assign(destination) { redirects.push(destination); }
  };
  const window = {
    location,
    localStorage,
    sessionStorage,
    innerHeight: 900,
    scrollY: 0,
    dataLayer: [],
    gtag(...args) { analytics.push(args); },
    addEventListener() {},
    matchMedia() { return { matches: true }; },
    setTimeout(callback, delay) { return nativeSetTimeout(callback, delay >= 12000 ? 5 : delay); },
    clearTimeout(handle) { nativeClearTimeout(handle); },
    requestAnimationFrame(callback) { return nativeSetTimeout(() => callback(Date.now()), 0); },
    getComputedStyle() { return { display: 'block', visibility: 'visible', opacity: '1' }; }
  };

  const fetch = async (endpoint, options) => {
    requests.push({ endpoint, options, payload: Object.fromEntries(options.body) });
    if (response === 'deferred-success') return deferred;
    if (response === 'success') return { ok: true, status: 200 };
    if (response === 'reject') return { ok: false, status: 422 };
    if (response === 'network') throw new Error('offline');
    if (response === 'timeout') {
      return new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        }, { once: true });
      });
    }
    throw new Error(`Unknown response scenario: ${response}`);
  };

  const context = vm.createContext({
    document,
    window,
    fetch,
    FormData: FakeFormData,
    Element: FakeElement,
    HTMLInputElement: class extends FakeElement {},
    Event: FakeEvent,
    URL,
    URLSearchParams,
    AbortController,
    console: { warn(...args) { warnings.push(args); } },
    performance: { now: () => Date.now() },
    setTimeout: window.setTimeout,
    clearTimeout: window.clearTimeout
  });
  vm.runInContext(script, context, { filename: 'main.js' });

  const submitListener = form.listeners.get('submit')?.[0]?.listener;
  assert.equal(typeof submitListener, 'function', 'main.js must attach a submit handler');
  const submit = () => submitListener.call(form, new FakeEvent('submit'));
  const click = (target) => documentListeners.get('click')?.({ target });
  const resolveSuccess = () => resolveDeferred({ ok: true, status: 200 });
  return { analytics, click, eventTypeField, form, localStorage, packageField, redirects, requests, resolveSuccess, sessionStorage, submit, warnings };
};

const eventsNamed = (harness, eventName) => harness.analytics.filter((entry) => entry[0] === 'event' && entry[1] === eventName);

const run = async () => {
  const invalid = makeHarness({ valid: false });
  await invalid.submit();
  assert.equal(invalid.requests.length, 0, 'invalid form must not send a request');
  assert.equal(eventsNamed(invalid, 'generate_lead').length, 0, 'invalid form must not count a lead');
  assert.equal(invalid.form.reportCount, 1, 'invalid form must invoke native validation');
  assert.equal(invalid.form.status.textContent, 'Please complete the required fields.');

  const success = makeHarness({ response: 'deferred-success' });
  const firstSubmit = success.submit();
  const duplicateSubmit = success.submit();
  await duplicateSubmit;
  assert.equal(success.requests.length, 1, 'double submit must create only one request');
  assert.equal(success.form.dataset.submitting, 'true', 'form stays locked during the request');
  assert.equal(success.form.button.disabled, true, 'submit button stays disabled during the request');
  success.resolveSuccess();
  await firstSubmit;
  assert.equal(eventsNamed(success, 'generate_lead').length, 1, 'successful response must count exactly one lead');
  assert.equal(eventsNamed(success, 'lead_form_attempt').length, 1, 'successful response must have one attempt');
  assert.equal(eventsNamed(success, 'event_form_start').length, 1, 'form start must be deduplicated');
  assert.equal(success.form.resetCount, 1, 'successful form must reset');
  assert.equal(success.form.dataset.submitting, undefined, 'success must release the submission lock');
  assert.equal(success.form.button.disabled, false, 'success must restore the submit button');
  assert.deepEqual(success.redirects, ['/thank-you/'], 'success must use the allowlisted thank-you redirect');
  assert.equal(success.requests[0].endpoint, 'https://formspree.io/f/maqrwpqr');
  assert.equal(success.requests[0].options.method, 'POST');
  assert.equal(success.requests[0].options.headers.Accept, 'application/json');
  const payload = success.requests[0].payload;
  assert.equal(payload.form_context, 'homepage_availability');
  assert.equal(payload.source_page, '/');
  assert.equal(payload.first_touch_utm_source, 'trusted_referral');
  assert.equal(payload.first_touch_utm_campaign, 'prior_campaign');
  assert.equal(payload.last_touch_utm_source, 'google');
  assert.equal(payload.last_touch_utm_medium, 'cpc');
  assert.equal(payload.last_touch_utm_campaign, 'event launch', 'control characters must be normalized');
  assert.equal(payload.gclid, 'GCLID-123');
  assert.equal(payload.gbraid, 'GBRAID-7');
  assert.equal(payload.wbraid, 'WBRAID-9');
  assert.equal(payload.initial_landing_page, '/proof/');
  assert.equal(payload.initial_referrer, 'https://partner.example/referral');
  assert.match(payload.last_landing_page, /^\/\?utm_source=google/);
  assert.equal(payload.last_referrer, 'https://google.com/search?q=event+video');
  const confirmation = JSON.parse(success.sessionStorage.getItem('archangel_event_lead_confirmation_v1'));
  assert.equal(confirmation.source_page, '/');
  assert.ok(confirmation.expires_at > confirmation.confirmed_at);

  const analyticsJson = JSON.stringify(success.analytics);
  for (const pii of ['QA Person', 'qa.person@example.com', '+1 202 555 0100', 'Alexandria, VA']) {
    assert.ok(!analyticsJson.includes(pii), `analytics must not contain PII: ${pii}`);
  }

  const reject = makeHarness({ response: 'reject' });
  await reject.submit();
  assert.equal(eventsNamed(reject, 'generate_lead').length, 0, '422 response must not count a lead');
  assert.equal(eventsNamed(reject, 'lead_form_error')[0][2].error_type, 'formspree_rejection');
  assert.equal(eventsNamed(reject, 'lead_form_error')[0][2].http_status, 422);
  assert.equal(reject.redirects.length, 0);
  assert.equal(reject.form.button.disabled, false);

  const network = makeHarness({ response: 'network' });
  await network.submit();
  assert.equal(eventsNamed(network, 'generate_lead').length, 0, 'network error must not count a lead');
  assert.equal(eventsNamed(network, 'lead_form_error')[0][2].error_type, 'network');
  assert.equal(network.redirects.length, 0);

  const timeout = makeHarness({ response: 'timeout' });
  await timeout.submit();
  assert.equal(eventsNamed(timeout, 'generate_lead').length, 0, 'timeout must not count a lead');
  assert.equal(eventsNamed(timeout, 'lead_form_error')[0][2].error_type, 'timeout');
  assert.match(timeout.form.status.textContent, /timed out/i);
  assert.equal(timeout.form.button.disabled, false);

  const preselection = makeHarness();
  class FakeLink extends FakeElement {
    constructor(dataset) {
      super();
      this.dataset = dataset;
      this.href = 'https://archangelcinema.com/#availability';
      this.attributes.set('href', '#availability');
      this.attributes.set('data-event-cta', '');
    }
    closest(selector) { return selector === 'a[href]' ? this : null; }
  }
  preselection.click(new FakeLink({
    ctaLocation: 'qa_card',
    packageInterest: 'Legacy Event Collection',
    eventTypeChoice: 'Live performance'
  }));
  assert.equal(preselection.packageField.value, 'Legacy Event Collection');
  assert.equal(preselection.eventTypeField.value, 'Live performance');
  const ctaEvent = eventsNamed(preselection, 'event_cta_click')[0];
  assert.equal(ctaEvent[2].cta_location, 'qa_card');
  assert.equal(ctaEvent[2].destination, '/#availability');

  console.log('PASS invalid form: no request, native validation, no conversion');
  console.log('PASS success: one request, duplicate locked, generate_lead exactly once, safe redirect');
  console.log('PASS attribution: first/last UTM + gclid/gbraid/wbraid in Formspree payload');
  console.log('PASS analytics: no form PII in GA event parameters');
  console.log('PASS reject/network/timeout: error telemetry, no conversion, no redirect, controls restored');
  console.log('PASS CTA preselection: package and event choices populate the availability form');
};

await run();
