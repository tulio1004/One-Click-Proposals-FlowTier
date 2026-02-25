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
  let addedSystems = []; // Array of { id, name, description, image, draft_notes, deliverables, requirements }
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
    schedulePreviewUpdate();

    // Fix: capture dropdown value on change, use mousedown on button
    const dropdown = document.getElementById('systemDropdown');
    if (dropdown) {
      dropdown.addEventListener('change', function () {
        dropdown._lastValue = dropdown.value;
      });
    }
    const addBtn = document.getElementById('addSystemBtn');
    if (addBtn) {
      addBtn.addEventListener('mousedown', function (e) {
        e.preventDefault();
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
  // SYSTEM DROPDOWN + ADD
  // ============================================
  window.addSelectedSystem = function () {
    const select = document.getElementById('systemDropdown');
    const id = select.value || select._lastValue;
    if (!id) return alert('Please select a system from the dropdown.');

    // Allow custom_automation to be added multiple times, but others only once
    if (id !== 'custom_automation' && addedSystems.find(s => s.id === id)) {
      return alert('This system has already been added.');
    }

    const lib = SYSTEMS_LIBRARY.find(s => s.id === id);
    if (!lib) return;

    const system = {
      id: id,
      uid: id + '_' + Date.now(), // unique key for rendering
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

      html += `<div class="system-card-builder" data-uid="${sys.uid}">`;
      html += `<div class="system-card-header">`;
      html += `<div class="system-card-title">`;
      if (sys.image) {
        html += `<img src="${escapeAttr(sys.image)}" alt="" class="system-thumb">`;
      }
      html += `<div>`;
      if (isCustom) {
        html += `<input type="text" class="system-name-input" value="${escapeAttr(sys.name)}" placeholder="Custom System Name" onchange="updateSystemField('${sys.uid}', 'name', this.value)">`;
      } else {
        html += `<strong>${escapeHtml(sys.name)}</strong>`;
      }
      html += `</div></div>`;
      html += `<div class="system-card-actions">`;
      if (!isFirst) html += `<button class="btn-icon" onclick="moveSystemUp('${sys.uid}')" title="Move up">&#9650;</button>`;
      if (!isLast) html += `<button class="btn-icon" onclick="moveSystemDown('${sys.uid}')" title="Move down">&#9660;</button>`;
      html += `<button class="btn-icon btn-danger" onclick="removeSystem('${sys.uid}')" title="Remove system">&times;</button>`;
      html += `</div></div>`;

      // Draft notes / description
      html += `<div class="form-group">`;
      html += `<label>${isCustom ? 'System Description' : 'Draft Notes (editable)'}</label>`;
      html += `<textarea id="sys_notes_${sys.uid}" rows="3" placeholder="${isCustom ? 'Describe this custom automation...' : 'Notes about this system for this client...'}" oninput="updateSystemField('${sys.uid}', 'draft_notes', this.value)">${escapeHtml(sys.draft_notes || '')}</textarea>`;
      html += `</div>`;

      // Deliverables
      html += `<div class="form-group">`;
      html += `<label>Deliverables</label>`;
      html += `<ul class="editable-list" id="sys_del_${sys.uid}">`;
      sys.deliverables.forEach(d => {
        html += editableListItemHTML(d);
      });
      html += `</ul>`;
      html += `<button class="add-item-btn" onclick="addEditableListItem(document.getElementById('sys_del_${sys.uid}')); schedulePreviewUpdate()">+ Add Deliverable</button>`;
      html += `</div>`;

      // Requirements
      html += `<div class="form-group">`;
      html += `<label>Requirements</label>`;
      html += `<ul class="editable-list" id="sys_req_${sys.uid}">`;
      sys.requirements.forEach(r => {
        html += editableListItemHTML(r);
      });
      html += `</ul>`;
      html += `<button class="add-item-btn" onclick="addEditableListItem(document.getElementById('sys_req_${sys.uid}')); schedulePreviewUpdate()">+ Add Requirement</button>`;
      html += `</div>`;

      html += `</div>`;
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
    return `<li><input type="text" value="${escapeAttr(value)}" oninput="schedulePreviewUpdate()"><button class="btn-icon" onclick="this.parentElement.remove(); schedulePreviewUpdate()" title="Remove">&times;</button></li>`;
  }

  window.addEditableListItem = function (container, value) {
    if (!container) return;
    const li = document.createElement('li');
    li.innerHTML = `<input type="text" value="${escapeAttr(value || '')}" oninput="schedulePreviewUpdate()"><button class="btn-icon" onclick="this.parentElement.remove(); schedulePreviewUpdate()" title="Remove">&times;</button>`;
    container.appendChild(li);
  };

  // ============================================
  // SCOPE OF WORK
  // ============================================
  function renderScopeItems() {
    const container = document.getElementById('scopeList');
    let html = '<ul class="editable-list">';
    scopeItems.forEach((item, i) => {
      html += `<li><input type="text" value="${escapeAttr(item)}" data-scope-idx="${i}" oninput="updateScopeItem(this)"><button class="btn-icon" onclick="removeScopeItem(${i})" title="Remove">&times;</button></li>`;
    });
    html += '</ul>';
    container.innerHTML = html;
  }

  window.addScopeItem = function () {
    scopeItems.push('');
    renderScopeItems();
    const inputs = document.querySelectorAll('#scopeList input');
    if (inputs.length) inputs[inputs.length - 1].focus();
    schedulePreviewUpdate();
  };

  window.removeScopeItem = function (idx) {
    scopeItems.splice(idx, 1);
    renderScopeItems();
    schedulePreviewUpdate();
  };

  window.updateScopeItem = function (el) {
    const idx = parseInt(el.dataset.scopeIdx);
    scopeItems[idx] = el.value;
    schedulePreviewUpdate();
  };

  // ============================================
  // TIMELINE / MILESTONES
  // ============================================
  function renderMilestones() {
    const container = document.getElementById('milestoneList');
    let html = '';
    milestones.forEach((m, i) => {
      html += `
        <div class="milestone-row">
          <input type="text" value="${escapeAttr(m.title)}" placeholder="Title" oninput="updateMilestone(${i}, 'title', this.value)">
          <input type="text" value="${escapeAttr(m.when)}" placeholder="When" oninput="updateMilestone(${i}, 'when', this.value)">
          <input type="text" value="${escapeAttr(m.details)}" placeholder="Details" oninput="updateMilestone(${i}, 'details', this.value)">
          <button class="btn-icon" onclick="removeMilestone(${i})" title="Remove">&times;</button>
        </div>
      `;
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
  // PRICING
  // ============================================
  function renderPricingItems() {
    const container = document.getElementById('pricingItems');
    let html = '';
    pricingLineItems.forEach((item, i) => {
      html += `
        <div class="pricing-row">
          <input type="text" value="${escapeAttr(item.name)}" placeholder="Item name" oninput="updatePricingItem(${i}, 'name', this.value)">
          <input type="text" value="${escapeAttr(item.description)}" placeholder="Description" oninput="updatePricingItem(${i}, 'description', this.value)">
          <input type="number" value="${(item.amount_cents / 100).toFixed(2)}" placeholder="0.00" step="0.01" min="0" oninput="updatePricingAmount(${i}, this.value)">
          <button class="btn-icon" onclick="removePricingItem(${i})" title="Remove">&times;</button>
        </div>
      `;
    });
    container.innerHTML = html;
    updatePricingTotal();
  }

  window.addPricingItem = function () {
    pricingLineItems.push({ name: '', description: '', amount_cents: 0 });
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
    updatePricingTotal();
    schedulePreviewUpdate();
  };

  function updatePricingTotal() {
    const total = pricingLineItems.reduce((sum, item) => sum + (item.amount_cents || 0), 0);
    const currency = document.getElementById('pricingCurrency').value;
    const symbols = { usd: '$', eur: '€', gbp: '£', cad: 'CA$', aud: 'A$', brl: 'R$' };
    const sym = symbols[currency] || '$';
    document.getElementById('totalAmount').textContent = sym + (total / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // ============================================
  // BUILD JSON
  // ============================================
  function buildJSON() {
    // Collect current deliverables/requirements from DOM for each system
    const systems = addedSystems.map(sys => {
      const delContainer = document.getElementById('sys_del_' + sys.uid);
      const reqContainer = document.getElementById('sys_req_' + sys.uid);
      const notesEl = document.getElementById('sys_notes_' + sys.uid);

      const deliverables = [];
      if (delContainer) {
        delContainer.querySelectorAll('input').forEach(inp => {
          if (inp.value.trim()) deliverables.push(inp.value.trim());
        });
      }

      const requirements = [];
      if (reqContainer) {
        reqContainer.querySelectorAll('input').forEach(inp => {
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

    const total = pricingLineItems.reduce((sum, item) => sum + (item.amount_cents || 0), 0);

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
        draft_bullets: scopeItems.filter(s => s.trim()),
        final_bullets: null
      },
      timeline: {
        milestones: milestones.filter(m => m.title.trim() || m.when.trim())
      },
      pricing: {
        currency: document.getElementById('pricingCurrency').value,
        mode: document.getElementById('pricingMode').value,
        items: pricingLineItems.map(i => ({ ...i })),
        total_cents: total,
        notes: document.getElementById('pricingNotes').value
      },
      settings: {
        tone: document.getElementById('settingsTone').value,
        industry: document.getElementById('settingsIndustry').value,
        show_images: document.getElementById('settingsShowImages').checked,
        deposit_required: document.getElementById('settingsDeposit').checked,
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
    const data = buildJSON();
    const iframe = document.getElementById('previewFrame');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'proposal_update', payload: data }, '*');
    }
  }

  window.refreshPreview = function () {
    updatePreview();
    const iframe = document.getElementById('previewFrame');
    if (iframe) {
      iframe.src = iframe.src;
      setTimeout(updatePreview, 500);
    }
  };

  // ============================================
  // JSON ACTIONS
  // ============================================
  window.copyJSON = function () {
    const json = JSON.stringify(buildJSON(), null, 2);
    navigator.clipboard.writeText(json).then(() => {
      showToast('JSON copied to clipboard');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = json;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('JSON copied to clipboard');
    });
  };

  window.downloadJSON = function () {
    const data = buildJSON();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (data.slug || 'proposal') + '.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  window.loadJSON = function () {
    document.getElementById('jsonFileInput').click();
  };

  window.handleFileLoad = function (event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result);
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
    document.getElementById('clientName').value = data.client?.name || '';
    document.getElementById('clientCompany').value = data.client?.company || '';
    document.getElementById('clientEmail').value = data.client?.email || '';
    document.getElementById('clientPhone').value = data.client?.phone || '';

    // Project
    document.getElementById('projectName').value = data.project?.name || '';
    document.getElementById('proposalId').value = data.proposal_id || '';
    document.getElementById('proposalSlug').value = data.slug || '';
    document.getElementById('proposalDate').value = data.created_date ? data.created_date.split('T')[0] : '';

    // Problem & Solution
    document.getElementById('problemDraft').value = data.problem?.draft || '';
    document.getElementById('solutionDraft').value = data.solution?.draft || '';

    // Systems
    addedSystems = [];
    if (data.systems && Array.isArray(data.systems)) {
      data.systems.forEach(sys => {
        const lib = SYSTEMS_LIBRARY.find(s => s.id === sys.id);
        addedSystems.push({
          id: sys.id,
          uid: sys.id + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: sys.name || (lib ? lib.name : 'Unknown System'),
          description: lib ? lib.description : '',
          image: sys.image || (lib ? lib.image : ''),
          draft_notes: sys.draft_notes || '',
          deliverables: sys.deliverables || (lib ? [...lib.deliverables] : []),
          requirements: sys.requirements || (lib ? [...lib.requirements] : [])
        });
      });
    }
    renderAddedSystems();

    // Scope
    scopeItems = data.scope_of_work?.draft_bullets || data.scope_of_work?.final_bullets || [];
    renderScopeItems();

    // Timeline
    milestones = data.timeline?.milestones || [];
    renderMilestones();

    // Pricing
    document.getElementById('pricingMode').value = data.pricing?.mode || 'one_time';
    document.getElementById('pricingCurrency').value = data.pricing?.currency || 'usd';
    document.getElementById('pricingNotes').value = data.pricing?.notes || '';
    pricingLineItems = (data.pricing?.items || []).map(i => ({ ...i }));
    renderPricingItems();

    // Settings
    document.getElementById('settingsTone').value = data.settings?.tone || 'Professional';
    document.getElementById('settingsIndustry').value = data.settings?.industry || 'Service Business';
    document.getElementById('settingsShowImages').checked = data.settings?.show_images !== false;
    document.getElementById('settingsDeposit').checked = data.settings?.deposit_required || false;
    document.getElementById('settingsPayText').value = data.settings?.pay_button_text || 'Pay Now';

    schedulePreviewUpdate();
  }

  // ============================================
  // WEBHOOK
  // ============================================
  function loadWebhookUrl() {
    const saved = localStorage.getItem('flowtier_webhook_url');
    if (saved) {
      document.getElementById('webhookUrl').value = saved;
    }
  }

  window.sendWebhook = async function () {
    const url = document.getElementById('webhookUrl').value.trim();
    if (!url) {
      alert('Please enter a Make.com Webhook URL.');
      return;
    }

    localStorage.setItem('flowtier_webhook_url', url);

    const data = buildJSON();
    const statusPanel = document.getElementById('webhookStatus');
    const statusText = document.getElementById('webhookStatusText');
    const responseEl = document.getElementById('webhookResponse');

    statusPanel.style.display = 'block';
    statusText.innerHTML = '<span class="badge badge-warning">Sending...</span>';
    responseEl.textContent = '';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Source': 'flowtier-proposal-builder',
          'X-Proposal-Id': data.proposal_id || ''
        },
        body: JSON.stringify(data)
      });

      const text = await response.text();
      let prettyBody = text;
      try {
        prettyBody = JSON.stringify(JSON.parse(text), null, 2);
      } catch (e) { /* not JSON */ }

      const now = new Date().toLocaleString();
      if (response.ok) {
        statusText.innerHTML = `<span class="badge badge-success">Success (${response.status})</span> <span style="color:var(--color-text-muted);font-size:0.75rem;">Last sent: ${now}</span>`;
      } else {
        statusText.innerHTML = `<span class="badge badge-danger">Error (${response.status})</span> <span style="color:var(--color-text-muted);font-size:0.75rem;">Last sent: ${now}</span>`;
      }
      responseEl.textContent = prettyBody || '(empty response)';
    } catch (err) {
      const now = new Date().toLocaleString();
      statusText.innerHTML = `<span class="badge badge-danger">Failed</span> <span style="color:var(--color-text-muted);font-size:0.75rem;">${now}</span>`;
      responseEl.textContent = err.message;
    }
  };

  // ============================================
  // CHANGE LISTENERS
  // ============================================
  function attachChangeListeners() {
    const formPanel = document.getElementById('formPanel');
    formPanel.addEventListener('input', function (e) {
      if (e.target.matches('input, textarea, select')) {
        schedulePreviewUpdate();
      }
    });
    formPanel.addEventListener('change', function (e) {
      if (e.target.matches('input, select')) {
        schedulePreviewUpdate();
        if (e.target.id === 'pricingCurrency') {
          updatePricingTotal();
        }
      }
    });
  }

  // ============================================
  // TOAST
  // ============================================
  function showToast(msg) {
    const existing = document.querySelector('.toast-msg');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:var(--color-text);color:white;padding:12px 24px;border-radius:var(--radius-md);font-size:0.875rem;font-weight:600;box-shadow:var(--shadow-lg);z-index:9999;animation:fadeInUp 0.3s ease;';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // ============================================
  // UTILITIES
  // ============================================
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
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
  const iframe = document.getElementById('previewFrame');
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
