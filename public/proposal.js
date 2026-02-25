/* ============================================
   PROPOSAL.JS — Client Proposal Renderer
   FlowTier Automations
   ============================================ */

(function () {
  'use strict';

  var container = document.getElementById('proposalContainer');

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
  function getProposalData() {
    if (window.PROPOSAL_DATA) return Promise.resolve(window.PROPOSAL_DATA);

    var slug = getSlugFromPath();
    if (slug) {
      return fetch('/api/proposals/' + encodeURIComponent(slug))
        .then(function (resp) {
          if (resp.ok) return resp.json();
          return null;
        })
        .catch(function () { return null; });
    }

    var params = new URLSearchParams(window.location.search);
    var querySlug = params.get('slug');
    if (querySlug) {
      return fetch('/api/proposals/' + encodeURIComponent(querySlug))
        .then(function (resp) {
          if (resp.ok) return resp.json();
          return null;
        })
        .catch(function () { return null; });
    }

    return Promise.resolve(null);
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
        fetch('/api/proposals/' + encodeURIComponent(slug) + '/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId })
        }).then(function (r) { return r.json(); }).then(function (data) {
          if (data.success) {
            window.location.href = window.location.pathname;
          }
        }).catch(function () {});
      }
    }
  }

  // ============================================
  // SIGNATURE PAD (Canvas Drawing)
  // ============================================
  var signatureCanvas = null;
  var signatureCtx = null;
  var isDrawing = false;
  var signatureMode = 'type'; // 'type' or 'draw'

  function initSignaturePad() {
    signatureCanvas = document.getElementById('signatureCanvas');
    if (!signatureCanvas) return;

    signatureCtx = signatureCanvas.getContext('2d');

    // Set canvas size
    var rect = signatureCanvas.parentElement.getBoundingClientRect();
    signatureCanvas.width = rect.width || 500;
    signatureCanvas.height = 150;

    signatureCtx.strokeStyle = '#00E676';
    signatureCtx.lineWidth = 2.5;
    signatureCtx.lineCap = 'round';
    signatureCtx.lineJoin = 'round';

    // Mouse events
    signatureCanvas.addEventListener('mousedown', startDrawing);
    signatureCanvas.addEventListener('mousemove', draw);
    signatureCanvas.addEventListener('mouseup', stopDrawing);
    signatureCanvas.addEventListener('mouseleave', stopDrawing);

    // Touch events
    signatureCanvas.addEventListener('touchstart', function (e) {
      e.preventDefault();
      var touch = e.touches[0];
      var rect = signatureCanvas.getBoundingClientRect();
      startDrawing({ offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top });
    });
    signatureCanvas.addEventListener('touchmove', function (e) {
      e.preventDefault();
      var touch = e.touches[0];
      var rect = signatureCanvas.getBoundingClientRect();
      draw({ offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top });
    });
    signatureCanvas.addEventListener('touchend', stopDrawing);
  }

  function startDrawing(e) {
    isDrawing = true;
    signatureCtx.beginPath();
    signatureCtx.moveTo(e.offsetX, e.offsetY);
  }

  function draw(e) {
    if (!isDrawing) return;
    signatureCtx.lineTo(e.offsetX, e.offsetY);
    signatureCtx.stroke();
  }

  function stopDrawing() {
    isDrawing = false;
  }

  window.clearSignaturePad = function () {
    if (signatureCanvas && signatureCtx) {
      signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    }
  };

  window.switchSignatureMode = function (mode) {
    signatureMode = mode;
    var typeTab = document.getElementById('sigTabType');
    var drawTab = document.getElementById('sigTabDraw');
    var typePanel = document.getElementById('sigPanelType');
    var drawPanel = document.getElementById('sigPanelDraw');

    if (mode === 'type') {
      typeTab.classList.add('active');
      drawTab.classList.remove('active');
      typePanel.style.display = 'block';
      drawPanel.style.display = 'none';
    } else {
      typeTab.classList.remove('active');
      drawTab.classList.add('active');
      typePanel.style.display = 'none';
      drawPanel.style.display = 'block';
      setTimeout(initSignaturePad, 100);
    }
  };

  // ============================================
  // PDF DOWNLOAD
  // ============================================
  window.downloadPDF = function () {
    var btn = document.getElementById('downloadPdfBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Generating PDF...';
    }

    // Hide signature block and PDF button for clean print
    var sigBlock = document.getElementById('signatureBlock');
    var pdfBtnWrap = document.getElementById('pdfDownloadWrap');
    if (sigBlock) sigBlock.style.display = 'none';
    if (pdfBtnWrap) pdfBtnWrap.style.display = 'none';

    setTimeout(function () {
      window.print();

      // Restore
      if (sigBlock) sigBlock.style.display = '';
      if (pdfBtnWrap) pdfBtnWrap.style.display = '';
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Download PDF';
      }
    }, 300);
  };

  // ============================================
  // RENDER
  // ============================================
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
    var companyName = client.company || client.name || 'Client';

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
    // 1) HERO HEADER
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
    // PDF Download Button
    // ============================
    html += '<div class="pdf-download-wrap" id="pdfDownloadWrap">';
    html += '<button class="btn btn-secondary" id="downloadPdfBtn" onclick="downloadPDF()">&#128196; Download PDF</button>';
    html += '</div>';

    // ============================
    // 2) Executive Summary
    // ============================
    html += '<div class="proposal-section">';
    html += '<div class="proposal-section-label">Overview</div>';
    html += '<h2>Executive Summary</h2>';
    html += '<p>Thank you for the opportunity to work with ' + escapeHtml(companyName) + '. This proposal outlines a tailored automation solution designed to streamline your operations, reduce manual work, and help your business scale efficiently. We have carefully assessed your needs and crafted a system that delivers measurable results from day one.</p>';
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
    // 5) Systems — 2-column grid
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
        html += '<div class="timeline-dot"></div>';
        html += '<div class="timeline-when">' + escapeHtml(m.when || '') + '</div>';
        html += '<h4>' + escapeHtml(m.title || '') + '</h4>';
        html += '<p>' + escapeHtml(m.details || '') + '</p>';
        html += '</div>';
      });
      html += '</div></div>';
    }

    // ============================
    // 8) Investment & Pricing — 3 Types
    // ============================
    var items = pricing.items || [];
    if (items.length > 0) {
      var hasSetup = items.some(function (i) { return i.pricing_type === 'setup_fee'; });
      var hasMonthly = items.some(function (i) { return i.pricing_type === 'monthly'; });

      html += '<div class="proposal-section">';
      html += '<div class="proposal-section-label">Investment</div>';
      html += '<h2>Investment &amp; Pricing</h2>';
      html += '<table class="pricing-table">';
      html += '<thead><tr>';
      html += '<th>Item</th>';
      html += '<th>Type</th>';
      html += '<th>Amount</th>';
      html += '</tr></thead>';
      html += '<tbody>';

      items.forEach(function (item) {
        var typeLabels = {
          'one_time': 'One-Time',
          'setup_fee': 'Setup Fee',
          'monthly': 'Monthly'
        };
        var typeLabel = typeLabels[item.pricing_type] || 'One-Time';
        var amountCents = item.amount_cents || 0;
        var amountStr = formatCurrency(amountCents, currency);
        if (item.pricing_type === 'monthly') {
          amountStr += '/mo';
        }

        html += '<tr>';
        html += '<td>';
        html += '<strong>' + escapeHtml(item.name || '') + '</strong>';
        if (item.description) {
          html += '<div class="pricing-item-description">' + escapeHtml(item.description) + '</div>';
        }
        if (item.due_date) {
          html += '<div class="pricing-item-due-date">Due: ' + escapeHtml(item.due_date) + '</div>';
        }
        html += '</td>';
        html += '<td><span class="pricing-type-badge pricing-type-' + (item.pricing_type || 'one_time') + '">' + typeLabel + '</span></td>';
        html += '<td>' + amountStr + '</td>';
        html += '</tr>';
      });

      html += '</tbody><tfoot>';

      // Total One-Time
      var totalOneTime = pricing.total_onetime_cents || items.reduce(function (s, i) {
        return s + (i.pricing_type === 'one_time' ? (i.amount_cents || 0) : 0);
      }, 0);
      if (totalOneTime > 0) {
        html += '<tr class="total-row">';
        html += '<td colspan="2"><strong>Total One-Time</strong></td>';
        html += '<td><strong>' + formatCurrency(totalOneTime, currency) + '</strong></td>';
        html += '</tr>';
      }

      // Total Setup Fees
      var totalSetup = pricing.total_setup_cents || items.reduce(function (s, i) {
        return s + (i.pricing_type === 'setup_fee' ? (i.amount_cents || 0) : 0);
      }, 0);
      if (totalSetup > 0) {
        html += '<tr class="total-row">';
        html += '<td colspan="2"><strong>Total Setup Fees</strong></td>';
        html += '<td><strong>' + formatCurrency(totalSetup, currency) + '</strong></td>';
        html += '</tr>';
      }

      // Total Monthly
      var totalMonthly = pricing.total_monthly_cents || items.reduce(function (s, i) {
        return s + (i.pricing_type === 'monthly' ? (i.amount_cents || 0) : 0);
      }, 0);
      if (totalMonthly > 0) {
        html += '<tr class="total-row">';
        html += '<td colspan="2"><strong>Total Monthly</strong></td>';
        html += '<td><strong>' + formatCurrency(totalMonthly, currency) + '/mo</strong></td>';
        html += '</tr>';
      }

      // Due Now
      var dueNow = pricing.due_now_cents || 0;
      if (dueNow > 0) {
        html += '<tr class="due-now-row">';
        html += '<td colspan="2"><strong>Due Now</strong></td>';
        html += '<td><strong class="due-now-amount">' + formatCurrency(dueNow, currency) + '</strong></td>';
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
    // 10) Terms & Conditions (from template with company_name placeholder)
    // ============================
    html += '<div class="proposal-section terms-section">';
    html += '<div class="proposal-section-label">Legal</div>';
    html += '<h2>Terms &amp; Conditions</h2>';

    var termsTemplate = data.terms_template || '';
    if (termsTemplate) {
      // Replace placeholders
      var processedTerms = termsTemplate
        .replace(/\{\{company_name\}\}/g, escapeHtml(companyName))
        .replace(/\{\{date\}\}/g, formatDate(data.created_date) || new Date().toLocaleDateString());

      // Convert to HTML paragraphs and headers
      var termsLines = processedTerms.split('\n');
      var termsHtml = '';
      termsLines.forEach(function (line) {
        var trimmed = line.trim();
        if (!trimmed) return;
        // Lines that look like headers (all caps or short bold lines)
        if (trimmed.length < 80 && trimmed === trimmed.toUpperCase() && trimmed.length > 3) {
          termsHtml += '<h4>' + escapeHtml(trimmed) + '</h4>';
        } else if (trimmed.match(/^\d+\.\s/)) {
          // Numbered items
          termsHtml += '<p>' + escapeHtml(trimmed) + '</p>';
        } else {
          termsHtml += '<p>' + escapeHtml(trimmed) + '</p>';
        }
      });
      html += termsHtml;
    } else {
      // Default terms
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
      html += '<p>By signing below, the client acknowledges that they have read, understood, and agree to all terms outlined in this proposal.</p>';
      html += '<h4>Electronic Signature Consent</h4>';
      html += '<p>By providing an electronic signature below, the client consents to the use of electronic signatures and agrees that such signatures carry the same legal weight as handwritten signatures.</p>';
    }

    html += '</div>';

    // ============================
    // 11) Signature & Acceptance (with type/draw options)
    // ============================
    html += '<div class="signature-block" id="signatureBlock">';
    html += '<div class="proposal-section-label">Agreement</div>';
    html += '<h2>Signature &amp; Acceptance</h2>';
    html += '<p>Please review the proposal above and sign below to accept.</p>';

    if (paymentInfo) {
      html += renderPaidConfirmation(paymentInfo, signedInfo, settings, currency);
    } else if (signedInfo) {
      html += renderSignedConfirmation(signedInfo, settings, slug, pricing);
    } else {
      // Store client info for signature submission
      var clientName = (data.client && data.client.name) || '';
      var clientEmail = (data.client && data.client.email) || '';

      html += '<form id="signForm" onsubmit="return false;">';
      html += '<input type="hidden" id="sigName" value="' + escapeHtml(clientName) + '">';
      html += '<input type="hidden" id="sigEmail" value="' + escapeHtml(clientEmail) + '">';

      // Signature mode tabs
      html += '<div class="signature-mode">';
      html += '<div class="sig-tabs">';
      html += '<button type="button" class="sig-tab active" id="sigTabType" onclick="switchSignatureMode(\'type\')">Type Signature</button>';
      html += '<button type="button" class="sig-tab" id="sigTabDraw" onclick="switchSignatureMode(\'draw\')">Draw Signature</button>';
      html += '</div>';

      // Type panel
      html += '<div class="sig-panel" id="sigPanelType">';
      html += '<input type="text" id="sigTypedName" placeholder="Type your full name" class="sig-typed-input">';
      html += '<div class="sig-typed-preview" id="sigTypedPreview"></div>';
      html += '</div>';

      // Draw panel
      html += '<div class="sig-panel" id="sigPanelDraw" style="display:none;">';
      html += '<div class="sig-canvas-wrap"><canvas id="signatureCanvas"></canvas></div>';
      html += '<button type="button" class="btn btn-secondary btn-sm" onclick="clearSignaturePad()" style="margin-top:8px;">Clear</button>';
      html += '</div>';

      html += '</div>';

      html += '<div class="form-group" style="margin-top:16px;"><label class="checkbox-wrap"><input type="checkbox" id="sigAgree" required><span>I have read and agree to the terms and conditions outlined in this proposal.</span></label></div>';
      html += '<div style="margin-top:20px;"><button type="button" class="btn btn-primary btn-lg" id="signBtn" onclick="handleSign()">Sign &amp; Accept Proposal</button></div>';
      html += '</form>';
    }

    html += '</div>';

    container.innerHTML = html;

    // Setup typed signature preview
    var typedInput = document.getElementById('sigTypedName');
    var typedPreview = document.getElementById('sigTypedPreview');
    if (typedInput && typedPreview) {
      typedInput.addEventListener('input', function () {
        typedPreview.textContent = typedInput.value || '';
      });
    }

    // Update page title
    document.title = 'Proposal — ' + (project.name || 'Untitled') + ' | ' + (companyName);
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

    // Show signature image if drawn
    if (info.signature_data && info.signature_type === 'drawn') {
      html += '<div class="sig-display"><img src="' + info.signature_data + '" alt="Signature" class="sig-image"></div>';
    } else if (info.signature_data && info.signature_type === 'typed') {
      html += '<div class="sig-display sig-typed-display">' + escapeHtml(info.signature_data) + '</div>';
    }

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
  window.handleSign = function () {
    var name = document.getElementById('sigName');
    var email = document.getElementById('sigEmail');
    var agree = document.getElementById('sigAgree');

    if (!agree) return;
    if (!agree.checked) { return alert('You must agree to the terms and conditions.'); }

    // Get name from typed signature or hidden field
    var sigTypedInput = document.getElementById('sigTypedName');
    var sigNameVal = '';
    if (signatureMode === 'type' && sigTypedInput && sigTypedInput.value.trim()) {
      sigNameVal = sigTypedInput.value.trim();
    } else if (signatureMode === 'draw') {
      sigNameVal = (name && name.value) ? name.value.trim() : 'Client';
    } else {
      if (!sigTypedInput || !sigTypedInput.value.trim()) { sigTypedInput.focus(); return alert('Please type your name to sign.'); }
      sigNameVal = sigTypedInput.value.trim();
    }
    var sigEmailVal = (email && email.value) ? email.value.trim() : '';

    var slug = getSlugFromPath() || (window.PROPOSAL_DATA ? window.PROPOSAL_DATA.slug : null) || 'proposal';
    var settings = window.PROPOSAL_DATA ? (window.PROPOSAL_DATA.settings || {}) : {};
    var pricing = window.PROPOSAL_DATA ? (window.PROPOSAL_DATA.pricing || {}) : {};

    // Determine signature data
    var signatureData = '';
    var signatureType = 'typed';

    if (signatureMode === 'draw' && signatureCanvas) {
      signatureData = signatureCanvas.toDataURL('image/png');
      signatureType = 'drawn';
    } else {
      var typedInput = document.getElementById('sigTypedName');
      signatureData = typedInput ? typedInput.value.trim() : name.value.trim();
      signatureType = 'typed';
    }

    var signPayload = {
      name: sigNameVal,
      email: sigEmailVal,
      signature_data: signatureData,
      signature_type: signatureType
    };

    // Save signature to backend
    fetch('/api/proposals/' + encodeURIComponent(slug) + '/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signPayload)
    })
    .then(function (resp) {
      if (resp.ok) return resp.json();
      throw new Error('Failed to save signature');
    })
    .then(function (result) {
      var signedInfo = result.signature;
      var block = document.getElementById('signatureBlock');
      if (block) {
        var form = document.getElementById('signForm');
        if (form) {
          form.outerHTML = renderSignedConfirmation(signedInfo, settings, slug, pricing);
        }
      }
    })
    .catch(function (err) {
      // Fallback: save to localStorage
      var signedInfo = {
        name: signPayload.name,
        email: signPayload.email,
        signature_data: signatureData,
        signature_type: signatureType,
        timestamp: new Date().toLocaleString()
      };
      localStorage.setItem('signed_' + slug, JSON.stringify(signedInfo));

      var block = document.getElementById('signatureBlock');
      if (block) {
        var form = document.getElementById('signForm');
        if (form) {
          form.outerHTML = renderSignedConfirmation(signedInfo, settings, slug, pricing);
        }
      }
    });
  };

  // --- Payment handler (global) ---
  window.handlePayment = function (slug) {
    var btn = document.getElementById('payNowBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Processing...';
    }

    fetch('/api/proposals/' + encodeURIComponent(slug) + '/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(function (resp) { return resp.json(); })
    .then(function (data) {
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Error creating checkout session: ' + (data.error || 'Unknown error'));
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Pay Now';
        }
      }
    })
    .catch(function (err) {
      alert('Payment error: ' + err.message);
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Pay Now';
      }
    });
  };

  // --- Initial render ---
  function boot() {
    checkPaymentSuccess();

    getProposalData().then(function (data) {
      if (data) {
        window.PROPOSAL_DATA = data;
        render(data);
      } else {
        container.innerHTML = '<div style="text-align:center;padding:80px 0;color:var(--color-text-muted);"><h2 style="margin-bottom:12px;">No Proposal Data</h2><p>This proposal is loading via the builder preview.</p></div>';
      }
    });
  }

  boot();

})();
