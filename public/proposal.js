/* ============================================
   PROPOSAL.JS — Client Proposal Renderer
   ============================================ */

(function () {
  'use strict';

  const container = document.getElementById('proposalContainer');

  // --- Utility: resolve draft/final ---
  function resolve(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (obj.final !== undefined && obj.final !== null && obj.final !== '') return obj.final;
    if (obj.draft !== undefined && obj.draft !== null && obj.draft !== '') return obj.draft;
    return '';
  }

  function resolveBullets(obj) {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj;
    if (obj.final_bullets && Array.isArray(obj.final_bullets) && obj.final_bullets.length > 0) return obj.final_bullets;
    if (obj.draft_bullets && Array.isArray(obj.draft_bullets)) return obj.draft_bullets;
    return [];
  }

  function formatCurrency(cents, currency) {
    const amount = (cents / 100).toFixed(2);
    const symbols = { usd: '$', eur: '€', gbp: '£', cad: 'CA$', aud: 'A$', brl: 'R$' };
    const sym = symbols[(currency || 'usd').toLowerCase()] || '$';
    return sym + amount.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function nl2p(text) {
    if (!text) return '';
    return text.split(/\n\n+/).map(p => `<p>${escapeHtml(p.trim())}</p>`).join('');
  }

  // --- Determine the slug from the URL path ---
  function getSlugFromPath() {
    // URL pattern: /slug-name  (served by Express catch-all route)
    const path = window.location.pathname;
    // Remove leading slash, ignore trailing slash
    const slug = path.replace(/^\//, '').replace(/\/$/, '');
    // Ignore known non-slug paths
    const reserved = ['builder', 'static', 'api', ''];
    if (reserved.includes(slug) || slug.startsWith('static/') || slug.startsWith('api/')) return null;
    return slug || null;
  }

  // --- Load proposal data ---
  async function getProposalData() {
    // Priority 1: window.PROPOSAL_DATA (set by builder iframe via postMessage)
    if (window.PROPOSAL_DATA) return window.PROPOSAL_DATA;

    // Priority 2: Fetch from backend API using slug from URL path
    const slug = getSlugFromPath();
    if (slug) {
      try {
        const resp = await fetch('/api/proposals/' + encodeURIComponent(slug));
        if (resp.ok) {
          const data = await resp.json();
          return data;
        }
      } catch (e) {
        console.warn('Failed to fetch proposal from API:', e);
      }
    }

    // Priority 3: Check URL query param ?slug=
    const params = new URLSearchParams(window.location.search);
    const querySlug = params.get('slug');
    if (querySlug) {
      try {
        const resp = await fetch('/api/proposals/' + encodeURIComponent(querySlug));
        if (resp.ok) {
          const data = await resp.json();
          return data;
        }
      } catch (e) {
        console.warn('Failed to fetch proposal from API via query param:', e);
      }
    }

    return null;
  }

  // --- Listen for messages from builder (live preview) ---
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'proposal_update') {
      window.PROPOSAL_DATA = e.data.payload;
      render(e.data.payload);
    }
  });

  // --- Render ---
  function render(data) {
    if (!data) {
      container.innerHTML = '<div style="text-align:center;padding:80px 0;color:var(--color-text-muted);"><p>No proposal data found.</p></div>';
      return;
    }

    const client = data.client || {};
    const project = data.project || {};
    const settings = data.settings || {};
    const pricing = data.pricing || {};
    const currency = pricing.currency || 'usd';
    const systems = data.systems || [];
    const timeline = data.timeline || {};
    const milestones = timeline.milestones || [];
    const scopeBullets = resolveBullets(data.scope_of_work);
    const problemText = resolve(data.problem);
    const solutionText = resolve(data.solution);
    const slug = data.slug || 'proposal';

    // Check if already signed (from server data or localStorage fallback)
    let signedInfo = data.signature || null;
    if (!signedInfo) {
      const signedKey = 'signed_' + slug;
      const signedData = localStorage.getItem(signedKey);
      if (signedData) {
        try { signedInfo = JSON.parse(signedData); } catch (e) { /* ignore */ }
      }
    }

    let html = '';

    // 1) Cover
    html += `
      <div class="proposal-cover">
        <div class="agency-name">FlowTier Automations</div>
        <h1>Automation Proposal</h1>
        <div class="cover-subtitle">Prepared for ${escapeHtml(client.name || 'Client')}${client.company ? ' at ' + escapeHtml(client.company) : ''}</div>
        <div class="cover-meta">
          <span><strong>Project:</strong>&nbsp;${escapeHtml(project.name || 'Untitled')}</span>
          <span><strong>ID:</strong>&nbsp;${escapeHtml(data.proposal_id || '—')}</span>
          <span><strong>Date:</strong>&nbsp;${formatDate(data.created_date) || '—'}</span>
        </div>
      </div>
    `;

    // 2) Executive Summary
    html += `
      <div class="proposal-section">
        <div class="proposal-section-label">Overview</div>
        <h2>Executive Summary</h2>
        <p>Thank you for the opportunity to work with ${escapeHtml(client.company || client.name || 'your team')}. This proposal outlines a tailored automation solution designed to streamline your operations, reduce manual work, and help your business scale efficiently. We have carefully assessed your needs and crafted a system that delivers measurable results from day one.</p>
      </div>
    `;

    // 3) The Problem
    if (problemText) {
      html += `
        <div class="proposal-section">
          <div class="proposal-section-label">Challenge</div>
          <h2>The Problem</h2>
          ${nl2p(problemText)}
        </div>
      `;
    }

    // 4) The Solution
    if (solutionText) {
      html += `
        <div class="proposal-section">
          <div class="proposal-section-label">Approach</div>
          <h2>The Solution</h2>
          ${nl2p(solutionText)}
        </div>
      `;
    }

    // 5) Systems
    if (systems.length > 0) {
      html += `
        <div class="proposal-section">
          <div class="proposal-section-label">Deliverables</div>
          <h2>Systems We Will Deliver</h2>
      `;
      systems.forEach(sys => {
        const summary = resolve({ draft: sys.draft_notes, final: sys.final_copy });
        const deliverables = sys.deliverables || [];
        const requirements = sys.requirements || [];
        const sysImage = sys.image || '';
        const images = sys.images || [];

        html += `<div class="system-card">`;

        // System image + title
        if (settings.show_images && sysImage) {
          html += `<div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">`;
          html += `<img src="${escapeHtml(sysImage)}" alt="" style="width:64px;height:64px;border-radius:12px;object-fit:cover;border:1px solid var(--color-border);flex-shrink:0;">`;
          html += `<h3 style="margin-bottom:0;">${escapeHtml(sys.name)}</h3>`;
          html += `</div>`;
        } else {
          html += `<h3>${escapeHtml(sys.name)}</h3>`;
        }

        if (summary) {
          html += `<div class="system-summary">${escapeHtml(summary)}</div>`;
        }
        if (deliverables.length > 0) {
          html += `<div class="system-list-title">Deliverables</div><ul>`;
          deliverables.forEach(d => { html += `<li>${escapeHtml(d)}</li>`; });
          html += `</ul>`;
        }
        if (requirements.length > 0) {
          html += `<div class="system-list-title">Requirements</div><ul>`;
          requirements.forEach(r => { html += `<li>${escapeHtml(r)}</li>`; });
          html += `</ul>`;
        }
        if (settings.show_images && images.length > 0) {
          html += `<div style="margin-top:16px;display:flex;gap:12px;flex-wrap:wrap;">`;
          images.forEach(img => {
            html += `<img src="${escapeHtml(img)}" alt="" style="max-width:200px;border-radius:8px;border:1px solid var(--color-border);">`;
          });
          html += `</div>`;
        }
        html += `</div>`;
      });
      html += `</div>`;
    }

    // 6) Scope of Work
    if (scopeBullets.length > 0) {
      html += `
        <div class="proposal-section">
          <div class="proposal-section-label">Scope</div>
          <h2>Scope of Work</h2>
          <ul class="scope-list">
      `;
      scopeBullets.forEach(b => {
        html += `<li><span class="scope-icon">&#10003;</span><span>${escapeHtml(b)}</span></li>`;
      });
      html += `</ul></div>`;
    }

    // 7) Timeline
    if (milestones.length > 0) {
      html += `
        <div class="proposal-section">
          <div class="proposal-section-label">Schedule</div>
          <h2>Timeline</h2>
          <div class="timeline-list">
      `;
      milestones.forEach(m => {
        html += `
          <div class="timeline-item">
            <div class="timeline-when">${escapeHtml(m.when || '')}</div>
            <h4>${escapeHtml(m.title || '')}</h4>
            <p>${escapeHtml(m.details || '')}</p>
          </div>
        `;
      });
      html += `</div></div>`;
    }

    // 8) Investment & Pricing
    const items = pricing.items || [];
    if (items.length > 0) {
      html += `
        <div class="proposal-section">
          <div class="proposal-section-label">Investment</div>
          <h2>Investment &amp; Pricing</h2>
          <table class="pricing-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
      `;
      items.forEach(item => {
        html += `
          <tr>
            <td><strong>${escapeHtml(item.name || '')}</strong></td>
            <td><span class="item-desc">${escapeHtml(item.description || '')}</span></td>
            <td>${formatCurrency(item.amount_cents || 0, currency)}</td>
          </tr>
        `;
      });
      const total = pricing.total_cents || items.reduce((s, i) => s + (i.amount_cents || 0), 0);
      html += `
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2"><strong>Total</strong></td>
                <td>${formatCurrency(total, currency)}</td>
              </tr>
            </tfoot>
          </table>
      `;
      if (pricing.notes) {
        html += `<div class="pricing-notes">${escapeHtml(pricing.notes)}</div>`;
      }
      if (settings.deposit_required) {
        html += `<div class="deposit-note">A 50% deposit is required to begin work. The remaining balance is due upon project completion.</div>`;
      }
      html += `</div>`;
    }

    // 9) What You Can Expect
    html += `
      <div class="proposal-section">
        <div class="proposal-section-label">Expectations</div>
        <h2>What You Can Expect</h2>
        <p>Once this proposal is accepted, our team will begin onboarding immediately. You will receive a dedicated project manager, regular progress updates, and full documentation of every system we build. Our goal is to deliver a seamless experience from start to finish, ensuring your automations are running smoothly and generating value from day one.</p>
        <p>We stand behind our work with ongoing support and optimization to ensure long-term success for your business.</p>
      </div>
    `;

    // 10) Terms & Clauses
    html += `
      <div class="proposal-section terms-section">
        <div class="proposal-section-label">Legal</div>
        <h2>Terms &amp; Conditions</h2>

        <h4>Payment Terms</h4>
        <p>All fees are due as outlined in the pricing section above. Late payments may incur a 1.5% monthly interest charge. We reserve the right to pause work if payments are more than 14 days overdue.</p>

        <h4>Change Requests</h4>
        <p>Any changes to the agreed scope of work must be submitted in writing. Additional work beyond the original scope will be quoted separately and requires written approval before implementation.</p>

        <h4>Client Responsibilities</h4>
        <p>The client agrees to provide timely access to all necessary accounts, credentials, content, and feedback required to complete the project. Delays caused by the client may impact the project timeline.</p>

        <h4>Confidentiality</h4>
        <p>Both parties agree to keep all project-related information confidential. Neither party will disclose proprietary business information, strategies, or technical details to third parties without written consent.</p>

        <h4>Intellectual Property</h4>
        <p>Upon receipt of full payment, all custom-built automations, workflows, and deliverables become the intellectual property of the client. Until full payment is received, all work remains the property of FlowTier Automations.</p>

        <h4>Limitation of Liability</h4>
        <p>FlowTier Automations shall not be held liable for any indirect, incidental, or consequential damages arising from the use of delivered systems. Our total liability shall not exceed the total amount paid for the project.</p>

        <h4>Termination</h4>
        <p>Either party may terminate this agreement with 14 days written notice. In the event of termination, the client will be invoiced for all work completed up to the termination date.</p>

        <h4>Acceptance</h4>
        <p>By signing below, the client acknowledges that they have read, understood, and agree to all terms outlined in this proposal. This constitutes a binding agreement between the client and FlowTier Automations.</p>

        <h4>Electronic Signature Consent</h4>
        <p>By providing an electronic signature below, the client consents to the use of electronic signatures and agrees that such signatures carry the same legal weight as handwritten signatures.</p>
      </div>
    `;

    // 11) Signature & Acceptance
    html += `<div class="signature-block" id="signatureBlock">`;
    html += `<div class="proposal-section-label">Agreement</div>`;
    html += `<h2>Signature &amp; Acceptance</h2>`;
    html += `<p>Please review the proposal above and sign below to accept.</p>`;

    if (signedInfo) {
      // Already signed
      html += renderSignedConfirmation(signedInfo, settings);
    } else {
      // Sign form
      html += `
        <form id="signForm" onsubmit="return false;">
          <div class="signature-fields">
            <div class="form-group">
              <label for="sigName">Full Name *</label>
              <input type="text" id="sigName" required placeholder="Your full name">
            </div>
            <div class="form-group">
              <label for="sigEmail">Email Address *</label>
              <input type="email" id="sigEmail" required placeholder="your@email.com">
            </div>
          </div>
          <div class="form-group">
            <label class="checkbox-wrap">
              <input type="checkbox" id="sigAgree" required>
              <span>I have read and agree to the terms and conditions outlined in this proposal.</span>
            </label>
          </div>
          <div style="margin-top:20px;">
            <button type="button" class="btn btn-primary btn-lg" id="signBtn" onclick="handleSign()">Sign &amp; Continue</button>
          </div>
        </form>
      `;
    }

    html += `</div>`;

    container.innerHTML = html;

    // Update page title
    document.title = `Proposal — ${project.name || 'Untitled'} | ${client.company || client.name || 'Client'}`;
  }

  function renderSignedConfirmation(info, settings) {
    const payText = (settings && settings.pay_button_text) ? settings.pay_button_text : 'Pay Now';
    const timestamp = info.signed_at ? formatDate(info.signed_at) + ' at ' + new Date(info.signed_at).toLocaleTimeString() : (info.timestamp || '');
    return `
      <div class="signature-confirmation">
        <div class="check-icon">&#10003;</div>
        <h3>Proposal Accepted</h3>
        <p><strong>${escapeHtml(info.name)}</strong></p>
        <p>${escapeHtml(info.email)}</p>
        <p style="color:var(--color-text-muted);font-size:0.8125rem;">Signed on ${escapeHtml(timestamp)}</p>
        <div class="pay-btn-wrap">
          <button class="btn btn-success btn-lg" onclick="document.getElementById('stripeModal').classList.add('active')">${escapeHtml(payText)}</button>
        </div>
      </div>
    `;
  }

  // --- Sign handler (global) ---
  window.handleSign = async function () {
    const name = document.getElementById('sigName');
    const email = document.getElementById('sigEmail');
    const agree = document.getElementById('sigAgree');

    if (!name || !email || !agree) return;

    if (!name.value.trim()) { name.focus(); return alert('Please enter your full name.'); }
    if (!email.value.trim()) { email.focus(); return alert('Please enter your email address.'); }
    if (!agree.checked) { return alert('You must agree to the terms and conditions.'); }

    const slug = getSlugFromPath() || (window.PROPOSAL_DATA ? window.PROPOSAL_DATA.slug : null) || 'proposal';
    const settings = window.PROPOSAL_DATA ? (window.PROPOSAL_DATA.settings || {}) : {};

    const signData = {
      name: name.value.trim(),
      email: email.value.trim()
    };

    // Try to save signature to backend
    let signedInfo = null;
    try {
      const resp = await fetch('/api/proposals/' + encodeURIComponent(slug) + '/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signData)
      });
      if (resp.ok) {
        const result = await resp.json();
        signedInfo = result.signature;
      }
    } catch (e) {
      console.warn('Could not save signature to server:', e);
    }

    // Fallback: save to localStorage
    if (!signedInfo) {
      signedInfo = {
        name: signData.name,
        email: signData.email,
        timestamp: new Date().toLocaleString()
      };
      localStorage.setItem('signed_' + slug, JSON.stringify(signedInfo));
    }

    // Replace form with confirmation
    const block = document.getElementById('signatureBlock');
    if (block) {
      const form = document.getElementById('signForm');
      if (form) {
        form.outerHTML = renderSignedConfirmation(signedInfo, settings);
      }
    }
  };

  // --- Initial render ---
  async function boot() {
    const data = await getProposalData();
    if (data) {
      window.PROPOSAL_DATA = data;
      render(data);
    } else {
      container.innerHTML = '<div style="text-align:center;padding:80px 0;color:var(--color-text-muted);"><h2 style="margin-bottom:12px;">No Proposal Data</h2><p>This proposal is loading via the builder preview.</p></div>';
    }
  }

  boot();

})();
