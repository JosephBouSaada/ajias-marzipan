/* Ajia's Marzipan: engraved icon set.
   One stroke weight (1.5), one 24-unit grid, square-cut terminals: the same
   tool that cuts the mold cuts these. Injected synchronously so nothing pops. */
(function () {
  var s = document.currentScript;
  var sprite =
    '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false">' +
    '<defs><g id="_st" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"></g></defs>' +
    // structural
    icon("i-menu", '<path d="M3 6.5h18M3 12h18M3 17.5h18"/>') +
    icon("i-close", '<path d="M5 5l14 14M19 5L5 19"/>') +
    icon("i-arrow", '<path d="M4 12h15M13 6l6 6-6 6"/>') +
    icon("i-chev", '<path d="M9 5l7 7-7 7"/>') +
    // an almond in profile: the material itself
    icon(
      "i-almond",
      '<path d="M12 3.2c3.6 3 5.4 6 5.4 9.2 0 4.1-2.5 8.4-5.4 8.4S6.6 16.5 6.6 12.4c0-3.2 1.8-6.2 5.4-9.2z"/><path d="M12 6.6v11"/>'
    ) +
    // calipers, for actual size
    icon(
      "i-caliper",
      '<path d="M4 3v14M20 3v14M4 20h16M4 17l-2.2 3M20 17l2.2 3"/><path d="M8.5 8h7"/>'
    ) +
    // a carved mold block
    icon(
      "i-mold",
      '<path d="M3 4h18v16H3z"/><path d="M7 8h4v4H7zM13 8h4v4h-4zM7 14h10v3H7z"/>'
    ) +
    // occasion glyphs, incised
    icon("i-rings", '<circle cx="9" cy="14" r="5.2"/><circle cx="15" cy="14" r="5.2"/><path d="M12 4.2l2 2.6h-4l2-2.6z"/>') +
    icon("i-candle", '<path d="M9 10h6v11H9z"/><path d="M12 10V6.5"/><path d="M12 2.5c1.6 1.6 2.2 2.6 2.2 3.5a2.2 2.2 0 01-4.4 0c0-.9.6-1.9 2.2-3.5z"/>') +
    icon("i-cup", '<path d="M7.5 4h9l-1 6.5a3.6 3.6 0 01-7 0L7.5 4z"/><path d="M12 14v5M8.5 21h7"/>') +
    icon("i-gift", '<path d="M3.5 8.5h17V13h-17zM5 13h14v8H5z"/><path d="M12 8.5V21"/><path d="M12 8.5S9.6 8.5 8.5 7.4a2 2 0 012.8-2.8C12.4 5.7 12 8.5 12 8.5zM12 8.5s2.4 0 3.5-1.1a2 2 0 00-2.8-2.8C11.6 5.7 12 8.5 12 8.5z"/>') +
    icon("i-star", '<path d="M12 3.2l2.7 5.9 6.3.8-4.7 4.4 1.3 6.3L12 17.4 6.4 20.6l1.3-6.3L3 9.9l6.3-.8L12 3.2z"/>') +
    // information & warning
    icon("i-info", '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.4v.9"/>') +
    // contact
    icon("i-phone", '<path d="M7.2 3.5l2.6 4.2-2.2 2.2a13 13 0 006.5 6.5l2.2-2.2 4.2 2.6v3.5c0 .8-.7 1.4-1.5 1.3C10.6 20.7 3.3 13.4 2.4 5c-.1-.8.5-1.5 1.3-1.5h3.5z"/>') +
    icon("i-mail", '<path d="M3 5h18v14H3z"/><path d="M3 6l9 7 9-7"/>') +
    icon("i-instagram", '<rect x="3" y="3" width="18" height="18" rx="4.5"/><circle cx="12" cy="12" r="4.2"/><path d="M17.3 6.7v.01"/>') +
    icon("i-whatsapp", '<path d="M20.5 11.7a8.5 8.5 0 01-12.6 7.5L3 20.5l1.3-4.7a8.5 8.5 0 1116.2-4.1z"/><path d="M8.1 7.4c.3-.6.6-.6.9-.6h.5l1 2.3c.1.3.1.5-.1.7l-.7.8c-.2.2-.1.4 0 .6.8 1.4 1.8 2.4 3.4 3.1.3.1.5.1.7-.1l.9-1.1c.2-.3.5-.3.8-.2l2.1 1c.3.1.4.3.4.5 0 .5-.3 1.5-.8 1.9-.5.5-1.3.8-2.2.7-1.3-.1-3.2-.7-5.2-2.5-1.7-1.5-2.8-3.4-3.1-4.7-.3-1 .1-1.8.4-2.4z"/>') +
    icon("i-pin", '<path d="M12 21.5s7-6.3 7-11.2A7 7 0 005 10.3c0 4.9 7 11.2 7 11.2z"/><circle cx="12" cy="10" r="2.6"/>') +
    "</svg>";

  function icon(id, body) {
    return (
      '<symbol id="' +
      id +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
      'stroke-linecap="square" stroke-linejoin="miter">' +
      body +
      "</symbol>"
    );
  }

  if (s && s.insertAdjacentHTML) s.insertAdjacentHTML("afterend", sprite);
  else document.body.insertAdjacentHTML("afterbegin", sprite);
})();
