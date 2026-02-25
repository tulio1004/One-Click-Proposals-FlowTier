/* ============================================
   PROPOSAL.JS — Client Proposal Renderer
   FlowTier Automations
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
    var amount = (cents / 100).toFixed(2);
    var symbols = { usd: '$', eur: '€', gbp: '£', cad: 'CA$', aud: 'A$', brl: 'R$' };
    var sym = symbols[(currency || 'usd').toLowerCase()] || '$';
    return sym + amount.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function nl2p(text) {
    if (!text) return '';
    return text.split(/\n\n+/).map(function (p) { return '<p>' + escapeHtml(p.trim()) + '</p>'; }).join('');
  }

  // --- Determine the slug from the URL path ---
  function getSlugFromPath() {
    var path = window.location.pathname;
    var slug = path.replace(/^\//, '').replace(/\/$/, '');
    var reserved = ['builder', 'static', 'api', ''];
    if (reserved.indexOf(slug) !== -1 || slug.indexOf('static/') === 0 || slug.indexOf('api/') === 0) return null;
    return slug || null;
  }

  // --- Load proposal data ---
  async function getProposalData() {
    if (window.PROPOSAL_DATA) return window.PROPOSAL_DATA;

    var slug = getSlugFromPath();
    if (slug) {
      try {
        var resp = await fetch('/api/proposals/' + encodeURIComponent(slug));
        if (resp.ok) return await resp.json();
      } catch (e) {
        console.warn('Failed to fetch proposal from API:', e);
      }
    }

    var params = new URLSearchParams(window.location.search);
    var querySlug = params.get('slug');
    if (querySlug) {
      try {
        var resp2 = await fetch('/api/proposals/' + encodeURIComponent(querySlug));
        if (resp2.ok) return await resp2.json();
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

  // --- Check for payment success in URL ---
  function checkPaymentSuccess() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      var sessionId = params.get('session_id');
      var slug = getSlugFromPath();
      if (sessionId && slug) {
        // Verify payment with backend
        fetch('/api/proposals/' + encodeURIComponent(slug) + '/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId })
        }).then(function (r) { return r.json(); }).then(function (data) {
          if (data.success) {
            // Reload to show updated state
            window.location.href = window.location.pathname;
          }
        }).catch(function () {});
      }
    }
  }

  // --- Render ---
  function render(data) {
    if (!data) {
      container.innerHTML = '<div style="text-align:center;padding:80px 0;color:var(--color-text-muted);"><p>No proposal data found.</p></div>';
      return;
    }

    var client = data.client || {};
    var project = data.project || {};
    var settings = data.settings || {};
    var pricing = data.pricing || {};
    var currency = pricing.currency || 'usd';
    var systems = data.systems || [];
    var timeline = data.timeline || {};
    var milestones = timeline.milestones || [];
    var scopeBullets = resolveBullets(data.scope_of_work);
    var problemText = resolve(data.problem);
    var solutionText = resolve(data.solution);
    var slug = data.slug || 'proposal';

    // Check if already signed
    var signedInfo = data.signature || null;
    if (!signedInfo) {
      var signedKey = 'signed_' + slug;
      var signedData = localStorage.getItem(signedKey);
      if (signedData) {
        try { signedInfo = JSON.parse(signedData); } catch (e) { /* ignore */ }
      }
    }

    // Check if already paid
    var paymentInfo = data.payment || null;

    var html = '';

    // ============================
    // 1) HERO HEADER with background image and logo
    // ============================
    html += '<div class="proposal-hero">';
    html += '<div class="proposal-hero-bg" style="background-image:url(\'/static/images/header-bg.png\');"></div>';
    html += '<div class="proposal-hero-overlay"></div>';
    html += '<div class="proposal-hero-content">';
    html += '<img src="/static/images/logo.webp" alt="FlowTier" class="proposal-hero-logo">';
    html += '<h1>Automation Proposal</h1>';
    html += '<div class="cover-subtitle">Prepared for ' + escapeHtml(client.name || 'Client') + (client.company ? ' at ' + escapeHtml(client.company) : '') + '</div>';
    html += '<div class="cover-meta">';
    html += '<span><strong>Project:</strong>&nbsp;' + escapeHtml(project.name || 'Untitled') + '</span>';
    html += '<span><strong>ID:</strong>&nbsp;' + escapeHtml(data.proposal_id || '—') + '</span>';
    html += '<span><strong>Date:</strong>&nbsp;' + (formatDate(data.created_date) || '—') + '</span>';
    html += '</div>';
    html += '</div></div>';

    // ============================
    // 2) Executive Summary
    // ============================
    html += '<div class="proposal-section">';
    html += '<div class="proposal-section-label">Overview</div>';
    html += '<h2>Executive Summary</h2>';
    html += '<p>Thank you for the opportunity to work with ' + escapeHtml(client.company || client.name || 'your team') + '. This proposal outlines a tailored automation solution designed to streamline your operations, reduce manual work, and help your business scale efficiently. We have carefully assessed your needs and crafted a system that delivers measurable results from day one.</p>';
    html += '</div>';

    // ============================
    // 3) The Problem
    // ============================
    if (problemText) {
      html += '<div class="proposal-section">';
      html += '<div class="proposal-section-label">Challenge</div>';
      html += '<h2>The Problem</h2>';
      html += nl2p(problemText);
      html += '</div>';
    }

    // ============================
    // 4) The Solution
    // ============================
    if (solutionText) {
      html += '<div class="proposal-section">';
      html += '<div class="proposal-section-label">Approach</div>';
      html += '<h2>The Solution</h2>';
      html += nl2p(solutionText);
      html += '</div>';
    }

    // ============================
    // 5) Systems — 2-column grid with larger images
    // ============================
    if (systems.length > 0) {
      html += '<div class="proposal-section">';
      html += '<div class="proposal-section-label">Deliverables</div>';
      html += '<h2>Systems We Will Deliver</h2>';
      html += '<div class="systems-grid">';

      systems.forEach(function (sys) {
        var summary = resolve({ draft: sys.draft_notes, final: sys.final_copy });
        var deliverables = sys.deliverables || [];
        var requirements = sys.requirements || [];
        var sysImage = sys.image || '';

        html += '<div class="system-card-v2">';

        // System image (large, top of card)
        if (settings.show_images !== false && sysImage) {
          html += '<div class="system-card-image">';
          html += '<img src="' + escapeHtml(sysImage) + '" alt="' + escapeHtml(sys.name) + '">';
          html += '</div>';
        }

        html += '<div class="system-card-body">';
        html += '<h3>' + escapeHtml(sys.name) + '</h3>';

        if (summary) {
          html += '<div class="system-summary">' + escapeHtml(summary) + '</div>';
        }

        if (deliverables.length > 0) {
          html += '<div class="system-list-title">Deliverables</div><ul>';
          deliverables.forEach(function (d) { html += '<li>' + escapeHtml(d) + '</li>'; });
          html += '</ul>';
        }

        if (requirements.length > 0) {
          html += '<div class="system-list-title">Requirements</div><ul>';
          requirements.forEach(function (r) { html += '<li>' + escapeHtml(r) + '</li>'; });
          html += '</ul>';
        }

        html += '</div></div>';
      });

      html += '</div></div>';
    }

    // ============================
    // 6) Scope of Work
    // ============================
    if (scopeBullets.length > 0) {
      html += '<div class="proposal-section">';
      html += '<div class="proposal-section-label">Scope</div>';
      html += '<h2>Scope of Work</h2>';
      html += '<ul class="scope-list">';
      scopeBullets.forEach(function (b) {
        html += '<li><span class="scope-icon">&#10003;</span><span>' + escapeHtml(b) + '</span></li>';
      });
      html += '</ul></div>';
    }

    // ============================
    // 7) Timeline
    // ============================
    if (milestones.length > 0) {
      html += '<div class="proposal-section">';
      html += '<div class="proposal-section-label">Schedule</div>';
      html += '<h2>Timeline</h2>';
      html += '<div class="timeline-list">';
      milestones.forEach(function (m) {
        html += '<div class="timeline-item">';
        html += '<div class="timeline-when">' + escapeHtml(m.when || '') + '</div>';
        html += '<h4>' + escapeHtml(m.title || '') + '</h4>';
        html += '<p>' + escapeHtml(m.details || '') + '</p>';
        html += '</div>';
      });
      html += '</div></div>';
    }

    // ============================
    // 8) Investment & Pricing (new model)
    // ============================
    var items = pricing.items || [];
    if (items.length > 0) {
      var hasMonthly = items.some(function (i) { return i.pricing_type === 'setup_monthly'; });

      html += '<div class="proposal-section">';
      html += '<div class="proposal-section-label">Investment</div>';
      html += '<h2>Investment &amp; Pricing</h2>';
      html += '<table class="pricing-table">';
      html += '<thead><tr>';
      html += '<th>Item</th>';
      html += '<th>Type</th>';
      html += '<th>Setup / One-Time</th>';
      if (hasMonthly) html += '<th>Monthly</th>';
      html += '</tr></thead>';
      html += '<tbody>';

      items.forEach(function (item) {
        var typeLabel = item.pricing_type === 'setup_monthly' ? 'Setup + Monthly' : 'One-Time';
        html += '<tr>';
        html += '<td><strong>' + escapeHtml(item.name || '') + '</strong></td>';
        html += '<td><span class="pricing-type-badge pricing-type-' + (item.pricing_type || 'one_time') + '">' + typeLabel + '</span></td>';
        html += '<td>' + formatCurrency(item.setup_cents || 0, currency) + '</td>';
        if (hasMonthly) {
          if (item.pricing_type === 'setup_monthly' && item.monthly_cents) {
            html += '<td>' + formatCurrency(item.monthly_cents, currency) + '/mo</td>';
          } else {
            html += '<td>—</td>';
          }
        }
        html += '</tr>';
      });

      // Totals
      var totalSetup = pricing.total_setup_cents || items.reduce(function (s, i) { return s + (i.setup_cents || 0); }, 0);
      var totalMonthly = pricing.total_monthly_cents || items.reduce(function (s, i) { return s + (i.pricing_type === 'setup_monthly' ? (i.monthly_cents || 0) : 0); }, 0);

      html += '</tbody><tfoot>';
      html += '<tr class="total-row">';
      html += '<td colspan="2"><strong>Total Setup / One-Time</strong></td>';
      html += '<td><strong>' + formatCurrency(totalSetup, currency) + '</strong></td>';
      if (hasMonthly) html += '<td></td>';
      html += '</tr>';

      if (totalMonthly > 0) {
        html += '<tr class="total-row">';
        html += '<td colspan="2"><strong>Total Monthly</strong></td>';
        html += '<td></td>';
        if (hasMonthly) html += '<td><strong>' + formatCurrency(totalMonthly, currency) + '/mo</strong></td>';
        html += '</tr>';
      }

      // Due Now
      var dueNow = pricing.due_now_cents || 0;
      if (dueNow > 0) {
        html += '<tr class="due-now-row">';
        html += '<td colspan="2"><strong>Due Now</strong></td>';
        html += '<td colspan="' + (hasMonthly ? '2' : '1') + '"><strong class="due-now-amount">' + formatCurrency(dueNow, currency) + '</strong></td>';
        html += '</tr>';
      }

      html += '</tfoot></table>';

      if (pricing.notes) {
        html += '<div class="pricing-notes">' + escapeHtml(pricing.notes) + '</div>';
      }

      html += '</div>';
    }

    // ============================
    // 9) What You Can Expect
    // ============================
    html += '<div class="proposal-section">';
    html += '<div class="proposal-section-label">Expectations</div>';
    html += '<h2>What You Can Expect</h2>';
    html += '<p>Once this proposal is accepted, our team will begin onboarding immediately. You will receive a dedicated project manager, regular progress updates, and full documentation of every system we build. Our goal is to deliver a seamless experience from start to finish, ensuring your automations are running smoothly and generating value from day one.</p>';
    html += '<p>We stand behind our work with ongoing support and optimization to ensure long-term success for your business.</p>';
    html += '</div>';

    // ============================
    // 10) Terms & Conditions
    // ============================
    html += '<div class="proposal-section terms-section">';
    html += '<div class="proposal-section-label">Legal</div>';
    html += '<h2>Terms &amp; Conditions</h2>';

    html += '<h4>Payment Terms</h4>';
    html += '<p>All fees are due as outlined in the pricing section above. Late payments may incur a 1.5% monthly interest charge. We reserve the right to pause work if payments are more than 14 days overdue.</p>';

    html += '<h4>Change Requests</h4>';
    html += '<p>Any changes to the agreed scope of work must be submitted in writing. Additional work beyond the original scope will be quoted separately and requires written approval before implementation.</p>';

    html += '<h4>Client Responsibilities</h4>';
    html += '<p>The client agrees to provide timely access to all necessary accounts, credentials, content, and feedback required to complete the project. Delays caused by the client may impact the project timeline.</p>';

    html += '<h4>Confidentiality</h4>';
    html += '<p>Both parties agree to keep all project-related information confidential. Neither party will disclose proprietary business information, strategies, or technical details to third parties without written consent.</p>';

    html += '<h4>Intellectual Property</h4>';
    html += '<p>Upon receipt of full payment, all custom-built automations, workflows, and deliverables become the intellectual property of the client. Until full payment is received, all work remains the property of FlowTier Automations.</p>';

    html += '<h4>Limitation of Liability</h4>';
    html += '<p>FlowTier Automations shall not be held liable for any indirect, incidental, or consequential damages arising from the use of delivered systems. Our total liability shall not exceed the total amount paid for the project.</p>';

    html += '<h4>Termination</h4>';
    html += '<p>Either party may terminate this agreement with 14 days written notice. In the event of termination, the client will be invoiced for all work completed up to the termination date.</p>';

    html += '<h4>Acceptance</h4>';
    html += '<p>By signing below, the client acknowledges that they have read, understood, and agree to all terms outlined in this proposal. This constitutes a binding agreement between the client and FlowTier Automations.</p>';

    html += '<h4>Electronic Signature Consent</h4>';
    html += '<p>By providing an electronic signature below, the client consents to the use of electronic signatures and agrees that such signatures carry the same legal weight as handwritten signatures.</p>';

    html += '</div>';

    // ============================
    // 11) Signature & Acceptance
    // ============================
    html += '<div class="signature-block" id="signatureBlock">';
    html += '<div class="proposal-section-label">Agreement</div>';
    html += '<h2>Signature &amp; Acceptance</h2>';
    html += '<p>Please review the proposal above and sign below to accept.</p>';

    if (paymentInfo) {
      // Already paid
      html += renderPaidConfirmation(paymentInfo, signedInfo, settings, currency);
    } else if (signedInfo) {
      // Signed but not paid
      html += renderSignedConfirmation(signedInfo, settings, slug, pricing);
    } else {
      // Sign form
      html += '<form id="signForm" onsubmit="return false;">';
      html += '<div class="signature-fields">';
      html += '<div class="form-group"><label for="sigName">Full Name *</label><input type="text" id="sigName" required placeholder="Your full name"></div>';
      html += '<div class="form-group"><label for="sigEmail">Email Address *</label><input type="email" id="sigEmail" required placeholder="your@email.com"></div>';
      html += '</div>';
      html += '<div class="form-group"><label class="checkbox-wrap"><input type="checkbox" id="sigAgree" required><span>I have read and agree to the terms and conditions outlined in this proposal.</span></label></div>';
      html += '<div style="margin-top:20px;"><button type="button" class="btn btn-primary btn-lg" id="signBtn" onclick="handleSign()">Sign &amp; Continue</button></div>';
      html += '</form>';
    }

    html += '</div>';

    container.innerHTML = html;

    // Update page title
    document.title = 'Proposal — ' + (project.name || 'Untitled') + ' | ' + (client.company || client.name || 'Client');
  }

  function renderSignedConfirmation(info, settings, slug, pricing) {
    var payText = (settings && settings.pay_button_text) ? settings.pay_button_text : 'Pay Now';
    var timestamp = info.signed_at ? formatDate(info.signed_at) + ' at ' + new Date(info.signed_at).toLocaleTimeString() : (info.timestamp || '');
    var dueNow = (pricing && pricing.due_now_cents) || 0;

    var html = '<div class="signature-confirmation">';
    html += '<div class="check-icon">&#10003;</div>';
    html += '<h3>Proposal Accepted</h3>';
    html += '<p><strong>' + escapeHtml(info.name) + '</strong></p>';
    html += '<p>' + escapeHtml(info.email) + '</p>';
    html += '<p style="color:var(--color-text-muted);font-size:0.8125rem;">Signed on ' + escapeHtml(timestamp) + '</p>';

    if (dueNow > 0) {
      var currency = (pricing && pricing.currency) || 'usd';
      html += '<div class="pay-btn-wrap">';
      html += '<p style="margin-bottom:12px;font-size:0.9375rem;">Amount due: <strong>' + formatCurrency(dueNow, currency) + '</strong></p>';
      html += '<button class="btn btn-success btn-lg" id="payNowBtn" onclick="handlePayment(\'' + escapeHtml(slug) + '\')">' + escapeHtml(payText) + '</button>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function renderPaidConfirmation(payment, signature, settings, currency) {
    var html = '<div class="signature-confirmation">';
    html += '<div class="check-icon" style="background:var(--color-success);">&#10003;</div>';
    html += '<h3>Payment Received</h3>';
    if (signature) {
      html += '<p><strong>' + escapeHtml(signature.name) + '</strong></p>';
    }
    html += '<p>Amount paid: <strong>' + formatCurrency(payment.amount_cents || 0, currency) + '</strong></p>';
    html += '<p style="color:var(--color-text-muted);font-size:0.8125rem;">Paid on ' + escapeHtml(formatDate(payment.paid_at)) + '</p>';
    html += '<p style="color:var(--color-success);font-weight:600;margin-top:12px;">Thank you! We will begin work shortly.</p>';
    html += '</div>';
    return html;
  }

  // --- Sign handler (global) ---
  window.handleSign = async function () {
    var name = document.getElementById('sigName');
    var email = document.getElementById('sigEmail');
    var agree = document.getElementById('sigAgree');

    if (!name || !email || !agree) return;
    if (!name.value.trim()) { name.focus(); return alert('Please enter your full name.'); }
    if (!email.value.trim()) { email.focus(); return alert('Please enter your email address.'); }
    if (!agree.checked) { return alert('You must agree to the terms and conditions.'); }

    var slug = getSlugFromPath() || (window.PROPOSAL_DATA ? window.PROPOSAL_DATA.slug : null) || 'proposal';
    var settings = window.PROPOSAL_DATA ? (window.PROPOSAL_DATA.settings || {}) : {};
    var pricing = window.PROPOSAL_DATA ? (window.PROPOSAL_DATA.pricing || {}) : {};

    var signData = { name: name.value.trim(), email: email.value.trim() };

    // Save signature to backend
    var signedInfo = null;
    try {
      var resp = await fetch('/api/proposals/' + encodeURIComponent(slug) + '/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signData)
      });
      if (resp.ok) {
        var result = await resp.json();
        signedInfo = result.signature;
      }
    } catch (e) {
      console.warn('Could not save signature to server:', e);
    }

    // Fallback: save to localStorage
    if (!signedInfo) {
      signedInfo = { name: signData.name, email: signData.email, timestamp: new Date().toLocaleString() };
      localStorage.setItem('signed_' + slug, JSON.stringify(signedInfo));
    }

    // Replace form with confirmation
    var block = document.getElementById('signatureBlock');
    if (block) {
      var form = document.getElementById('signForm');
      if (form) {
        form.outerHTML = renderSignedConfirmation(signedInfo, settings, slug, pricing);
      }
    }
  };

  // --- Payment handler (global) ---
  window.handlePayment = async function (slug) {
    var btn = document.getElementById('payNowBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Processing...';
    }

    try {
      var resp = await fetch('/api/proposals/' + encodeURIComponent(slug) + '/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      var data = await resp.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        alert('Error creating checkout session: ' + (data.error || 'Unknown error'));
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Pay Now';
        }
      }
    } catch (err) {
      alert('Payment error: ' + err.message);
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Pay Now';
      }
    }
  };

  // --- Initial render ---
  async function boot() {
    checkPaymentSuccess();

    var data = await getProposalData();
    if (data) {
      window.PROPOSAL_DATA = data;
      render(data);
    } else {
      container.innerHTML = '<div style="text-align:center;padding:80px 0;color:var(--color-text-muted);"><h2 style="margin-bottom:12px;">No Proposal Data</h2><p>This proposal is loading via the builder preview.</p></div>';
    }
  }

  boot();

})();
