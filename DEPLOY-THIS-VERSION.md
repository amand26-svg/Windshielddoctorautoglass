# Windshield Doctor — Vercel deployment fix

This version fixes the static file layout for Vercel. The site pages, CSS, scripts and images are in `public/`; the Resend serverless function is in `api/`. Deploy the **contents of this folder as the Vercel project root**.

## If deploying using GitHub

1. Extract this archive. In your GitHub repository, `vercel.json`, `public/`, and `api/` must be next to one another at the repository root (not under an extra `windshield-doctor` folder).
2. Push all files and directories (do not upload `index.html` alone).
3. On Vercel, open the project **Settings > Build and Deployment**. Set **Root Directory** to the directory containing `vercel.json`, `public` and `api` (usually `./`).
4. Choose Framework Preset **Other**. Ensure no Build Command override is set, and Output Directory is **public** (the included `vercel.json` sets this as well).
5. Trigger a fresh production deployment.

## If deploying with Vercel CLI

Open a terminal inside the folder that contains `vercel.json` and `public/`, then run `npx vercel --prod`. Select your existing Vercel project.

## What to check after deployment

* Homepage: https://windshielddoctorautoglass.vercel.app/
* CSS: https://windshielddoctorautoglass.vercel.app/assets/styles.css (should show CSS, **not 404**)
* Logo: https://windshielddoctorautoglass.vercel.app/assets/images/logo.png (should show logo)
* Hero photo: https://windshielddoctorautoglass.vercel.app/assets/images/windshield-installation-1200.webp
* Quote page: https://windshielddoctorautoglass.vercel.app/contact.html

## Email

To enable direct quote emails **To:** `info.Windshielddoctorautoglass@gmail.com` and **CC:** `Windshielddoctorautoglass@gmail.com`, set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in Vercel and redeploy the updated source. The FROM address must use the verified domain `windshielddoctorautoglass.com`; both recipients are set in `api/quote.mjs`. All public website email displays and links use `Windshielddoctorautoglass@gmail.com`. Refer to `VERCEL-EMAIL-SETUP.md`.

The site is plain HTML/CSS/JavaScript — it is not a React/Next.js app and has no frontend build step. The homepage includes only the Classic glass-shatter animation.

## Resend and quote function troubleshooting (November 2026)

The quote endpoint now uses Vercel's Web Standard handler (`export default { fetch(request) { ... } }`).

1. Keep `api/quote.mjs`, `public/`, and `vercel.json` together at the **project repository root**.
2. In Vercel, Framework Preset: **Other**; Root Directory: `./`; Output Directory: `public`; Build Command override disabled.
3. Set Production environment variables: `RESEND_API_KEY` (Secret) and `RESEND_FROM_EMAIL` (Config).
4. The sender should be `Windshield Doctor <quotes@windshielddoctorautoglass.com>` on the verified domain.
5. Redeploy **the updated source files**, not only the older deployment. Redeploying a previous build cannot apply these code changes.
6. Open `https://www.windshielddoctorautoglass.com/api/quote` in a browser. Expected JSON: `{"error":"Method not allowed."}` with HTTP 405. This confirms the function route is deployed. A 404 means the function isn't deployed.
7. Submit the form. If it fails, the page now shows the HTTP status. Check Vercel **Logs** for `/api/quote` and Resend **Logs/Emails**.
8. `503` = variables missing; `502` = Resend delivery/API rejection or network issue; `403` = origin mismatch; `400` = validation error.

**Security:** If a Resend key has appeared in a screenshot, rotate the key in Resend and update it in Vercel. Never include the secret in an uploaded website ZIP.
