const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const choices = document.querySelectorAll('.choice');
const vertical = document.querySelector('#vertical');
const form = document.querySelector('#inquiry-form');
const status = document.querySelector('#form-status');
const initialVertical = vertical?.value || 'Dealerships';
const mobileCta = document.querySelector('.mobile-cta');
const floatingCtaZones = document.querySelectorAll('[data-floating-cta-zone], video[controls], .pilot-plan, .detail-cta');
const activeFloatingCtaZones = new Set();
const trackEvent = (name, parameters = {}) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, parameters);
    return;
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...parameters });
};

document.querySelectorAll('a[href*="#start"]').forEach((link) => link.addEventListener('click', () => {
  trackEvent('free_asset_click', { page_path: window.location.pathname, link_text: link.textContent.trim() });
}));

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

const preciseHover = window.matchMedia('(hover: hover) and (pointer: fine)');
const initManagedFlipCards = () => {
  document.querySelectorAll('[data-flip-card]').forEach((card) => {
    if (card.dataset.flipReady === 'true') return;
    const front = card.querySelector('.managed-card-front');
    const back = card.querySelector('.managed-card-back');
    const openButton = front?.querySelector('.managed-card-toggle');
    const closeButton = back?.querySelector('.managed-card-close');
    if (!front || !back || !openButton || !closeButton) return;
    card.dataset.flipReady = 'true';

    const setFaceState = (flipped, focusTarget = null) => {
      const activeFace = flipped ? back : front;
      const inactiveFace = flipped ? front : back;
      card.classList.toggle('is-flipped', flipped);
      openButton.setAttribute('aria-expanded', String(flipped));
      activeFace.setAttribute('aria-hidden', 'false');
      activeFace.removeAttribute('inert');
      if (focusTarget) focusTarget.focus({ preventScroll: true });
      inactiveFace.setAttribute('aria-hidden', 'true');
      inactiveFace.setAttribute('inert', '');
    };

    const closeCard = (returnFocus = false) => {
      card.dataset.pinned = 'false';
      if (card.matches(':hover')) card.dataset.hoverClosed = 'true';
      setFaceState(false, returnFocus ? openButton : null);
    };

    card.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse'
        || !preciseHover.matches
        || window.innerWidth <= 850
        || card.matches(':focus-within')
        || card.dataset.pinned === 'true'
        || card.dataset.hoverClosed === 'true') return;
      setFaceState(true);
    });
    card.addEventListener('pointerleave', (event) => {
      if (event.pointerType !== 'mouse') return;
      delete card.dataset.hoverClosed;
      if (card.dataset.pinned !== 'true' && !card.matches(':focus-within')) setFaceState(false);
    });
    openButton.addEventListener('click', () => {
      card.dataset.pinned = 'true';
      setFaceState(true, closeButton);
      trackEvent('managed_card_open', { service: openButton.getAttribute('aria-controls') });
    });
    closeButton.addEventListener('click', () => closeCard(true));
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !card.classList.contains('is-flipped')) return;
      event.preventDefault();
      closeCard(true);
    });
    card.addEventListener('focusout', () => {
      window.requestAnimationFrame(() => {
        if (card.dataset.pinned !== 'true'
          && !card.matches(':hover')
          && !card.matches(':focus-within')) setFaceState(false);
      });
    });
  });
};
initManagedFlipCards();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initManagedFlipCards, { once: true });

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

const formCtas = [...document.querySelectorAll('a[href*="#start"]')]
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

function selectVertical(value) {
  if (vertical) vertical.value = value;
  choices.forEach((choice) => choice.classList.toggle('active', choice.dataset.value === value));
}

choices.forEach((choice) => choice.addEventListener('click', () => selectVertical(choice.dataset.value)));
document.querySelectorAll('[data-system]').forEach((link) => link.addEventListener('click', () => selectVertical(link.dataset.system)));

document.querySelector('.sound-button')?.addEventListener('click', (event) => {
  event.currentTarget.classList.toggle('playing');
  event.currentTarget.lastChild.textContent = event.currentTarget.classList.contains('playing') ? ' PAUSE' : ' PLAY';
});

const normalizeWebsite = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, '')}`;
};

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.className = '';
  if (!form.checkValidity()) {
    status.textContent = 'Please complete the required fields.';
    status.className = 'error';
    form.reportValidity();
    return;
  }
  const honeypot = form.querySelector('[name="_gotcha"]');
  if (honeypot?.value) {
    form.reset();
    status.textContent = 'Received. We will follow up with the appropriate next step.';
    return;
  }
  const submission = new FormData(form);
  submission.delete('_gotcha');
  const website = normalizeWebsite(submission.get('url'));
  if (website) submission.set('url', website);
  else submission.delete('url');
  const campaign = new URLSearchParams(window.location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((key) => {
    const value = campaign.get(key);
    if (value) submission.set(key, value);
  });
  submission.set('source_page', window.location.pathname || '/');
  const configuredAction = form.getAttribute('action');
  const endpoint = form.dataset.endpoint || configuredAction;
  if (!endpoint) {
    status.textContent = 'This preview is not connected yet. Add the Formspree form ID before publishing.';
    status.className = 'error';
    return;
  }
  if (window.location.protocol === 'file:') {
    status.textContent = 'This local file preview cannot send forms. Test it on the published site or through a local preview server.';
    status.className = 'error';
    return;
  }
  const button = form.querySelector('button[type="submit"]');
  if (button.disabled) return;
  const originalButtonMarkup = button.innerHTML;
  button.disabled = true;
  button.textContent = 'Sending...';
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(endpoint, { method: form.method || 'POST', headers: { Accept: 'application/json' }, body: submission, signal: controller.signal });
    if (!response.ok) throw new Error('Request failed');
    form.reset();
    selectVertical(initialVertical);
    status.textContent = 'Received. Expect a practical next step from ArchAngel Cinema.';
    trackEvent('generate_lead', { page_path: window.location.pathname, vertical: submission.get('vertical') || initialVertical });
  } catch (error) {
    status.textContent = error?.name === 'AbortError'
      ? 'The request timed out. Please try again or email partnerships@archangelcinema.com.'
      : 'The form service could not accept this request. Please try again or email partnerships@archangelcinema.com.';
    status.className = 'error';
  } finally {
    window.clearTimeout(timeout);
    button.disabled = false;
    button.innerHTML = originalButtonMarkup;
  }
});

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
