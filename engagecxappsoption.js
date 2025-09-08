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
  const CONFIG_NAME = 'PORTAL_SHOW_CLARITY_ENGAGECX_DROPDOWN_BTN';

  // Try to discover current domain/reseller from portal globals; provide safe fallbacks for testing
  function getContext() {
    const u = (window.user || window.nsUser || {}); // adapt if your portal exposes something else
    const domain =
      u.domain ||
      window.portalDomain ||
      window.sub_domain ||
      'pizzademo'; // fallback for testing
    const reseller =
      u.reseller ||
      window.portalReseller ||
      'clarity';   // fallback
    return { domain, reseller };
  }

  // ---------- gate: only run if UI config is enabled ("yes") ----------
  async function allowedByUiConfig() {
    try {
      const { domain, reseller } = getContext();
      const data = await netsapiens.api.post({
        object: 'uiconfig',
        action: 'read',
        domain,
        reseller,
        config_name: CONFIG_NAME,
        user: '*' // NS row is wildcarded; this guarantees a match
      });

      // Expect an array; enable only if first row says "yes"
      const enabled = Array.isArray(data) && data[0]?.config_value === 'yes';
      console.log('EngageCX UI config check:', { domain, reseller, enabled, raw: data });
      return enabled;
    } catch (error) {
      console.error('Error fetching EngageCX UI config:', error);
      return false;
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

    // Place directly below "Clarity Video Anywhere"; fallback to append
    var $videoAnywhere = $menu.find('a:contains("Clarity Video Anywhere")').closest('li');
    if ($videoAnywhere.length) {
      $videoAnywhere.after($item);
    } else {
      $menu.append($item);
    }

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
  when(() => jq() && $('#app-menu-list').length, async function () {
    const ok = await allowedByUiConfig();
    if (ok) injectAppsMenu();
    else console.log('EngageCX injection skipped: UI config disabled or missing.');
  });
})();
