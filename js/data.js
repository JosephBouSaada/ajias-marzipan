/* Ajia's Marzipan catalogue settings. Product listings live in products.json. */
window.AJIA = (function () {
  var raw = { categories: [], products: [], trayGroups: [] };
  try {
    var request = new XMLHttpRequest();
    request.open("GET", "js/products.json?v=7", false);
    request.send(null);
    if (request.status >= 200 && request.status < 300) raw = JSON.parse(request.responseText);
  } catch (error) {
    /* The page still loads its shell if a local preview is opened without a server. */
  }

  return {
    PLACEHOLDER: {
      on: true,
      note: "Prices and contact details are placeholders, not Ajia's real figures.",
    },
    SIZES_CONFIRMED: false,
    CONTACT: {
      phone: "(617) 000-0000",
      phoneHref: "tel:+16170000000",
      email: "ajia-email-not-set@example.invalid",
      instagram: "ajiasmarzipan",
      instagramHref: "https://instagram.com/",
      area: "Greater Boston",
      placeholder: true,
    },
    CATEGORIES: raw.categories,
    PRODUCTS: raw.products,
    TRAY_GROUPS: raw.trayGroups,
  };
})();
