/* Ajia's Marzipan catalogue settings. Product listings live in products.json. */
window.AJIA = (function () {
  var raw = { categories: [], products: [], trayGroups: [] };
  try {
    var request = new XMLHttpRequest();
    request.open("GET", "js/products.json?v=21", false);
    request.send(null);
    if (request.status >= 200 && request.status < 300) raw = JSON.parse(request.responseText);
  } catch (error) {
    /* The page still loads its shell if a local preview is opened without a server. */
  }

  return {
    PLACEHOLDER: {
      on: false,
      note: "Prices and contact details are current.",
    },
    SIZES_CONFIRMED: false,
    CONTACT: {
      phone: "Call Ajia",
      phoneHref: "tel:+19783874774",
      email: "ajiasmarzipan@gmail.com",
      instagram: "@ajias.marzipan",
      instagramHref: "https://www.instagram.com/ajias.marzipan/",
      whatsapp: "WhatsApp Ajia",
      whatsappHref: "https://wa.me/19783874774",
      area: "Greater Boston",
      placeholder: false,
    },
    CATEGORIES: raw.categories,
    PRODUCTS: raw.products,
    TRAY_GROUPS: raw.trayGroups,
  };
})();
