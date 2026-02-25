# FlowTier Proposal System

A complete proposal builder and client-facing proposal system for FlowTier Automations.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Builder    │────>│   Make.com   │────>│  POST /api/      │
│  /builder    │     │   Webhook    │     │  proposals       │
│  (you fill   │     │  (AI refines │     │  (saves JSON)    │
│   the form)  │     │   content)   │     │                  │
└─────────────┘     └──────────────┘     └────────┬─────────┘
                                                   │
                                                   ▼
                                          ┌──────────────────┐
                                          │  Client visits    │
                                          │  /:slug           │
                                          │  (sees polished   │
                                          │   proposal)       │
                                          └──────────────────┘
```

## Workflow

1. Open `/builder` and fill out the proposal form
2. Click **"Send JSON to Make.com"** — raw JSON payload is sent to your webhook
3. Make.com processes the JSON through AI to refine the copy
4. Make.com sends the refined JSON to `POST /api/proposals` on your server
5. The backend saves the proposal and it becomes available at `/:slug`
6. Share the link (e.g., `proposals.flowtier.io/clientxyz`) with your client
7. Client reviews, signs, and pays

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/builder` | Serves the builder page |
| `POST` | `/api/proposals` | Create/update a proposal (Make.com sends refined JSON here) |
| `GET` | `/api/proposals` | List all proposals |
| `GET` | `/api/proposals/:slug` | Get a single proposal's JSON data |
| `DELETE` | `/api/proposals/:slug` | Delete a proposal |
| `POST` | `/api/proposals/:slug/sign` | Record a client signature |
| `GET` | `/:slug` | Serve the client-facing proposal page |

## Make.com Integration

### What the Builder Sends to Make.com

The builder sends the **raw JSON payload** with every field clearly structured. In Make.com, you can map each field by name. Here's the structure:

```json
{
  "proposal_id": "PROP-2026-001",
  "slug": "brightside-dental-automation",
  "created_date": "2026-02-24",
  "client": {
    "name": "Sarah Mitchell",
    "company": "Brightside Dental",
    "email": "sarah@brightsidedental.com",
    "phone": "+1 (555) 123-4567"
  },
  "project": { "name": "Patient Experience Automation" },
  "problem": { "draft": "...", "final": null },
  "solution": { "draft": "...", "final": null },
  "systems": [ ... ],
  "scope_of_work": { "draft_bullets": [...], "final_bullets": null },
  "timeline": { "milestones": [...] },
  "pricing": { ... },
  "settings": { ... }
}
```

### What Make.com Should Send Back

After AI refinement, Make.com should POST the same structure to `POST /api/proposals` with `final` fields filled in:

```json
{
  "slug": "brightside-dental-automation",
  "problem": { "draft": "...", "final": "AI-refined problem statement" },
  "solution": { "draft": "...", "final": "AI-refined solution text" },
  "systems": [
    {
      "id": "voice_assistant",
      "draft_notes": "...",
      "final_copy": "AI-refined system description",
      ...
    }
  ],
  "scope_of_work": {
    "draft_bullets": [...],
    "final_bullets": ["AI-refined bullet 1", "AI-refined bullet 2"]
  },
  ...
}
```

The proposal page automatically renders `final` fields when present, falling back to `draft` when `final` is null.

### Headers for Make.com HTTP Request

```
Method: POST
URL: https://proposals.flowtier.io/api/proposals
Content-Type: application/json
X-Source: make-com
X-API-Key: your-api-key (optional, if you set API_KEY env var)
```

## File Structure

```
proposal-system/
├── server.js              # Express backend
├── package.json
├── data/                  # Stored proposals (JSON files)
├── public/
│   ├── builder.html       # Builder page
│   ├── builder.js         # Builder logic (includes systems library)
│   ├── proposal.html      # Client proposal page
│   ├── proposal.js        # Proposal rendering logic
│   ├── index.css          # Shared styles (FlowTier dark theme)
│   ├── 404.html           # 404 page
│   └── images/            # Service images (8 AI-generated)
│       ├── ai-voice-assistant.png
│       ├── ai-chatbot.png
│       ├── ai-email-agent.png
│       ├── ai-lead-generation.png
│       ├── ai-outreach.png
│       ├── one-click-proposal.png
│       ├── customer-care-followup.png
│       └── custom-automation.png
└── README.md
```

## Setup & Deployment

### Local Development

```bash
npm install
node server.js
# Open http://localhost:3000/builder
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `API_KEY` | *(none)* | Optional API key to protect the create/list/delete endpoints |

### Builder Login

The builder is password-protected. Default credentials are set in `server.js`:
- **Username:** `tulio`
- **Password:** `25524515Fl0wT13r`

To change credentials, edit the `VALID_USER` and `VALID_PASS` constants in `server.js`.

### Deploy to VPS

1. SSH into your VPS
2. Clone or upload the project
3. Install dependencies: `npm install`
4. Start with PM2: `pm2 start server.js --name proposal-system`
5. Set up Nginx reverse proxy for `proposals.flowtier.io` → `localhost:3000`
6. Enable SSL with Certbot

### Nginx Config Example

```nginx
server {
    listen 80;
    server_name proposals.flowtier.io;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Notes

- Set `API_KEY` environment variable to protect the create/list/delete endpoints
- The signature endpoint is open (clients need to sign without auth)
- The GET proposal endpoint is open (clients need to view without auth)
- Consider adding rate limiting for production use
