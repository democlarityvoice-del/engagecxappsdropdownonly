// ===================== EngageCX Feature Injection =====================
(function waitForClarityContext(tries = 20) {
  if (typeof user !== 'undefined' && typeof user_domain !== 'undefined' && typeof sub_reseller !== 'undefined') {
    console.log('[EngageCX] User context found:', { user, user_domain, sub_reseller });
    checkEngageCxConfig(user, user_domain, sub_reseller);
  } else if (tries > 0) {
    console.log('[EngageCX] Waiting for user context...');
    setTimeout(() => waitForClarityContext(tries - 1), 300);
  } else {
    console.error('[EngageCX] User context not found. Aborting.');
  }
})();

async function checkEngageCxConfig(user, domain, reseller) {
  try {
    const config_name = "PORTAL_SHOW_CLARITY_ENGAGECX_DROPDOWN_BTN";

    console.log("[EngageCX] Checking UI config:", { domain, reseller, user, config_name });

    const data = await netsapiens.api.post({
      object: "uiconfig",
      action: "read",
      domain,
      reseller,
      config_name,
      user
    });

    console.log("[EngageCX] Config response:", data);

    const enabled = data && data[0] && data[0].config_value?.trim().toLowerCase() === "yes";
    console.log("[EngageCX] Feature enabled =", enabled);

    if (enabled) {
      injectEngageCxMenu();
    } else {
      console.log("[EngageCX] Feature disabled. Skipping injection.");
    }
  } catch (err) {
    console.error("[EngageCX] Failed to check config or inject menu:", err);
  }
}

function injectEngageCxMenu() {
  const $ = window.jQuery || window.$;
  if (!$) return console.error("[EngageCX] jQuery not found.");

  const $menu = $('#app-menu-list');
  if (!$menu.length) return console.error("[EngageCX] App menu not found.");
  if ($menu.find('li.engagecx-menu').length) {
    console.log("[EngageCX] EngageCX menu already exists. Skipping.");
    return;
  }

  const ECX_LOGIN = 'https://engagecx.clarityvoice.com/#/login';

  const $item = $(`
    <li class="dropdown-submenu engagecx-menu" id="engagecx-submenu">
      <a tabindex="-1" href="#">EngageCX</a>
      <ul class="dropdown-menu" style="top:0;left:100%;margin-top:0;margin-left:0;display:none;">
        <li><a href="#" id="engagecx-open-window" target="_blank" rel="noopener noreferrer">Open in Window</a></li>
      </ul>
    </li>
  `);

  const $videoAnywhere = $menu.find('a:contains("Clarity Video Anywhere")').closest('li');
  const $smart = $menu.find('a:contains("SMARTanalytics")').closest('li');

  if ($videoAnywhere.length && $smart.length) {
    $smart.before($item);
  } else {
    $menu.append($item);
  }

  $item.hover(
    function () { $(this).find('.dropdown-menu').first().stop(true, true).fadeIn(150); },
    function () { $(this).find('.dropdown-menu').first().stop(true, true).fadeOut(150); }
  );

  $(document).off('click.ecxOpenWin').on('click.ecxOpenWin', '#engagecx-open-window', function (e) {
    e.preventDefault();
    try {
      window.open(ECX_LOGIN, '_blank', 'noopener,noreferrer');
    } catch (err) {
      window.location.href = ECX_LOGIN;
    }
  });

  console.log("[EngageCX] Menu injected successfully.");
}
