// ===================== EngageCX Apps → Dropdown Only =====================
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
  const UI_CONFIG_NAME = "PORTAL_SHOW_CLARITY_ENGAGECX_DROPDOWN_BTN";
  const DOMAIN = "pizzademo"; // for now, bind it to a test domain only
  const USER = "*"; // wildcard for all users in that domain

  // ---------- Fetch UI config from Netsapiens ----------
  async function checkUiConfig() {
    try {
      const response = await netsapiens.api.post({
        object: "uiconfig",
        action: "read",
        domain: DOMAIN,
        config_name: UI_CONFIG_NAME,
        user: USER
      });

      console.log("UI Config Response:", response);

      // If response is valid and config_value is 'yes', return true
      if (Array.isArray(response) && response.length > 0) {
        return response[0].config_value === "yes";
      }
      return false;
    } catch (err) {
      console.error("Error fetching UI config:", err);
      return false;
    }
  }

  // ---------- Apps menu (source of truth to launch) ----------
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

    // Always place below Clarity Video Anywhere
    var $videoAnywhere = $menu.find('a:contains("Clarity Video Anywhere")').closest('li');
    if ($videoAnywhere.length) {
      $videoAnywhere.after($item);
    } else {
      $menu.append($item); // fallback
    }

    // Hover flyout
    $item.hover(
      function () { $(this).find('.dropdown-menu').first().stop(true, true).fadeIn(150); },
      function () { $(this).find('.dropdown-menu').first().stop(true, true).fadeOut(150); }
    );

    // Open in window → always go to login
    $(document).off('click.ecxOpenWin').on('click.ecxOpenWin', '#engagecx-open-window', function (e) {
      e.preventDefault();
      try {
        window.open(ECX_LOGIN, '_blank', 'noopener,noreferrer');
      } catch (err) {
        window.location.href = ECX_LOGIN;
      }
    });
  }

  // ---------- Run only if config allows ----------
  when(() => jq() && $('#app-menu-list').length, async () => {
    const isEnabled = await checkUiConfig();
    console.log("UI Config Enabled:", isEnabled);
    if (isEnabled) {
      injectAppsMenu();
    } else {
      console.log("EngageCX menu injection skipped: config not enabled.");
    }
  });

})();
