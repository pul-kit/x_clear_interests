(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Try multiple “checkbox” representations:
  // 1) Native input checkbox
  // 2) ARIA checkbox (common in React UIs)
  // 3) Any element that advertises checked state via aria-checked
  const getChecked = () => [
    ...document.querySelectorAll('input[type="checkbox"]:checked'),
    ...document.querySelectorAll('[role="checkbox"][aria-checked="true"]'),
    ...document.querySelectorAll('[aria-checked="true"]'),
  ];

  // Click in the most reliable place:
  // - if it's an input, click its closest label/container
  // - if it's aria checkbox, click itself
  const clickToUncheck = (el) => {
    // If it's a native input, clicking it may be blocked; try label/container
    if (el.matches?.('input[type="checkbox"]')) {
      const label = el.closest('label');
      if (label) return label.click();
      const container = el.closest('[role="checkbox"]') || el.parentElement;
      return (container || el).click();
    }

    // ARIA checkbox / other element
    const roleBox = el.matches?.('[role="checkbox"]') ? el : el.closest?.('[role="checkbox"]');
    return (roleBox || el).click();
  };

  // Find a sensible scroll container
  const getScrollContainer = () => {
    // Prefer main/section-like scrollers first
    const candidates = [
      document.querySelector('main'),
      document.querySelector('[role="main"]'),
      ...document.querySelectorAll('div, section'),
    ].filter(Boolean);

    // pick first element that actually scrolls
    return candidates.find(el => {
      const cs = getComputedStyle(el);
      const scrollY = cs.overflowY;
      return (scrollY === 'auto' || scrollY === 'scroll') && el.scrollHeight > el.clientHeight + 50;
    }) || document.scrollingElement || document.documentElement;
  };

  const scroller = getScrollContainer();

  console.log('Scroller:', scroller);

  // Loop: uncheck visible ones, scroll, repeat
  let totalUnchecks = 0;
  let stablePasses = 0;

  for (let pass = 0; pass < 80; pass++) {
    const checkedNow = getChecked();

    // De-dupe elements (some selectors overlap)
    const uniq = Array.from(new Set(checkedNow));

    if (uniq.length === 0) {
      stablePasses++;
    } else {
      stablePasses = 0;
      for (const el of uniq) {
        try {
          clickToUncheck(el);
          totalUnchecks++;
          // small delay helps React state updates
          await sleep(25);
        } catch (e) {}
      }
    }

    // If we’ve seen “nothing to uncheck” for a few passes, stop
    if (stablePasses >= 4) break;

    // Scroll to reveal more (virtualized lists)
    scroller.scrollBy(0, Math.max(300, scroller.clientHeight * 0.8));
    await sleep(200);
  }

  console.log(`Done. Click attempts: ${totalUnchecks}`);
  console.log('Remaining checked (native):', document.querySelectorAll('input[type="checkbox"]:checked').length);
  console.log('Remaining checked (aria):', document.querySelectorAll('[role="checkbox"][aria-checked="true"]').length);
})();
