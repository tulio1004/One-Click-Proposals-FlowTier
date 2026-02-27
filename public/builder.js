/* ============================================
   BUILDER.JS — Proposal Builder Logic
   ============================================ */

(function () {
  'use strict';

  // ============================================
  // SYSTEMS LIBRARY — 8 Pre-configured Services
  // ============================================
  const SYSTEMS_LIBRARY = [
    {
      id: 'ai_voice_assistant',
      name: 'AI Voice Assistant',
      description: 'An intelligent AI-powered voice assistant that answers inbound calls 24/7, collects caller information, answers frequently asked questions, qualifies leads, and either books appointments directly into your calendar or routes the data to your CRM. It handles after-hours calls, reduces missed opportunities, and ensures every caller receives a professional, consistent experience — without requiring additional staff.',
      image: '/static/images/ai-voice-assistant.png',
      deliverables: [
        'AI voice agent configured for inbound call handling',
        'Caller data collection and CRM integration',
        'Appointment booking via voice commands',
        'After-hours call handling with intelligent routing',
        'FAQ knowledge base setup and training',
        'Call recording, transcription, and analytics dashboard',
        'Custom greeting and call flow design'
      ],
      requirements: [
        'Active phone number or willingness to provision one',
        'CRM platform access (e.g., GoHighLevel, HubSpot)',
        'Calendar system for appointment booking',
        'FAQ document or list of common questions',
        'Call routing preferences and business hours'
      ]
    },
    {
      id: 'ai_chatbot',
      name: 'AI Chatbot',
      description: 'A multi-channel AI chatbot that engages visitors and customers on your website, WhatsApp, and SMS simultaneously. It answers questions instantly using your knowledge base, captures lead information, qualifies prospects, schedules appointments, and escalates complex inquiries to a human agent when needed. The chatbot learns from your business data to provide accurate, on-brand responses around the clock.',
      image: '/static/images/ai-chatbot.png',
      deliverables: [
        'AI chatbot widget for website integration',
        'WhatsApp Business API chatbot setup',
        'SMS conversational agent configuration',
        'Knowledge base training with your business data',
        'Lead capture and qualification flows',
        'Human handoff and escalation logic',
        'Chat transcript logging and analytics',
        'Multi-language support (if needed)'
      ],
      requirements: [
        'Website access for widget installation',
        'WhatsApp Business account',
        'FAQ documents, service descriptions, and pricing info',
        'Escalation rules and team contact information',
        'Brand voice and tone guidelines'
      ]
    },
    {
      id: 'ai_email_agent',
      name: 'AI Email Agent',
      description: 'An AI-powered email processing system that reads, categorizes, and responds to incoming emails automatically. It distinguishes between existing customers and new leads, drafts personalized responses based on the email content, and handles routine inquiries without human intervention. When an email topic exceeds the AI\'s scope or requires a nuanced decision, the system flags it and routes it to the appropriate team member for review — ensuring nothing falls through the cracks while dramatically reducing response times.',
      image: '/static/images/ai-email-agent.png',
      deliverables: [
        'AI email reading and classification system',
        'Automatic customer vs. new lead identification',
        'AI-generated response drafts for routine inquiries',
        'Smart routing for complex cases to human reviewers',
        'Priority flagging for urgent or high-value emails',
        'Follow-up reminder automation for unanswered threads',
        'Spam and irrelevant email filtering',
        'Weekly email performance and response time report'
      ],
      requirements: [
        'Email account access (Gmail, Outlook, or IMAP)',
        'Customer database or CRM for identification',
        'Response templates or guidelines for common topics',
        'Escalation rules and team member assignments',
        'Business rules for priority classification'
      ]
    },
    {
      id: 'ai_lead_generation',
      name: 'AI Lead Generation',
      description: 'A fully automated lead generation system that identifies and collects high-quality leads tailored to your industry. Whether you need consumer leads for real estate, construction, cleaning services, or similar businesses — or B2B leads for agencies and service providers — the system gathers verified contact information including name, email, phone number, and enriches each lead with AI-powered insights such as company size, industry, estimated revenue, and engagement likelihood. Leads are delivered directly to your CRM, ready for outreach.',
      image: '/static/images/ai-lead-generation.png',
      deliverables: [
        'Automated lead sourcing and collection pipeline',
        'Lead data enrichment with AI (company info, revenue, industry)',
        'Verified contact details: name, email, phone',
        'Consumer lead generation (B2C) for service industries',
        'Business lead generation (B2B) for agencies and SaaS',
        'CRM integration for automatic lead delivery',
        'Lead scoring and qualification criteria',
        'Weekly lead generation performance report'
      ],
      requirements: [
        'Target audience and ideal customer profile',
        'Industry and geographic targeting preferences',
        'CRM platform access for lead delivery',
        'Lead volume expectations and budget parameters',
        'Qualification criteria for lead scoring'
      ]
    },
    {
      id: 'ai_outreach',
      name: 'AI Personalized Outreach',
      description: 'An AI-driven outreach system that sends highly personalized emails to your lead database, where every single message is uniquely crafted for the specific recipient. Unlike traditional email blast tools that send the same generic template to everyone, this system researches each contact, references their business, industry, or recent activity, and writes a one-of-a-kind message designed to start a genuine conversation. The result is dramatically higher open rates, reply rates, and conversion — because every email feels like it was written by a human who did their homework.',
      image: '/static/images/ai-outreach.png',
      deliverables: [
        'AI-powered personalized email generation engine',
        'Per-recipient research and message customization',
        'Multi-step follow-up sequences with unique messaging',
        'A/B testing framework for subject lines and copy',
        'Sending schedule optimization for best deliverability',
        'Reply detection and conversation routing',
        'Campaign analytics dashboard (opens, replies, conversions)',
        'Do-not-contact and unsubscribe management'
      ],
      requirements: [
        'Lead database or contact list (CSV or CRM export)',
        'Email sending account (dedicated domain recommended)',
        'Value proposition and key selling points',
        'Target audience description and ideal customer profile',
        'Preferred tone and messaging guidelines'
      ]
    },
    {
      id: 'one_click_proposal',
      name: 'One-Click Proposal System',
      description: 'A streamlined proposal generation system — the very system you are looking at right now. It allows you to fill out a simple intake form, select the services you want to offer, and instantly generate a professional, branded proposal page with a unique URL for your client. The proposal includes all project details, pricing, timeline, terms and conditions, electronic signature capture, and a payment button. It can be customized for any industry and adapted to any service offering, making it the fastest way to close deals professionally.',
      image: '/static/images/one-click-proposal.png',
      deliverables: [
        'Custom-branded proposal builder interface',
        'Automated proposal page generation with unique URLs',
        'Electronic signature capture and storage',
        'Payment integration (Stripe or similar)',
        'AI-powered content refinement via Make.com',
        'Proposal tracking and status monitoring',
        'Customizable terms and conditions',
        'Mobile-responsive proposal design'
      ],
      requirements: [
        'Brand guidelines (logo, colors, fonts)',
        'Service descriptions and pricing structure',
        'Terms and conditions content',
        'Payment processor account (Stripe recommended)',
        'Domain and hosting for proposal pages'
      ]
    },
    {
      id: 'customer_care_followup',
      name: 'Customer Care Follow-Up',
      description: 'An automated customer care system that sends personalized follow-up messages to leads and customers at every stage of their journey. From initial inquiry through project completion and beyond, the system keeps your clients engaged with timely project updates, milestone notifications, satisfaction check-ins, review requests, feedback surveys, and re-engagement campaigns. Every touchpoint is automated but feels personal, ensuring no customer is ever forgotten and your brand stays top of mind.',
      image: '/static/images/customer-care-followup.png',
      deliverables: [
        'Multi-stage follow-up sequence automation',
        'Project update notifications for active clients',
        'Post-service review request automation (Google, Yelp, etc.)',
        'Customer satisfaction surveys and feedback collection',
        'Re-engagement campaigns for dormant leads',
        'Anniversary and milestone celebration messages',
        'Negative feedback interception and internal routing',
        'Follow-up performance analytics dashboard'
      ],
      requirements: [
        'CRM or customer database with stage tracking',
        'Message templates for each follow-up stage',
        'Review platform links (Google Business, Yelp, etc.)',
        'Trigger events for each stage transition',
        'Preferred communication channels (email, SMS, WhatsApp)'
      ]
    },
    {
      id: 'custom_automation',
      name: 'Custom Automation',
      description: '',
      image: '/static/images/custom-automation.png',
      deliverables: [],
      requirements: []
    }
  ];

  // ============================================
  // STATE
  // ============================================
  let addedSystems = [];
  let scopeItems = [];
  let milestones = [];
  let pricingLineItems = [];
  let updateTimer = null;

  // ============================================
  // QUILL RICH TEXT EDITORS
  // ============================================
  var quillToolbar = [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    ['link'],
    [{ 'color': [] }, { 'background': [] }],
    ['clean']
  ];

  var quillEditors = {}; // Store all Quill instances by id
  var systemQuillEditors = {}; // Store system-specific Quill instances by uid

  function createQuillEditor(elementId, placeholder) {
    var el = document.getElementById(elementId);
    if (!el) return null;
    var quill = new Quill('#' + elementId, {
      theme: 'snow',
      placeholder: placeholder || 'Type here...',
      modules: { toolbar: quillToolbar }
    });
    quill.on('text-change', function () {
      schedulePreviewUpdate();
    });
    quillEditors[elementId] = quill;
    return quill;
  }

  function getQuillHTML(editorId) {
    var quill = quillEditors[editorId];
    if (!quill) return '';
    var html = quill.root.innerHTML;
    if (html === '<p><br></p>' || html === '<p></p>') return '';
    return html;
  }

  function setQuillHTML(editorId, html) {
    var quill = quillEditors[editorId];
    if (!quill) return;
    if (!html) {
      quill.setText('');
    } else {
      quill.root.innerHTML = html;
    }
  }

  function initSystemQuill(uid, placeholder, initialContent) {
    var editorId = 'sys_notes_' + uid;
    var el = document.getElementById(editorId);
    if (!el) return null;
    var quill = new Quill('#' + editorId, {
      theme: 'snow',
      placeholder: placeholder || 'Notes about this system...',
      modules: { toolbar: quillToolbar }
    });
    if (initialContent) {
      // Check if content looks like HTML
      if (initialContent.indexOf('<') !== -1) {
        quill.root.innerHTML = initialContent;
      } else {
        quill.setText(initialContent);
      }
    }
    quill.on('text-change', function () {
      schedulePreviewUpdate();
    });
    quillEditors[editorId] = quill;
    systemQuillEditors[uid] = quill;
    return quill;
  }

  // ============================================
  // PRE-FILL FROM URL QUERY PARAMETERS
  // ============================================
  // Store lead_id from CRM (hidden, not exposed to client)
  var _linkedLeadId = '';

  function prefillFromQueryParams() {
    var params = new URLSearchParams(window.location.search);
    if (params.toString().length === 0) return;

    // Capture lead_id if provided (from Lead Manager CRM)
    if (params.has('lead_id')) {
      _linkedLeadId = params.get('lead_id');
      console.log('[FlowTier] Linked to lead:', _linkedLeadId);
    }

    // Map query param names to form field IDs
    var fieldMap = {
      'client_name': 'clientName',
      'company_name': 'clientCompany',
      'client_email': 'clientEmail',
      'client_phone': 'clientPhone',
      'client_address': null, // no field for this yet, but capture it
      'project_name': 'projectName'
    };

    var filled = false;
    for (var key in fieldMap) {
      if (params.has(key) && fieldMap[key]) {
        var el = document.getElementById(fieldMap[key]);
        if (el && !el.value) {
          el.value = params.get(key);
          filled = true;
        }
      }
    }

    // If no lead_id from URL, try to match by email on blur
    if (!_linkedLeadId) {
      setupEmailLookup();
    }

    // Trigger slug generation if company was pre-filled
    if (filled) {
      var companyInput = document.getElementById('clientCompany');
      if (companyInput && companyInput.value) {
        companyInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      schedulePreviewUpdate();
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    populateDropdown();
    loadWebhookUrl();
    setDefaultDate();
    attachChangeListeners();
    setupAutoSlug();

    // Initialize Quill editors for static fields
    createQuillEditor('problemDraft', 'Describe the client\'s current challenges...');
    createQuillEditor('solutionDraft', 'Describe the proposed solution...');
    createQuillEditor('pricingNotes', 'Optional notes...');
    createQuillEditor('termsTemplate', 'Terms and conditions...');

    // Load terms after Quill is initialized
    loadTermsTemplate();

    // Pre-fill from URL query parameters (e.g., from Lead Manager CRM)
    prefillFromQueryParams();
    showLinkedBannerIfNeeded();

    schedulePreviewUpdate();

    // Fix: capture dropdown value on change
    var dropdown = document.getElementById('systemDropdown');
    if (dropdown) {
      dropdown.addEventListener('change', function () {
        dropdown._lastValue = dropdown.value;
      });
      dropdown.addEventListener('mousedown', function () {
        if (dropdown.value) dropdown._lastValue = dropdown.value;
      });
    }
    var addBtn = document.getElementById('addSystemBtn');
    if (addBtn) {
      addBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var select = document.getElementById('systemDropdown');
        if (!select.value && select._lastValue) {
          select.value = select._lastValue;
        }
        addSelectedSystem();
      });
    }

    // Check if editing an existing proposal (URL: /builder/slug)
    var pathParts = window.location.pathname.split('/');
    if (pathParts.length >= 3 && pathParts[1] === 'builder' && pathParts[2]) {
      loadExistingProposal(pathParts[2]);
    }
  }

  function setDefaultDate() {
    document.getElementById('proposalDate').value = new Date().toISOString().split('T')[0];
  }

  function populateDropdown() {
    var select = document.getElementById('systemDropdown');
    select.innerHTML = '<option value="">— Select a system to add —</option>';
    SYSTEMS_LIBRARY.forEach(function (sys) {
      var opt = document.createElement('option');
      opt.value = sys.id;
      opt.textContent = sys.name;
      select.appendChild(opt);
    });
  }

  // ============================================
  // EMAIL-BASED LEAD LOOKUP (cross-origin to Lead Manager CRM)
  // ============================================
  var _lookupTimeout = null;
  var CRM_BASE = 'https://leads.flowtier.io';

  function setupEmailLookup() {
    var emailInput = document.getElementById('clientEmail');
    if (!emailInput) return;

    emailInput.addEventListener('blur', function () {
      var email = emailInput.value.trim().toLowerCase();
      if (!email || !email.includes('@') || _linkedLeadId) return;
      lookupLeadByEmail(email);
    });

    // Also trigger on a short delay after typing stops
    emailInput.addEventListener('input', function () {
      clearTimeout(_lookupTimeout);
      var email = emailInput.value.trim().toLowerCase();
      if (!email || !email.includes('@') || _linkedLeadId) return;
      _lookupTimeout = setTimeout(function () {
        lookupLeadByEmail(email);
      }, 1500);
    });
  }

  function lookupLeadByEmail(email) {
    fetch(CRM_BASE + '/api/leads/lookup?email=' + encodeURIComponent(email))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.found && data.lead_id) {
          _linkedLeadId = data.lead_id;
          console.log('[FlowTier] Auto-matched lead:', data.lead_id, data.contact_name, data.company_name);
          showToast('Linked to lead: ' + (data.contact_name || data.company_name || data.lead_id));

          // Auto-fill name/company if empty
          var nameInput = document.getElementById('clientName');
          var companyInput = document.getElementById('clientCompany');
          if (nameInput && !nameInput.value && data.contact_name) {
            nameInput.value = data.contact_name;
            nameInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          if (companyInput && !companyInput.value && data.company_name) {
            companyInput.value = data.company_name;
            companyInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      })
      .catch(function (err) {
        // Silently fail — CRM might not be reachable
        console.log('[FlowTier] Lead lookup failed (CRM unreachable):', err.message);
      });
  }

  // ============================================
  // LOAD EXISTING PROPOSAL (for editing)
  // ============================================
  function loadExistingProposal(slug) {
    fetch('/api/proposals/' + encodeURIComponent(slug))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.slug) {
          populateFromJSON(data);
          showToast('Loaded proposal: ' + slug);
        }
      })
      .catch(function (err) {
        console.error('Error loading proposal:', err);
      });
  }

  // ============================================
  // AUTO-SLUG GENERATION
  // ============================================
  function setupAutoSlug() {
    var companyInput = document.getElementById('clientCompany');
    var nameInput = document.getElementById('clientName');
    var slugInput = document.getElementById('proposalSlug');

    function generateSlug() {
      var company = companyInput.value.trim();
      var name = nameInput.value.trim();
      var base = company || name || '';
      if (!base) {
        slugInput.value = '';
        return;
      }
      var slug = base.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      var date = new Date();
      var suffix = date.getFullYear().toString().slice(-2) + (date.getMonth() + 1).toString().padStart(2, '0');
      slug = slug + '-' + suffix;
      slugInput.value = slug;
    }

    companyInput.addEventListener('input', generateSlug);
    nameInput.addEventListener('input', generateSlug);
  }

  // ============================================
  // PROPOSAL ID GENERATOR
  // ============================================
  window.generateProposalId = function () {
    fetch('/api/generate-id')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.proposal_id) {
          document.getElementById('proposalId').value = data.proposal_id;
          showToast('Generated ID: ' + data.proposal_id);
          schedulePreviewUpdate();
        }
      })
      .catch(function (err) {
        alert('Error generating ID: ' + err.message);
      });
  };

  // ============================================
  // TERMS TEMPLATE — Load & Save
  // ============================================
  function loadTermsTemplate() {
    fetch('/api/terms')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.template) {
          setQuillHTML('termsTemplate', data.template);
        }
      })
      .catch(function () { /* ignore */ });
  }

  window.saveTerms = function () {
    var template = getQuillHTML('termsTemplate');
    var statusEl = document.getElementById('termsSaveStatus');

    fetch('/api/terms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template: template })
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.success) {
        statusEl.innerHTML = '<span style="color:var(--color-success);">Terms saved successfully.</span>';
      } else {
        statusEl.innerHTML = '<span style="color:var(--color-danger);">Failed to save.</span>';
      }
      setTimeout(function () { statusEl.innerHTML = ''; }, 3000);
    })
    .catch(function (err) {
      statusEl.innerHTML = '<span style="color:var(--color-danger);">Error: ' + err.message + '</span>';
    });
  };

  // ============================================
  // SYSTEM DROPDOWN + ADD
  // ============================================
  window.addSelectedSystem = function () {
    var select = document.getElementById('systemDropdown');
    var id = select.value || select._lastValue;
    if (!id) return alert('Please select a system from the dropdown.');

    if (id !== 'custom_automation' && addedSystems.find(function (s) { return s.id === id; })) {
      return alert('This system has already been added.');
    }

    var lib = SYSTEMS_LIBRARY.find(function (s) { return s.id === id; });
    if (!lib) return;

    var system = {
      id: id,
      uid: id + '_' + Date.now(),
      name: lib.name,
      description: lib.description,
      image: lib.image,
      draft_notes: lib.description,
      deliverables: lib.deliverables.slice(),
      requirements: lib.requirements.slice()
    };

    addedSystems.push(system);
    select.value = '';
    renderAddedSystems();
    schedulePreviewUpdate();
  };

  window.removeSystem = function (uid) {
    addedSystems = addedSystems.filter(function (s) { return s.uid !== uid; });
    renderAddedSystems();
    schedulePreviewUpdate();
  };

  window.moveSystemUp = function (uid) {
    var idx = addedSystems.findIndex(function (s) { return s.uid === uid; });
    if (idx > 0) {
      var temp = addedSystems[idx - 1];
      addedSystems[idx - 1] = addedSystems[idx];
      addedSystems[idx] = temp;
      renderAddedSystems();
      schedulePreviewUpdate();
    }
  };

  window.moveSystemDown = function (uid) {
    var idx = addedSystems.findIndex(function (s) { return s.uid === uid; });
    if (idx < addedSystems.length - 1) {
      var temp = addedSystems[idx];
      addedSystems[idx] = addedSystems[idx + 1];
      addedSystems[idx + 1] = temp;
      renderAddedSystems();
      schedulePreviewUpdate();
    }
  };

  function renderAddedSystems() {
    var container = document.getElementById('addedSystemsList');
    if (addedSystems.length === 0) {
      container.innerHTML = '<div class="empty-state">No systems added yet. Select one from the dropdown above.</div>';
      return;
    }

    var html = '';
    addedSystems.forEach(function (sys, idx) {
      var isCustom = sys.id === 'custom_automation';
      var isFirst = idx === 0;
      var isLast = idx === addedSystems.length - 1;

      html += '<div class="system-card-builder" data-uid="' + sys.uid + '">';
      html += '<div class="system-card-header">';
      html += '<div class="system-card-title">';
      if (sys.image) {
        html += '<img src="' + escapeAttr(sys.image) + '" alt="" class="system-thumb">';
      }
      html += '<div>';
      if (isCustom) {
        html += '<input type="text" class="system-name-input" value="' + escapeAttr(sys.name) + '" placeholder="Custom System Name" onchange="updateSystemField(\'' + sys.uid + '\', \'name\', this.value)">';
      } else {
        html += '<strong>' + escapeHtml(sys.name) + '</strong>';
      }
      html += '</div></div>';
      html += '<div class="system-card-actions">';
      if (!isFirst) html += '<button class="btn-icon" onclick="moveSystemUp(\'' + sys.uid + '\')" title="Move up">&#9650;</button>';
      if (!isLast) html += '<button class="btn-icon" onclick="moveSystemDown(\'' + sys.uid + '\')" title="Move down">&#9660;</button>';
      html += '<button class="btn-icon btn-danger" onclick="removeSystem(\'' + sys.uid + '\')" title="Remove system">&times;</button>';
      html += '</div></div>';

      // Draft notes (Quill rich text editor)
      html += '<div class="form-group">';
      html += '<label>' + (isCustom ? 'System Description' : 'Draft Notes (editable)') + '</label>';
      html += '<div class="quill-editor-wrap compact">';
      html += '<div id="sys_notes_' + sys.uid + '"></div>';
      html += '</div>';
      html += '</div>';

      // Deliverables
      html += '<div class="form-group">';
      html += '<label>Deliverables</label>';
      html += '<ul class="editable-list" id="sys_del_' + sys.uid + '">';
      sys.deliverables.forEach(function (d) {
        html += editableListItemHTML(d);
      });
      html += '</ul>';
      html += '<button class="add-item-btn" onclick="addEditableListItem(document.getElementById(\'sys_del_' + sys.uid + '\')); schedulePreviewUpdate()">+ Add Deliverable</button>';
      html += '</div>';

      // Requirements
      html += '<div class="form-group">';
      html += '<label>Requirements</label>';
      html += '<ul class="editable-list" id="sys_req_' + sys.uid + '">';
      sys.requirements.forEach(function (r) {
        html += editableListItemHTML(r);
      });
      html += '</ul>';
      html += '<button class="add-item-btn" onclick="addEditableListItem(document.getElementById(\'sys_req_' + sys.uid + '\')); schedulePreviewUpdate()">+ Add Requirement</button>';
      html += '</div>';

      html += '</div>';
    });

    container.innerHTML = html;

    // Initialize Quill editors for each system's notes
    systemQuillEditors = {};
    addedSystems.forEach(function (sys) {
      var isCustom = sys.id === 'custom_automation';
      var placeholder = isCustom ? 'Describe this custom automation...' : 'Notes about this system for this client...';
      initSystemQuill(sys.uid, placeholder, sys.draft_notes || '');
    });
  }

  window.updateSystemField = function (uid, field, value) {
    var sys = addedSystems.find(function (s) { return s.uid === uid; });
    if (sys) {
      sys[field] = value;
      schedulePreviewUpdate();
    }
  };

  function editableListItemHTML(value) {
    return '<li><input type="text" value="' + escapeAttr(value) + '" oninput="schedulePreviewUpdate()"><button class="btn-icon" onclick="this.parentElement.remove(); schedulePreviewUpdate()" title="Remove">&times;</button></li>';
  }

  window.addEditableListItem = function (container, value) {
    if (!container) return;
    var li = document.createElement('li');
    li.innerHTML = '<input type="text" value="' + escapeAttr(value || '') + '" oninput="schedulePreviewUpdate()"><button class="btn-icon" onclick="this.parentElement.remove(); schedulePreviewUpdate()" title="Remove">&times;</button>';
    container.appendChild(li);
  };

  // ============================================
  // SCOPE OF WORK (with Quill rich text editors)
  // ============================================
  var scopeQuillEditors = {};

  function renderScopeItems() {
    var container = document.getElementById('scopeList');
    scopeQuillEditors = {};
    var html = '';
    scopeItems.forEach(function (item, i) {
      html += '<div class="scope-item-row" data-scope-idx="' + i + '">';
      html += '<div class="scope-item-editor">';
      html += '<div class="quill-editor-wrap compact">';
      html += '<div id="scope_editor_' + i + '"></div>';
      html += '</div>';
      html += '</div>';
      html += '<button class="btn-icon btn-danger scope-remove-btn" onclick="removeScopeItem(' + i + ')" title="Remove">&times;</button>';
      html += '</div>';
    });
    container.innerHTML = html;

    // Initialize Quill editors for each scope item
    scopeItems.forEach(function (item, i) {
      var editorId = 'scope_editor_' + i;
      var el = document.getElementById(editorId);
      if (!el) return;
      var quill = new Quill('#' + editorId, {
        theme: 'snow',
        placeholder: 'Describe this scope item...',
        modules: { toolbar: quillToolbar }
      });
      if (item) {
        if (item.indexOf('<') !== -1 && (item.indexOf('<p>') !== -1 || item.indexOf('<h') !== -1 || item.indexOf('<ul>') !== -1 || item.indexOf('<strong>') !== -1)) {
          quill.root.innerHTML = item;
        } else {
          quill.setText(item);
        }
      }
      quill.on('text-change', function () {
        var html = quill.root.innerHTML;
        if (html === '<p><br></p>' || html === '<p></p>') html = '';
        scopeItems[i] = html;
        schedulePreviewUpdate();
      });
      scopeQuillEditors[i] = quill;
    });
  }

  window.addScopeItem = function () {
    scopeItems.push('');
    renderScopeItems();
    // Focus the last editor
    var lastQuill = scopeQuillEditors[scopeItems.length - 1];
    if (lastQuill) lastQuill.focus();
    schedulePreviewUpdate();
  };

  window.removeScopeItem = function (idx) {
    scopeItems.splice(idx, 1);
    renderScopeItems();
    schedulePreviewUpdate();
  };

  // ============================================
  // TIMELINE / MILESTONES
  // ============================================
  function renderMilestones() {
    var container = document.getElementById('milestoneList');
    var html = '';
    milestones.forEach(function (m, i) {
      html += '<div class="milestone-row">';
      html += '<input type="text" value="' + escapeAttr(m.title) + '" placeholder="Title" oninput="updateMilestone(' + i + ', \'title\', this.value)">';
      html += '<input type="text" value="' + escapeAttr(m.when) + '" placeholder="When" oninput="updateMilestone(' + i + ', \'when\', this.value)">';
      html += '<input type="text" value="' + escapeAttr(m.details) + '" placeholder="Details" oninput="updateMilestone(' + i + ', \'details\', this.value)">';
      html += '<button class="btn-icon" onclick="removeMilestone(' + i + ')" title="Remove">&times;</button>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  window.addMilestone = function () {
    milestones.push({ title: '', when: '', details: '' });
    renderMilestones();
    schedulePreviewUpdate();
  };

  window.removeMilestone = function (idx) {
    milestones.splice(idx, 1);
    renderMilestones();
    schedulePreviewUpdate();
  };

  window.updateMilestone = function (idx, field, value) {
    milestones[idx][field] = value;
    schedulePreviewUpdate();
  };

  // ============================================
  // PRICING — 3 Types: One-Time, Setup Fee, Monthly
  // ============================================
  function renderPricingItems() {
    var container = document.getElementById('pricingItems');
    var html = '';
    pricingLineItems.forEach(function (item, i) {
      var ptype = item.pricing_type || 'one_time';
      html += '<div class="pricing-card-v2">';
      html += '<div class="pricing-card-header">';
      html += '<input type="text" class="pr-name" value="' + escapeAttr(item.name) + '" placeholder="Item title" oninput="updatePricingItem(' + i + ', \'name\', this.value)">';
      html += '<button class="btn-icon" onclick="removePricingItem(' + i + ')" title="Remove">&times;</button>';
      html += '</div>';
      html += '<textarea class="pr-description" rows="2" placeholder="Description of this service..." oninput="updatePricingItem(' + i + ', \'description\', this.value)">' + escapeAttr(item.description || '') + '</textarea>';
      html += '<div class="pricing-card-row">';
      html += '<div class="pr-field"><label>Type</label><select class="pr-type" onchange="updatePricingItem(' + i + ', \'pricing_type\', this.value); renderPricingItemsGlobal();">';
      html += '<option value="one_time"' + (ptype === 'one_time' ? ' selected' : '') + '>One-Time</option>';
      html += '<option value="setup_fee"' + (ptype === 'setup_fee' ? ' selected' : '') + '>Setup Fee</option>';
      html += '<option value="monthly"' + (ptype === 'monthly' ? ' selected' : '') + '>Monthly</option>';
      html += '</select></div>';
      html += '<div class="pr-field"><label>Amount</label><input type="number" class="pr-amount" value="' + ((item.amount_cents || 0) / 100).toFixed(2) + '" placeholder="0.00" step="0.01" min="0" oninput="updatePricingAmount(' + i + ', this.value)"></div>';
      html += '<div class="pr-field"><label>Due Date</label><input type="date" class="pr-due-date" value="' + escapeAttr(item.due_date || '') + '" oninput="updatePricingItem(' + i + ', \'due_date\', this.value)"></div>';
      html += '</div>';
      html += '</div>';
    });
    container.innerHTML = html;
    updatePricingTotals();
  }

  // Expose for inline onchange
  window.renderPricingItemsGlobal = function () {
    renderPricingItems();
    schedulePreviewUpdate();
  };

  window.addPricingItem = function () {
    pricingLineItems.push({ name: '', description: '', pricing_type: 'one_time', amount_cents: 0, due_date: '' });
    renderPricingItems();
    schedulePreviewUpdate();
  };

  window.removePricingItem = function (idx) {
    pricingLineItems.splice(idx, 1);
    renderPricingItems();
    schedulePreviewUpdate();
  };

  window.updatePricingItem = function (idx, field, value) {
    pricingLineItems[idx][field] = value;
    schedulePreviewUpdate();
  };

  window.updatePricingAmount = function (idx, value) {
    pricingLineItems[idx].amount_cents = Math.round(parseFloat(value || 0) * 100);
    updatePricingTotals();
    schedulePreviewUpdate();
  };

  function updatePricingTotals() {
    var totalOneTime = 0;
    var totalSetup = 0;
    var totalMonthly = 0;

    pricingLineItems.forEach(function (item) {
      var cents = item.amount_cents || 0;
      if (item.pricing_type === 'one_time') {
        totalOneTime += cents;
      } else if (item.pricing_type === 'setup_fee') {
        totalSetup += cents;
      } else if (item.pricing_type === 'monthly') {
        totalMonthly += cents;
      }
    });

    var currency = document.getElementById('pricingCurrency').value;
    var symbols = { usd: '$', eur: '€', gbp: '£', cad: 'CA$', aud: 'A$', brl: 'R$' };
    var sym = symbols[currency] || '$';

    function fmt(cents) {
      return sym + (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    document.getElementById('totalOneTime').textContent = fmt(totalOneTime);
    document.getElementById('totalSetup').textContent = fmt(totalSetup);
    document.getElementById('totalMonthly').textContent = fmt(totalMonthly);
  }

  // ============================================
  // BUILD JSON
  // ============================================
  function buildJSON() {
    var systems = addedSystems.map(function (sys) {
      var delContainer = document.getElementById('sys_del_' + sys.uid);
      var reqContainer = document.getElementById('sys_req_' + sys.uid);
      var sysQuill = systemQuillEditors[sys.uid];

      var deliverables = [];
      if (delContainer) {
        delContainer.querySelectorAll('input').forEach(function (inp) {
          if (inp.value.trim()) deliverables.push(inp.value.trim());
        });
      }

      var requirements = [];
      if (reqContainer) {
        reqContainer.querySelectorAll('input').forEach(function (inp) {
          if (inp.value.trim()) requirements.push(inp.value.trim());
        });
      }

      return {
        id: sys.id,
        name: sys.name,
        draft_notes: sysQuill ? (sysQuill.root.innerHTML === '<p><br></p>' ? '' : sysQuill.root.innerHTML) : (sys.draft_notes || ''),
        final_copy: null,
        deliverables: deliverables,
        requirements: requirements,
        image: sys.image || ''
      };
    });

    var totalOneTime = 0;
    var totalSetup = 0;
    var totalMonthly = 0;

    var items = pricingLineItems.map(function (i) {
      var cents = i.amount_cents || 0;
      if (i.pricing_type === 'one_time') totalOneTime += cents;
      else if (i.pricing_type === 'setup_fee') totalSetup += cents;
      else if (i.pricing_type === 'monthly') totalMonthly += cents;

      return {
        name: i.name,
        description: i.description || '',
        pricing_type: i.pricing_type || 'one_time',
        amount_cents: cents,
        due_date: i.due_date || ''
      };
    });

    var dueNowVal = parseFloat(document.getElementById('dueNowAmount').value || 0);
    var dueNowCents = Math.round(dueNowVal * 100);

    // Get terms template
    var termsTemplate = getQuillHTML('termsTemplate');

    return {
      proposal_id: document.getElementById('proposalId').value,
      slug: document.getElementById('proposalSlug').value,
      created_date: document.getElementById('proposalDate').value || new Date().toISOString().split('T')[0],
      lead_id: _linkedLeadId || '',
      client: {
        name: document.getElementById('clientName').value,
        company: document.getElementById('clientCompany').value,
        email: document.getElementById('clientEmail').value,
        phone: document.getElementById('clientPhone').value
      },
      project: {
        name: document.getElementById('projectName').value
      },
      problem: {
        draft: getQuillHTML('problemDraft'),
        final: null
      },
      solution: {
        draft: getQuillHTML('solutionDraft'),
        final: null
      },
      systems: systems,
      scope_of_work: {
        draft_bullets: scopeItems.filter(function (s) { return s && s.trim() && s !== '<p><br></p>'; }),
        final_bullets: null
      },
      timeline: {
        milestones: milestones.filter(function (m) { return m.title.trim() || m.when.trim(); })
      },
      pricing: {
        currency: document.getElementById('pricingCurrency').value,
        items: items,
        total_onetime_cents: totalOneTime,
        total_setup_cents: totalSetup,
        total_monthly_cents: totalMonthly,
        due_now_cents: dueNowCents,
        notes: getQuillHTML('pricingNotes')
      },
      terms_template: termsTemplate,
      settings: {
        tone: document.getElementById('settingsTone').value,
        industry: document.getElementById('settingsIndustry').value,
        show_images: document.getElementById('settingsShowImages').checked,
        pay_button_text: document.getElementById('settingsPayText').value || 'Pay Now'
      }
    };
  }

  // ============================================
  // PREVIEW UPDATE
  // ============================================
  window.schedulePreviewUpdate = function () {
    clearTimeout(updateTimer);
    updateTimer = setTimeout(updatePreview, 400);
  };

  function updatePreview() {
    var data = buildJSON();
    var iframe = document.getElementById('previewFrame');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'proposal_update', payload: data }, '*');
    }
  }

  window.refreshPreview = function () {
    updatePreview();
    var iframe = document.getElementById('previewFrame');
    if (iframe) {
      iframe.src = iframe.src;
      setTimeout(updatePreview, 500);
    }
  };

  // ============================================
  // JSON ACTIONS
  // ============================================
  window.copyJSON = function () {
    var json = JSON.stringify(buildJSON(), null, 2);
    navigator.clipboard.writeText(json).then(function () {
      showToast('JSON copied to clipboard');
    }).catch(function () {
      var ta = document.createElement('textarea');
      ta.value = json;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('JSON copied to clipboard');
    });
  };

  window.downloadJSON = function () {
    var data = buildJSON();
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (data.slug || 'proposal') + '.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  window.loadJSON = function () {
    document.getElementById('jsonFileInput').click();
  };

  window.handleFileLoad = function (event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var data = JSON.parse(e.target.result);
        populateFromJSON(data);
        showToast('JSON loaded successfully');
      } catch (err) {
        alert('Invalid JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // ============================================
  // JSON IMPORT (paste field)
  // ============================================
  window.importFromJSON = function () {
    var field = document.getElementById('jsonImportField');
    var statusEl = document.getElementById('jsonImportStatus');
    var raw = field.value.trim();

    if (!raw) {
      statusEl.innerHTML = '<span style="color:var(--color-danger);">Please paste JSON first.</span>';
      setTimeout(function () { statusEl.innerHTML = ''; }, 3000);
      return;
    }

    try {
      var data = JSON.parse(raw);
      populateFromJSON(data);
      statusEl.innerHTML = '<span style="color:var(--color-success);">JSON imported successfully!</span>';
      field.value = '';
      showToast('Proposal imported from JSON');
    } catch (err) {
      statusEl.innerHTML = '<span style="color:var(--color-danger);">Invalid JSON: ' + err.message + '</span>';
    }
    setTimeout(function () { statusEl.innerHTML = ''; }, 4000);
  };

  // ============================================
  // POPULATE FORM FROM JSON
  // ============================================
  function populateFromJSON(data) {
    if (!data) return;

    // Client
    document.getElementById('clientName').value = (data.client && data.client.name) || '';
    document.getElementById('clientCompany').value = (data.client && data.client.company) || '';
    document.getElementById('clientEmail').value = (data.client && data.client.email) || '';
    document.getElementById('clientPhone').value = (data.client && data.client.phone) || '';

    // Project
    document.getElementById('projectName').value = (data.project && data.project.name) || '';
    document.getElementById('proposalId').value = data.proposal_id || '';
    document.getElementById('proposalSlug').value = data.slug || '';
    // Restore linked lead_id if present
    if (data.lead_id) _linkedLeadId = data.lead_id;
    document.getElementById('proposalDate').value = data.created_date ? data.created_date.split('T')[0] : '';

    // Problem & Solution (Quill editors)
    setQuillHTML('problemDraft', (data.problem && data.problem.draft) || '');
    setQuillHTML('solutionDraft', (data.solution && data.solution.draft) || '');

    // Systems
    addedSystems = [];
    if (data.systems && Array.isArray(data.systems)) {
      data.systems.forEach(function (sys) {
        var lib = SYSTEMS_LIBRARY.find(function (s) { return s.id === sys.id; });
        addedSystems.push({
          id: sys.id,
          uid: sys.id + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: sys.name || (lib ? lib.name : 'Unknown System'),
          description: lib ? lib.description : '',
          image: sys.image || (lib ? lib.image : ''),
          draft_notes: sys.draft_notes || sys.final_copy || '',
          deliverables: sys.deliverables || (lib ? lib.deliverables.slice() : []),
          requirements: sys.requirements || (lib ? lib.requirements.slice() : [])
        });
      });
    }
    renderAddedSystems();

    // Scope
    var sow = data.scope_of_work;
    scopeItems = (sow && sow.draft_bullets) || (sow && sow.final_bullets) || [];
    renderScopeItems();

    // Timeline
    milestones = (data.timeline && data.timeline.milestones) || [];
    renderMilestones();

    // Pricing — handle both old and new format
    var pricing = data.pricing || {};
    document.getElementById('pricingCurrency').value = pricing.currency || 'usd';
    setQuillHTML('pricingNotes', pricing.notes || '');
    document.getElementById('dueNowAmount').value = pricing.due_now_cents ? (pricing.due_now_cents / 100).toFixed(2) : '';

    pricingLineItems = (pricing.items || []).map(function (i) {
      // Support old format (setup_cents/monthly_cents) and new format (amount_cents)
      var ptype = i.pricing_type || 'one_time';
      var amountCents = i.amount_cents || 0;

      // Migrate from old format
      if (!i.amount_cents && i.setup_cents) {
        amountCents = i.setup_cents;
      }

      return {
        name: i.name || '',
        description: i.description || '',
        pricing_type: ptype,
        amount_cents: amountCents,
        due_date: i.due_date || ''
      };
    });
    renderPricingItems();

    // Terms
    if (data.terms_template) {
      setQuillHTML('termsTemplate', data.terms_template);
    }

    // Settings
    var settings = data.settings || {};
    document.getElementById('settingsTone').value = settings.tone || 'Professional';
    document.getElementById('settingsIndustry').value = settings.industry || 'Service Business';
    document.getElementById('settingsShowImages').checked = settings.show_images !== false;
    document.getElementById('settingsPayText').value = settings.pay_button_text || 'Pay Now';

    schedulePreviewUpdate();
  }

  // ============================================
  // WEBHOOK — Persistent (saved on server)
  // ============================================
  function loadWebhookUrl() {
    fetch('/api/webhook-config')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.url) {
          document.getElementById('webhookUrl').value = data.url;
        }
      })
      .catch(function () { /* ignore */ });
  }

  window.saveWebhookUrl = function () {
    var url = document.getElementById('webhookUrl').value.trim();
    var statusEl = document.getElementById('webhookSaveStatus');

    fetch('/api/webhook-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url })
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.success) {
        statusEl.innerHTML = '<span style="color:var(--color-success);">Webhook URL saved successfully.</span>';
      } else {
        statusEl.innerHTML = '<span style="color:var(--color-danger);">Failed to save.</span>';
      }
      setTimeout(function () { statusEl.innerHTML = ''; }, 3000);
    })
    .catch(function (err) {
      statusEl.innerHTML = '<span style="color:var(--color-danger);">Error: ' + err.message + '</span>';
    });
  };

  // ============================================
  // SAVE DRAFT — Save without webhook or stage change
  // ============================================
  window.saveDraft = function () {
    var data = buildJSON();

    if (!data.slug) {
      alert('Please enter a client name or company to generate a slug.');
      return;
    }
    if (!data.client.name && !data.client.company) {
      alert('Please fill in at least the client name or company.');
      return;
    }

    var statusPanel = document.getElementById('createStatus');
    var statusText = document.getElementById('createStatusText');
    var responseEl = document.getElementById('createResponse');

    statusPanel.style.display = 'block';
    statusText.innerHTML = '<span class="badge badge-warning">Saving draft...</span>';
    responseEl.textContent = '';

    fetch('/api/proposals?draft=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'flowtier-proposal-builder'
      },
      body: JSON.stringify(data)
    })
    .then(function (response) {
      return response.json().then(function (result) {
        return { ok: response.ok, status: response.status, result: result };
      });
    })
    .then(function (res) {
      var now = new Date().toLocaleString();
      if (res.ok && res.result.success) {
        statusText.innerHTML = '<span class="badge badge-success">Draft Saved!</span> <span style="color:var(--color-text-muted);font-size:0.75rem;">' + now + '</span>';
        responseEl.textContent = 'URL: ' + res.result.url + '\n\nDraft saved. No webhook fired. You can continue editing and send when ready.';
      } else {
        statusText.innerHTML = '<span class="badge badge-danger">Error (' + res.status + ')</span>';
        responseEl.textContent = res.result.error || 'Unknown error';
      }
    })
    .catch(function (err) {
      statusText.innerHTML = '<span class="badge badge-danger">Failed</span>';
      responseEl.textContent = err.message;
    });
  };

  // ============================================
  // SEND PROPOSAL — Save + Send URL to webhook + update lead stage
  // ============================================
  window.createProposal = function () {
    var data = buildJSON();

    if (!data.slug) {
      alert('Please enter a client name or company to generate a slug.');
      return;
    }
    if (!data.client.name && !data.client.company) {
      alert('Please fill in at least the client name or company.');
      return;
    }

    var statusPanel = document.getElementById('createStatus');
    var statusText = document.getElementById('createStatusText');
    var responseEl = document.getElementById('createResponse');

    statusPanel.style.display = 'block';
    statusText.innerHTML = '<span class="badge badge-warning">Creating proposal...</span>';
    responseEl.textContent = '';

    fetch('/api/proposals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'flowtier-proposal-builder'
      },
      body: JSON.stringify(data)
    })
    .then(function (response) {
      return response.json().then(function (result) {
        return { ok: response.ok, status: response.status, result: result };
      });
    })
    .then(function (res) {
      var now = new Date().toLocaleString();
      if (res.ok && res.result.success) {
        statusText.innerHTML = '<span class="badge badge-success">Proposal Created!</span> <span style="color:var(--color-text-muted);font-size:0.75rem;">' + now + '</span>';
        responseEl.textContent = 'URL: ' + res.result.url + '\n\nThe proposal URL and client details have been sent to your Make.com webhook.';
      } else {
        statusText.innerHTML = '<span class="badge badge-danger">Error (' + res.status + ')</span>';
        responseEl.textContent = res.result.error || 'Unknown error';
      }
    })
    .catch(function (err) {
      statusText.innerHTML = '<span class="badge badge-danger">Failed</span>';
      responseEl.textContent = err.message;
    });
  };

  // ============================================
  // CHANGE LISTENERS
  // ============================================
  function attachChangeListeners() {
    var formPanel = document.getElementById('formPanel');
    formPanel.addEventListener('input', function (e) {
      if (e.target.matches('input, textarea, select')) {
        schedulePreviewUpdate();
      }
    });
    formPanel.addEventListener('change', function (e) {
      if (e.target.matches('input, select')) {
        schedulePreviewUpdate();
        if (e.target.id === 'pricingCurrency') {
          updatePricingTotals();
        }
      }
    });
  }

  // ============================================
  // TOAST
  // ============================================
  function showToast(msg) {
    var existing = document.querySelector('.toast-msg');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:var(--color-primary);color:var(--color-text-on-primary);padding:12px 24px;border-radius:var(--radius-md);font-size:0.875rem;font-weight:600;box-shadow:var(--shadow-lg);z-index:9999;animation:fadeInUp 0.3s ease;';
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(function () { toast.remove(); }, 300);
    }, 2500);
  }

  // ============================================
  // UTILITIES
  // ============================================
  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ============================================
  // IFRAME LOAD
  // ============================================
  var iframe = document.getElementById('previewFrame');
  if (iframe) {
    iframe.addEventListener('load', function () {
      setTimeout(updatePreview, 300);
    });
  }

  // ============================================
  // IMPORT LEAD FROM CRM
  // ============================================
  var _searchTimeout = null;

  window.openImportLeadModal = function () {
    var modal = document.getElementById('importLeadModal');
    if (modal) {
      modal.style.display = 'flex';
      var input = document.getElementById('leadSearchInput');
      if (input) { input.value = ''; input.focus(); }
      document.getElementById('leadSearchResults').innerHTML = '<p style="color:var(--color-text-muted,#6b7a8d);font-size:0.8125rem;text-align:center;padding:20px 0;">Type at least 2 characters to search leads from your CRM</p>';
    }
  };

  window.closeImportLeadModal = function () {
    var modal = document.getElementById('importLeadModal');
    if (modal) modal.style.display = 'none';
  };

  // Close modal on backdrop click
  document.addEventListener('click', function (e) {
    var modal = document.getElementById('importLeadModal');
    if (e.target === modal) window.closeImportLeadModal();
  });

  window.searchLeads = function () {
    clearTimeout(_searchTimeout);
    var q = (document.getElementById('leadSearchInput').value || '').trim();
    var resultsEl = document.getElementById('leadSearchResults');

    if (q.length < 2) {
      resultsEl.innerHTML = '<p style="color:var(--color-text-muted,#6b7a8d);font-size:0.8125rem;text-align:center;padding:20px 0;">Type at least 2 characters to search</p>';
      return;
    }

    resultsEl.innerHTML = '<p style="color:var(--color-text-muted,#6b7a8d);font-size:0.8125rem;text-align:center;padding:20px 0;">Searching...</p>';

    _searchTimeout = setTimeout(function () {
      fetch('/api/crm/leads/search?q=' + encodeURIComponent(q))
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var leads = data.leads || [];
          if (leads.length === 0) {
            resultsEl.innerHTML = '<p style="color:var(--color-text-muted,#6b7a8d);font-size:0.8125rem;text-align:center;padding:20px 0;">No leads found matching "' + escapeHtml(q) + '"</p>';
            return;
          }

          var html = '';
          leads.forEach(function (lead, idx) {
            html += '<div class="lead-result-item" data-idx="' + idx + '" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border:1px solid var(--color-border-light,#1e2d3d);border-radius:8px;margin-bottom:8px;cursor:pointer;transition:all 0.15s ease;">' 
              + '<div>'
              + '<div style="font-size:0.875rem;font-weight:600;color:var(--color-text,#e0e0e0);">' + escapeHtml(lead.contact_name || 'No Name') + '</div>'
              + '<div style="font-size:0.75rem;color:var(--color-text-muted,#6b7a8d);margin-top:2px;">' + escapeHtml(lead.company_name || '') + (lead.industry ? ' &middot; ' + escapeHtml(lead.industry) : '') + '</div>'
              + '<div style="font-size:0.6875rem;color:var(--color-text-muted,#6b7a8d);margin-top:2px;font-family:var(--font-mono,monospace);">' + escapeHtml(lead.email || '') + '</div>'
              + '</div>'
              + '<div style="padding:4px 12px;background:rgba(0,230,118,0.1);color:#00E676;border-radius:4px;font-size:0.6875rem;font-weight:600;text-transform:uppercase;">' + escapeHtml(lead.stage || 'cold') + '</div>'
              + '</div>';
          });
          resultsEl.innerHTML = html;

          // Attach click and hover handlers via JS (avoids inline escaping issues)
          resultsEl.querySelectorAll('.lead-result-item').forEach(function (el) {
            var i = parseInt(el.getAttribute('data-idx'));
            var ld = leads[i];
            el.addEventListener('mouseenter', function () { el.style.borderColor = 'rgba(0,230,118,0.4)'; el.style.background = 'rgba(0,230,118,0.04)'; });
            el.addEventListener('mouseleave', function () { el.style.borderColor = ''; el.style.background = ''; });
            el.addEventListener('click', function () { selectLead(ld.lead_id, ld.contact_name, ld.company_name, ld.email, ld.phone); });
          });
        })
        .catch(function (err) {
          resultsEl.innerHTML = '<p style="color:var(--color-danger,#FF5252);font-size:0.8125rem;text-align:center;padding:20px 0;">Error searching leads: ' + escapeHtml(err.message) + '</p>';
        });
    }, 300); // Debounce 300ms
  };

  window.selectLead = function (leadId, name, company, email, phone) {
    // Store lead_id
    _linkedLeadId = leadId;

    // Fill form fields
    if (name) document.getElementById('clientName').value = name;
    if (company) document.getElementById('clientCompany').value = company;
    if (email) document.getElementById('clientEmail').value = email;
    if (phone) document.getElementById('clientPhone').value = phone;

    // Trigger slug generation
    var slugInput = document.getElementById('proposalSlug');
    if (slugInput && company) {
      slugInput.value = company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    // Show linked banner
    var banner = document.getElementById('leadLinkedBanner');
    if (banner) {
      banner.style.display = 'flex';
      var bannerText = document.getElementById('leadLinkedText');
      if (bannerText) bannerText.textContent = 'Linked to: ' + (name || company || leadId);
    }

    // Close modal and show toast
    window.closeImportLeadModal();
    showToast('Lead imported: ' + (name || company));

    // Update preview
    schedulePreviewUpdate();
  };

  // Show linked banner on prefill too
  function showLinkedBannerIfNeeded() {
    if (_linkedLeadId) {
      var banner = document.getElementById('leadLinkedBanner');
      if (banner) {
        banner.style.display = 'flex';
        var name = document.getElementById('clientName').value || document.getElementById('clientCompany').value || _linkedLeadId;
        var bannerText = document.getElementById('leadLinkedText');
        if (bannerText) bannerText.textContent = 'Linked to: ' + name;
      }
    }
  }

  // ============================================
  // BOOT
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
