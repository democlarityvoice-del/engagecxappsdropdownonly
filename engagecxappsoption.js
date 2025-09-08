// ===================== EngageCX Apps → Dropdown Only (UI Config Gated) =====================
;(function () {
  // ---------- tiny utilities ----------
  function jq() { return window.jQuery || window.$; }
  function when(pred, fn) {
    if (pred()) return void fn();
    const obs = new MutationObserver(() => { if (pred()) { obs.disconnect(); fn(); } });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    const iv = setInterval(() => { if (pred()) { clearInterval(iv); fn(); } }, 300);
  }

  // ---------- constants ----------
  const ECX_LOGIN = 'https://engagecx.clarityvoice.com/#/login';
  const UI_CONFIG_NAME = 'PORTAL_SHOW_CLARITY_ENGAGECX_DROPDOWN_BTN'; // 

  // ---------- UI config check ----------
  async function allowedByUiConfig() {
    try {
      if (!(window.netsapiens && netsapiens.api && typeof netsapiens.api.post === 'function')) return false;

      // Grab domain and user from known globals (adjust if yours differ)
      const DOMAIN = window.DOMAIN || window.portalDomain || window.nsDomain;
      const USER   = window.USER   || window.portalUser   || window.nsUser;

      if (!DOMAIN || !USER) return false;

      const resp = await netsapiens.api.post({
        object: 'uiconfig',
        action: 'read',
        domain: DOMAIN,
        config_name: UI_CONFIG_NAME,
        user: USER
      });

      // Normalize and interpret the returned config value
      const raw =
        (resp && (resp.config_value ?? resp.value)) ??
        (Array.isArray(resp) ? resp[0]?.config_value : undefined) ??
        (resp?.data?.config_value) ?? '';

      return /^(1|y|yes|true|on)$/i.test(String(raw).trim());
    } catch (err) {
      return false; // fail closed on any error
    }
  }

  // ---------- Apps menu injection ----------
  function injectAppsMenu() {
    var $ = jq(); if (!$) return;
    var $menu = $('#app-menu-list');
    if (!$menu.length || $menu.find('li.engagecx-menu').length) return;

    var $item = $(
      '<li class="dropdown-submenu engagecx-menu" id="engagecx-submenu">' +
        '<a tabindex="-1" href="#">EngageCX</a>' +
        '<ul class="dropdown-menu" style="top:0;left:100%;margin-top:0;margin-left:0;display:none;">' +
          '<li><a href="#" id="engagecx-open-window" target="_blank" rel="noopener noreferrer">Open in Window</a></li>' +
        '</ul>' +
      '</li>'
    );

    // Insert near neighbors if present, fallback to end (SmartAnalytics fail-safe)
    var $videoAnywhere = $menu.find('a:contains("Clarity Video Anywhere")').closest('li');
    var $smart = $menu.find('a:contains("SMARTanalytics")').closest('li');
    if ($videoAnywhere.length && $smart.length) {
      $smart.before($item);
    } else {
      $menu.append($item);
    }

    // Hover flyout behavior
    $item.hover(
      function () { $(this).find('.dropdown-menu').first().stop(true, true).fadeIn(150); },
      function () { $(this).find('.dropdown-menu').first().stop(true, true).fadeOut(150); }
    );

    // Click → always open EngageCX login
    $(document).off('click.ecxOpenWin').on('click.ecxOpenWin', '#engagecx-open-window', function (e) {
      e.preventDefault();
      try { window.open(ECX_LOGIN, '_blank', 'noopener,noreferrer'); }
      catch (err) { window.location.href = ECX_LOGIN; }
    });
  }

  // ---------- Gate by UI config before injecting ----------
  when(() => jq() && $('#app-menu-list').length, function () {
    allowedByUiConfig().then(function (ok) {
      if (ok) injectAppsMenu();
    });
  });
})();


