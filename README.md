# Glasify coming-soon website

Static, permanently dark coming-soon site. No build dependencies, cookies, analytics, browser-language detection, browser geolocation or local storage.

## Pages and hosting

- `/no/`: Norwegian Bokmål (`lang="nb"`)
- `/se/`: Swedish (`lang="sv"`)
- `/dk/`: Danish (`lang="da"`)
- `/en/`: English

Directory index files support these routes on GitHub Pages, which normally redirects `/no` to `/no/` (likewise for other directories). Deploy the repository root, including `assets`, locale directories, `404.html` and the unchanged `CNAME`. This assumes the existing custom domain at its root, not a GitHub project subpath. No server-side routing or country headers are assumed: GitHub Pages does not provide application logic for country-header redirects.

Only `/` and `/index.html` run the country lookup. NO → `/no/`, SE → `/se/`, DK → `/dk/`; every other country, including FI, → `/en/`. Explicit locale URLs remain selected. The URL hash is retained; query parameters are intentionally dropped. Unknown URLs receive a plain 404 with language links, not app content or affiliate content. There are no additional language pages.

## Country lookup and privacy

The browser requests the documented [GeoJS country-code-only text endpoint](https://www.geojs.io/docs/v1/endpoints/country/): `https://get.geojs.io/v1/ip/country`. The response is only a country code. The provider necessarily receives the visitor's IP and normal connection metadata; this is not an anonymous request. The site neither requests precise location nor stores an IP or country. Fetch omits credentials, suppresses the referrer and bypasses the browser response cache. See [GeoJS privacy policy](https://www.geojs.io/privacy/). Review that provider policy and update the linked Glasify privacy policy before production deployment as appropriate.

A 2.5-second deadline includes fetching and reading the response. Timeout, offline, blocked requests, CORS errors, HTTP errors, invalid responses and unmapped countries all lead to English. VPNs and IP databases can identify the wrong country; the language links always allow correction. There is no proximity-based guess or browser-language fallback. A country lookup occurs on each root visit; direct locale visits avoid it entirely.

The root contains an immediately usable English page and a visible explanation of the lookup. If JavaScript is disabled or fails to load, English content and the language links still work; automatic navigation cannot run. No cookie banner is needed for this implementation because it sets no cookies or storage. External providers and their policies remain separate considerations.

## Content and waitlist

`scripts/build.py` contains all four complete translations and generates committed HTML, including metadata, FAQ, accessibility labels, legal text, form notices and success/error messages. Native language names in the switcher and product/platform names remain consistent. External privacy and Apple pages are outside this repository and may have their own localization.

The existing endpoint and payload are preserved:

```
POST https://glasify-backend.onrender.com/v1/waitlist
Content-Type: application/json
{"email":"person@example.com","platform":"ios"}
```

Android sends `"platform":"android"`. Both selectors belong to the form. Submission disables the button to avoid duplicates, times out after 15 seconds, announces translated status, and preserves the address after errors for retry. JavaScript is required for submission; without it the button stays disabled and a translated explanation appears. No production waitlist submissions were made during testing. Backend availability, CORS configuration, email delivery, duplicate handling and consent/retention policy must be verified by its operator. Android interest collection does not promise an Android release date.

The FAQ covers launch timing/platforms, Apple subscription cancellation, refunds, finding purchases and general support. It links to [Apple cancellation instructions](https://support.apple.com/118428), [refund instructions](https://support.apple.com/118223) and [Apple's refund portal](https://reportaproblem.apple.com/). It distinguishes cancellation from refunds, states that Apple decides eligibility and does not guarantee a refund. General contact remains `contact@glasify.app`.

## Edit and test

Run from the repository root:

```sh
python3 scripts/build.py
node --check assets/redirect.js
node --check assets/waitlist.js
node --test tests/static.test.cjs
git diff --check
python3 -m http.server 8080
```

Open `http://localhost:8080/en/` (or another locale). Python's basic server does not reproduce GitHub Pages custom-404 handling; the deployed host must serve `404.html` with a 404 status for unknown URLs.

Automated checks cover all mappings including Finland, malformed responses, network/HTTP/timeout fallback, no lookup on explicit or unknown routes, locale structure and links, and both platform payloads with success/HTTP/network outcomes. These use mocked requests, not live services. Syntax checks and whitespace checks also pass. No browser layout QA or production host/backend integration test has been performed.

Suggested deployment smoke checks: narrow and wide screens, keyboard focus and radio selection, every language link, root routing with mocked NO/SE/DK/FI and blocked requests, JavaScript disabled, unknown paths, real browser CORS, and an operator-authorized test address for both waitlist platforms. Keep live waitlist testing separate from static tests to avoid unsolicited subscriptions.
