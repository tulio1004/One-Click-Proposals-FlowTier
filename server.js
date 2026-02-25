/* ============================================
   SERVER.JS — Proposal System Backend
   Express server for FlowTier Proposal Builder
   ============================================ */

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_DIR = path.join(__dirname, 'config');

// Builder credentials
const BUILDER_USER = process.env.BUILDER_USER || 'tulio';
const BUILDER_PASS = process.env.BUILDER_PASS || '25524515Fl0wT13r';

// Stripe keys (set via environment variables)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';

const stripe = STRIPE_SECRET_KEY ? require('stripe')(STRIPE_SECRET_KEY) : null;

// Ensure directories exist
[DATA_DIR, CONFIG_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ============================================
// PERSISTENT CONFIG HELPERS
// ============================================
const WEBHOOK_CONFIG_FILE = path.join(CONFIG_DIR, 'webhook.json');
const TERMS_CONFIG_FILE = path.join(CONFIG_DIR, 'terms.json');
const COUNTER_FILE = path.join(CONFIG_DIR, 'counter.json');

function getWebhookUrl() {
  try {
    if (fs.existsSync(WEBHOOK_CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(WEBHOOK_CONFIG_FILE, 'utf8')).url || '';
    }
  } catch (e) { /* ignore */ }
  return '';
}

function setWebhookUrl(url) {
  fs.writeFileSync(WEBHOOK_CONFIG_FILE, JSON.stringify({ url, updated_at: new Date().toISOString() }, null, 2), 'utf8');
}

// --- Default terms (with {{company_name}} placeholder) ---
const DEFAULT_TERMS = `This Work for Hire Agreement ("Agreement") is made {{date}}, between FlowTier Automation and {{company_name}}.

The parties listed above (known as "Consultant" and "Client") hereby agree to enter into a business relationship whereby Consultant provides technical services consulting in consideration of payment provided by Client, pursuant to the terms of this agreement.

1. Purpose

This technical services agreement outlines the terms and conditions for the provision of technical services consulting by FlowTier ("Consultant") to {{company_name}} ("Client").

2. Agreement Terms

Client agrees to pay Consultant the agreed-upon fees as outlined in the SOW (Scope of Work). Payment terms, including any applicable milestones and payment schedule, shall be specified in the SOW or project plan.

Consultant shall perform the services listed in the SOW. They shall do so as an independent contractor and not as an employee or representative of the Client. Consultant shall be responsible for all taxes, insurance, and other liabilities associated with their status as independent contractors.

3. Monthly Subscription

Client agrees to pay a monthly subscription fee for applicable AI services as set forth in the applicable Order Form or Invoice. The monthly subscription covers ongoing operation, monitoring, and maintenance of the system.

FlowTier will perform daily operational checks to confirm the system is running as intended and will provide routine support, adjustments, and tuning during standard support hours, Monday through Friday, 10:00 AM to 5:00 PM (Eastern Time), excluding holidays. Simple adjustments may be completed the same business day when feasible; however, more complex changes, troubleshooting, or revisions may require additional time depending on scope, testing needs, and scheduling.

4. Cancellation

There is no long-term commitment required for the monthly subscription. Client may cancel the service at any time by providing written notice. Cancellation will become effective at the end of the then-current billing period, and no further monthly subscription fees will be charged after the effective cancellation date. Fees already paid are non-refundable unless otherwise expressly stated in this Agreement.

5. System Buy Out

At any time during the subscription, Client may elect to purchase ("Buy Out") the system implementation and assume ownership of the configuration and related assets created specifically for Client's deployment, subject to the terms of this Agreement. The Buy-Out fee shall be equal to ten (10) times the then-current monthly subscription fee.

The Buy-Out fee may be paid either (a) in a single payment, or (b) split into up to three (3) equal monthly payments. Ownership transfer will occur only after the Buy-Out fee is paid in full. Daily maintenance and on-demand adjustments will no longer be provided after the Buy-Out and remain the responsibility of Client.

6. Confidentiality

Consultant acknowledges that, from time to time, they will have access to confidential or proprietary information related to Client's business. Consultant agrees to maintain complete discretion and confidentiality regarding this information, and to refrain from disclosing this information to third parties without prior written consent from Client.

7. Amendments

This agreement shall represent the full scope of terms between Consultant and Client related to the services described therein. Any addition or modification to this agreement shall require written approval by both parties.

8. Governance & Dispute Resolution

The terms of this agreement shall be governed according to the laws of Massachusetts, USA. Any disputes or legal proceedings shall be filed and resolved through a neutral arbitrator located in Massachusetts, USA.

If Consultant and Client should enter into a dispute, both parties agree that the prevailing party shall have their entire legal fees, including attorney's fees, reimbursed by the opposite party.

9. Electronic Signature Consent

By providing an electronic signature below, the client consents to the use of electronic signatures and agrees that such signatures carry the same legal weight as handwritten signatures.`;

function getTermsTemplate() {
  try {
    if (fs.existsSync(TERMS_CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(TERMS_CONFIG_FILE, 'utf8')).template || DEFAULT_TERMS;
    }
  } catch (e) { /* ignore */ }
  return DEFAULT_TERMS;
}

function setTermsTemplate(template) {
  fs.writeFileSync(TERMS_CONFIG_FILE, JSON.stringify({ template, updated_at: new Date().toISOString() }, null, 2), 'utf8');
}

// --- Proposal ID counter ---
function getCounter() {
  try {
    if (fs.existsSync(COUNTER_FILE)) {
      return JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return { year: new Date().getFullYear(), count: 0 };
}

function incrementCounter() {
  const counter = getCounter();
  const currentYear = new Date().getFullYear();
  if (counter.year !== currentYear) {
    counter.year = currentYear;
    counter.count = 0;
  }
  counter.count += 1;
  fs.writeFileSync(COUNTER_FILE, JSON.stringify(counter, null, 2), 'utf8');
  const yy = String(currentYear).slice(-2);
  const num = String(counter.count).padStart(2, '0');
  return `FT${yy}P${num}`;
}

function peekNextId() {
  const counter = getCounter();
  const currentYear = new Date().getFullYear();
  const year = counter.year === currentYear ? currentYear : currentYear;
  const count = counter.year === currentYear ? counter.count + 1 : 1;
  const yy = String(year).slice(-2);
  const num = String(count).padStart(2, '0');
  return `FT${yy}P${num}`;
}

// ============================================
// WEBHOOK NOTIFICATION HELPER
// ============================================
async function sendWebhookNotification(eventType, payload) {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    console.log(`[Webhook] No webhook URL configured. Skipping ${eventType} notification.`);
    return null;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'flowtier-proposal-system',
        'X-Event-Type': eventType
      },
      body: JSON.stringify({
        event: eventType,
        timestamp: new Date().toISOString(),
        ...payload
      })
    });

    const text = await response.text();
    console.log(`[Webhook] ${eventType} notification sent. Status: ${response.status}`);
    return { status: response.status, body: text };
  } catch (err) {
    console.error(`[Webhook] Failed to send ${eventType} notification:`, err.message);
    return null;
  }
}

// ============================================
// MIDDLEWARE
// ============================================
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Source, X-Proposal-Id, X-API-Key, X-Event-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const API_KEY = process.env.API_KEY || null;

function requireApiKey(req, res, next) {
  if (!API_KEY) return next();
  const provided = req.headers['x-api-key'] || req.query.api_key;
  if (provided === API_KEY) return next();
  return res.status(401).json({ error: 'Unauthorized. Invalid or missing API key.' });
}

// ============================================
// SESSION-BASED AUTH
// ============================================
const activeSessions = new Map();

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function getTokenFromReq(req) {
  const cookies = req.headers.cookie || '';
  const match = cookies.match(/builder_token=([a-f0-9]+)/);
  return match ? match[1] : null;
}

function isAuthenticated(req) {
  const token = getTokenFromReq(req);
  if (!token) return false;
  const session = activeSessions.get(token);
  if (!session) return false;
  if (Date.now() - session.created > 24 * 60 * 60 * 1000) {
    activeSessions.delete(token);
    return false;
  }
  return true;
}

function requireBuilderAuth(req, res, next) {
  if (isAuthenticated(req)) return next();
  res.redirect('/login');
}

// ============================================
// STATIC FILES
// ============================================
app.use('/static', express.static(path.join(__dirname, 'public')));

// ============================================
// AUTH ROUTES
// ============================================
app.get('/login', (req, res) => {
  if (isAuthenticated(req)) return res.redirect('/');
  res.send(getLoginPageHTML());
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === BUILDER_USER && password === BUILDER_PASS) {
    const token = generateToken();
    activeSessions.set(token, { user: username, created: Date.now() });
    res.setHeader('Set-Cookie', `builder_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
    return res.redirect('/');
  }
  res.send(getLoginPageHTML('Invalid username or password.'));
});

app.get('/logout', (req, res) => {
  const token = getTokenFromReq(req);
  if (token) activeSessions.delete(token);
  res.setHeader('Set-Cookie', 'builder_token=; Path=/; HttpOnly; Max-Age=0');
  res.redirect('/login');
});

// ============================================
// DASHBOARD (root — protected)
// ============================================
app.get('/', requireBuilderAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// ============================================
// BUILDER PAGE (protected)
// ============================================
app.get('/builder', requireBuilderAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'builder.html'));
});

// Edit existing proposal in builder
app.get('/builder/:slug', requireBuilderAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'builder.html'));
});

// ============================================
// DEV CONSOLE (protected)
// ============================================
app.get('/dev', requireBuilderAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dev.html'));
});

// Test webhook endpoint — fires a test payload to the configured webhook URL
app.post('/api/dev/test-webhook', async (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { event_type, payload } = req.body;
  if (!event_type || !payload) {
    return res.status(400).json({ error: 'Missing event_type or payload' });
  }

  const url = getWebhookUrl();
  if (!url) {
    return res.json({ success: false, error: 'No webhook URL configured. Go to Configuration tab to set one.' });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'flowtier-proposal-system',
        'X-Event-Type': event_type,
        'X-Test': 'true'
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    console.log(`[Dev] Test webhook fired: ${event_type} → ${response.status}`);

    return res.json({
      success: response.ok,
      webhook_status: response.status,
      webhook_response: text.substring(0, 500),
      error: response.ok ? null : `Webhook returned ${response.status}`
    });
  } catch (err) {
    console.error(`[Dev] Test webhook error:`, err.message);
    return res.json({
      success: false,
      error: `Failed to reach webhook: ${err.message}`
    });
  }
});

// ============================================
// WEBHOOK CONFIG API (protected)
// ============================================
app.get('/api/webhook-config', (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ url: getWebhookUrl() });
});

app.post('/api/webhook-config', (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
  const { url } = req.body;
  if (typeof url !== 'string') return res.status(400).json({ error: 'URL must be a string' });
  setWebhookUrl(url.trim());
  res.json({ success: true, url: url.trim() });
});

// ============================================
// TERMS API (protected — editable, persistent)
// ============================================
app.get('/api/terms', (req, res) => {
  res.json({ template: getTermsTemplate() });
});

app.post('/api/terms', (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
  const { template } = req.body;
  if (typeof template !== 'string') return res.status(400).json({ error: 'Template must be a string' });
  setTermsTemplate(template);
  res.json({ success: true });
});

// ============================================
// PROPOSAL ID GENERATOR
// ============================================
app.get('/api/generate-id', (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
  const id = incrementCounter();
  res.json({ proposal_id: id });
});

app.get('/api/next-id', (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ next_id: peekNextId() });
});

// ============================================
// STRIPE CONFIG
// ============================================
app.get('/api/stripe-config', (req, res) => {
  res.json({ publishableKey: STRIPE_PUBLISHABLE_KEY });
});

// ============================================
// API: Create / Update proposal
// ============================================
app.post('/api/proposals', (req, res) => {
  try {
    const data = req.body;

    if (!data || !data.slug) {
      return res.status(400).json({ error: 'Missing required field: slug' });
    }

    const slug = sanitizeSlug(data.slug);
    if (!slug) {
      return res.status(400).json({ error: 'Invalid slug format' });
    }

    data.slug = slug;
    data._received_at = new Date().toISOString();
    data._source = req.headers['x-source'] || 'builder';

    // Determine status
    const filePath = path.join(DATA_DIR, `${slug}.json`);
    let isUpdate = false;
    if (fs.existsSync(filePath)) {
      // Preserve existing signature and payment data on update
      try {
        const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (existing.signature) data.signature = existing.signature;
        if (existing.payment) data.payment = existing.payment;
      } catch (e) { /* ignore */ }
      isUpdate = true;
    }

    if (!data.status) {
      data.status = 'pending';
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`[${new Date().toISOString()}] Proposal ${isUpdate ? 'updated' : 'saved'}: ${slug}`);

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'proposals.flowtier.io';
    const proposalUrl = `${protocol}://${host}/${slug}`;

    // Send webhook notification
    sendWebhookNotification(isUpdate ? 'proposal_updated' : 'proposal_created', {
      proposal_url: proposalUrl,
      slug: slug,
      proposal_id: data.proposal_id || '',
      client: {
        name: (data.client && data.client.name) || '',
        company: (data.client && data.client.company) || '',
        email: (data.client && data.client.email) || '',
        phone: (data.client && data.client.phone) || ''
      },
      project_name: (data.project && data.project.name) || '',
      pricing: {
        currency: (data.pricing && data.pricing.currency) || 'usd',
        due_now_cents: (data.pricing && data.pricing.due_now_cents) || 0,
        total_setup_cents: (data.pricing && data.pricing.total_setup_cents) || 0,
        total_monthly_cents: (data.pricing && data.pricing.total_monthly_cents) || 0
      },
      created_date: data.created_date || new Date().toISOString()
    }).catch(err => console.error('[Webhook] Error:', err));

    return res.status(200).json({
      success: true,
      slug: slug,
      url: proposalUrl,
      message: `Proposal ${isUpdate ? 'updated' : 'created'} at /${slug}`
    });
  } catch (err) {
    console.error('Error saving proposal:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// API: Import proposal via JSON (external endpoint)
// ============================================
app.post('/api/import', (req, res) => {
  try {
    const data = req.body;
    if (!data) return res.status(400).json({ error: 'No data provided' });

    // Auto-generate slug if not provided
    if (!data.slug) {
      const company = (data.client && data.client.company) || (data.client && data.client.name) || 'proposal';
      const dateSuffix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      data.slug = sanitizeSlug(company + '-' + dateSuffix);
    }

    const slug = sanitizeSlug(data.slug);
    if (!slug) return res.status(400).json({ error: 'Could not generate valid slug' });

    data.slug = slug;
    data._received_at = new Date().toISOString();
    data._source = req.headers['x-source'] || 'import';
    if (!data.status) data.status = 'pending';

    const filePath = path.join(DATA_DIR, `${slug}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'proposals.flowtier.io';
    const proposalUrl = `${protocol}://${host}/${slug}`;

    console.log(`[${new Date().toISOString()}] Proposal imported: ${slug}`);

    return res.status(200).json({
      success: true,
      slug: slug,
      url: proposalUrl,
      message: `Proposal imported at /${slug}`
    });
  } catch (err) {
    console.error('Error importing proposal:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// API: Get proposal data
// ============================================
app.get('/api/proposals/:slug', (req, res) => {
  const slug = sanitizeSlug(req.params.slug);
  if (!slug) return res.status(400).json({ error: 'Invalid slug' });

  const filePath = path.join(DATA_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Proposal not found' });
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Error reading proposal' });
  }
});

// ============================================
// API: List all proposals (for dashboard)
// ============================================
app.get('/api/proposals', (req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    const proposals = files.map(f => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
        let status = 'pending';
        if (data.payment) status = 'paid';
        else if (data.signature) status = 'signed';

        return {
          slug: data.slug,
          proposal_id: data.proposal_id || '',
          client_name: (data.client && data.client.name) || '',
          client_company: (data.client && data.client.company) || '',
          client_email: (data.client && data.client.email) || '',
          project_name: (data.project && data.project.name) || '',
          created_date: data.created_date || data._received_at || '',
          status: status,
          due_now_cents: (data.pricing && data.pricing.due_now_cents) || 0,
          currency: (data.pricing && data.pricing.currency) || 'usd',
          url: `/${data.slug}`
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    // Sort by date descending
    proposals.sort((a, b) => {
      const da = new Date(a.created_date || 0);
      const db = new Date(b.created_date || 0);
      return db - da;
    });

    return res.json({ proposals });
  } catch (err) {
    return res.status(500).json({ error: 'Error listing proposals' });
  }
});

// ============================================
// API: Delete proposal
// ============================================
app.delete('/api/proposals/:slug', (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
  const slug = sanitizeSlug(req.params.slug);
  if (!slug) return res.status(400).json({ error: 'Invalid slug' });

  const filePath = path.join(DATA_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Proposal not found' });
  }

  try {
    fs.unlinkSync(filePath);
    return res.json({ success: true, message: `Proposal ${slug} deleted` });
  } catch (err) {
    return res.status(500).json({ error: 'Error deleting proposal' });
  }
});

// ============================================
// API: Record signature + webhook notification
// ============================================
app.post('/api/proposals/:slug/sign', (req, res) => {
  const slug = sanitizeSlug(req.params.slug);
  if (!slug) return res.status(400).json({ error: 'Invalid slug' });

  const filePath = path.join(DATA_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Proposal not found' });
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const { name, email, signature_data, signature_type } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    data.signature = {
      name: name.trim(),
      email: email.trim(),
      signature_data: signature_data || null,
      signature_type: signature_type || 'typed',
      signed_at: new Date().toISOString(),
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown'
    };

    data.status = 'signed';
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`[${new Date().toISOString()}] Proposal signed: ${slug} by ${name}`);

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'proposals.flowtier.io';
    const proposalUrl = `${protocol}://${host}/${slug}`;

    sendWebhookNotification('proposal_signed', {
      proposal_url: proposalUrl,
      slug: slug,
      proposal_id: data.proposal_id || '',
      client: {
        name: (data.client && data.client.name) || '',
        company: (data.client && data.client.company) || '',
        email: (data.client && data.client.email) || '',
        phone: (data.client && data.client.phone) || ''
      },
      signature: data.signature,
      project_name: (data.project && data.project.name) || ''
    }).catch(err => console.error('[Webhook] Error:', err));

    return res.json({ success: true, signature: data.signature });
  } catch (err) {
    console.error('Error recording signature:', err);
    return res.status(500).json({ error: 'Error recording signature' });
  }
});

// ============================================
// STRIPE: Create Checkout Session
// ============================================
app.post('/api/proposals/:slug/checkout', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured. Set STRIPE_SECRET_KEY.' });

  const slug = sanitizeSlug(req.params.slug);
  if (!slug) return res.status(400).json({ error: 'Invalid slug' });

  const filePath = path.join(DATA_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Proposal not found' });
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const pricing = data.pricing || {};
    const currency = (pricing.currency || 'usd').toLowerCase();
    const dueNowCents = pricing.due_now_cents || 0;
    const client = data.client || {};
    const project = data.project || {};

    if (dueNowCents <= 0) {
      return res.status(400).json({ error: 'No amount due.' });
    }

    let description = `Proposal: ${project.name || 'Untitled Project'}`;
    if (client.company) description += ` — ${client.company}`;

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'proposals.flowtier.io';
    const baseUrl = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: client.email || undefined,
      line_items: [{
        price_data: {
          currency: currency,
          product_data: {
            name: project.name || 'Proposal Payment',
            description: description
          },
          unit_amount: dueNowCents
        },
        quantity: 1
      }],
      metadata: {
        slug: slug,
        proposal_id: data.proposal_id || '',
        client_name: client.name || '',
        client_company: client.company || ''
      },
      success_url: `${baseUrl}/${slug}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/${slug}?payment=cancelled`
    });

    return res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: 'Failed to create checkout session: ' + err.message });
  }
});

// ============================================
// STRIPE: Verify payment
// ============================================
app.post('/api/proposals/:slug/verify-payment', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured.' });

  const slug = sanitizeSlug(req.params.slug);
  if (!slug) return res.status(400).json({ error: 'Invalid slug' });

  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'Missing session_id' });

  const filePath = path.join(DATA_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Proposal not found' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed', status: session.payment_status });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.payment = {
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent,
      amount_cents: session.amount_total,
      currency: session.currency,
      status: session.payment_status,
      customer_email: session.customer_email || (session.customer_details && session.customer_details.email) || '',
      paid_at: new Date().toISOString()
    };
    data.status = 'paid';

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`[${new Date().toISOString()}] Payment recorded: ${slug}`);

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'proposals.flowtier.io';
    const proposalUrl = `${protocol}://${host}/${slug}`;

    sendWebhookNotification('proposal_paid', {
      proposal_url: proposalUrl,
      slug: slug,
      proposal_id: data.proposal_id || '',
      client: {
        name: (data.client && data.client.name) || '',
        company: (data.client && data.client.company) || '',
        email: (data.client && data.client.email) || '',
        phone: (data.client && data.client.phone) || ''
      },
      payment: data.payment,
      project_name: (data.project && data.project.name) || ''
    }).catch(err => console.error('[Webhook] Error:', err));

    return res.json({ success: true, payment: data.payment });
  } catch (err) {
    console.error('Payment verification error:', err);
    return res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// ============================================
// SERVE CLIENT PROPOSAL PAGE BY SLUG
// ============================================
app.get('/:slug', (req, res) => {
  const slug = sanitizeSlug(req.params.slug);
  if (!slug) return res.status(400).send('Invalid URL');

  const reserved = ['builder', 'api', 'static', 'favicon.ico', 'robots.txt', 'login', 'logout', 'dashboard', 'dev'];
  if (reserved.includes(slug)) return res.status(404).send('Not found');

  const filePath = path.join(DATA_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
  }

  res.sendFile(path.join(__dirname, 'public', 'proposal.html'));
});

// ============================================
// HELPERS
// ============================================
function sanitizeSlug(slug) {
  if (!slug || typeof slug !== 'string') return null;
  const clean = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (clean.length < 1 || clean.length > 100) return null;
  return clean;
}

function getLoginPageHTML(error) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login — FlowTier Proposals</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/static/index.css">
</head>
<body>
  <div class="login-page">
    <div class="login-card">
      <img src="/static/images/logo.webp" alt="FlowTier" class="login-logo">
      <h2>Proposal Builder</h2>
      ${error ? '<div class="login-error">' + error + '</div>' : ''}
      <form method="POST" action="/login">
        <div class="form-group">
          <label for="username">Username</label>
          <input type="text" id="username" name="username" required autofocus placeholder="Enter username">
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required placeholder="Enter password">
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;padding:12px;font-size:0.9375rem;margin-top:8px;">Sign In</button>
      </form>
    </div>
  </div>
</body>
</html>`;
}

// ============================================
// START SERVER
// ============================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ┌─────────────────────────────────────────┐
  │  FlowTier Proposal System               │
  │  Running on port ${PORT}                    │
  │                                         │
  │  Dashboard: http://localhost:${PORT}/        │
  │  Builder:   http://localhost:${PORT}/builder  │
  │  API:       http://localhost:${PORT}/api/...  │
  │  Proposals: http://localhost:${PORT}/:slug   │
  └─────────────────────────────────────────┘
  `);
});
