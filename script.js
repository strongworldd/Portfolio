// ===========================
// script.js (anti-saccade avec inkLock)
// ===========================

// Menu mobile
const menuBtn  = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');
menuBtn?.addEventListener('click', () => {
  const isOpen = getComputedStyle(navLinks).display !== 'none';
  navLinks.style.display = isOpen ? 'none' : 'flex';
});

// Smooth scroll avec offset
const headerHeight = document.querySelector('.nav')?.offsetHeight || 0;
document.querySelectorAll('.nav-center .nav-link').forEach(a => {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if (!href?.startsWith('#')) return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (!target) return;

    // Verrouille l’encre sur le lien cliqué pour éviter la saccade pendant le scroll doux
    lockInk(a);

    const y = target.getBoundingClientRect().top + window.scrollY - headerHeight - 10;
    window.scrollTo({ top: y, behavior: 'smooth' });
    if (window.innerWidth <= 980) navLinks.style.display = 'none';
  });
});

// ---------------------------
// Barre bleue sans saccades
// ---------------------------
const center = document.querySelector('.nav-center');
const links  = [...document.querySelectorAll('.nav-center .nav-link')];
const ink    = center?.querySelector('.nav-ink');

function measure(el){
  const c = center.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return { left: r.left - c.left, width: r.width };
}

let ticking = false;
function raf(cb){
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { cb(); ticking = false; });
}

function setInkTo(el, animate = true){
  if (!center || !ink || !el) return;
  const { left, width } = measure(el);
  if (!animate) {
    const old = ink.style.transition;
    ink.style.transition = 'none';
    ink.style.left  = `${left}px`;
    ink.style.width = `${width}px`;
    // force reflow
    void ink.offsetWidth;
    ink.style.transition = old || '';
  } else {
    ink.style.left  = `${left}px`;
    ink.style.width = `${width}px`;
  }
}

function currentSectionLink(){
  const pos = window.scrollY + headerHeight + 20;
  let current = links[0];
  for (const l of links) {
    const sec = document.querySelector(l.getAttribute('href'));
    if (!sec) continue;
    if (sec.offsetTop <= pos) current = l;
  }
  // bas de page => Contact
  if (window.innerHeight + Math.round(window.scrollY) >= document.documentElement.scrollHeight - 2) {
    const contact = links.find(l => l.getAttribute('href') === '#contact');
    if (contact) current = contact;
  }
  return current;
}

// -------------
// Ink lock
// -------------
let inkLock = null; // { link, until }
function lockInk(link, ms = 520){
  inkLock = { link, until: performance.now() + ms };
  // place immédiatement la barre sur la cible
  raf(() => setInkTo(link, true));
}
function resolveActiveLink(){
  // Si verrou actif, on reste sur la cible jusqu’à expiration
  if (inkLock && performance.now() < inkLock.until) {
    return inkLock.link;
  }
  // sinon, on suit le scroll
  return currentSectionLink();
}
function clearInkLockIfExpired(){
  if (inkLock && performance.now() >= inkLock.until) {
    inkLock = null;
  }
}

function updateActive(fromScroll = false){
  clearInkLockIfExpired();
  const active = resolveActiveLink();
  links.forEach(l => l.classList.toggle('active', l === active));
  setInkTo(active, /*animate*/ fromScroll || !!inkLock);
}

// Init après charge (incluant polices)
function initInk(){
  if (!center || !ink || links.length === 0) return;
  setInkTo(links[0], false);
  updateActive(false);
}
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(initInk);
} else {
  window.addEventListener('load', initInk);
}

// rAF pour éviter les saccades
window.addEventListener('resize', () => raf(() => updateActive(false)));
window.addEventListener('scroll',  () => raf(() => updateActive(true)));

// Ajuste aussi au clic (et verrouille déjà fait plus haut)
links.forEach(l => l.addEventListener('click', () => raf(() => setInkTo(l, true))));
