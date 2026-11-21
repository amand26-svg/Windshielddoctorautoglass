/** Windshield Doctor quote endpoint — Vercel Web Handler (no dependencies). */
const SHOP_EMAIL = 'info.Windshielddoctorautoglass@gmail.com';
const SERVICES = new Set([
  'Windshield repair', 'Windshield replacement', 'Side and rear glass',
  'Not sure — I need advice'
]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}
function getString(body, key, limit) {
  const value = body[key];
  if (typeof value !== 'string' || value.length > limit) return null;
  return value.trim();
}

async function handleQuote(request) {
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
    // Vercel can forward the original custom domain through a proxy.
    // Compare the public Host rather than requiring request.url to use the same hostname.
    const origin = request.headers.get('origin');
    if (origin) {
      let originHost;
      try { originHost = new URL(origin).host.toLowerCase(); }
      catch { return json({ error: 'Request not permitted.' }, 403); }
      const hosts = [request.headers.get('x-forwarded-host'), request.headers.get('host'), new URL(request.url).host]
        .filter(Boolean).map(host => host.toLowerCase());
      if (!hosts.includes(originHost)) return json({ error: 'Request not permitted.' }, 403);
    }
    if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) {
      return json({ error: 'Expected JSON request.' }, 415);
    }
    if (Number(request.headers.get('content-length') || 0) > 4000000) {
      return json({ error: 'Request is too large.' }, 413);
    }
    let body;
    try {
      const raw = await request.text();
      if (raw.length > 4000000) return json({ error: 'Request is too large.' }, 413);
      body = JSON.parse(raw);
    } catch {
      return json({ error: 'Invalid form data.' }, 400);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return json({ error: 'Invalid form data.' }, 400);
    }
    // Quietly discard simple bot submissions.
    if (body.website) return json({ success: true });

    const name = getString(body, 'name', 80);
    const phone = getString(body, 'phone', 30);
    const email = getString(body, 'email', 120);
    const service = getString(body, 'service', 60);
    const vehicle = getString(body, 'vehicle', 140);
    const vin = getString(body, 'vin', 17);
    const details = getString(body, 'details', 1500);
    if (!name || !phone || !email || !service || !vehicle || vin === null || details === null ||
        !EMAIL_PATTERN.test(email) || !SERVICES.has(service) ||
        (vin && !VIN_PATTERN.test(vin.toUpperCase()))) {
      return json({ error: 'Please check the required fields and VIN (if supplied).' }, 400);
    }
    // Only accept up to 3 valid JPEG images, encoded by the browser after resizing.
    // The content and byte-size checks are also enforced server-side.
    const photos = body.photos ?? [];
    if (!Array.isArray(photos) || photos.length > 3) {
      return json({ error: 'Maximum of 3 photos per request.' }, 400);
    }
    const attachments = [];
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      if (!photo || typeof photo !== 'object' || Array.isArray(photo) ||
          typeof photo.content !== 'string' || photo.content.length > 1200000 ||
          !/^[A-Za-z0-9+/]+={0,2}$/.test(photo.content)) {
        return json({ error: 'Invalid photo attachment.' }, 400);
      }
      const bytes = Buffer.from(photo.content, 'base64');
      if (bytes.length === 0 || bytes.length > 900000 ||
          bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff ||
          bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9 ||
          bytes.toString('base64') !== photo.content) {
        return json({ error: 'Invalid or oversized JPEG photo.' }, 400);
      }
      attachments.push({ filename: `damage-photo-${i + 1}.jpg`, content: photo.content, content_type: 'image/jpeg' });
    }
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !from) {
      console.error('Quote email delivery is not configured.');
      return json({ error: 'Email sending is not configured yet.' }, 503);
    }

    const lines = [
      'New auto glass quote request', '',
      'Name: ' + name,
      'Phone: ' + phone,
      'Email: ' + email,
      'Service: ' + service,
      'Vehicle: ' + vehicle,
      'VIN: ' + (vin ? vin.toUpperCase() : 'Not provided'),
      'Damage / additional details: ' + (details || 'Not provided'),
      'Damage photos attached: ' + attachments.length, '',
      'Please contact the customer to discuss the next steps.'
    ];
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          from,
          to: [SHOP_EMAIL],
          reply_to: email,
          subject: `New auto glass quote — ${service}`,
          text: lines.join('\n'),
          ...(attachments.length ? { attachments } : {})
        }),
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) {
        let providerError = {};
        try { providerError = await response.json(); } catch { /* non-JSON provider error */ }
        // This appears only in Vercel private function logs, never in the page.
        console.error('Resend rejected a quote email', {
          status: response.status,
          code: providerError.name || 'unknown',
          message: providerError.message || 'No details returned'
        });
        return json({ error: 'Email delivery is temporarily unavailable.' }, 502);
      }
      return json({ success: true });
    } catch (error) {
      console.error('Quote mail API request failed:', error?.name || 'unknown');
      return json({ error: 'Email delivery is temporarily unavailable.' }, 502);
    }
}

// Vercel's current Web Handler contract: api/quote.mjs serves /api/quote.
// A default-exported object with a fetch method receives a standard Request.
export default {
  fetch(request) { return handleQuote(request); }
};
