/* =============================================================================
   Portfolio — app.js
   Vanilla JS SPA. Fetches content.yaml, renders the page, wires events.
   No framework, no build step. Cache-friendly static deploy.
   ============================================================================= */

(function () {
  'use strict';

  const root = document.getElementById('root');

  // ===========================================================================
  // Helpers
  // ===========================================================================

  /** HTML-escape user-controlled strings. Safe by default for everything. */
  function esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Format a headline. Inputs come from content.yaml. The text is escaped first,
   * then we re-introduce a small allowlist of formatting:
   *   **word**  → <span class="it2">word</span>  (italic, pop color)
   *   *word*    → <span class="it1">word</span>  (italic, accent color)
   *   newline   → <br>
   * Order matters: process ** before * to avoid greedy single-asterisk matches.
   */
  function fmtHeadline(text) {
    if (!text) return '';
    const escaped = esc(String(text).trim());
    // Two passes via callback (avoids regex backref syntax). Match double
    // asterisks first so the single-asterisk pass cannot eat them.
    const pass1 = escaped.replace(
      /\*\*([^*\n]+?)\*\*/g,
      function (_, inner) { return '<span class=\"it2\">' + inner + '</span>'; }
    );
    const pass2 = pass1.replace(
      /\*([^*\n]+?)\*/g,
      function (_, inner) { return '<span class=\"it1\">' + inner + '</span>'; }
    );
    return pass2.replace(/\n/g, '<br>');
  }

  /** Force trailing line breaks to <br> but preserve paragraph blocks. */
  function fmtParagraph(text) {
    if (!text) return '';
    return esc(String(text).trim()).replace(/\n\n+/g, '</p><p>').replace(/\n/g, ' ');
  }

  function safeHref(url) {
    if (!url) return '#';
    const s = String(url).trim();
    // Allow http(s), mailto, and in-page anchors. Block javascript: etc.
    if (/^(https?:|mailto:|#|\/)/i.test(s)) return esc(s);
    return '#';
  }

  // ===========================================================================
  // Section renderers — return HTML strings.
  // ===========================================================================

  function renderNav(D) {
    const links = (D.nav?.links || [])
      .map(l => `<a href="${safeHref(l.href)}">${esc(l.label)}</a>`)
      .join('');
    const cta = D.nav?.cta || { label: 'Hire me', href: '#contact' };
    return `
      <nav class="px-nav">
        <div class="px-nav-inner">
          <div class="px-logo"><b>${esc(D.profile.name.split(' ')[0])}</b> <i>${esc(D.profile.name.split(' ').slice(1).join(' '))}</i></div>
          <div class="px-navlinks">${links}</div>
          <a class="px-cta" href="${safeHref(cta.href)}">${esc(cta.label)}</a>
        </div>
      </nav>`;
  }

  function renderHero(D) {
    const h = D.hero || {};
    const chips = (h.chips || []).slice(0, 3);
    const chipClasses = ['c1', 'c2', 'c3'];
    const chipsHtml = chips
      .map((c, i) => `<div class="px-chip ${chipClasses[i] || ''}">${esc(c.label || c)}</div>`)
      .join('');

    const primary = h.primary_cta   || { label: 'See selected work', href: '#projects' };
    const secondary = h.secondary_cta || { label: 'LinkedIn ↗',       href: D.profile.linkedin };

    const tagText = (h.tag || '').trim();
    const tagHtml = tagText
      ? `<div class="px-tag" data-pr><span class="led"></span>${esc(tagText)}</div>`
      : '';

    const avatarSrc = (D.profile && D.profile.avatar || '').trim();
    // Allow http(s), relative paths, and data: URIs — but not javascript:.
    const safeAvatarSrc = /^(javascript|vbscript|data:text\/html):/i.test(avatarSrc) ? '' : avatarSrc;
    const avatarFace = safeAvatarSrc
      ? (() => {
          const alt = esc(D.profile.name || '');
          const src = esc(safeAvatarSrc);
          // Derive WebP + JPEG sources for modern image delivery
          // Derive base name for responsive srcset (e.g. "avatar" from "avatar.webp")
          const base = src.replace(/\.[^.]+$/, '');
          const webpSmall = `${base}_400.webp`;
          const webpLarge = `${base}.webp`;
          const jpgSmall  = `${base}_400.jpg`;
          const jpgLarge  = `${base}.jpg`;
          // sizes matches CSS: disk = avatar-wrap(320px) - inset(14px*2) = 292px desktop,
          // and 220px wrap → 192px disk on mobile.
          const sizes = '(max-width: 760px) 192px, 292px';
          return `<picture>` +
            `<source type="image/webp" srcset="${webpSmall} 400w, ${webpLarge} 640w" sizes="${sizes}">` +
            `<source type="image/jpeg" srcset="${jpgSmall} 400w, ${jpgLarge} 640w" sizes="${sizes}">` +
            `<img class="px-avatar-face" src="${jpgLarge}" alt="${alt}" ` +
                 `width="640" height="640" fetchpriority="high">` +
            `</picture>`;
        })()
      : `<svg class="px-avatar-face" viewBox="0 0 200 200" aria-hidden="true">
                  <defs>
                    <clipPath id="px-face-clip"><circle cx="100" cy="100" r="100"/></clipPath>
                  </defs>
                  <g clip-path="url(#px-face-clip)">
                    <rect width="200" height="200" fill="rgba(255,255,255,0.08)"/>
                    <ellipse cx="100" cy="220" rx="110" ry="70" fill="rgba(255,255,255,0.18)"/>
                    <rect x="84" y="138" width="32" height="26" rx="6" fill="rgba(255,255,255,0.22)"/>
                    <ellipse cx="100" cy="92" rx="46" ry="54" fill="rgba(255,255,255,0.92)"/>
                    <path d="M54 86 C56 50 76 38 100 38 C124 38 144 50 146 86 C146 78 138 70 128 68 C124 60 112 56 100 56 C88 56 76 60 72 68 C62 70 54 78 54 86 Z" fill="rgba(20,17,14,0.85)"/>
                    <circle cx="86"  cy="96" r="3.2" fill="#14110E"/>
                    <circle cx="114" cy="96" r="3.2" fill="#14110E"/>
                    <rect x="78"  y="86" width="14" height="2.4" rx="1.2" fill="#14110E"/>
                    <rect x="108" y="86" width="14" height="2.4" rx="1.2" fill="#14110E"/>
                    <path d="M100 102 L97 116 L103 116 Z" fill="rgba(20,17,14,0.18)"/>
                    <path d="M90 124 Q100 132 110 124" stroke="#14110E" stroke-width="2.4" fill="none" stroke-linecap="round"/>
                  </g>
                </svg>`;
    const avatarClass = safeAvatarSrc ? 'px-avatar has-img' : 'px-avatar';

    return `
      <section class="px-shell px-hero">
        <div class="px-hero-grid">
          <div class="px-hero-text">
            ${tagHtml}
            <h1 data-pr data-pd="1">${fmtHeadline(h.headline)}</h1>
            <p class="px-hero-sub" data-pr data-pd="2">${esc((h.sub || '').trim())}</p>
            <div class="px-hero-actions" data-pr data-pd="3">
              <a class="px-btn p" href="${safeHref(primary.href)}">${esc(primary.label)}</a>
              <a class="px-btn s" href="${safeHref(secondary.href)}" target="_blank" rel="noreferrer">${esc(secondary.label)}</a>
            </div>
          </div>
          <div class="px-hero-avatar-col" data-pr data-pd="2">
            <div class="px-avatar-wrap">
              <div class="px-orbit"></div>
              <div class="${avatarClass}">
                ${avatarFace}
              </div>
              ${chipsHtml}
            </div>
          </div>
        </div>
      </section>`;
  }

  function renderMarquee(D) {
    const items = D.marquee || [];
    if (!items.length) return '';
    // Render the list twice for a seamless loop.
    const oneLoop = items
      .map(item => `${esc(item)}<span class="star">✦</span>`)
      .join('');
    return `
      <div class="px-marquee">
        <div class="px-mq-track"><span>${oneLoop}${oneLoop}</span></div>
      </div>`;
  }

  function renderAbout(D) {
    const a = D.about || {};
    const stats = (a.stats || [])
      .map(s => `<div class="px-stat"><div class="pxsv">${esc(s.value)}</div><div class="pxsl">${esc(s.label)}</div></div>`)
      .join('');
    return `
      <section class="px-shell px-section" id="about">
        <div class="px-eye" data-pr>${esc(a.eyebrow || 'About')}</div>
        <h2 data-pr>${fmtHeadline(a.headline)}</h2>
        <div class="px-about">
          <div class="px-about-text" data-pr>
            <p>${esc((a.paragraph_1 || '').trim())}</p>
            <p>${esc((a.paragraph_2 || '').trim())}</p>
          </div>
          <div class="px-stats" data-pr data-pd="2">${stats}</div>
        </div>
      </section>`;
  }

  function renderAIMind(D) {
    const a = D.ai_mind || {};
    const proof = (a.proof || [])
      .map((p, i) => `
        <div class="px-ai-card" data-pr data-pd="${i + 1}">
          <span class="px-ai-card-t">CASE 0${i + 1}</span>
          <div class="px-ai-card-n">${esc(p.name)}</div>
          <div class="px-ai-card-r">${esc((p.description || '').trim())}</div>
        </div>`).join('');
    return `
      <section class="px-ai" id="ai">
        <div class="px-shell">
          <div class="px-eye" data-pr>${esc(a.eyebrow || 'AI Mind')}</div>
          <h2 data-pr>${fmtHeadline(a.headline)}</h2>
          <div class="px-ai-body">
            <p data-pr data-pd="1">${esc((a.paragraph_1 || '').trim())}</p>
            <p data-pr data-pd="2">${esc((a.paragraph_2 || '').trim())}</p>
          </div>
          <div class="px-ai-proof">${proof}</div>
        </div>
      </section>`;
  }

  function renderSkills(D) {
    const s = D.skills || {};
    const groups = (s.groups || []).map(g => `
      <div class="px-skill">
        <h3>${esc(g.title)}</h3>
        <ul>${(g.items || []).map(it => `<li>${esc(it)}</li>`).join('')}</ul>
      </div>`).join('');
    return `
      <section class="px-shell px-section" id="skills">
        <div class="px-eye" data-pr>${esc(s.eyebrow || 'Skills')}</div>
        <h2 data-pr>${fmtHeadline(s.headline)}</h2>
        <div class="px-skills" data-pr>${groups}</div>
      </section>`;
  }

  function renderExperience(D) {
    const e = D.experience || {};
    const rows = (e.jobs || []).map((job, i) => {
      const num = String(i + 1).padStart(2, '0');
      const bullets = (job.bullets || []).map(b => `<li>${esc(b)}</li>`).join('');
      const open = i === 0 ? ' open' : '';
      return `
        <div class="px-exp-row${open}" data-pr data-pd="${Math.min(i + 1, 4)}" data-exp-idx="${i}">
          <div class="px-exp-head">
            <div class="px-num">${num}</div>
            <div class="px-co">${esc(job.company)}</div>
            <div class="px-role">${esc(job.role || '')}</div>
            <div class="px-dates">${esc(job.dates || '')}</div>
            <div class="px-arrow">›</div>
          </div>
          <div class="px-exp-body">
            <div class="px-exp-bod">
              ${job.client     ? `<div class="px-client">For · ${esc(job.client)}</div>` : ''}
              ${job.prior_role ? `<div class="px-prior">Previously: ${esc(job.prior_role)}</div>` : ''}
              <ul class="px-bullets">${bullets}</ul>
            </div>
          </div>
        </div>`;
    }).join('');
    return `
      <section class="px-shell px-section" id="work">
        <div class="px-eye" data-pr>${esc(e.eyebrow || 'Experience')}</div>
        <h2 data-pr>${fmtHeadline(e.headline)}</h2>
        <div>${rows}</div>
      </section>`;
  }

  function renderProjects(D) {
    const p = D.projects || {};
    const items = p.items || [];
    const tags = ['All', ...new Set(items.map(it => it.tag).filter(Boolean))];
    const filterBtns = tags
      .map((t, i) => `<button class="${i === 0 ? 'on' : ''}" data-filter="${esc(t)}">${esc(t)}</button>`)
      .join('');
    const cards = items.map((it, i) => {
      const stack = (it.stack || []).map(s => `<span>${esc(s)}</span>`).join('');
      return `
        <div class="px-pcard" data-tag="${esc(it.tag || '')}" data-project-idx="${i}"
             data-pr data-pd="${(i % 4) + 1}" role="button" tabindex="0">
          <div class="px-pcard-head">
            <span class="px-ptag">${esc(it.tag || '')}</span>
            ${it.year ? `<span class="px-pyear">${esc(it.year)}</span>` : ''}
          </div>
          <div class="px-pname">${esc(it.name)}</div>
          <div class="px-pblurb">${esc((it.blurb || '').trim())}</div>
          <div class="px-pstack">${stack}</div>
          <div class="px-pcard-cta">View details →</div>
        </div>`;
    }).join('');
    return `
      <section class="px-shell px-section" id="projects">
        <div class="px-eye" data-pr>${esc(p.eyebrow || 'Selected Projects')}</div>
        <h2 data-pr>${fmtHeadline(p.headline)}</h2>
        <div class="px-pf" data-pr>${filterBtns}</div>
        <div class="px-pgrid">${cards}</div>
      </section>`;
  }

  function renderEduCertsTestimonials(D) {
    const ed = D.education || {};
    const ce = D.certifications || {};
    const te = D.testimonials || {};

    const schools = (ed.schools || []).map((s, i) => `
      <div class="px-edu" data-pr data-pd="${i + 1}">
        <h3>${esc(s.school)}</h3>
        <div class="deg">${esc(s.degree || '')}${s.location ? ' · ' + esc(s.location) : ''}</div>
        <div class="dat">${esc(s.dates || '')}</div>
      </div>`).join('');

    const certs = (ce.items || []).map((c, i) => `
      <div class="px-cert" data-pr data-pd="${Math.min(i + 1, 4)}">
        <div><b>${esc(c.name)}</b><div class="iss">${esc(c.issuer || '')}</div></div>
        <div class="yr">${esc(c.year || '—')}</div>
      </div>`).join('');

    const quotes = (te.items || []).map((q, i) => `
      <div class="px-tcard" data-pr data-pd="${i + 1}">
        <q>${esc((q.quote || '').trim())}</q>
        <div class="px-tcard-w"><b>${esc(q.who)}</b> · ${esc(q.role || '')}</div>
      </div>`).join('');

    return `
      <section class="px-shell px-section">
        <div class="px-two">
          <div>
            <div class="px-eye" data-pr>${esc(ed.eyebrow || 'Education')}</div>
            <h2 data-pr style="font-size:clamp(28px, 4cqi, 44px)">${fmtHeadline(ed.headline)}</h2>
            ${schools}
            <div style="margin-top:36px">
              <div class="px-eye" data-pr>${esc(ce.eyebrow || 'Certifications')}</div>
              <h2 data-pr style="font-size:clamp(24px, 3.5cqi, 36px); margin: 14px 0 14px;">${fmtHeadline(ce.headline)}</h2>
              ${certs}
            </div>
          </div>
          <div id="testimonials">
            <div class="px-eye" data-pr>${esc(te.eyebrow || 'Testimonials')}</div>
            <h2 data-pr style="font-size:clamp(28px, 4cqi, 44px)">${fmtHeadline(te.headline)}</h2>
            ${quotes}
          </div>
        </div>
      </section>`;
  }

  function renderContact(D) {
    const c = D.contact || {};
    return `
      <section class="px-contact" id="contact">
        <div class="px-shell" data-pr>
          <div class="px-eye">${esc(c.eyebrow || 'Contact')}</div>
          <h2>${fmtHeadline(c.headline)}</h2>
          <div class="px-contact-sub">${esc((c.sub || '').trim())}</div>
          <div class="px-contact-actions">
            <button class="px-btn p" data-open-contact>${esc(c.primary_cta_label || 'Send a message →')}</button>
            <a class="px-btn s" href="${safeHref(D.profile.linkedin)}" target="_blank" rel="noreferrer">${esc(c.secondary_cta_label || 'LinkedIn ↗')}</a>
          </div>
        </div>
      </section>`;
  }

  function renderFooter(D) {
    const langs = (D.profile.languages || []).join(' · ');
    return `
      <footer class="px-shell px-footer">
        <span>© ${new Date().getFullYear()} ${esc(D.profile.name)} · ${esc(D.profile.location || '')}</span>
        <span>${esc(langs)}${langs && D.profile.availability ? ' · ' : ''}${esc(D.profile.availability || '')}</span>
      </footer>`;
  }

  function renderProjectModal(project) {
    const stack = (project.stack || []).map(s => `<span>${esc(s)}</span>`).join('');
    const d = project.details;
    let body;
    if (d) {
      const blocks = [];
      if (d.problem)    blocks.push(`<div class="px-md-block"><div class="px-md-label">The problem</div><p>${esc(d.problem.trim())}</p></div>`);
      if (d.approach)   blocks.push(`<div class="px-md-block"><div class="px-md-label">My approach</div><p>${esc(d.approach.trim())}</p></div>`);
      if (d.outcome)    blocks.push(`<div class="px-md-block"><div class="px-md-label">Outcome</div><p>${esc(d.outcome.trim())}</p></div>`);
      if (d.highlights) {
        const hl = d.highlights.map(h => `<li>${esc(h)}</li>`).join('');
        blocks.push(`<div class="px-md-block"><div class="px-md-label">Highlights</div><ul class="px-bullets">${hl}</ul></div>`);
      }
      body = blocks.join('');
    } else {
      body = `
        <div class="px-md-block">
          <div class="px-md-label">Notes</div>
          <p>Detailed case-study material available on request — happy to walk through architecture, tradeoffs, and outcomes in a call.</p>
        </div>`;
    }

    return `
      <div class="px-modal" role="dialog" aria-modal="true" data-modal="project">
        <div class="px-modal-card">
          <button class="px-modal-x" aria-label="Close">×</button>
          <div class="px-modal-head" data-tag="${esc(project.tag || '')}">
            <div class="px-modal-meta">
              <span class="px-ptag">${esc(project.tag || '')}</span>
              ${project.year ? `<span class="px-pyear">${esc(project.year)}</span>` : ''}
            </div>
            <h3 class="px-modal-name">${esc(project.name)}</h3>
            <p class="px-modal-blurb">${esc((project.blurb || '').trim())}</p>
            <div class="px-pstack">${stack}</div>
          </div>
          <div class="px-modal-body">${body}</div>
        </div>
      </div>`;
  }

  function renderContactModal(D) {
    const c = D.contact || {};
    const m = c.modal || {};
    return `
      <div class="px-modal" role="dialog" aria-modal="true" data-modal="contact">
        <div class="px-modal-card px-modal-form">
          <button class="px-modal-x" aria-label="Close">×</button>
          <div data-contact-state="form">
            <div class="px-modal-head">
              <div class="px-modal-meta"><span class="px-ptag">Direct message</span></div>
              <h3 class="px-modal-name">${esc(m.title || 'Get in touch.')}</h3>
              <p class="px-modal-blurb">${esc((m.intro || '').trim())}</p>
            </div>
            <form class="px-form" novalidate>
              <label class="px-field"><span>Your name</span>
                <input type="text" name="name" required placeholder="Jane Smith">
              </label>
              <label class="px-field"><span>Reply-to email</span>
                <input type="email" name="email" required placeholder="you@company.com">
              </label>
              <label class="px-field"><span>Company / role <em>(optional)</em></span>
                <input type="text" name="company" placeholder="Acme · Engineering Director">
              </label>
              <label class="px-field"><span>Message</span>
                <textarea name="message" required rows="5" placeholder="What's on your mind?"></textarea>
              </label>
              <label class="px-field px-honeypot" aria-hidden="true">
                <span>Website</span>
                <input type="text" name="website" tabindex="-1" autocomplete="off">
              </label>
              <div class="px-form-actions">
                <button type="button" class="px-btn s" data-close-contact>Cancel</button>
                <button type="submit" class="px-btn p" data-submit-btn>Send message →</button>
              </div>
              <div class="px-form-error" hidden></div>
              <div class="px-form-note">Or reach me on <a href="${safeHref(D.profile.linkedin)}" target="_blank" rel="noreferrer">LinkedIn ↗</a></div>
            </form>
          </div>
          <div data-contact-state="sent" hidden>
            <div class="px-form-sent">
              <div class="px-modal-meta"><span class="px-ptag">Sent</span></div>
              <h3 class="px-modal-name">${esc(m.success_title || 'Thanks — I got it.')}</h3>
              <p class="px-modal-blurb">${esc((m.success_intro || '').trim())}</p>
              <div class="px-form-actions">
                <a class="px-btn s" href="${safeHref(D.profile.linkedin)}" target="_blank" rel="noreferrer">LinkedIn ↗</a>
                <button class="px-btn p" data-close-contact>Close</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  // ===========================================================================
  // Top-level render
  // ===========================================================================

  function render(D) {
    // Auto-computed tokens — update whenever the YAML data changes.
    const startYear  = D.profile.career_start_year || 2007;
    const yearsExp   = new Date().getFullYear() - startYear;
    const projectCnt = (D.projects && D.projects.items ? D.projects.items.length : 0);
    const aiCnt      = (D.ai_mind && D.ai_mind.proof   ? D.ai_mind.proof.length   : 0);
    D = JSON.parse(
      JSON.stringify(D)
        .replace(/\{years\}/g,     String(yearsExp))
        .replace(/\{projects\}/g,  String(projectCnt))
        .replace(/\{ai_agents\}/g, String(aiCnt))
    );

    document.title = `${D.profile.name} — ${D.profile.role}`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && D.profile.tagline) meta.setAttribute('content', `${D.profile.name} — ${D.profile.role}. ${D.profile.tagline}`);

    root.className = 'px-root';
    root.innerHTML = [
      renderNav(D),
      '<main id="main-content">',
      renderHero(D),
      renderMarquee(D),
      renderAbout(D),
      renderAIMind(D),
      renderSkills(D),
      renderExperience(D),
      renderProjects(D),
      renderEduCertsTestimonials(D),
      renderContact(D),
      '</main>',
      renderFooter(D),
    ].join('\n');

    wireEvents(D);
    initObserver();
  }

  // ===========================================================================
  // Event wiring
  // ===========================================================================

  let openModal = null;       // currently mounted modal element
  let prevBodyOverflow = '';  // for scroll lock

  function wireEvents(D) {
    // Filter pills
    const pf = root.querySelector('.px-pf');
    if (pf) {
      pf.addEventListener('click', e => {
        const btn = e.target.closest('button[data-filter]');
        if (!btn) return;
        const filter = btn.getAttribute('data-filter');
        pf.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === btn));
        const cards = root.querySelectorAll('.px-pcard');
        cards.forEach(c => {
          const show = filter === 'All' || c.getAttribute('data-tag') === filter;
          c.style.display = show ? '' : 'none';
        });
      });
    }

    // Experience accordion (single-open)
    root.querySelectorAll('.px-exp-row').forEach(row => {
      row.addEventListener('click', () => {
        const isOpen = row.classList.contains('open');
        root.querySelectorAll('.px-exp-row').forEach(r => r.classList.remove('open'));
        if (!isOpen) row.classList.add('open');
      });
    });

    // Project card → modal
    root.querySelectorAll('.px-pcard').forEach(card => {
      const open = () => {
        const idx = parseInt(card.getAttribute('data-project-idx'), 10);
        const project = D.projects.items[idx];
        if (project) showModal(renderProjectModal(project));
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });

    // Contact CTA
    root.querySelectorAll('[data-open-contact]').forEach(btn => {
      btn.addEventListener('click', () => showContactModal(D));
    });
  }

  function showModal(html) {
    closeModal();
    const wrap = document.createElement('div');
    wrap.innerHTML = html.trim();
    const node = wrap.firstChild;
    document.body.appendChild(node);
    openModal = node;

    // Click-outside to close
    node.addEventListener('click', e => { if (e.target === node) closeModal(); });
    node.querySelector('.px-modal-x')?.addEventListener('click', closeModal);

    // Body scroll lock
    prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!openModal) return;
    openModal.remove();
    openModal = null;
    document.body.style.overflow = prevBodyOverflow;
  }

  function showContactModal(D) {
    showModal(renderContactModal(D));
    const form = openModal.querySelector('form');
    const submitBtn = openModal.querySelector('[data-submit-btn]');
    const errEl = openModal.querySelector('.px-form-error');

    openModal.querySelectorAll('[data-close-contact]').forEach(b => {
      b.addEventListener('click', closeModal);
    });

    form?.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(form);
      if (fd.get('website')) return; // honeypot
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      errEl.hidden = true;
      errEl.textContent = '';

      const endpoint = (D.contact?.form_endpoint || '').trim();
      try {
        if (endpoint) {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: fd,
          });
          if (!res.ok) throw new Error(`Form endpoint returned ${res.status}`);
        } else {
          await new Promise(r => setTimeout(r, 800)); // demo mode
        }
        // Switch to sent state
        openModal.querySelector('[data-contact-state="form"]').hidden = true;
        openModal.querySelector('[data-contact-state="sent"]').hidden = false;
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send message →';
        errEl.textContent = 'Could not send — please try again or use LinkedIn.';
        errEl.hidden = false;
        console.error(err);
      }
    });
  }

  // ESC closes modals (capture, not bound per-modal)
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // ===========================================================================
  // Entrance animation observer
  // ===========================================================================

  function initObserver() {
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: just reveal everything
      root.querySelectorAll('[data-pr]').forEach(el => el.classList.add('pin'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('pin'); io.unobserve(e.target); } });
    }, { threshold: 0.08 });
    root.querySelectorAll('[data-pr]').forEach(el => io.observe(el));
  }

  // ===========================================================================
  // Boot — fetch content.yaml, parse, render
  // ===========================================================================

  function showError(msg, hint) {
    root.innerHTML = `
      <div class="px-loading error">
        <div><b>Couldn't load content.yaml</b></div>
        <div>${esc(msg)}</div>
        ${hint ? `<div style="opacity:.8">${hint}</div>` : ''}
      </div>`;
  }

  async function boot() {
    if (typeof jsyaml === 'undefined') {
      showError('YAML parser failed to load.', 'Check your internet connection or self-host js-yaml.');
      return;
    }
    try {
      const res = await fetch('content.yaml', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const data = jsyaml.load(text);
      if (!data || !data.profile) throw new Error('content.yaml is missing required fields');
      render(data);
    } catch (err) {
      console.error(err);
      const isFile = location.protocol === 'file:';
      const hint = isFile
        ? 'Tip: open via a local server — run <code>python3 -m http.server</code> in this folder, then visit <code>http://localhost:8000</code>.'
        : 'Check that content.yaml exists in the same folder as index.html.';
      showError(err.message || String(err), hint);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
