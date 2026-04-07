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
const TEMPLATES_DIR = path.join(__dirname, 'templates');

// Builder credentials
const BUILDER_USER = process.env.BUILDER_USER || 'tulio';
const BUILDER_PASS = process.env.BUILDER_PASS || '25524515Fl0wT13r';

// Stripe keys (set via environment variables)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';

const stripe = STRIPE_SECRET_KEY ? require('stripe')(STRIPE_SECRET_KEY) : null;

// CRM (Lead Manager) base URL for cross-system integration
const CRM_BASE = process.env.CRM_BASE_URL || 'https://leads.flowtier.io';

// Internal API key for cross-system calls (Lead Manager -> Proposals)
const INTAKE_API_KEY = process.env.INTAKE_API_KEY || 'ft-intake-2026-flowtier';

// Ensure directories exist
[DATA_DIR, CONFIG_DIR, TEMPLATES_DIR].forEach(dir => {
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
// PRICING HELPER — Build clean dollar-based pricing for webhooks
// ============================================
function buildPricingPayload(data) {
  const pricing = data.pricing || {};
  const currency = (pricing.currency || 'usd').toLowerCase();
  const symbols = { usd: '$', eur: '€', gbp: '£', cad: 'CA$', aud: 'A$', brl: 'R$' };
  const sym = symbols[currency] || '$';

  const oneTimeCents = pricing.total_onetime_cents || 0;
  const setupCents = pricing.total_setup_cents || 0;
  const monthlyCents = pricing.total_monthly_cents || 0;
  const dueNowCents = pricing.due_now_cents || 0;
  const totalCents = oneTimeCents + setupCents + monthlyCents;

  function fmt(cents) {
    return sym + (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  return {
    currency: currency.toUpperCase(),
    total: fmt(totalCents),
    total_dollars: parseFloat((totalCents / 100).toFixed(2)),
    one_time: fmt(oneTimeCents),
    one_time_dollars: parseFloat((oneTimeCents / 100).toFixed(2)),
    setup: fmt(setupCents),
    setup_dollars: parseFloat((setupCents / 100).toFixed(2)),
    monthly: fmt(monthlyCents),
    monthly_dollars: parseFloat((monthlyCents / 100).toFixed(2)),
    due_now: fmt(dueNowCents),
    due_now_dollars: parseFloat((dueNowCents / 100).toFixed(2))
  };
}

// CRM LEAD PATCH HELPER (reusable for all lead updates)
// ============================================
async function patchLeadInCRM(leadId, patchBody, label) {
  if (!leadId) return;
  const tag = label || 'CRM Patch';

  try {
    const http = require('http');
    const https = require('https');
    const url = new URL(`${CRM_BASE}/api/leads/${leadId}`);
    const protocol = url.protocol === 'https:' ? https : http;

    const patchData = JSON.stringify(patchBody);

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(patchData),
        'X-Source': 'flowtier-proposal-system'
      }
    };

    await new Promise((resolve, reject) => {
      const req = protocol.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          console.log(`[${tag}] Lead ${leadId}: ${res.statusCode}`);
          resolve(body);
        });
      });
      req.on('error', (err) => {
        console.error(`[${tag}] Failed for lead ${leadId}:`, err.message);
        reject(err);
      });
      req.setTimeout(5000, () => { req.destroy(); reject(new Error('Timeout')); });
      req.write(patchData);
      req.end();
    });
  } catch (err) {
    console.error(`[${tag}] Error for lead ${leadId}:`, err.message);
  }
}

// Convenience wrappers
async function linkProposalToLead(leadId, proposalUrl) {
  return patchLeadInCRM(leadId, { proposal_url: proposalUrl, stage: 'proposal_sent' }, 'CRM Link');
}
async function linkProposalToLeadDraft(leadId, proposalUrl) {
  return patchLeadInCRM(leadId, { proposal_url: proposalUrl }, 'CRM Draft');
}
async function updateLeadStageWon(leadId) {
  return patchLeadInCRM(leadId, { stage: 'won' }, 'CRM Won');
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
  // Return JSON error for API requests, redirect for page requests
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
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

    // Set status based on draft flag
    const isDraftSave = req.query.draft === '1' || req.headers['x-draft'] === '1';
    if (isDraftSave) {
      data.status = data.status === 'signed' || data.status === 'paid' ? data.status : 'draft';
    } else if (!data.status || data.status === 'draft') {
      data.status = 'pending';
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`[${new Date().toISOString()}] Proposal ${isDraftSave ? 'draft saved' : (isUpdate ? 'updated' : 'saved')}: ${slug}`);

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'proposals.flowtier.io';
    const proposalUrl = `${protocol}://${host}/${slug}`;

    if (!isDraftSave) {
      // Send webhook notification (only on send, not on draft save)
      sendWebhookNotification(isUpdate ? 'proposal_updated' : 'proposal_created', {
        proposal_url: proposalUrl,
        slug: slug,
        proposal_id: data.proposal_id || '',
        lead_id: data.lead_id || '',
        ghl_contact_id: data.lead_id || '',
        client: {
          name: (data.client && data.client.name) || '',
          company: (data.client && data.client.company) || '',
          email: (data.client && data.client.email) || '',
          phone: (data.client && data.client.phone) || ''
        },
        project_name: (data.project && data.project.name) || '',
        pricing: buildPricingPayload(data),
        created_date: data.created_date || new Date().toISOString()
      }).catch(err => console.error('[Webhook] Error:', err));

      // Auto-attach proposal to lead in CRM + set stage to proposal_sent
      if (data.lead_id) {
        linkProposalToLead(data.lead_id, proposalUrl, (data.project && data.project.name) || '', (data.client && data.client.name) || '').catch(err => console.error('[CRM Link] Error:', err));
      }
    } else {
      // Draft save: still attach proposal to lead, but do NOT change stage or fire webhook
      if (data.lead_id) {
        linkProposalToLeadDraft(data.lead_id, proposalUrl).catch(err => console.error('[CRM Link Draft] Error:', err));
      }
    }

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
          url: `/${data.slug}`,
          view_count: data.view_count || 0,
          first_viewed_at: data.first_viewed_at || null,
          last_viewed_at: data.last_viewed_at || null
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
app.post('/api/proposals/:slug/sign', async (req, res) => {
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
    const baseUrl = `${protocol}://${host}`;
    const proposalUrl = `${baseUrl}/${slug}`;

    // Generate Stripe payment link if there's an amount due
    let paymentLink = null;
    const pricing = data.pricing || {};
    const dueNowCents = pricing.due_now_cents || 0;

    if (stripe && dueNowCents > 0) {
      try {
        const client = data.client || {};
        const project = data.project || {};
        const currency = (pricing.currency || 'usd').toLowerCase();
        let description = `Proposal: ${project.name || 'Untitled Project'}`;
        if (client.company) description += ` — ${client.company}`;

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

        paymentLink = session.url;
        console.log(`[${new Date().toISOString()}] Payment link generated for signed proposal: ${slug}`);
      } catch (stripeErr) {
        console.error('[Stripe] Error generating payment link on sign:', stripeErr.message);
      }
    }

    sendWebhookNotification('proposal_signed', {
      proposal_url: proposalUrl,
      slug: slug,
      proposal_id: data.proposal_id || '',
      lead_id: data.lead_id || '',
      ghl_contact_id: data.lead_id || '',
      client: {
        name: (data.client && data.client.name) || '',
        company: (data.client && data.client.company) || '',
        email: (data.client && data.client.email) || '',
        phone: (data.client && data.client.phone) || ''
      },
      signature: data.signature,
      project_name: (data.project && data.project.name) || '',
      payment_link: paymentLink,
      pricing: buildPricingPayload(data)
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
      lead_id: data.lead_id || '',
      ghl_contact_id: data.lead_id || '',
      client: {
        name: (data.client && data.client.name) || '',
        company: (data.client && data.client.company) || '',
        email: (data.client && data.client.email) || '',
        phone: (data.client && data.client.phone) || ''
      },
      payment: data.payment,
      project_name: (data.project && data.project.name) || '',
      pricing: buildPricingPayload(data)
    }).catch(err => console.error('[Webhook] Error:', err));

    // Auto-change lead stage to 'won' on payment
    if (data.lead_id) {
      updateLeadStageWon(data.lead_id).catch(err => console.error('[CRM Won] Error:', err));
    }

    return res.json({ success: true, payment: data.payment });
  } catch (err) {
    console.error('Payment verification error:', err);
    return res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// ============================================
// PROPOSAL VIEW TRACKING
// ============================================
app.post('/api/proposals/:slug/track-view', (req, res) => {
  const slug = sanitizeSlug(req.params.slug);
  if (!slug) return res.status(400).json({ error: 'Invalid slug' });

  // Skip tracking for authenticated (logged-in) users
  if (isAuthenticated(req)) {
    return res.json({ tracked: false, reason: 'authenticated_user' });
  }

  const filePath = path.join(DATA_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Proposal not found' });
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Initialize views array if it doesn't exist
    if (!data.views) data.views = [];

    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || '';
    const cleanIp = ip.split(',')[0].trim();
    const ua = req.headers['user-agent'] || '';
    const now = new Date().toISOString();

    // Deduplicate: don't record if same IP viewed within the last 30 minutes
    const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
    const recentFromSameIp = data.views.find(v =>
      v.ip === cleanIp && new Date(v.timestamp).getTime() > thirtyMinAgo
    );

    if (recentFromSameIp) {
      return res.json({ tracked: false, reason: 'duplicate_within_30min' });
    }

    data.views.push({
      timestamp: now,
      ip: cleanIp,
      user_agent: ua.substring(0, 200)
    });

    // Update first_viewed_at if this is the first view
    if (!data.first_viewed_at) {
      data.first_viewed_at = now;
    }
    data.last_viewed_at = now;
    data.view_count = data.views.length;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`[View] Proposal ${slug} viewed by ${cleanIp}`);

    return res.json({ tracked: true, view_count: data.view_count });
  } catch (err) {
    console.error('Error tracking view:', err);
    return res.status(500).json({ error: 'Error tracking view' });
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
// CRM LEAD SEARCH PROXY
// ============================================
// Proxy search leads from the CRM (avoids CORS in production)
app.get('/api/crm/leads/search', requireBuilderAuth, async (req, res) => {
  try {
    const q = req.query.q || '';
    if (q.length < 2) return res.json({ leads: [] });
    
    const https = require('https');
    const http = require('http');
    const url = new URL(CRM_BASE + '/api/leads/search?q=' + encodeURIComponent(q));
    const protocol = url.protocol === 'https:' ? https : http;
    
    const proxyReq = protocol.get(url.toString(), (proxyRes) => {
      let data = '';
      proxyRes.on('data', chunk => data += chunk);
      proxyRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          res.json(parsed);
        } catch (e) {
          res.json({ leads: [] });
        }
      });
    });
    proxyReq.on('error', () => res.json({ leads: [] }));
    proxyReq.setTimeout(5000, () => { proxyReq.destroy(); res.json({ leads: [] }); });
  } catch (e) {
    res.json({ leads: [] });
  }
});

// ============================================
// PROPOSAL TEMPLATES
// ============================================

// Helper: sanitize template name to a safe filename
function sanitizeTemplateName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 80);
}

// Helper: strip lead-specific fields from proposal data to create a template
function extractTemplateData(proposalData) {
  const {
    proposal_id, slug, created_date, lead_id, client,
    status, signature, payment, _received_at, _source,
    ...templateFields
  } = proposalData;
  return templateFields;
}

// List all templates
app.get('/api/templates', requireBuilderAuth, (req, res) => {
  try {
    const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.json'));
    const templates = files.map(f => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, f), 'utf8'));
        return {
          id: f.replace('.json', ''),
          name: data._template_name || f.replace('.json', ''),
          description: data._template_description || '',
          created_at: data._template_created_at || '',
          updated_at: data._template_updated_at || '',
          systems: (data.systems || []).map(s => s.name),
          pricing_items: (data.pricing && data.pricing.items || []).length
        };
      } catch (e) { return null; }
    }).filter(Boolean);

    templates.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    res.json({ templates });
  } catch (err) {
    console.error('[Templates] List error:', err.message);
    res.status(500).json({ error: 'Failed to list templates' });
  }
});

// Get a single template
app.get('/api/templates/:id', requireBuilderAuth, (req, res) => {
  const filePath = path.join(TEMPLATES_DIR, `${req.params.id}.json`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Template not found' });
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read template' });
  }
});

// Save a new template (from current proposal data)
app.post('/api/templates', requireBuilderAuth, (req, res) => {
  try {
    const { name, description, proposal_data } = req.body;
    if (!name || !proposal_data) {
      return res.status(400).json({ error: 'Template name and proposal_data are required' });
    }

    const id = sanitizeTemplateName(name);
    if (!id) return res.status(400).json({ error: 'Invalid template name' });

    const templateData = extractTemplateData(proposal_data);
    templateData._template_name = name;
    templateData._template_description = description || '';
    templateData._template_created_at = new Date().toISOString();
    templateData._template_updated_at = new Date().toISOString();

    const filePath = path.join(TEMPLATES_DIR, `${id}.json`);
    const isUpdate = fs.existsSync(filePath);
    if (isUpdate) {
      // Preserve original creation date on update
      try {
        const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        templateData._template_created_at = existing._template_created_at || templateData._template_created_at;
      } catch (e) { /* ignore */ }
    }

    fs.writeFileSync(filePath, JSON.stringify(templateData, null, 2), 'utf8');
    console.log(`[Templates] ${isUpdate ? 'Updated' : 'Created'}: ${name} (${id})`);

    res.json({
      success: true,
      id,
      name,
      message: `Template ${isUpdate ? 'updated' : 'created'}: ${name}`
    });
  } catch (err) {
    console.error('[Templates] Save error:', err.message);
    res.status(500).json({ error: 'Failed to save template' });
  }
});

// Delete a template
app.delete('/api/templates/:id', requireBuilderAuth, (req, res) => {
  const filePath = path.join(TEMPLATES_DIR, `${req.params.id}.json`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Template not found' });
  try {
    fs.unlinkSync(filePath);
    console.log(`[Templates] Deleted: ${req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// ============================================
// INTAKE FORMS MODULE
// ============================================

const INTAKE_DIR = path.join(DATA_DIR, 'intake');
if (!fs.existsSync(INTAKE_DIR)) fs.mkdirSync(INTAKE_DIR, { recursive: true });

function generateIntakeId() {
  const counter = getCounter();
  const currentYear = new Date().getFullYear();
  const yy = String(currentYear).slice(-2);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FT${yy}I${rand}`;
}

function readIntake(id) {
  const fp = path.join(INTAKE_DIR, `${id}.json`);
  if (!fs.existsSync(fp)) return null;
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch (e) { return null; }
}

function writeIntake(data) {
  const fp = path.join(INTAKE_DIR, `${data.id}.json`);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
}

// GET /intake/:id — serve the client-facing intake form page
app.get('/intake/:id', (req, res) => {
  const intake = readIntake(req.params.id);
  if (!intake) return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
  if (intake.status === 'submitted') {
    return res.sendFile(path.join(__dirname, 'public', 'intake-submitted.html'));
  }
  res.sendFile(path.join(__dirname, 'public', 'intake.html'));
});

// GET /api/intake — list all intake forms (protected)
app.get('/api/intake', requireBuilderAuth, (req, res) => {
  try {
    const files = fs.readdirSync(INTAKE_DIR).filter(f => f.endsWith('.json'));
    const forms = files.map(f => {
      try {
        const d = JSON.parse(fs.readFileSync(path.join(INTAKE_DIR, f), 'utf8'));
        return {
          id: d.id,
          ghl_contact_id: d.ghl_contact_id || '',
          client_name: d.client_name || '',
          client_email: d.client_email || '',
          client_company: d.client_company || '',
          status: d.status || 'pending',
          created_at: d.created_at || '',
          submitted_at: d.submitted_at || null,
          url: `/intake/${d.id}`
        };
      } catch (e) { return null; }
    }).filter(Boolean);
    forms.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return res.json({ forms });
  } catch (err) {
    return res.status(500).json({ error: 'Error listing intake forms' });
  }
});

// GET /api/intake/:id — get a single intake form (public — needed by the form page)
app.get('/api/intake/:id', (req, res) => {
  const intake = readIntake(req.params.id);
  if (!intake) return res.status(404).json({ error: 'Intake form not found' });
  return res.json(intake);
});

// POST /api/intake — create a new intake form link (protected)
// Accepts either a valid session cookie OR the X-Intake-Key header (for cross-system calls from Lead Manager)
function requireIntakeAuth(req, res, next) {
  const key = req.headers['x-intake-key'];
  if (key && key === INTAKE_API_KEY) return next();
  return requireBuilderAuth(req, res, next);
}

app.post('/api/intake', requireIntakeAuth, (req, res) => {
  const { ghl_contact_id, client_name, client_email, client_phone, client_company } = req.body;
  if (!ghl_contact_id) return res.status(400).json({ error: 'ghl_contact_id is required' });
  const id = generateIntakeId();
  const now = new Date().toISOString();
  const intake = {
    id,
    ghl_contact_id,
    client_name: client_name || '',
    client_email: client_email || '',
    client_phone: client_phone || '',
    client_company: client_company || '',
    status: 'pending',
    created_at: now,
    submitted_at: null,
    submission: null
  };
  writeIntake(intake);
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'proposals.flowtier.io';
  const url = `${protocol}://${host}/intake/${id}`;
  console.log(`[Intake] Created: ${id} for GHL contact ${ghl_contact_id}`);
  return res.json({ success: true, id, url });
});

// POST /api/intake/:id/submit — client submits the intake form (public)
app.post('/api/intake/:id/submit', async (req, res) => {
  const intake = readIntake(req.params.id);
  if (!intake) return res.status(404).json({ error: 'Intake form not found' });
  if (intake.status === 'submitted') return res.status(400).json({ error: 'Form already submitted' });

  const submission = req.body;
  const now = new Date().toISOString();
  intake.status = 'submitted';
  intake.submitted_at = now;
  intake.submission = submission;
  // Update client info from submission (form uses: name, email, phone, business_name)
  if (submission.name) intake.client_name = submission.name;
  if (submission.email) intake.client_email = submission.email;
  if (submission.phone) intake.client_phone = submission.phone;
  if (submission.business_name) intake.client_company = submission.business_name;
  writeIntake(intake);

  console.log(`[Intake] Submitted: ${intake.id} by ${intake.client_name || intake.client_email}`);

  // Fire webhook
  sendWebhookNotification('intake_submitted', {
    intake_id: intake.id,
    ghl_contact_id: intake.ghl_contact_id,
    lead_id: intake.ghl_contact_id,
    client: {
      name: intake.client_name,
      email: intake.client_email,
      phone: intake.client_phone,
      company: intake.client_company
    },
    submitted_at: now,
    submission
  }).catch(err => console.error('[Intake Webhook] Error:', err));

  return res.json({ success: true });
});

// DELETE /api/intake/:id — delete an intake form (protected)
app.delete('/api/intake/:id', requireBuilderAuth, (req, res) => {
  const fp = path.join(INTAKE_DIR, `${req.params.id}.json`);
  if (!fs.existsSync(fp)) return res.status(404).json({ error: 'Not found' });
  try {
    fs.unlinkSync(fp);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete' });
  }
});

// GET /api/intake/:id/export-md — export submission as Markdown (protected)
app.get('/api/intake/:id/export-md', requireBuilderAuth, (req, res) => {
  const intake = readIntake(req.params.id);
  if (!intake) return res.status(404).send('Not found');
  if (!intake.submission) return res.status(400).send('No submission yet');

  const s = intake.submission;
  const lines = [];
  lines.push(`# AI Front Office Onboarding — ${intake.client_name || intake.id}`);
  lines.push(``);
  lines.push(`**GHL Contact ID:** ${intake.ghl_contact_id || '—'}`);
  lines.push(`**Submitted:** ${intake.submitted_at || '—'}`);
  lines.push(`**Company:** ${intake.client_company || '—'}`);
  lines.push(`**Email:** ${intake.client_email || '—'}`);
  lines.push(`**Phone:** ${intake.client_phone || '—'}`);
  lines.push(``);

  const sections = [
    { title: 'Contact Info', keys: ['name','business_name','email','phone'] },
    { title: 'Primary Goal', keys: ['primary_goal','primary_goal_other','video_step','video_url','booking_link','website','checkout_link','reviews_link','other_links'] },
    { title: 'About Your Business', keys: ['business_type','years_in_business','main_service','other_services','service_area','team_size','business_hours','peak_season'] },
    { title: 'Current Setup', keys: ['crm','crm_other','current_followup','current_followup_other','biggest_challenge','monthly_revenue','avg_ticket'] },
    { title: 'Channels', keys: ['ch_sms','ch_chat','ch_ig','ch_fb','ch_wa','ch_email','ch_voice','channel_preferences'] },
    { title: 'Voice Agent', keys: ['voice_agent','voice_gender','voice_style','ai_intro','transfer_triggers','recording','voice_other'] },
    { title: 'AI Personality', keys: ['ai_name','tone','use_emojis','use_firstname','use_jargon','use_humor','voice_samples'] },
    { title: 'Credibility', keys: ['founder_name','founder_bio','proof_points','awards','differentiators'] },
    { title: 'Lead Qualification', keys: ['qualify_questions','disqualify_criteria'] },
    { title: 'Objections', keys: ['objections'] },
    { title: 'Differentiation', keys: ['vs_competitors','unique_value'] },
    { title: 'Booking', keys: ['booking_system','booking_max_per_day','booking_preferred_times','booking_auth','post_booking','pre_appt_instructions'] },
    { title: 'Rules & Guardrails', keys: ['forbidden_actions','compliance_rules','emergency_action','emergency_detail'] },
    { title: 'Follow-Ups', keys: ['followup','followup_first','followup_second','followup_max','followup_stop','followup_tone'] },
    { title: 'Current Leads', keys: ['monthly_leads','current_response_time','lead_sources','lead_sources_other','conversion_rate'] },
    { title: 'Supporting Materials', keys: ['materials','materials_delivery','signature'] }
  ];

  sections.forEach(sec => {
    const hasData = sec.keys.some(k => s[k] !== undefined && s[k] !== '' && s[k] !== false);
    if (!hasData) return;
    lines.push(`## ${sec.title}`);
    lines.push(``);
    sec.keys.forEach(k => {
      const val = s[k];
      if (val === undefined || val === '' || val === false) return;
      const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const display = Array.isArray(val) ? val.join(', ') : String(val);
      lines.push(`**${label}:** ${display}`);
    });
    lines.push(``);
  });

  // FAQs
  const faqKeys = Object.keys(s).filter(k => k.startsWith('faq_q'));
  if (faqKeys.length > 0) {
    lines.push(`## FAQs`);
    lines.push(``);
    faqKeys.forEach(qk => {
      const num = qk.replace('faq_q', '');
      const q = s[qk]; const a = s[`faq_a${num}`];
      if (q) { lines.push(`**Q:** ${q}`); lines.push(`**A:** ${a || '—'}`); lines.push(``); }
    });
  }

  // Scenarios
  const scKeys = Object.keys(s).filter(k => k.match(/^sc\d+_trigger$/));
  if (scKeys.length > 0) {
    lines.push(`## Common Scenarios`);
    lines.push(``);
    scKeys.forEach(tk => {
      const num = tk.replace('sc','').replace('_trigger','');
      const trigger = s[tk]; const response = s[`sc${num}_response`];
      if (trigger) { lines.push(`**Trigger:** ${trigger}`); lines.push(`**Response:** ${response || '—'}`); lines.push(``); }
    });
  }

  const md = lines.join('\n');
  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', `attachment; filename="${intake.id}-intake.md"`);
  return res.send(md);
});

// GET /intakes — dashboard for intake forms (protected)
app.get('/intakes', requireBuilderAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'intakes.html'));
});

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
