const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const leadForms = [...new Set(document.querySelectorAll('#inquiry-form, #availability-form, form[data-lead-form]'))];
const mobileCta = document.querySelector('.mobile-cta');
const floatingCtaZones = document.querySelectorAll('[data-floating-cta-zone], video[controls]');
const activeFloatingCtaZones = new Set();
const trackEvent = (name, parameters = {}) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, parameters);
    return;
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...parameters });
};

const attributionKeys = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'gbraid',
  'wbraid'
];
const attributionStorageKeys = {
  first: 'archangel_first_touch_v1',
  last: 'archangel_last_touch_v1'
};
const inMemoryStorage = new Map();
const getBrowserStorage = (storageName) => {
  try {
    return window[storageName];
  } catch {
    return null;
  }
};
const localStore = getBrowserStorage('localStorage');
const sessionStore = getBrowserStorage('sessionStorage');
const readStoredJson = (storage, key) => {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return inMemoryStorage.get(key) || null;
  }
};
const writeStoredJson = (storage, key, value) => {
  inMemoryStorage.set(key, value);
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private browsing or hardened webviews.
  }
};
const cleanAttributionValue = (value, maximumLength = 500) => String(value || '')
  .trim()
  .replace(/[\r\n\t]+/g, ' ')
  .slice(0, maximumLength);
const currentLandingPage = `${window.location.pathname || '/'}${window.location.search || ''}`;
const captureAttribution = () => {
  const query = new URLSearchParams(window.location.search);
  const incoming = {};
  attributionKeys.forEach((key) => {
    const value = cleanAttributionValue(query.get(key), 250);
    if (value) incoming[key] = value;
  });

  let firstTouch = readStoredJson(localStore, attributionStorageKeys.first);
  if (!firstTouch || typeof firstTouch !== 'object') {
    firstTouch = {
      ...incoming,
      initial_landing_page: cleanAttributionValue(currentLandingPage, 1000),
      initial_referrer: cleanAttributionValue(document.referrer, 1000),
      captured_at: new Date().toISOString()
    };
    writeStoredJson(localStore, attributionStorageKeys.first, firstTouch);
  }

  const storedSessionTouch = readStoredJson(sessionStore, attributionStorageKeys.last);
  const storedLocalTouch = readStoredJson(localStore, attributionStorageKeys.last);
  const previousLastTouch = storedSessionTouch && typeof storedSessionTouch === 'object'
    ? storedSessionTouch
    : storedLocalTouch && typeof storedLocalTouch === 'object'
      ? storedLocalTouch
      : {};
  const lastTouch = {
    ...previousLastTouch,
    ...incoming,
    last_landing_page: cleanAttributionValue(currentLandingPage, 1000),
    last_referrer: cleanAttributionValue(document.referrer, 1000),
    captured_at: new Date().toISOString()
  };
  writeStoredJson(sessionStore, attributionStorageKeys.last, lastTouch);
  writeStoredJson(localStore, attributionStorageKeys.last, lastTouch);

  return { firstTouch, lastTouch };
};
const attribution = captureAttribution();

const eventDateField = document.querySelector('#availability-form [name="event_date"]');
if (eventDateField && !eventDateField.min) {
  const today = new Date();
  const localYear = today.getFullYear();
  const localMonth = String(today.getMonth() + 1).padStart(2, '0');
  const localDay = String(today.getDate()).padStart(2, '0');
  eventDateField.min = `${localYear}-${localMonth}-${localDay}`;
}

const addAttributionToSubmission = (submission) => {
  attributionKeys.forEach((key) => {
    const firstValue = cleanAttributionValue(attribution.firstTouch?.[key], 250);
    const lastValue = cleanAttributionValue(attribution.lastTouch?.[key], 250);
    submission.set(`first_touch_${key}`, firstValue);
    submission.set(`last_touch_${key}`, lastValue);
    if (lastValue) {
      if (!submission.get(key)) submission.set(key, lastValue);
    }
  });
  const initialLandingPage = cleanAttributionValue(attribution.firstTouch?.initial_landing_page, 1000);
  const initialReferrer = cleanAttributionValue(attribution.firstTouch?.initial_referrer, 1000);
  const lastLandingPage = cleanAttributionValue(attribution.lastTouch?.last_landing_page, 1000);
  const lastReferrer = cleanAttributionValue(attribution.lastTouch?.last_referrer, 1000);
  submission.set('initial_landing_page', initialLandingPage);
  submission.set('initial_referrer', initialReferrer);
  submission.set('last_landing_page', lastLandingPage);
  submission.set('last_referrer', lastReferrer);
};

const safeLinkDestination = (link) => {
  const rawDestination = link.dataset.destination || link.getAttribute('href') || '';
  if (!rawDestination) return 'unknown';
  if (rawDestination.startsWith('#')) return `${window.location.pathname || '/'}${rawDestination}`;
  if (/^tel:/i.test(rawDestination)) return 'phone';
  try {
    const destination = new URL(rawDestination, window.location.href);
    return destination.origin === window.location.origin
      ? `${destination.pathname}${destination.hash}`
      : `${destination.origin}${destination.pathname}`;
  } catch {
    return cleanAttributionValue(rawDestination, 300);
  }
};
const calendarHosts = [
  'cal.com',
  'calendly.com',
  'savvycal.com',
  'tidycal.com',
  'youcanbook.me',
  'acuityscheduling.com',
  'calendar.google.com',
  'meetings.hubspot.com'
];
const getCalendarProvider = (link) => {
  try {
    const destination = new URL(link.href, window.location.href);
    if (destination.protocol !== 'https:') return '';
    const hostname = destination.hostname.toLowerCase().replace(/^www\./, '');
    const recognizedHost = calendarHosts.find((host) => hostname === host || hostname.endsWith(`.${host}`));
    if (recognizedHost) return recognizedHost;
    if (link.hasAttribute('data-book-appointment')) return hostname;
  } catch {
    // Invalid and placeholder URLs are deliberately ignored.
  }
  return '';
};

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const link = target?.closest('a[href]');
  const eventButton = target?.closest('button[data-event-cta], #availability-form button[type="submit"]');

  if (link) {
    const rawHref = link.getAttribute('href') || '';
    const ctaLocation = link.dataset.ctaLocation || 'unspecified';
    if (rawHref.startsWith('#') && rawHref.length > 1) {
      let anchorTarget = null;
      try {
        anchorTarget = document.getElementById(decodeURIComponent(rawHref.slice(1)));
      } catch {
        anchorTarget = null;
      }
      if (anchorTarget && typeof anchorTarget.scrollIntoView === 'function') {
        event.preventDefault();
        anchorTarget.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start'
        });
        if (window.location.hash !== rawHref) window.history?.pushState?.(null, '', rawHref);
      }
    }
    const eventCta = link.hasAttribute('data-event-cta')
      || (/availability/i.test(rawHref) && rawHref.includes('#'));
    if (eventCta) {
      trackEvent('event_cta_click', {
        cta_location: ctaLocation,
        destination: safeLinkDestination(link),
        page_path: window.location.pathname
      });
    }

    if (/^tel:\+?[\d().\s-]{7,}$/i.test(rawHref)) {
      trackEvent('phone_click', {
        cta_location: ctaLocation,
        page_path: window.location.pathname
      });
    }

    const calendarProvider = getCalendarProvider(link);
    if (calendarProvider) {
      trackEvent('book_appointment', {
        calendar_provider: calendarProvider,
        cta_location: ctaLocation,
        page_path: window.location.pathname
      });
    }

  }

  if (eventButton) {
    trackEvent('event_cta_click', {
      cta_location: eventButton.dataset.ctaLocation || 'form',
      destination: eventButton.dataset.destination || 'form_submit',
      page_path: window.location.pathname
    });
  }
});

document.querySelectorAll('video:not([data-scroll-video])').forEach((media) => {
  const videoName = media.dataset.videoName || 'unnamed_video';
  media.addEventListener('play', () => trackEvent('video_start', { page_path: window.location.pathname, video_name: videoName }), { once: true });
  media.addEventListener('ended', () => trackEvent('video_complete', { page_path: window.location.pathname, video_name: videoName }));
});

document.querySelectorAll('[data-proof-link]').forEach((link) => link.addEventListener('click', () => {
  trackEvent('proof_page_click', { page_path: window.location.pathname, link_text: link.textContent.trim() });
}));

document.querySelectorAll('[data-social-proof]').forEach((link) => link.addEventListener('click', () => {
  trackEvent('social_proof_click', { page_path: window.location.pathname, platform: link.dataset.socialProof });
}));

document.querySelectorAll('[data-about-link]').forEach((link) => link.addEventListener('click', () => {
  trackEvent('about_page_click', { page_path: window.location.pathname, link_text: link.textContent.trim() });
}));

const deferredVideos = [...document.querySelectorAll('video source[data-src]')]
  .map((source) => source.closest('video'))
  .filter(Boolean);
const hydrateVideo = (media) => {
  if (media.dataset.sourceReady === 'true') return;
  media.querySelectorAll('source[data-src]').forEach((source) => {
    source.src = source.dataset.src;
    source.removeAttribute('data-src');
  });
  media.dataset.sourceReady = 'true';
  media.load();
};
if ('IntersectionObserver' in window) {
  const mediaObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      hydrateVideo(entry.target);
      mediaObserver.unobserve(entry.target);
    });
  }, { rootMargin: '320px 0px' });
  deferredVideos.forEach((media) => mediaObserver.observe(media));
} else {
  deferredVideos.forEach(hydrateVideo);
}

const updateMobileCta = () => {
  if (!mobileCta) return;
  const trigger = Math.max(320, window.innerHeight * 0.6);
  mobileCta.classList.toggle('is-visible', window.scrollY > trigger && activeFloatingCtaZones.size === 0);
};
window.addEventListener('scroll', updateMobileCta, { passive: true });
window.addEventListener('resize', updateMobileCta);
updateMobileCta();

if (mobileCta && floatingCtaZones.length && 'IntersectionObserver' in window) {
  const floatingCtaObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) activeFloatingCtaZones.add(entry.target);
      else activeFloatingCtaZones.delete(entry.target);
    });
    updateMobileCta();
  }, { threshold: 0.04 });
  floatingCtaZones.forEach((zone) => floatingCtaObserver.observe(zone));
}

const motionAllowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const formCtas = [...document.querySelectorAll('a[href*="#availability"]')]
  .filter((link) => link.matches('.button, .nav-cta, .mobile-cta'));

if (motionAllowed && formCtas.length) {
  const motionClasses = ['cta-bounce', 'cta-tilt', 'cta-pulse', 'cta-glint', 'cta-orbit'];
  let shuffleIndex = 0;
  let shuffleTimer = 0;
  let cleanupTimer = 0;

  const clearCtaMotion = (target) => {
    if (!target) return;
    target.classList.remove('is-cta-shuffling', ...motionClasses);
  };

  const isVisibleCta = (target) => {
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0
      || rect.height <= 0
      || rect.bottom <= 0
      || rect.top >= window.innerHeight
      || target.matches(':hover, :focus-visible')) return false;

    let current = target;
    while (current && current !== document.documentElement) {
      const style = window.getComputedStyle(current);
      if (style.display === 'none'
        || style.visibility === 'hidden'
        || Number(style.opacity) < 0.15) return false;
      current = current.parentElement;
    }

    return true;
  };

  const runCtaShuffle = () => {
    window.clearTimeout(cleanupTimer);
    formCtas.forEach(clearCtaMotion);

    if (!document.hidden) {
      const visibleCtas = formCtas.filter(isVisibleCta);
      if (visibleCtas.length) {
        const target = visibleCtas[shuffleIndex % visibleCtas.length];
        const motion = motionClasses[shuffleIndex % motionClasses.length];
        target.classList.add('is-cta-shuffling', motion);
        cleanupTimer = window.setTimeout(() => clearCtaMotion(target), 1300);
        shuffleIndex += 1;
      }
    }

    const nextDelay = 2550 + (shuffleIndex % 3) * 350;
    shuffleTimer = window.setTimeout(runCtaShuffle, nextDelay);
  };

  formCtas.forEach((target) => {
    target.classList.add('cta-motion-ready');
    target.addEventListener('pointerenter', () => clearCtaMotion(target), { passive: true });
    target.addEventListener('focus', () => clearCtaMotion(target));
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.clearTimeout(shuffleTimer);
      window.clearTimeout(cleanupTimer);
      formCtas.forEach(clearCtaMotion);
    } else {
      window.clearTimeout(shuffleTimer);
      shuffleTimer = window.setTimeout(runCtaShuffle, 900);
    }
  });

  shuffleTimer = window.setTimeout(runCtaShuffle, 850);
}

if (motionAllowed) {
  document.body.classList.add('js-motion');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.scroll-reveal').forEach((item) => revealObserver.observe(item));

  const parallaxItems = [...document.querySelectorAll('[data-parallax]')];
  let parallaxFrame = 0;
  const updateParallax = () => {
    parallaxFrame = 0;
    const viewport = window.innerHeight;
    parallaxItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const speed = Number(item.dataset.parallax) || 0.05;
      const offset = (rect.top + rect.height / 2 - viewport / 2) * speed * -1;
      item.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    });
  };
  const requestParallax = () => {
    if (!parallaxFrame) parallaxFrame = window.requestAnimationFrame(updateParallax);
  };
  window.addEventListener('scroll', requestParallax, { passive: true });
  window.addEventListener('resize', requestParallax);
  requestParallax();
}

const scrollFilm = document.querySelector('[data-scroll-film]');
const filmCopies = scrollFilm ? [...scrollFilm.querySelectorAll('.film-copy')] : [];
const filmTabIndexState = new WeakMap();
const syncFilmCopyAccessibility = (activeStage) => {
  filmCopies.forEach((copy, index) => {
    const active = index === activeStage;
    copy.setAttribute('aria-hidden', String(!active));
    copy.toggleAttribute('inert', !active);
    copy.querySelectorAll('a[href], button, input, select, textarea, [tabindex]').forEach((control) => {
      if (!filmTabIndexState.has(control)) filmTabIndexState.set(control, control.getAttribute('tabindex'));
      if (!active) {
        control.setAttribute('tabindex', '-1');
        return;
      }
      const originalTabIndex = filmTabIndexState.get(control);
      if (originalTabIndex === null) control.removeAttribute('tabindex');
      else control.setAttribute('tabindex', originalTabIndex);
    });
  });
};
if (filmCopies.length) {
  const initialFilmStage = Number.parseInt(scrollFilm.dataset.stage || '0', 10);
  syncFilmCopyAccessibility(Number.isFinite(initialFilmStage) ? initialFilmStage : 0);
}
if (scrollFilm && motionAllowed) {
  const video = scrollFilm.querySelector('[data-scroll-video]');
  const filmNumber = scrollFilm.querySelector('[data-film-number]');
  const filmTime = scrollFilm.querySelector('[data-film-time]');
  const filmDuration = scrollFilm.querySelector('[data-film-duration]');
  let filmFrame = 0;
  let targetProgress = 0;
  let renderedProgress = 0;
  let pendingVideoTime = 0;
  let seekFrame = 0;
  let lastFrameTime = performance.now();

  const formatTime = (seconds) => {
    const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = Math.floor(safeSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const commitVideoSeek = () => {
    seekFrame = 0;
    if (!video?.duration || video.readyState < 1 || video.seeking) return;
    const nextTime = Math.min(video.duration - 0.025, Math.max(0, pendingVideoTime));
    if (Math.abs(video.currentTime - nextTime) < 1 / 40) return;
    video.currentTime = nextTime;
  };

  const scheduleVideoSeek = () => {
    if (!seekFrame) seekFrame = window.requestAnimationFrame(commitVideoSeek);
  };

  const updateFilmStage = (progress) => {
    const stage = progress < 0.2 ? 0 : progress < 0.46 ? 1 : progress < 0.72 ? 2 : 3;
    scrollFilm.dataset.stage = String(stage);
    syncFilmCopyAccessibility(stage);
    if (filmNumber) filmNumber.textContent = String(stage + 1).padStart(2, '0');
  };

  const renderScrollFilm = (now) => {
    const elapsed = Math.min(50, Math.max(8, now - lastFrameTime));
    lastFrameTime = now;
    const delta = targetProgress - renderedProgress;
    const smoothing = 1 - Math.exp(-elapsed / 62);
    renderedProgress += delta * smoothing;
    if (Math.abs(delta) < 0.0004) renderedProgress = targetProgress;

    const reveal = Math.min(1, renderedProgress / 0.14);
    scrollFilm.style.setProperty('--film-progress', renderedProgress.toFixed(4));
    scrollFilm.style.setProperty('--film-reveal', reveal.toFixed(4));
    updateFilmStage(renderedProgress);

    if (video?.duration) {
      pendingVideoTime = Math.min(video.duration - 0.025, video.duration * renderedProgress);
      scheduleVideoSeek();
      if (filmTime) filmTime.textContent = formatTime(pendingVideoTime);
    }

    if (renderedProgress !== targetProgress) {
      filmFrame = window.requestAnimationFrame(renderScrollFilm);
    } else {
      filmFrame = 0;
    }
  };

  const updateScrollFilm = () => {
    const rect = scrollFilm.getBoundingClientRect();
    const track = Math.max(scrollFilm.offsetHeight - window.innerHeight, 1);
    targetProgress = Math.min(1, Math.max(0, -rect.top / track));
    if (!filmFrame) filmFrame = window.requestAnimationFrame(renderScrollFilm);
  };

  const requestFilm = () => {
    updateScrollFilm();
  };

  video?.addEventListener('loadedmetadata', () => {
    video.pause();
    video.currentTime = 0;
    if (filmDuration) filmDuration.textContent = formatTime(video.duration);
    updateScrollFilm();
  });
  video?.addEventListener('seeked', scheduleVideoSeek);
  video?.addEventListener('loadeddata', async () => {
    scrollFilm.classList.add('is-video-ready');
    try {
      await video.play();
      video.pause();
      video.currentTime = Math.min(video.duration * renderedProgress, Math.max(0, video.duration - 0.025));
    } catch {
      // The poster remains a complete fallback when autoplay is restricted.
    }
  }, { once: true });
  video?.load();
  window.addEventListener('scroll', requestFilm, { passive: true });
  window.addEventListener('resize', requestFilm);
  requestFilm();
}

menuToggle?.addEventListener('click', () => {
  const open = header.classList.toggle('menu-open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});

document.querySelectorAll('.site-nav a').forEach((link) => link.addEventListener('click', () => {
  header.classList.remove('menu-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', 'Open menu');
}));

if (menuToggle && header) {
  const closeMenu = (returnFocus = false) => {
    if (!header.classList.contains('menu-open')) return;
    header.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    if (returnFocus) menuToggle.focus({ preventScroll: true });
  };

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu(true);
  });
  document.addEventListener('pointerdown', (event) => {
    if (!header.contains(event.target)) closeMenu();
  });
}

const normalizeWebsite = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, '')}`;
};

const formStartState = new WeakSet();
const markFormStarted = (currentForm) => {
  if (formStartState.has(currentForm)) return;
  formStartState.add(currentForm);
  trackEvent('event_form_start', {
    form_id: currentForm.id || 'lead_form',
    cta_location: currentForm.dataset.ctaLocation || 'form',
    page_path: window.location.pathname
  });
};
const getFormStatus = (currentForm) => {
  const localStatus = currentForm.querySelector('[data-form-status], [aria-live="polite"], [aria-live="assertive"]');
  if (localStatus) return localStatus;
  const describedBy = (currentForm.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
  for (const id of describedBy) {
    const describedStatus = document.getElementById(id);
    if (describedStatus) return describedStatus;
  }
  const expectedIds = currentForm.id === 'availability-form'
    ? ['availability-form-status', 'availability-status', 'form-status']
    : [`${currentForm.id}-status`, 'form-status'];
  for (const id of expectedIds) {
    const expectedStatus = document.getElementById(id);
    if (expectedStatus) return expectedStatus;
  }
  const fallbackStatus = document.createElement('p');
  fallbackStatus.id = currentForm.id ? `${currentForm.id}-status` : 'lead-form-status';
  fallbackStatus.dataset.formStatus = '';
  fallbackStatus.setAttribute('aria-live', 'polite');
  currentForm.append(fallbackStatus);
  return fallbackStatus;
};
const setFormStatus = (statusElement, message, isError = false) => {
  statusElement.textContent = message;
  statusElement.classList.toggle('error', isError);
};
const getSafeSuccessRedirect = (currentForm) => {
  const configuredRedirect = currentForm.dataset.successRedirect
    || (currentForm.id === 'availability-form' ? '/thank-you/' : '');
  if (!configuredRedirect) return '';
  try {
    const destination = new URL(configuredRedirect, window.location.origin);
    if (destination.origin !== window.location.origin) return '';
    if (currentForm.id === 'availability-form' && destination.pathname !== '/thank-you/') return '';
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return '';
  }
};
const saveEventLeadConfirmation = (sourcePage) => {
  writeStoredJson(sessionStore, 'archangel_event_lead_confirmation_v1', {
    confirmed_at: Date.now(),
    expires_at: Date.now() + 30 * 60 * 1000,
    source_page: sourcePage
  });
};

leadForms.forEach((currentForm) => {
  const startHandler = () => markFormStarted(currentForm);
  currentForm.addEventListener('focusin', startHandler, { once: true });
  currentForm.addEventListener('input', startHandler, { once: true });
  currentForm.addEventListener('change', startHandler, { once: true });

  currentForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    markFormStarted(currentForm);
    const currentStatus = getFormStatus(currentForm);
    setFormStatus(currentStatus, '');

    if (!currentForm.checkValidity()) {
      setFormStatus(currentStatus, 'Please complete the required fields.', true);
      currentForm.reportValidity();
      return;
    }

    if (currentForm.dataset.submitting === 'true') return;
    const button = currentForm.querySelector('button[type="submit"], input[type="submit"]');
    if (button?.disabled) return;

    const submission = new FormData(currentForm);
    const website = normalizeWebsite(submission.get('url'));
    if (website) submission.set('url', website);
    else submission.delete('url');
    addAttributionToSubmission(submission);
    submission.set('source_page', window.location.pathname || '/');

    const configuredAction = currentForm.getAttribute('action');
    const endpoint = currentForm.dataset.endpoint || configuredAction;
    if (!endpoint) {
      setFormStatus(currentStatus, 'This preview is not connected yet. Add the Formspree form ID before publishing.', true);
      return;
    }
    if (window.location.protocol === 'file:') {
      setFormStatus(currentStatus, 'This local file preview cannot send forms. Test it on the published site or through a local preview server.', true);
      return;
    }

    const submissionVertical = submission.get('vertical') || '';
    const submissionCtaLocation = currentForm.dataset.ctaLocation || 'form';
    const formId = currentForm.id || 'lead_form';
    const originalButtonMarkup = button?.innerHTML || '';
    const originalButtonValue = button instanceof HTMLInputElement ? button.value : '';
    currentForm.dataset.submitting = 'true';
    if (button) {
      button.disabled = true;
      if (button instanceof HTMLInputElement) button.value = 'Sending...';
      else button.textContent = 'Sending...';
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    let shouldRedirect = '';
    let leadTracked = false;
    trackEvent('lead_form_attempt', {
      page_path: window.location.pathname,
      form_id: formId,
      cta_location: submissionCtaLocation,
      ...(submissionVertical ? { vertical: submissionVertical } : {})
    });

    try {
      const response = await fetch(endpoint, {
        method: (currentForm.method || 'POST').toUpperCase(),
        headers: { Accept: 'application/json' },
        body: submission,
        signal: controller.signal
      });
      if (!response.ok) {
        const requestError = new Error('Request failed');
        requestError.name = 'FormspreeError';
        requestError.status = response.status;
        throw requestError;
      }

      if (!leadTracked) {
        leadTracked = true;
        trackEvent('generate_lead', {
          page_path: window.location.pathname,
          form_id: formId,
          cta_location: submissionCtaLocation,
          ...(submissionVertical ? { vertical: submissionVertical } : {})
        });
      }
      currentForm.reset();
      setFormStatus(currentStatus, currentForm.id === 'availability-form'
        ? 'Your request was received. Taking you to the next step…'
        : 'Received. Expect a practical next step from ArchAngel Cinema.');
      shouldRedirect = getSafeSuccessRedirect(currentForm);
      if (shouldRedirect) saveEventLeadConfirmation(window.location.pathname || '/');
    } catch (error) {
      const errorType = error?.name === 'AbortError'
        ? 'timeout'
        : error?.name === 'FormspreeError'
          ? 'formspree_rejection'
          : 'network';
      trackEvent('lead_form_error', {
        page_path: window.location.pathname,
        form_id: formId,
        cta_location: submissionCtaLocation,
        error_type: errorType,
        ...(submissionVertical ? { vertical: submissionVertical } : {}),
        ...(error?.status ? { http_status: error.status } : {})
      });
      console.warn('Lead form submission failed.', { errorType, httpStatus: error?.status || null });
      setFormStatus(currentStatus, error?.name === 'AbortError'
        ? 'The request timed out. Please try again or email partnerships@archangelcinema.com.'
        : 'The form service could not accept this request. Please try again or email partnerships@archangelcinema.com.', true);
    } finally {
      window.clearTimeout(timeout);
      delete currentForm.dataset.submitting;
      if (button) {
        button.disabled = false;
        if (button instanceof HTMLInputElement) button.value = originalButtonValue;
        else button.innerHTML = originalButtonMarkup;
      }
    }

    if (shouldRedirect) window.location.assign(shouldRedirect);
  });
});

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
