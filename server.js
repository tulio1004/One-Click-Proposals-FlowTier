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

// Stripe keys (set via environment variables — NEVER hardcode live keys)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';

const stripe = require('stripe')(STRIPE_SECRET_KEY);

// Ensure directories exist
[DATA_DIR, CONFIG_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ============================================
// PERSISTENT WEBHOOK CONFIG
// ============================================
const WEBHOOK_CONFIG_FILE = path.join(CONFIG_DIR, 'webhook.json');

function getWebhookUrl() {
  try {
    if (fs.existsSync(WEBHOOK_CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(WEBHOOK_CONFIG_FILE, 'utf8'));
      return config.url || '';
    }
  } catch (e) { /* ignore */ }
  return '';
}

function setWebhookUrl(url) {
  fs.writeFileSync(WEBHOOK_CONFIG_FILE, JSON.stringify({ url, updated_at: new Date().toISOString() }, null, 2), 'utf8');
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

// CORS headers for Make.com webhook callbacks
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Source, X-Proposal-Id, X-API-Key, X-Event-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Optional API key protection
const API_KEY = process.env.API_KEY || null;

function requireApiKey(req, res, next) {
  if (!API_KEY) return next();
  const provided = req.headers['x-api-key'] || req.query.api_key;
  if (provided === API_KEY) return next();
  return res.status(401).json({ error: 'Unauthorized. Invalid or missing API key.' });
}

// ============================================
// SESSION-BASED AUTH FOR BUILDER
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
  if (isAuthenticated(req)) return res.redirect('/builder');
  res.send(getLoginPageHTML());
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === BUILDER_USER && password === BUILDER_PASS) {
    const token = generateToken();
    activeSessions.set(token, { user: username, created: Date.now() });
    res.setHeader('Set-Cookie', `builder_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
    return res.redirect('/builder');
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
// BUILDER PAGE (protected)
// ============================================
app.get('/builder', requireBuilderAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'builder.html'));
});

// ============================================
// WEBHOOK CONFIG API (protected by builder auth)
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
// STRIPE CONFIG API
// ============================================
app.get('/api/stripe-config', (req, res) => {
  res.json({ publishableKey: STRIPE_PUBLISHABLE_KEY });
});

// ============================================
// API: Create proposal from builder (saves + sends URL to webhook)
// ============================================
app.post('/api/proposals', (req, res) => {
  try {
    const data = req.body;

    if (!data || !data.slug) {
      return res.status(400).json({ error: 'Missing required field: slug' });
    }

    // Sanitize slug
    const slug = sanitizeSlug(data.slug);
    if (!slug) {
      return res.status(400).json({ error: 'Invalid slug format' });
    }

    // Add server-side metadata
    data.slug = slug;
    data._received_at = new Date().toISOString();
    data._source = req.headers['x-source'] || 'builder';

    // Save to file
    const filePath = path.join(DATA_DIR, `${slug}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`[${new Date().toISOString()}] Proposal saved: ${slug}`);

    // Determine full URL
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'proposals.flowtier.io';
    const proposalUrl = `${protocol}://${host}/${slug}`;

    // Send webhook notification with proposal URL + client details
    sendWebhookNotification('proposal_created', {
      proposal_url: proposalUrl,
      slug: slug,
      proposal_id: data.proposal_id || '',
      client: {
        name: data.client && data.client.name || '',
        company: data.client && data.client.company || '',
        email: data.client && data.client.email || '',
        phone: data.client && data.client.phone || ''
      },
      project_name: data.project && data.project.name || '',
      pricing: {
        currency: data.pricing && data.pricing.currency || 'usd',
        due_now_cents: data.pricing && data.pricing.due_now_cents || 0,
        total_cents: data.pricing && data.pricing.total_cents || 0
      },
      created_date: data.created_date || new Date().toISOString()
    }).catch(err => console.error('[Webhook] Error:', err));

    return res.status(200).json({
      success: true,
      slug: slug,
      url: proposalUrl,
      message: `Proposal created at /${slug}`
    });
  } catch (err) {
    console.error('Error saving proposal:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// API: Get proposal data as JSON
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
// API: List all proposals
// ============================================
app.get('/api/proposals', requireApiKey, (req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    const proposals = files.map(f => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
        return {
          slug: data.slug,
          proposal_id: data.proposal_id,
          client_name: data.client && data.client.name,
          client_company: data.client && data.client.company,
          project_name: data.project && data.project.name,
          created_date: data.created_date,
          signed: !!data.signature,
          paid: !!data.payment,
          url: `/${data.slug}`
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    return res.json({ proposals });
  } catch (err) {
    return res.status(500).json({ error: 'Error listing proposals' });
  }
});

// ============================================
// API: Delete a proposal
// ============================================
app.delete('/api/proposals/:slug', requireApiKey, (req, res) => {
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
// API: Record signature + send webhook notification
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
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    data.signature = {
      name: name.trim(),
      email: email.trim(),
      signed_at: new Date().toISOString(),
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown'
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`[${new Date().toISOString()}] Proposal signed: ${slug} by ${name}`);

    // Send webhook notification for signature
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'proposals.flowtier.io';
    const proposalUrl = `${protocol}://${host}/${slug}`;

    sendWebhookNotification('proposal_signed', {
      proposal_url: proposalUrl,
      slug: slug,
      proposal_id: data.proposal_id || '',
      client: {
        name: data.client && data.client.name || '',
        company: data.client && data.client.company || '',
        email: data.client && data.client.email || '',
        phone: data.client && data.client.phone || ''
      },
      signature: data.signature,
      project_name: data.project && data.project.name || ''
    }).catch(err => console.error('[Webhook] Error:', err));

    return res.json({
      success: true,
      signature: data.signature
    });
  } catch (err) {
    console.error('Error recording signature:', err);
    return res.status(500).json({ error: 'Error recording signature' });
  }
});

// ============================================
// STRIPE: Create Checkout Session
// ============================================
app.post('/api/proposals/:slug/checkout', async (req, res) => {
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
      return res.status(400).json({ error: 'No amount due. Please set a "Due Now" amount in the proposal.' });
    }

    // Build the line item description
    let description = `Proposal: ${project.name || 'Untitled Project'}`;
    if (client.company) description += ` — ${client.company}`;

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'proposals.flowtier.io';
    const baseUrl = `${protocol}://${host}`;

    // Create Stripe Checkout Session
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
// STRIPE: Verify payment and record it
// ============================================
app.post('/api/proposals/:slug/verify-payment', async (req, res) => {
  const slug = sanitizeSlug(req.params.slug);
  if (!slug) return res.status(400).json({ error: 'Invalid slug' });

  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'Missing session_id' });

  const filePath = path.join(DATA_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Proposal not found' });
  }

  try {
    // Verify with Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed', status: session.payment_status });
    }

    // Record payment in proposal data
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.payment = {
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent,
      amount_cents: session.amount_total,
      currency: session.currency,
      status: session.payment_status,
      customer_email: session.customer_email || session.customer_details?.email || '',
      paid_at: new Date().toISOString()
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`[${new Date().toISOString()}] Payment recorded: ${slug} — ${session.amount_total} ${session.currency}`);

    // Send webhook notification for payment
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'proposals.flowtier.io';
    const proposalUrl = `${protocol}://${host}/${slug}`;

    sendWebhookNotification('proposal_paid', {
      proposal_url: proposalUrl,
      slug: slug,
      proposal_id: data.proposal_id || '',
      client: {
        name: data.client && data.client.name || '',
        company: data.client && data.client.company || '',
        email: data.client && data.client.email || '',
        phone: data.client && data.client.phone || ''
      },
      payment: data.payment,
      project_name: data.project && data.project.name || ''
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

  const reserved = ['builder', 'api', 'static', 'favicon.ico', 'robots.txt', 'login', 'logout'];
  if (reserved.includes(slug)) return res.status(404).send('Not found');

  const filePath = path.join(DATA_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
  }

  res.sendFile(path.join(__dirname, 'public', 'proposal.html'));
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/builder');
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
  │  Builder:  http://localhost:${PORT}/builder  │
  │  API:      http://localhost:${PORT}/api/...  │
  │  Proposals: http://localhost:${PORT}/:slug   │
  └─────────────────────────────────────────┘
  `);
});
