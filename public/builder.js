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
  // INITIALIZATION
  // ============================================
  function init() {
    populateDropdown();
    loadWebhookUrl();
    setDefaultDate();
    attachChangeListeners();
    setupAutoSlug();
    schedulePreviewUpdate();

    // Fix: capture dropdown value on change and on any interaction
    const dropdown = document.getElementById('systemDropdown');
    if (dropdown) {
      dropdown.addEventListener('change', function () {
        dropdown._lastValue = dropdown.value;
      });
      // Also capture on mousedown/focus to handle edge cases
      dropdown.addEventListener('mousedown', function () {
        if (dropdown.value) dropdown._lastValue = dropdown.value;
      });
    }
    const addBtn = document.getElementById('addSystemBtn');
    if (addBtn) {
      addBtn.addEventListener('click', function (e) {
        e.preventDefault();
        // Read value directly at click time
        const select = document.getElementById('systemDropdown');
        if (!select.value && select._lastValue) {
          select.value = select._lastValue;
        }
        addSelectedSystem();
      });
    }
  }

  function setDefaultDate() {
    document.getElementById('proposalDate').value = new Date().toISOString().split('T')[0];
  }

  function populateDropdown() {
    const select = document.getElementById('systemDropdown');
    select.innerHTML = '<option value="">— Select a system to add —</option>';
    SYSTEMS_LIBRARY.forEach(sys => {
      const opt = document.createElement('option');
      opt.value = sys.id;
      opt.textContent = sys.name;
      select.appendChild(opt);
    });
  }

  // ============================================
  // AUTO-SLUG GENERATION
  // ============================================
  function setupAutoSlug() {
    const companyInput = document.getElementById('clientCompany');
    const nameInput = document.getElementById('clientName');
    const slugInput = document.getElementById('proposalSlug');

    function generateSlug() {
      const company = companyInput.value.trim();
      const name = nameInput.value.trim();
      const base = company || name || '';
      if (!base) {
        slugInput.value = '';
        return;
      }
      // Create slug: lowercase, replace spaces/special chars with hyphens
      let slug = base.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Add a short unique suffix to avoid collisions
      const date = new Date();
      const suffix = date.getFullYear().toString().slice(-2) + (date.getMonth() + 1).toString().padStart(2, '0');
      slug = slug + '-' + suffix;

      slugInput.value = slug;
    }

    companyInput.addEventListener('input', generateSlug);
    nameInput.addEventListener('input', generateSlug);
  }

  // ============================================
  // SYSTEM DROPDOWN + ADD
  // ============================================
  window.addSelectedSystem = function () {
    const select = document.getElementById('systemDropdown');
    const id = select.value || select._lastValue;
    if (!id) return alert('Please select a system from the dropdown.');

    if (id !== 'custom_automation' && addedSystems.find(s => s.id === id)) {
      return alert('This system has already been added.');
    }

    const lib = SYSTEMS_LIBRARY.find(s => s.id === id);
    if (!lib) return;

    const system = {
      id: id,
      uid: id + '_' + Date.now(),
      name: lib.name,
      description: lib.description,
      image: lib.image,
      draft_notes: lib.description,
      deliverables: [...lib.deliverables],
      requirements: [...lib.requirements]
    };

    addedSystems.push(system);
    select.value = '';
    renderAddedSystems();
    schedulePreviewUpdate();
  };

  window.removeSystem = function (uid) {
    addedSystems = addedSystems.filter(s => s.uid !== uid);
    renderAddedSystems();
    schedulePreviewUpdate();
  };

  window.moveSystemUp = function (uid) {
    const idx = addedSystems.findIndex(s => s.uid === uid);
    if (idx > 0) {
      [addedSystems[idx - 1], addedSystems[idx]] = [addedSystems[idx], addedSystems[idx - 1]];
      renderAddedSystems();
      schedulePreviewUpdate();
    }
  };

  window.moveSystemDown = function (uid) {
    const idx = addedSystems.findIndex(s => s.uid === uid);
    if (idx < addedSystems.length - 1) {
      [addedSystems[idx], addedSystems[idx + 1]] = [addedSystems[idx + 1], addedSystems[idx]];
      renderAddedSystems();
      schedulePreviewUpdate();
    }
  };

  function renderAddedSystems() {
    const container = document.getElementById('addedSystemsList');
    if (addedSystems.length === 0) {
      container.innerHTML = '<div class="empty-state">No systems added yet. Select one from the dropdown above.</div>';
      return;
    }

    let html = '';
    addedSystems.forEach((sys, idx) => {
      const isCustom = sys.id === 'custom_automation';
      const isFirst = idx === 0;
      const isLast = idx === addedSystems.length - 1;

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

      // Draft notes
      html += '<div class="form-group">';
      html += '<label>' + (isCustom ? 'System Description' : 'Draft Notes (editable)') + '</label>';
      html += '<textarea id="sys_notes_' + sys.uid + '" rows="3" placeholder="' + (isCustom ? 'Describe this custom automation...' : 'Notes about this system for this client...') + '" oninput="updateSystemField(\'' + sys.uid + '\', \'draft_notes\', this.value)">' + escapeHtml(sys.draft_notes || '') + '</textarea>';
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
  }

  window.updateSystemField = function (uid, field, value) {
    const sys = addedSystems.find(s => s.uid === uid);
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
  // SCOPE OF WORK
  // ============================================
  function renderScopeItems() {
    const container = document.getElementById('scopeList');
    let html = '<ul class="editable-list">';
    scopeItems.forEach(function (item, i) {
      html += '<li><input type="text" value="' + escapeAttr(item) + '" data-scope-idx="' + i + '" oninput="updateScopeItem(this)"><button class="btn-icon" onclick="removeScopeItem(' + i + ')" title="Remove">&times;</button></li>';
    });
    html += '</ul>';
    container.innerHTML = html;
  }

  window.addScopeItem = function () {
    scopeItems.push('');
    renderScopeItems();
    var inputs = document.querySelectorAll('#scopeList input');
    if (inputs.length) inputs[inputs.length - 1].focus();
    schedulePreviewUpdate();
  };

  window.removeScopeItem = function (idx) {
    scopeItems.splice(idx, 1);
    renderScopeItems();
    schedulePreviewUpdate();
  };

  window.updateScopeItem = function (el) {
    var idx = parseInt(el.dataset.scopeIdx);
    scopeItems[idx] = el.value;
    schedulePreviewUpdate();
  };

  // ============================================
  // TIMELINE / MILESTONES
  // ============================================
  function renderMilestones() {
    const container = document.getElementById('milestoneList');
    let html = '';
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
  // PRICING — One-Time or Setup+Monthly per item
  // ============================================
  function renderPricingItems() {
    const container = document.getElementById('pricingItems');
    let html = '';
    pricingLineItems.forEach(function (item, i) {
      var ptype = item.pricing_type || 'one_time';
      html += '<div class="pricing-row-v2">';
      html += '<input type="text" class="pr-name" value="' + escapeAttr(item.name) + '" placeholder="Item name" oninput="updatePricingItem(' + i + ', \'name\', this.value)">';
      html += '<select class="pr-type" onchange="updatePricingItem(' + i + ', \'pricing_type\', this.value); renderPricingItems();">';
      html += '<option value="one_time"' + (ptype === 'one_time' ? ' selected' : '') + '>One-Time</option>';
      html += '<option value="setup_monthly"' + (ptype === 'setup_monthly' ? ' selected' : '') + '>Setup + Monthly</option>';
      html += '</select>';
      html += '<input type="number" class="pr-setup" value="' + ((item.setup_cents || 0) / 100).toFixed(2) + '" placeholder="0.00" step="0.01" min="0" oninput="updatePricingSetup(' + i + ', this.value)">';
      if (ptype === 'setup_monthly') {
        html += '<input type="number" class="pr-monthly" value="' + ((item.monthly_cents || 0) / 100).toFixed(2) + '" placeholder="0.00" step="0.01" min="0" oninput="updatePricingMonthly(' + i + ', this.value)">';
      } else {
        html += '<div class="pr-monthly-placeholder"></div>';
      }
      html += '<button class="btn-icon" onclick="removePricingItem(' + i + ')" title="Remove">&times;</button>';
      html += '</div>';
    });
    container.innerHTML = html;
    updatePricingTotals();
  }

  window.addPricingItem = function () {
    pricingLineItems.push({ name: '', pricing_type: 'one_time', setup_cents: 0, monthly_cents: 0 });
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

  window.updatePricingSetup = function (idx, value) {
    pricingLineItems[idx].setup_cents = Math.round(parseFloat(value || 0) * 100);
    updatePricingTotals();
    schedulePreviewUpdate();
  };

  window.updatePricingMonthly = function (idx, value) {
    pricingLineItems[idx].monthly_cents = Math.round(parseFloat(value || 0) * 100);
    updatePricingTotals();
    schedulePreviewUpdate();
  };

  function updatePricingTotals() {
    var totalSetup = 0;
    var totalMonthly = 0;
    pricingLineItems.forEach(function (item) {
      totalSetup += (item.setup_cents || 0);
      if (item.pricing_type === 'setup_monthly') {
        totalMonthly += (item.monthly_cents || 0);
      }
    });
    var currency = document.getElementById('pricingCurrency').value;
    var symbols = { usd: '$', eur: '€', gbp: '£', cad: 'CA$', aud: 'A$', brl: 'R$' };
    var sym = symbols[currency] || '$';
    document.getElementById('totalSetup').textContent = sym + (totalSetup / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    document.getElementById('totalMonthly').textContent = sym + (totalMonthly / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Show/hide monthly total
    var monthlyRow = document.getElementById('pricingTotalMonthly');
    if (monthlyRow) {
      monthlyRow.style.display = totalMonthly > 0 ? 'flex' : 'none';
    }
  }

  // ============================================
  // BUILD JSON
  // ============================================
  function buildJSON() {
    var systems = addedSystems.map(function (sys) {
      var delContainer = document.getElementById('sys_del_' + sys.uid);
      var reqContainer = document.getElementById('sys_req_' + sys.uid);
      var notesEl = document.getElementById('sys_notes_' + sys.uid);

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
        draft_notes: notesEl ? notesEl.value : (sys.draft_notes || ''),
        final_copy: null,
        deliverables: deliverables,
        requirements: requirements,
        image: sys.image || ''
      };
    });

    var totalSetup = 0;
    var totalMonthly = 0;
    var items = pricingLineItems.map(function (i) {
      totalSetup += (i.setup_cents || 0);
      if (i.pricing_type === 'setup_monthly') {
        totalMonthly += (i.monthly_cents || 0);
      }
      return {
        name: i.name,
        pricing_type: i.pricing_type || 'one_time',
        setup_cents: i.setup_cents || 0,
        monthly_cents: i.monthly_cents || 0
      };
    });

    var dueNowVal = parseFloat(document.getElementById('dueNowAmount').value || 0);
    var dueNowCents = Math.round(dueNowVal * 100);

    return {
      proposal_id: document.getElementById('proposalId').value,
      slug: document.getElementById('proposalSlug').value,
      created_date: document.getElementById('proposalDate').value || new Date().toISOString().split('T')[0],
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
        draft: document.getElementById('problemDraft').value,
        final: null
      },
      solution: {
        draft: document.getElementById('solutionDraft').value,
        final: null
      },
      systems: systems,
      scope_of_work: {
        draft_bullets: scopeItems.filter(function (s) { return s.trim(); }),
        final_bullets: null
      },
      timeline: {
        milestones: milestones.filter(function (m) { return m.title.trim() || m.when.trim(); })
      },
      pricing: {
        currency: document.getElementById('pricingCurrency').value,
        items: items,
        total_setup_cents: totalSetup,
        total_monthly_cents: totalMonthly,
        due_now_cents: dueNowCents,
        notes: document.getElementById('pricingNotes').value
      },
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
    document.getElementById('proposalDate').value = data.created_date ? data.created_date.split('T')[0] : '';

    // Problem & Solution
    document.getElementById('problemDraft').value = (data.problem && data.problem.draft) || '';
    document.getElementById('solutionDraft').value = (data.solution && data.solution.draft) || '';

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
          draft_notes: sys.draft_notes || '',
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

    // Pricing
    var pricing = data.pricing || {};
    document.getElementById('pricingCurrency').value = pricing.currency || 'usd';
    document.getElementById('pricingNotes').value = pricing.notes || '';
    document.getElementById('dueNowAmount').value = pricing.due_now_cents ? (pricing.due_now_cents / 100).toFixed(2) : '';

    pricingLineItems = (pricing.items || []).map(function (i) {
      return {
        name: i.name || '',
        pricing_type: i.pricing_type || 'one_time',
        setup_cents: i.setup_cents || i.amount_cents || 0,
        monthly_cents: i.monthly_cents || 0
      };
    });
    renderPricingItems();

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
  // CREATE PROPOSAL — Save + Send URL to webhook
  // ============================================
  window.createProposal = async function () {
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

    try {
      var response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Source': 'flowtier-proposal-builder'
        },
        body: JSON.stringify(data)
      });

      var result = await response.json();
      var now = new Date().toLocaleString();

      if (response.ok && result.success) {
        statusText.innerHTML = '<span class="badge badge-success">Proposal Created!</span> <span style="color:var(--color-text-muted);font-size:0.75rem;">' + now + '</span>';
        responseEl.textContent = 'URL: ' + result.url + '\n\nThe proposal URL and client details have been sent to your Make.com webhook.';
      } else {
        statusText.innerHTML = '<span class="badge badge-danger">Error (' + response.status + ')</span>';
        responseEl.textContent = result.error || 'Unknown error';
      }
    } catch (err) {
      statusText.innerHTML = '<span class="badge badge-danger">Failed</span>';
      responseEl.textContent = err.message;
    }
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
  // BOOT
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
