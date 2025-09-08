// ===================== EngageCX Apps → Dropdown Only (UI Config Gated, exact params) =====================
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
  const UI_CONFIG_NAME = 'PORTAL_SHOW_CLARITY_ENGAGECX_DROPDOWN_BTN'; 

  // ---------- gate: only run if the exact UI config is enabled ("yes") ----------
  async function allowedByUiConfig() {
    try {
      if (!(window.netsapiens && netsapiens.api && typeof netsapiens.api.post === 'function')) return false;
      if (typeof window.DOMAIN === 'undefined' || typeof window.USER === 'undefined') return false;

      const response = await netsapiens.api.post({
        object: "uiconfig",
        action: "read",
        domain: DOMAIN,
        config_name: UI_CONFIG_NAME,
        user: USER
      });

      // EXACT interpretation per instruction: only "yes" enables it
      const val =
        (response && response.config_value) ??
        (Array.isArray(response) ? response[0]?.config_value : undefined) ??
        (response && response.data && response.data.config_value);

      return val === 'yes';
    } catch {
      return false; // fail closed
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

    // place before SMARTanalytics when present; else append (fail-safe)
    var $smart = $menu.find('a:contains("SMARTanalytics")').closest('li');
    if ($smart.length) { $smart.before($item); } else { $menu.append($item); }

    // hover flyout
    $item.hover(
      function () { $(this).find('.dropdown-menu').first().stop(true, true).fadeIn(150); },
      function () { $(this).find('.dropdown-menu').first().stop(true, true).fadeOut(150); }
    );

    // Open in window → always go to login
    $(document).off('click.ecxOpenWin').on('click.ecxOpenWin', '#engagecx-open-window', function (e) {
      e.preventDefault();
      try { window.open(ECX_LOGIN, '_blank', 'noopener,noreferrer'); }
      catch (err) { window.location.href = ECX_LOGIN; }
    });
  }

  // ---------- run only if gate passes ----------
  when(() => jq() && $('#app-menu-list').length, function () {
    allowedByUiConfig().then(function (ok) {
      if (ok) injectAppsMenu();
    });
  });
})();
