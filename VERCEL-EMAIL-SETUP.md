# Windshield Doctor — Connect Resend to the Vercel contact form

**Contact form primary delivery inbox:** `info.Windshielddoctorautoglass@gmail.com`  
**CC copy of each quote (including photos):** `Windshielddoctorautoglass@gmail.com`  
**Public website contact email:** `Windshielddoctorautoglass@gmail.com`

Both Gmail recipients are configured in `api/quote.mjs` (primary **To** and secondary **CC**). They are not the email address Resend sends **from**. Every successful request includes the full message and attachments for both inboxes; customer replies continue to use the submitted email as `Reply-To`. The manual email-app fallback addresses the public inbox and CCs the internal inbox.

## Before you start

You'll need:
- A Vercel account and this website deployed as a Vercel project.
- A Resend account (you may reuse an existing Resend account).
- **A verified sending domain:** `windshielddoctorautoglass.com` (already verified in your Resend account). A Gmail address and the free `*.vercel.app` website address cannot serve as your Resend sender domain.
- Access to that domain's **DNS settings** (wherever the DNS is hosted, such as your registrar or DNS provider).

## A. Connect a sending domain to Resend

1. Sign in at https://resend.com and open **Domains** from the dashboard.
2. Select **Add Domain** and enter a domain (or subdomain) you **own** and want to send notifications from. Choose a sending-enabled setup if prompted.
3. Resend displays the **DNS records** it needs for that domain, usually including DKIM and SPF/return-path records. Copy the exact record **Type**, **Name/Host**, and **Value/Target** shown in **your** Resend account; don't substitute generic DNS values.
4. Open the DNS management page of the provider controlling your domain's DNS. Add the records as directed. Existing records that handle the domain's incoming mail should not be deleted or changed; if you see an MX record, be sure it is the specifically named record Resend requests for sending/return-path rather than replacing the domain's normal inbound MX records.
5. Save the records. Return to Resend and click **I've added the records** / verify. Wait until the domain is **Verified** for sending. DNS updates may take time to propagate.

**Your verified domain:** `windshielddoctorautoglass.com`. Use this sender: `Windshield Doctor <quotes@windshielddoctorautoglass.com>`. The primary receiving inbox remains `info.Windshielddoctorautoglass@gmail.com`, with `Windshielddoctorautoglass@gmail.com` copied on each request.

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
   | `RESEND_FROM_EMAIL` | `Windshield Doctor <quotes@windshielddoctorautoglass.com>` |

4. Click **Save**. Do not create a `RESEND_TO_EMAIL` variable: both Gmail recipients are already set in the website's server function.
5. Go to **Deployments**, open the most recent deployment, and select **Redeploy**. Existing deployments do not automatically receive newly added environment variables.

## D. Deploy this updated ZIP to fix the quote form

1. Extract this ZIP. At the **repository root**, these items must be siblings: `vercel.json`, `public/` (contains `index.html`, `contact.html` and the website assets), and `api/` (contains `quote.mjs`).
2. Replace your existing site's files in the **same Vercel-connected GitHub repository** with the new files, then commit. Alternatively, run `npx vercel --prod` from the extracted project root and choose the existing project. Do not simply redeploy an old build; it won't contain the corrected endpoint.
3. In Vercel **Settings → Build and Deployment**, use **Other** framework, **Root Directory `./`**, **Output Directory `public`**, with no custom build command.
4. Allow the new production deployment to complete. In Vercel → **Functions**, confirm `/api/quote` appears if that view is available.
5. Opening `https://www.windshielddoctorautoglass.com/api/quote` in a browser should return `{"error":"Method not allowed."}` with HTTP **405**. This is expected and proves the function exists. If it shows 404, the `/api` folder is missing from the deployed project or the root folder is wrong.

## E. Check everything works

1. Visit your deployed website at `/contact.html`.
2. Fill out a **test** quote request with your name, phone, email, service, vehicle, optional VIN, and one optional photo. Click **Send quote request**.
3. Check **both** `info.Windshielddoctorautoglass@gmail.com` (To) and `Windshielddoctorautoglass@gmail.com` (CC), including Spam, for the same quote and photo attachments.
4. If the page reports an HTTP error, note the status number. **404** means the function is missing, **503** means the environment variables are missing for that deployment, and **502** usually means Resend rejected the email or the outbound request failed. Check **Vercel → Logs** for `/api/quote` and **Resend → Logs/Emails** for more details.
5. Open the notification. Reply should go to the **customer's submitted email address**, thanks to its `Reply-To` header.

When configured, the contact form sends a quote notification that includes all submitted details and attaches up to **3 optional damage photos**. The site only reports success when Resend accepts the message for sending; that does **not guarantee** delivery to an inbox. If sending fails, the form offers a manual email-app/copy-message fallback. Photos cannot automatically be included in that fallback and must be attached manually.

**Security tip:** Keep your API key secret. For a public quote form, consider bot protection or rate limiting if you receive spam. Website submissions go from the visitor's browser to `/api/quote`, then Vercel uses the API key server-side to send the notification via Resend.
