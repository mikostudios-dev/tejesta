// Local calendar days deliberately follow the visitor's clock and timezone.
window.TejestaDailyHero = (section, options, showOption) => {
  const storageKey = `tejesta-daily-hero-seed-${section.id}`;
  const hash = (text) => {
    let value = 2166136261;
    for (const character of text) {
      value = Math.imul(value ^ character.charCodeAt(0), 16777619);
    }
    return value >>> 0;
  };
  // A deterministic fallback also survives refreshes when storage is blocked.
  let seed = hash(section.id);
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved !== null && /^\d+$/.test(saved)) {
      seed = Number(saved) >>> 0;
    } else {
      const candidate = Math.floor(Math.random() * 4294967296);
      window.localStorage.setItem(storageKey, String(candidate));
      seed = candidate;
    }
  } catch (error) {
    // Keep the stable fallback rather than choosing again on each refresh.
  }

  // Shuffle once per visitor, then walk the order by calendar day. This avoids
  // consecutive repeats, including the wraparound, without storing daily state.
  const order = options.map((option, index) => index);
  let state = seed;
  for (let index = order.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const other = Math.floor((state / 4294967296) * (index + 1));
    [order[index], order[other]] = [order[other], order[index]];
  }

  let timer;
  const refresh = () => {
    window.clearTimeout(timer);
    const now = new Date();
    // UTC encodes the local date here; elapsed UTC hours do not define the day.
    const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
    const index = order[((day + seed) % order.length + order.length) % order.length];
    showOption(options[index]);
    section.classList.add('is-ready');
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    // Recheck the clock at least every minute to handle timezone/clock changes.
    timer = window.setTimeout(refresh, Math.min(60000, Math.max(1, midnight - now)));
  };
  const resume = () => {
    if (!document.hidden) refresh();
  };
  document.addEventListener('visibilitychange', resume);
  window.addEventListener('pageshow', refresh);
  window.addEventListener('focus', refresh);
  refresh();
};
