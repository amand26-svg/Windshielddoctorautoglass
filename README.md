# Windshield Doctor Auto Glass

Complete, responsive, multi-page static website for the Sarnia shop. No framework,
installation, paid theme or build process is required. Open `index.html` to browse.

## Included pages

- Home — `index.html`
- Services — `services.html`
- Windshield repair — `windshield-repair.html`
- Windshield replacement — `windshield-replacement.html`
- Side and rear glass — `side-rear-glass.html`
- About — `about.html`
- FAQs — `faq.html`
- Contact and quote request — `contact.html`
- Privacy — `privacy.html`
- Photo credits — `photo-credits.html`
- Human-readable sitemap — `sitemap.html`

## Preview

1. Extract the ZIP first; do not browse from inside the compressed folder.
2. Open `windshield-doctor/index.html` in your browser.
3. Keep the `assets` folder alongside the HTML files.

For a preview using a web server, run `python -m http.server 8080` inside this
folder, then open http://localhost:8080. The website itself does not need Python.

## Contact and quote behaviour (Vercel + Resend)

- Call buttons use `tel:+12265264555`.
- Direct quote emails go to **info.Windshielddoctorautoglass@gmail.com** once Resend is configured.
- The form now includes an **optional VIN** input (valid 17-character VIN when filled), plus customer, service, vehicle and damage details.
- Submissions go through the Vercel Function `api/quote.mjs`, which sends mail using Resend. The Resend key is **never** sent to browsers or bundled in site assets.
- **Before deployment:** follow **[VERCEL-EMAIL-SETUP.md](VERCEL-EMAIL-SETUP.md)** to configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in Vercel. Without that configuration the direct email send does not work and shows a fallback message.
- The site displays a confirmation only after Resend accepts the request; no appointment is automatically booked.
- Failed automatic sends provide **Open email app** and **Copy message** options. Photos can be shared separately by email, not through the form.
- Directions open Google Maps for 523 Vidal Street South, Sarnia, ON N7T 2V7.
- The interactive map is loaded only after selecting **Load map**.

## Publish on your own hosting

For Vercel, deploy the **entire `windshield-doctor/` folder** (including `api/quote.mjs`) as the project root. Follow **VERCEL-EMAIL-SETUP.md** for email integration. For conventional static hosting only, upload the HTML files, `assets/`, `robots.txt` and any generated `sitemap.xml` (automatic sending will not be available). `index.html`
must be at the public root. Use HTTPS. No npm command or build output is needed.

The HTML and images work on conventional static hosts. The **automatic quote emailing requires Vercel Functions (or another compatible server environment)**. On Vercel, leave the build command blank and use the website root as the project root. You do not need to upload `tools/`, `pages.json`, this README,
`ASSET-SOURCES.md`, or `assets/originals/` to serve the site.

## Domain and Sarnia SEO

Every page already contains a unique title, description, visible local business
information and relevant internal links. Business structured data uses the
supplied phone, email and address. Service pages contain Service schema; the FAQ
page contains matching FAQ schema. Search engines decide eligibility and rankings.

No domain was supplied, so the website does not pretend to own a guessed domain.
Once you choose the actual domain, run this once from the website folder:

```sh
python tools/configure-seo.py https://your-real-domain.ca
```

This adds canonical URLs, absolute social-image URLs, business URLs, `og:url`, a
valid XML sitemap and the sitemap line in `robots.txt`. The script can be run
again if the domain changes. If you cannot run Python, ask the website developer
to run this step before uploading the files.

After launch, submit the generated sitemap to Google Search Console and keep
the shop's Google Business Profile name, address and phone consistent with this
website. Add verified hours to the website and business profile when available.

## Brand and images

- Client's original 2048 × 684 PNG logo: `assets/images/logo.png`.
- Downloaded HD source photos: `assets/originals/` (1960–2400 pixels wide).
- Responsive WebP versions: `assets/images/` at 640, 1200 and 1920 pixels wide.
- Image attribution and sources: `ASSET-SOURCES.md` and `photo-credits.html`.
- Social-sharing image: `assets/images/social-card.jpg`.
- Red, black and off-white brand colours are defined at the top of
  `assets/styles.css`. Layouts adapt to desktop, tablet and mobile.

Stock images illustrate auto glass work. They do not represent this client's
staff or shop. The site identifies them accordingly. Keep the photo credits,
including the Blue Water Bridge attribution and CC BY-SA 2.0 terms, when reusing
the corresponding image files. HD sources are supplied for this website project,
not for resale as standalone stock photos.

## Owner details to confirm before launch

The business name, email, phone and address match the provided brief. The service
structure is based on the requested auto-glass business and should be reviewed by
the owner. No invented reviews, certifications, years in business, warranties,
prices or insurance partnerships have been added.

Confirm opening hours, exact services, any calibration arrangements and any
mobile service availability with the owner. Current copy directs visitors to
call for availability and does not promise same-day service or insurance billing.

## Accessibility and motion

Includes a skip link, labelled form controls, keyboard focus styles, accessible
mobile navigation, native FAQ disclosures and high-contrast call-to-action buttons.
Reduced-motion preferences turn off reveal effects and transition animations.
Page transitions progressively enhance supported browsers; standard navigation
continues to work elsewhere. Core content, contact links and FAQs work without JS.

## Verification

The updated files were checked for JavaScript syntax and Vercel handler behavior using local automated tests. Live end-to-end sending requires your Resend API key, verified sender domain and Vercel deployment. Source images were inspected.
Live browser rendering was unavailable in the build environment; inspect the
site at desktop and mobile widths and confirm mail-app and map behaviour on the
chosen hosting domain before launch.


### Photo attachments on Contact page
Visitors may add up to 3 optional damage photos. The browser resizes/compresses them as JPEGs (at most about 850 KB each), and `api/quote.mjs` validates them and attaches them directly to the Resend notification. No additional photo-storage service or npm dependency is required. The original image may be up to 20 MB. Some HEIC/HEIF phone pictures need converting to JPG/PNG if the browser cannot decode them. The fallback `mailto:` message cannot automatically include the images; customers must attach those themselves.


## Homepage glass-shatter entrance (new)

The homepage includes a lightweight opening animation (`assets/glass-intro.js`) that
cracks from a central impact and drops the glass shards
to reveal the page. It runs only on the first homepage visit within a browser tab
(session), so customers aren't delayed every time they revisit or navigate.

- To replay during review: visit `index.html?previewIntro=1` (or `/?previewIntro=1`).
- Visitors can click **Skip intro** or press Escape.
- It is skipped automatically for visitors using reduced-motion accessibility settings
  or data-saver mode, and on other website pages.
- No video, animation library, external service, or extra Vercel configuration is needed.
- The main logo PNG has been made transparent to blend into the site's header.

The existing VIN field, up-to-3 photo upload flow and Resend/Vercel email endpoint
are unchanged. See `VERCEL-EMAIL-SETUP.md` for email delivery configuration.


### Final published intro choice

Only the **Classic** glass-shatter animation is included. There are no top-right animation selection buttons, impact-hole variant, or hammer-fix variant. The classic animation runs automatically once per browser session on the homepage, lasts approximately 1.9 seconds, and retains transparent glass, light-blue cracks, a skip button, and reduced-motion/data-saving support. To review it again, add `?previewIntro=1` to the homepage URL.
