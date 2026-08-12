// Mobile navigation toggle
const hamburger = document.getElementById('hamburger');
const mainNav = document.getElementById('mainNav');

hamburger.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});

// Sticky header shadow on scroll + back-to-top button
const siteHeader = document.getElementById('siteHeader');
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
  const scrolled = window.scrollY > 20;
  siteHeader.classList.toggle('scrolled', scrolled);
  backToTop.classList.toggle('visible', window.scrollY > 500);
  updateScrollSpy();
});

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Scroll spy: highlight active nav link
const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.nav-link')];

function updateScrollSpy() {
  const scrollPos = window.scrollY + 140;
  let currentId = sections[0]?.id;
  for (const section of sections) {
    if (section.offsetTop <= scrollPos) currentId = section.id;
  }
  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
  });
}

// Reveal-on-scroll animation
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => revealObserver.observe(el));

// Menu accordion
document.querySelectorAll('.menu-cat-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const cat = btn.closest('.menu-cat');
    const isOpen = cat.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
  });
});

// Spice-level icon badges (adds chili icons next to "(scharf)" / "(leicht scharf)" without removing the text)
const chiliSvg = '<svg class="chili" viewBox="0 0 24 24"><path d="M9 3c3 0 5 2 5 5 0 4-3 6-3 10a2 2 0 0 1-4 0c0-3 2-5 2-8-2 0-4-2-4-5 1.5 0 3-1 4-2z"/><path d="M14 8c2.5 1 4 3.5 4 6.5a2 2 0 0 1-4 0"/></svg>';
document.querySelectorAll('.menu-name').forEach(el => {
  const text = el.textContent;
  let level = 0;
  if (/\(leicht scharf\)/i.test(text)) level = 1;
  else if (/\(scharf\)/i.test(text)) level = 2;
  if (level > 0) {
    const badge = document.createElement('span');
    badge.className = 'spice-badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.innerHTML = chiliSvg.repeat(level);
    el.appendChild(badge);
  }
});

// Menu search/filter
const menuSearch = document.getElementById('menuSearch');
const menuSearchClear = document.getElementById('menuSearchClear');
const menuSearchEmpty = document.getElementById('menuSearchEmpty');
const menuCats = [...document.querySelectorAll('.menu-cat')];

function applyMenuFilter(rawQuery) {
  const q = rawQuery.trim().toLowerCase();
  menuSearchClear.hidden = q === '';
  let anyMatch = false;

  menuCats.forEach((cat, catIndex) => {
    const body = cat.querySelector('.menu-cat-body');
    const rows = [...body.querySelectorAll('.menu-row')];
    let catHasMatch = false;

    rows.forEach(row => {
      const match = q === '' || row.textContent.toLowerCase().includes(q);
      row.style.display = match ? '' : 'none';
      if (match) catHasMatch = true;
    });

    // Hide subheads (and their intro paragraph) when their section has no visible rows
    let currentHeader = null;
    let currentIntro = null;
    let sectionHasMatch = false;
    const closeSection = () => {
      if (currentHeader) {
        currentHeader.style.display = sectionHasMatch ? '' : 'none';
        if (currentIntro) currentIntro.style.display = sectionHasMatch ? '' : 'none';
      }
    };
    [...body.children].forEach(child => {
      if (child.classList.contains('menu-subhead')) {
        closeSection();
        currentHeader = child;
        currentIntro = null;
        sectionHasMatch = false;
      } else if (child.classList.contains('menu-intro')) {
        currentIntro = child;
      } else if (child.classList.contains('menu-row') && child.style.display !== 'none') {
        sectionHasMatch = true;
      }
    });
    closeSection();

    if (q === '') {
      cat.style.display = '';
      const isFirst = catIndex === 0;
      cat.classList.toggle('open', isFirst);
      cat.querySelector('.menu-cat-toggle').setAttribute('aria-expanded', String(isFirst));
    } else {
      cat.style.display = catHasMatch ? '' : 'none';
      if (catHasMatch) {
        cat.classList.add('open');
        cat.querySelector('.menu-cat-toggle').setAttribute('aria-expanded', 'true');
      }
    }
    if (catHasMatch) anyMatch = true;
  });

  menuSearchEmpty.hidden = q === '' || anyMatch;
}

if (menuSearch) {
  menuSearch.addEventListener('input', () => applyMenuFilter(menuSearch.value));
  menuSearchClear.addEventListener('click', () => {
    menuSearch.value = '';
    applyMenuFilter('');
    menuSearch.focus();
  });
}

// Category quick-jump chips
document.querySelectorAll('.menu-jump button').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    if (!target) return;
    if (menuSearch && menuSearch.value) {
      menuSearch.value = '';
      applyMenuFilter('');
    }
    menuCats.forEach(cat => {
      const open = cat === target;
      cat.classList.toggle('open', open);
      cat.querySelector('.menu-cat-toggle').setAttribute('aria-expanded', String(open));
    });
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Opening hours logic
// 0 = Sunday ... 6 = Saturday. Closed Monday; otherwise 11:30-14:00 and 17:00-21:30.
function getOpeningStatus(now = new Date()) {
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const lunchStart = 11 * 60 + 30, lunchEnd = 14 * 60;
  const dinnerStart = 17 * 60, dinnerEnd = 21 * 60 + 30;

  if (day === 1) return { open: false, label: 'Heute Ruhetag (Montag)' };

  if (minutes >= lunchStart && minutes < lunchEnd) {
    return { open: true, label: `Jetzt geöffnet – bis ${formatTime(lunchEnd)} Uhr` };
  }
  if (minutes >= dinnerStart && minutes < dinnerEnd) {
    return { open: true, label: `Jetzt geöffnet – bis ${formatTime(dinnerEnd)} Uhr` };
  }
  if (minutes < lunchStart) {
    return { open: false, label: `Geschlossen – öffnet heute um ${formatTime(lunchStart)} Uhr` };
  }
  if (minutes >= lunchEnd && minutes < dinnerStart) {
    return { open: false, label: `Mittagspause – öffnet um ${formatTime(dinnerStart)} Uhr` };
  }
  return { open: false, label: 'Geschlossen – öffnet morgen' };
}

function formatTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function renderOpeningStatus() {
  const status = getOpeningStatus();

  const statusIndicator = document.getElementById('statusIndicator');
  statusIndicator.textContent = status.label;
  statusIndicator.classList.toggle('open', status.open);
  statusIndicator.classList.toggle('closed', !status.open);

  const badge = document.getElementById('hoursBadge');
  const badgeText = document.getElementById('hoursBadgeText');
  badgeText.textContent = status.label;
  badge.classList.toggle('open', status.open);
  badge.classList.toggle('closed', !status.open);

  const today = new Date().getDay();
  document.querySelectorAll('#hoursTable tr').forEach(row => {
    row.classList.toggle('today', Number(row.dataset.day) === today);
  });
}
renderOpeningStatus();
setInterval(renderOpeningStatus, 60000);

// Gallery lightbox
const galleryGrid = document.getElementById('galleryGrid');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');

if (galleryGrid) {
  galleryGrid.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      lightboxImg.src = item.dataset.full;
      lightboxImg.alt = item.dataset.caption || '';
      lightboxCaption.textContent = item.dataset.caption || '';
      lightbox.classList.add('open');
    });
  });
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightboxImg.src = '';
}
lightboxClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

// Reservation form -> opens mail client with prefilled request
const form = document.getElementById('reservationForm');
const formHint = document.getElementById('formHint');
const RESTAURANT_EMAIL = 'shanghai.stadtroda@gmx.de';

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const name = data.get('name').trim();
  const phone = data.get('phone').trim();
  const date = data.get('date');
  const time = data.get('time');
  const guests = data.get('guests');
  const message = data.get('message').trim();

  const bodyLines = [
    `Name: ${name}`,
    `Telefon: ${phone}`,
    date ? `Datum: ${date}` : null,
    time ? `Uhrzeit: ${time}` : null,
    `Personen: ${guests}`,
    message ? `Nachricht: ${message}` : null
  ].filter(Boolean);

  const subject = encodeURIComponent(`Tischreservierung – ${name}`);
  const body = encodeURIComponent(bodyLines.join('\n'));

  window.location.href = `mailto:${RESTAURANT_EMAIL}?subject=${subject}&body=${body}`;
  formHint.textContent = 'Ihr E-Mail-Programm sollte sich jetzt öffnen. Falls nicht, rufen Sie uns bitte an.';
});

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Initial scroll spy call
updateScrollSpy();
