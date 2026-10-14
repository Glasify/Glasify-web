/* Root only: an explicit language URL always wins. No cookies or storage. */
(async () => {
  if (location.pathname !== '/' && location.pathname !== '/index.html') return;
  const controller = new AbortController();
  let timer;
  let route = 'en';
  try {
    const country = await Promise.race([
      (async () => {
        const response = await fetch('https://get.geojs.io/v1/ip/country', {
          signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store'
        });
        if (!response.ok) throw new Error('Country lookup failed');
        return (await response.text()).trim();
      })(),
      new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('Country lookup timed out')); }, 2500); })
    ]);
    route = new Map([['NO', 'no'], ['SE', 'se'], ['DK', 'dk']]).get(country) || 'en';
  } catch (_) {
    // Network, CORS, provider, timeout and malformed responses all use English.
  } finally {
    clearTimeout(timer);
  }
  location.replace(`/${route}/${location.hash}`);
})();
