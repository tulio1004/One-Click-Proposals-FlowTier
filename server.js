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

// Builder credentials
const BUILDER_USER = process.env.BUILDER_USER || 'tulio';
const BUILDER_PASS = process.env.BUILDER_PASS || '25524515Fl0wT13r';

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Source, X-Proposal-Id, X-API-Key');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Optional API key protection for the create endpoint
const API_KEY = process.env.API_KEY || null;

function requireApiKey(req, res, next) {
  if (!API_KEY) return next(); // No key set = open access
  const provided = req.headers['x-api-key'] || req.query.api_key;
  if (provided === API_KEY) return next();
  return res.status(401).json({ error: 'Unauthorized. Invalid or missing API key.' });
}

// ============================================
// SESSION-BASED AUTH FOR BUILDER
// ============================================
// Simple token-based session (no external deps needed)
const activeSessions = new Map(); // token -> { user, created }

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function getTokenFromReq(req) {
  // Check cookie
  const cookies = req.headers.cookie || '';
  const match = cookies.match(/builder_token=([a-f0-9]+)/);
  return match ? match[1] : null;
}

function isAuthenticated(req) {
  const token = getTokenFromReq(req);
  if (!token) return false;
  const session = activeSessions.get(token);
  if (!session) return false;
  // Sessions expire after 24 hours
  if (Date.now() - session.created > 24 * 60 * 60 * 1000) {
    activeSessions.delete(token);
    return false;
  }
  return true;
}

function requireBuilderAuth(req, res, next) {
  if (isAuthenticated(req)) return next();
  // Redirect to login page
  res.redirect('/login');
}

// ============================================
// STATIC FILES — Serve /public for CSS, JS, images
// ============================================
app.use('/static', express.static(path.join(__dirname, 'public')));

// ============================================
// AUTH ROUTES
// ============================================

// Login page
app.get('/login', (req, res) => {
  if (isAuthenticated(req)) return res.redirect('/builder');
  res.send(getLoginPageHTML());
});

// Login POST
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

// Logout
app.get('/logout', (req, res) => {
  const token = getTokenFromReq(req);
  if (token) activeSessions.delete(token);
  res.setHeader('Set-Cookie', 'builder_token=; Path=/; HttpOnly; Max-Age=0');
  res.redirect('/login');
});

// ============================================
// ROUTES
// ============================================

// --- Builder page (protected) ---
app.get('/builder', requireBuilderAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'builder.html'));
});

// --- API: Create / Update a proposal ---
// Make.com sends refined JSON here
app.post('/api/proposals', requireApiKey, (req, res) => {
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
    data._source = req.headers['x-source'] || 'api';

    // Save to file
    const filePath = path.join(DATA_DIR, `${slug}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`[${new Date().toISOString()}] Proposal saved: ${slug}`);

    return res.status(200).json({
      success: true,
      slug: slug,
      url: `/${slug}`,
      message: `Proposal created at /${slug}`
    });
  } catch (err) {
    console.error('Error saving proposal:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- API: Get proposal data as JSON ---
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

// --- API: List all proposals ---
app.get('/api/proposals', requireApiKey, (req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    const proposals = files.map(f => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
        return {
          slug: data.slug,
          proposal_id: data.proposal_id,
          client_name: data.client?.name,
          client_company: data.client?.company,
          project_name: data.project?.name,
          created_date: data.created_date,
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

// --- API: Delete a proposal ---
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

// --- API: Record signature ---
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
      ip: req.ip || req.connection?.remoteAddress || 'unknown'
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`[${new Date().toISOString()}] Proposal signed: ${slug} by ${name}`);

    return res.json({
      success: true,
      signature: data.signature
    });
  } catch (err) {
    console.error('Error recording signature:', err);
    return res.status(500).json({ error: 'Error recording signature' });
  }
});

// --- Serve client proposal page by slug ---
// This MUST be the last route to avoid catching other paths
app.get('/:slug', (req, res) => {
  const slug = sanitizeSlug(req.params.slug);
  if (!slug) return res.status(400).send('Invalid URL');

  // Check reserved paths
  const reserved = ['builder', 'api', 'static', 'favicon.ico', 'robots.txt', 'login', 'logout'];
  if (reserved.includes(slug)) return res.status(404).send('Not found');

  const filePath = path.join(DATA_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
  }

  // Serve the proposal page — it will fetch its data from /api/proposals/:slug
  res.sendFile(path.join(__dirname, 'public', 'proposal.html'));
});

// --- Root redirect ---
app.get('/', (req, res) => {
  res.redirect('/builder');
});

// ============================================
// HELPERS
// ============================================
function sanitizeSlug(slug) {
  if (!slug || typeof slug !== 'string') return null;
  // Allow lowercase letters, numbers, hyphens
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
      <div class="logo-text">FlowTier</div>
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
