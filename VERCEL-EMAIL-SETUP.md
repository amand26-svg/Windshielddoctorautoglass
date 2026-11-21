# Windshield Doctor — Connect Resend to the Vercel contact form

**Contact form delivery inbox:** `info.Windshielddoctorautoglass@gmail.com`

This address is already configured in `api/quote.mjs`. It is the **recipient** of incoming quote requests, not the email address Resend sends **from**. You do not need to create an inbox on a new domain. Keep using Gmail to read and reply to requests.

## Before you start

You'll need:
- A Vercel account and this website deployed as a Vercel project.
- A Resend account (you may reuse an existing Resend account).
- **A domain you control** (for example, `your-business-domain.ca`) so you can verify a sender in Resend. A Gmail address and the free `*.vercel.app` website address cannot serve as your Resend sender domain.
- Access to that domain's **DNS settings** (wherever the DNS is hosted, such as your registrar or DNS provider).

## A. Connect a sending domain to Resend

1. Sign in at https://resend.com and open **Domains** from the dashboard.
2. Select **Add Domain** and enter a domain (or subdomain) you **own** and want to send notifications from. Choose a sending-enabled setup if prompted.
3. Resend displays the **DNS records** it needs for that domain, usually including DKIM and SPF/return-path records. Copy the exact record **Type**, **Name/Host**, and **Value/Target** shown in **your** Resend account; don't substitute generic DNS values.
4. Open the DNS management page of the provider controlling your domain's DNS. Add the records as directed. Existing records that handle the domain's incoming mail should not be deleted or changed; if you see an MX record, be sure it is the specifically named record Resend requests for sending/return-path rather than replacing the domain's normal inbound MX records.
5. Save the records. Return to Resend and click **I've added the records** / verify. Wait until the domain is **Verified** for sending. DNS updates may take time to propagate.

**Important:** The receiving inbox is `info.Windshielddoctorautoglass@gmail.com`, but the sender must be on your verified domain. An example sender **after verifying** `your-business-domain.ca` would be `Windshield Doctor <quotes@your-business-domain.ca>`. This is just an example, not a verified sender configured for your account.

## B. Create a Resend API key

1. In Resend, open **API Keys** > **Create API Key**.
2. Name it something recognizable, such as `Windshield Doctor Vercel`.
3. Choose **Sending access**. If Resend offers domain restrictions, choose the Windshield Doctor sending domain.
4. Copy the generated API key (it starts with `re_`). Keep it private. It must only be entered into Vercel's server-side environment variables; never paste it into the website's HTML/JavaScript or publish it on GitHub.

## C. Add the keys in Vercel

1. Open https://vercel.com/dashboard and choose the **Windshield Doctor** project.
2. Open **Settings** > **Environment Variables**.
3. Add these two variables, assigned to **Production**:

   | Name | Value |
   | ---- | ----- |
   | `RESEND_API_KEY` | The private `re_...` API key copied from Resend |
   | `RESEND_FROM_EMAIL` | `Windshield Doctor <quotes@your-business-domain.ca>` — **replace** `your-business-domain.ca` with the domain you actually verified in Resend |

4. Click **Save**. Do not create a `RESEND_TO_EMAIL` variable: the recipient `info.Windshielddoctorautoglass@gmail.com` is already set in the website's server function.
5. Go to **Deployments**, open the most recent deployment, and select **Redeploy**. Existing deployments do not automatically receive newly added environment variables.

## D. Deploying this ZIP if the website isn't online yet

1. Unzip the download and open the `windshield-doctor` folder. Its `index.html` and `api/` directory must sit at the **root** of the Vercel project.
2. Deploy by adding this folder to a Git repository and importing the repository into Vercel, or use the Vercel CLI. If your repository contains an outer directory, set **Root Directory** in Vercel to `windshield-doctor`.
3. Choose the **Other** framework preset. The website is plain HTML/CSS/JS; no build command or output directory is needed. `api/quote.mjs` runs as a Vercel serverless function.
4. If you haven't already, complete steps A–C above and redeploy.

## E. Check everything works

1. Visit your deployed website at `/contact.html`.
2. Fill out a **test** quote request with your name, phone, email, service, vehicle, optional VIN, and one optional photo. Click **Send quote request**.
3. Check **info.Windshielddoctorautoglass@gmail.com** in Gmail, including the Spam folder.
4. Check **Resend > Emails** for the attempt, including errors if nothing arrives. You may also inspect **Vercel > Logs** for server-function errors.
5. Open the notification. Reply should go to the **customer's submitted email address**, thanks to its `Reply-To` header.

When configured, the contact form sends a quote notification that includes all submitted details and attaches up to **3 optional damage photos**. The site only reports success when Resend accepts the message for sending; that does **not guarantee** delivery to an inbox. If sending fails, the form offers a manual email-app/copy-message fallback. Photos cannot automatically be included in that fallback and must be attached manually.

**Security tip:** Keep your API key secret. For a public quote form, consider bot protection or rate limiting if you receive spam. Website submissions go from the visitor's browser to `/api/quote`, then Vercel uses the API key server-side to send the notification via Resend.
