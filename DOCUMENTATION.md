# FlowTier Proposal System - Documentation

**Author:** Manus AI
**Date:** February 25, 2026

## 1. Introduction

This document provides comprehensive documentation for the FlowTier Proposal System, a self-hosted, one-click proposal generation and tracking tool. It covers system architecture, deployment, API reference, data models, and all user-facing features.

## 2. System Architecture

The system is a Node.js/Express application with a vanilla HTML/CSS/JavaScript frontend. It is designed to be lightweight, fast, and easy to deploy on a standard Linux VPS.

- **Backend:** Node.js, Express.js
- **Frontend:** HTML, CSS, JavaScript (no frameworks)
- **Data Storage:** File-based JSON. Each proposal is a separate `.json` file in the `/data` directory. Configuration files (webhooks, terms) are stored in the `/config` directory.
- **Process Management:** PM2
- **Web Server:** Nginx (as a reverse proxy)
- **SSL:** Let's Encrypt (Certbot)

## 3. Deployment Guide

This guide covers deploying the Proposal System on a fresh Ubuntu VPS.

### 3.1. Prerequisites

- A VPS running Ubuntu 22.04 or later.
- A domain name (`proposals.flowtier.io`) pointed to your VPS IP address.
- Node.js and npm installed.
- Nginx and PM2 installed.

### 3.2. Installation Steps

1.  **Clone the Repository**

    SSH into your VPS and clone the repository. You will need a GitHub Personal Access Token (PAT) with `repo` scope to clone the private repository.

    ```bash
    # Replace YOUR_TOKEN_HERE with your GitHub PAT
    git clone https://tulio1004:YOUR_TOKEN_HERE@github.com/tulio1004/One-Click-Proposals-FlowTier.git oneclickproposals

    # Navigate into the project directory
    cd oneclickproposals

    # Install dependencies
    npm install
    ```

2.  **Configure Environment Variables**

    The system is configured using an `ecosystem.config.js` file for PM2. Create this file in the project root.

    ```bash
    nano ecosystem.config.js
    ```

    Paste the following configuration, replacing the placeholder values with your actual credentials and Stripe keys.

    ```javascript
    module.exports = {
      apps: [{
        name: 'proposals',
        script: 'server.js',
        env: {
          PORT: 3000,
          BUILDER_USER: 'your_admin_user',
          BUILDER_PASS: 'your_strong_password',
          STRIPE_SECRET_KEY: 'sk_live_...',
          STRIPE_PUBLISHABLE_KEY: 'pk_live_...'
        }
      }]
    };
    ```

3.  **Start the Application with PM2**

    ```bash
    # Start the application
    pm2 start ecosystem.config.js

    # Save the process list to resurrect on reboot
    pm2 save
    ```

4.  **Configure Nginx Reverse Proxy**

    Create an Nginx configuration file to proxy requests from `proposals.flowtier.io` to the Node.js application running on port 3000.

    ```bash
    # Create the Nginx config file
    sudo nano /etc/nginx/sites-available/proposals.flowtier.io
    ```

    Paste the following configuration:

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

    Enable the site and test the configuration:

    ```bash
    sudo ln -s /etc/nginx/sites-available/proposals.flowtier.io /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx
    ```

5.  **Obtain SSL Certificate with Certbot**

    ```bash
    sudo apt update && sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d proposals.flowtier.io --non-interactive --agree-tos -m your-email@example.com
    ```

### 3.3. Service Management

-   **Check Status:** `pm2 status` or `pm2 list`
-   **View Logs:** `pm2 logs proposals`
-   **Restart Service:** `pm2 restart proposals`
-   **Stop Service:** `pm2 stop proposals`

## 4. User Interface

-   **Dashboard:** Lists all created proposals with their status (Pending, Signed, Paid).
-   **Builder:** A rich editor for creating and modifying proposals.
-   **Proposal View:** The public-facing, client-viewable proposal page where they can sign and pay.
-   **Dev Console:** A developer-focused page for API documentation and webhook testing.

## 5. API Reference

### 5.1. Authentication

-   **Session Auth:** Most API endpoints are protected and require an active login session.
-   **API Key Auth:** The `/api/import` endpoint can be protected by setting an `API_KEY` in the environment variables.

### 5.2. Proposal Object

The core data object for a proposal.

| Field | Type | Description |
| :--- | :--- | :--- |
| `slug` | `String` | Unique, URL-friendly identifier for the proposal. |
| `proposal_id` | `String` | Human-readable sequential ID (e.g., FT26P01). |
| `client` | `Object` | Contains `name`, `company`, `email`, `phone`. |
| `project` | `Object` | Contains `name`. |
| `pricing` | `Object` | Contains `currency`, `due_now_cents`, `total_setup_cents`, `total_monthly_cents`, and an array of `items`. |
| `sections` | `Array<Object>` | Content sections of the proposal, each with a `title` and `content` (HTML). |
| `terms` | `String` | The legal terms and conditions for the proposal. |
| `signature` | `Object` | Captured signature data, including `name`, `email`, `signature_data`, and `signed_at`. |
| `payment` | `Object` | Captured payment data from Stripe, including `stripe_session_id`, `amount_cents`, and `paid_at`. |
| `status` | `String` | The current status: `pending`, `signed`, or `paid`. |

### 5.3. Endpoints

-   `POST /api/proposals`: Create or update a proposal.
-   `GET /api/proposals`: List all proposals for the dashboard.
-   `GET /api/proposals/:slug`: Retrieve the JSON data for a single proposal.
-   `DELETE /api/proposals/:slug`: Delete a proposal.
-   `POST /api/import`: Create a proposal from a JSON payload (for external integrations).
-   `POST /api/proposals/:slug/sign`: Record a client's signature.
-   `POST /api/proposals/:slug/checkout`: Create a Stripe Checkout session for payment.
-   `POST /api/proposals/:slug/verify-payment`: Verify a payment after the client returns from Stripe.
-   `GET /api/terms`: Get the current terms and conditions template.
-   `POST /api/terms`: Update the terms and conditions template.
-   `GET /api/webhook-config`: Get the current webhook URL.
-   `POST /api/webhook-config`: Set the webhook URL.

## 6. Webhooks

The system sends webhook notifications for key events.

### 6.1. Events

-   `proposal_created`: Fired when a new proposal is saved.
-   `proposal_updated`: Fired when an existing proposal is updated.
-   `proposal_signed`: Fired when a client signs a proposal. Includes a direct Stripe `payment_link` in the payload if an amount is due.
-   `proposal_paid`: Fired when a client successfully completes a payment via Stripe.

### 6.2. Payload Structure

**Example: `proposal_signed`**

```json
{
  "event": "proposal_signed",
  "timestamp": "2026-02-25T12:00:00.000Z",
  "proposal_url": "https://proposals.flowtier.io/example-corp-2026",
  "slug": "example-corp-2026",
  "proposal_id": "FT26P01",
  "client": {
    "name": "John Doe",
    "company": "Example Corp",
    "email": "john@example.com"
  },
  "signature": {
    "name": "John Doe",
    "email": "john@example.com",
    "signed_at": "2026-02-25T12:00:00.000Z"
  },
  "payment_link": "https://checkout.stripe.com/c/pay/...",
  "amount_due": {
    "cents": 50000,
    "formatted": "$500.00",
    "currency": "USD"
  }
}
```

This documentation provides a complete overview of the FlowTier Proposal System. For any further questions, please refer to the source code or the Dev Console within the application.
