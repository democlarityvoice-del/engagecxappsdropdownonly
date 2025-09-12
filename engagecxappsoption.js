// ===================== EngageCX Apps → Dropdown Only =====================
;(function () {

  const engagecxenabled = await netsapiens.api.post({
        object: "uiconfig",
        action: "read",
        domain: sub_domain,
        config_name: "PORTAL_SHOW_CLARITY_ENGAGECX_DROPDOWN_BTN",
        user: sub_user,
  });

console.log('engage enabled?', engagecxenabled);
  
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

    // insert between neighbors if present; else append
    var $videoAnywhere = $menu.find('a:contains("Clarity Video Anywhere")').closest('li');
    var $smart = $menu.find('a:contains("SMARTanalytics")').closest('li');
    if ($videoAnywhere.length && $smart.length) {
      $smart.before($item);
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
      try {
        window.open(ECX_LOGIN, '_blank', 'noopener,noreferrer');
      } catch (err) {
        window.location.href = ECX_LOGIN;
      }
    });
  }

  // ---------- Inject when ready ----------
  when(() => jq() && $('#app-menu-list').length, injectAppsMenu);
})();
