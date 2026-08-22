/* ==========================================================================
   Ajia's Marzipan: behaviour
   The strike: a cell is carved until it is struck, then the piece comes out.
   The cart: a local cart, no payment, no server.
   ========================================================================== */
(function () {
  "use strict";

  var D = window.AJIA || { PRODUCTS: [], CATEGORIES: [], CONTACT: {}, PLACEHOLDER: {} };
  var $ = function (s, r) {
    return (r || document).querySelector(s);
  };
  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };
  var byId = {};
  D.PRODUCTS.forEach(function (p) {
    byId[p.id] = p;
  });

  var money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var svg = function (id, cls) {
    return '<svg class="i ' + (cls || "") + '" aria-hidden="true"><use href="#' + id + '"/></svg>';
  };

  /* Every unconfirmed figure is marked where the figure is, not only in a notice
     at the top of the page: a number that looks settled reads as settled. */
  var PH_PRICE = "Placeholder price: not Ajia's real figure";
  var PH_SIZE = "Estimated from Ajia's photographs: awaiting her measurement";
  function price(n) {
    var t = money.format(n);
    return D.PLACEHOLDER.on
      ? '<span class="ph" title="' + PH_PRICE + '">' + t + '<i aria-hidden="true">?</i>' +
        '<span class="sr"> (placeholder price)</span></span>'
      : t;
  }
  function size(p) {
    if (p.sizeMeasured || D.SIZES_CONFIRMED) return esc(p.size);
    return (
      '<span class="ph" title="' + PH_SIZE + '">approx. ' + esc(p.size) +
      '<i aria-hidden="true">?</i><span class="sr"> (estimated, not yet measured)</span></span>'
    );
  }

  /* A repaint that drops focus makes the keyboard path unusable: remember which
     control the user was on, and put them back on it. */
  function keepFocus(repaint) {
    var el = document.activeElement;
    var key = el && el !== document.body ? el.getAttribute("data-focus-key") : null;
    var caret = el && el.setSelectionRange && el.type !== "number" ? el.selectionStart : null;
    repaint();
    if (!key) return;
    var back = document.querySelector('[data-focus-key="' + key.replace(/"/g, '\\"') + '"]');
    if (!back) return;
    back.focus({ preventScroll: true });
    if (caret != null && back.setSelectionRange) {
      try {
        back.setSelectionRange(caret, caret);
      } catch (e) {
        /* not a text input */
      }
    }
  }

  /* ---------------------------------------------------------------- nav -- */
  var burger = $(".burger");
  var nav = $("#nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", String(!open));
      burger.setAttribute("aria-expanded", String(!open));
      burger.innerHTML = svg(open ? "i-menu" : "i-close");
    });
  }

  /* ------------------------------------------------------------- strike -- */
  /* Cells are visible from the start; the strike changes their state, never
     their presence. One authored moment, staggered along the reading order. */
  function armStrikes(root) {
    var cells = $$(".cell[data-strike]", root || document);
    if (!cells.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cells.forEach(function (c) {
        c.classList.add("is-struck");
      });
      return;
    }
    if (!("IntersectionObserver" in window)) {
      cells.forEach(function (c) {
        c.classList.add("is-struck");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        var hit = entries.filter(function (e) {
          return e.isIntersecting;
        });
        hit.forEach(function (e, i) {
          e.target.style.setProperty("--d", i * 85 + "ms");
          e.target.classList.add("is-struck");
          io.unobserve(e.target);
        });
      },
      { threshold: 0.22, rootMargin: "0px 0px -6% 0px" }
    );
    cells.forEach(function (c) {
      io.observe(c);
    });
  }

  /* -------------------------------------------------------------- toast -- */
  var toastEl;
  var toastT;
  function toast(html) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = svg("i-check") + "<span>" + html + "</span>";
    toastEl.setAttribute("data-show", "true");
    clearTimeout(toastT);
    toastT = setTimeout(function () {
      toastEl.setAttribute("data-show", "false");
    }, 3200);
  }

  /* --------------------------------------------------------------- sheet -- */
  var KEY = "ajia.sheet.v2";
  var sheet = read();

  function read() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "{}");
      return {
        items: raw.items && typeof raw.items === "object" ? raw.items : {},
        occasion: raw.occasion || "",
        date: raw.date || "",
      };
    } catch (e) {
      return { items: {}, occasion: "", date: "" };
    }
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(sheet));
    } catch (e) {
      /* private mode: the sheet simply does not persist */
    }
    paintCount();
    document.dispatchEvent(new CustomEvent("sheet:change"));
  }

  function totals() {
    var t = { lines: 0, pieces: 0, trays: 0, packs: 0, sum: 0 };
    Object.keys(sheet.items).forEach(function (id) {
      var p = byId[id];
      var q = sheet.items[id];
      if (!p || !q) return;
      t.lines += 1;
      t.sum += p.price * q;
      if (p.unit === "piece") t.pieces += q;
      else if (p.unit === "tray") t.trays += q;
      else t.packs += q;
    });
    return t;
  }

  function setQty(id, q) {
    var p = byId[id];
    if (!p) return;
    q = Math.max(0, Math.min(9999, Math.round(q || 0)));
    if (q === 0) delete sheet.items[id];
    else sheet.items[id] = q;
    save();
  }
  function add(id) {
    var p = byId[id];
    if (!p) return;
    var step = Math.max(1, p.startQty || 1);
    var have = sheet.items[id] || 0;
    var next = have + step;
    setQty(id, next);
    toast(
      "Added <b>" + step + " " + unitWord(p, step) + "</b> of " + esc(p.name) +
        ". Your cart now has <b>" + next + "</b>."
    );
  }
  function unitWord(p, n) {
    var u = p.unit;
    if (n === 1) return u;
    return u === "box" ? "boxes" : u + "s";
  }

  function paintCount() {
    var t = totals();
    $$("[data-sheet-count]").forEach(function (el) {
      var n = t.lines;
      el.setAttribute("data-empty", n === 0 ? "true" : "false");
      var slot = $(".sheet-btn__n", el);
      if (slot) slot.textContent = String(n);
      el.setAttribute(
        "aria-label",
        n === 0 ? "Cart, empty" : "Cart, " + n + (n === 1 ? " line" : " lines")
      );
    });
  }

  /* ---------------------------------------------------- catalogue render -- */
  var goodsEl = $("#goods");
  if (goodsEl) {
    var activeCat = "all";
    var filtersEl = $("#filters");

    var counts = {};
    D.CATEGORIES.forEach(function (c) {
      counts[c.id] =
        c.id === "all"
          ? D.PRODUCTS.length
          : D.PRODUCTS.filter(function (p) {
              return p.cat.indexOf(c.id) > -1;
            }).length;
    });

    if (filtersEl) {
      filtersEl.innerHTML =
        "<ul>" +
        D.CATEGORIES.map(function (c) {
          return (
            '<li><button type="button" data-cat="' +
            c.id +
            '" aria-pressed="' +
            (c.id === "all") +
            '">' +
            esc(c.name) +
            "<i>" +
            counts[c.id] +
            "</i></button></li>"
          );
        }).join("") +
        "</ul>";
      filtersEl.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-cat]");
        if (!b) return;
        activeCat = b.getAttribute("data-cat");
        $$("button[data-cat]", filtersEl).forEach(function (x) {
          x.setAttribute("aria-pressed", String(x === b));
        });
        paintGoods();
        history.replaceState(null, "", activeCat === "all" ? location.pathname : "#" + activeCat);
      });
    }

    var hash = location.hash.replace("#", "");
    if (
      hash &&
      D.CATEGORIES.some(function (c) {
        return c.id === hash;
      })
    ) {
      activeCat = hash;
      $$("button[data-cat]", filtersEl).forEach(function (x) {
        x.setAttribute("aria-pressed", String(x.getAttribute("data-cat") === hash));
      });
    }

    function goodCard(p) {
      var q = sheet.items[p.id] || 0;
      var step = Math.max(1, p.startQty || 1);
      var addLabel = q ? "Add " + step + " more" : "Add " + step + " " + unitWord(p, step);
      return (
        '<article class="good" data-good="' +
        p.id +
        '">' +
        '<div class="good__shot">' +
        '<img src="img/card/' +
        p.photo +
        '.jpg" alt="' +
        esc(p.alt) +
        '" loading="lazy" decoding="async" width="900" height="675">' +
        "</div>" +
        '<div class="good__body">' +
        '<h3 class="good__name">' +
        esc(p.name) +
        "</h3>" +
        '<p class="good__say">' +
        esc(p.blurb) +
        "</p>" +
        (p.colors
          ? '<p class="good__say"><strong>Colours:</strong> ' + esc(p.colors.join(", ")) + ".</p>"
          : "") +
        (p.dietNote ? '<p class="good__say"><em>' + esc(p.dietNote) + "</em></p>" : "") +
        '<div class="good__spec">' +
        "<span>" +
        svg("i-caliper") +
        size(p) +
        "</span>" +
        "</div>" +
        '<div class="good__buy">' +
        '<p class="good__price num">' +
        price(p.price) +
        "<small>per " +
        p.unit +
        "</small></p>" +
        '<button type="button" class="btn btn--brass btn--sm" data-add="' +
        p.id +
        '" data-focus-key="add:' +
        p.id +
        '">' +
        svg("i-plus") +
        esc(addLabel) +
        "</button>" +
        "</div>" +
        (q
          ? '<p class="good__spec" style="border:0;padding-top:.35rem;margin-top:.55rem;color:var(--brass-700);font-weight:600">' +
            svg("i-check") +
            " " +
            q +
            " " +
            unitWord(p, q) +
            " in your cart</p>"
          : "") +
        "</div></article>"
      );
    }

    function paintGoods() {
      var list = D.PRODUCTS.filter(function (p) {
        return activeCat === "all" || p.cat.indexOf(activeCat) > -1;
      });
      goodsEl.innerHTML = list.map(goodCard).join("");
      var live = $("#goods-count");
      if (live)
        live.textContent =
          list.length + (list.length === 1 ? " piece" : " pieces") + " in " + labelFor(activeCat);
    }
    function labelFor(id) {
      var c = D.CATEGORIES.filter(function (x) {
        return x.id === id;
      })[0];
      return c ? c.name.toLowerCase() : id;
    }

    goodsEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-add]");
      if (!b) return;
      add(b.getAttribute("data-add"));
      keepFocus(paintGoods);
    });

    document.addEventListener("sheet:change", function () {
      /* keep the catalogue honest about what is already in the cart */
    });

    paintGoods();
  }

  /* ------------------------------------------------------------- cart --- */
  var linesEl = $("#lines");
  if (linesEl) {
    var tallyEl = $("#tally");
    var emptyEl = $("#sheet-empty");
    var liveEl = $("#sheet-live");

    function lineRow(p, q) {
      return (
        '<div class="line" data-line="' +
        p.id +
        '">' +
        '<figure class="line__shot"><img src="img/thumb/' +
        p.photo +
        '.jpg" alt="" loading="lazy" decoding="async" width="420" height="420"></figure>' +
        "<div>" +
        '<p class="line__name">' +
        esc(p.name) +
        "</p>" +
        '<p class="line__meta num">' +
        price(p.price) +
        " per " +
        p.unit +
        " · " +
        size(p) +
        "</p>" +
        "</div>" +
        '<div class="qty">' +
        '<button type="button" data-step="-1" data-id="' +
        p.id +
        '" data-focus-key="minus:' +
        p.id +
        '" aria-label="One fewer ' +
        esc(p.name) +
        '">' +
        svg("i-minus") +
        "</button>" +
        '<input type="number" inputmode="numeric" min="0" value="' +
        q +
        '" data-qty="' +
        p.id +
        '" data-focus-key="qty:' +
        p.id +
        '" aria-label="Quantity of ' +
        esc(p.name) +
        '">' +
        '<button type="button" data-step="1" data-id="' +
        p.id +
        '" data-focus-key="plus:' +
        p.id +
        '" aria-label="One more ' +
        esc(p.name) +
        '">' +
        svg("i-plus") +
        "</button>" +
        "</div>" +
        '<p class="line__sum num">' +
        price(p.price * q) +
        "</p>" +
        '<button type="button" class="line__x" data-drop="' +
        p.id +
        '" aria-label="Remove ' +
        esc(p.name) +
        ' in your cart">' +
        svg("i-trash") +
        "</button>" +
        "</div>"
      );
    }

    function paintSheet() {
      var ids = Object.keys(sheet.items).filter(function (id) {
        return byId[id] && sheet.items[id] > 0;
      });
      var t = totals();

      if (emptyEl) emptyEl.hidden = ids.length > 0;
      var wrapEl = $("#sheet-wrap");
      if (wrapEl) wrapEl.hidden = ids.length === 0;

      linesEl.innerHTML = ids
        .map(function (id) {
          return lineRow(byId[id], sheet.items[id]);
        })
        .join("");

      if (tallyEl) {
        tallyEl.innerHTML =
          '<dl class="tally__rows">' +
          row("Pieces", t.pieces) +
          row("Trays", t.trays) +
          row("Boxes & jars", t.packs) +
          '<div class="tally__row tally__row--total"><dt>Estimate' +
          (D.PLACEHOLDER.on ? '<b class="ph-tag">placeholder</b>' : "") +
          '</dt><dd class="num">' +
          price(t.sum) +
          "</dd></div>" +
          "</dl>";
      }
      if (liveEl) {
        var plural = function (n, word) {
          return n + " " + word + (n === 1 ? "" : "s");
        };
        liveEl.textContent =
          t.lines === 0
            ? "Your cart is empty."
            : [plural(t.lines, "line"), plural(t.pieces, "piece")]
                .concat(t.trays ? [plural(t.trays, "tray")] : [])
                .join(", ") + ".";
      }
      var sub = $("#submit");
      if (sub) sub.disabled = ids.length === 0;
    }
    function row(label, n) {
      return '<div class="tally__row"><dt>' + label + '</dt><dd class="num">' + n + "</dd></div>";
    }

    linesEl.addEventListener("click", function (e) {
      var step = e.target.closest("[data-step]");
      if (step) {
        var id = step.getAttribute("data-id");
        setQty(id, (sheet.items[id] || 0) + Number(step.getAttribute("data-step")));
        keepFocus(paintSheet);
        return;
      }
      var drop = e.target.closest("[data-drop]");
      if (drop) {
        var did = drop.getAttribute("data-drop");
        var name = byId[did] ? byId[did].name : "That line";
        var next = drop.closest(".line").nextElementSibling;
        setQty(did, 0);
        paintSheet();
        toast(esc(name) + " removed from your cart.");
        /* the button they pressed no longer exists: move them somewhere sensible */
        var land = next
          ? document.querySelector('[data-focus-key^="minus:"]')
          : document.querySelector("#sheet-empty .btn, #lines [data-focus-key]");
        if (land) land.focus({ preventScroll: true });
      }
    });
    linesEl.addEventListener("change", function (e) {
      var f = e.target.closest("[data-qty]");
      if (!f) return;
      setQty(f.getAttribute("data-qty"), Number(f.value));
      keepFocus(paintSheet);
    });

    /* occasion + date live in the cart, not just in the form */
    var occ = $("#occasion");
    var dat = $("#event-date");
    if (occ) {
      occ.value = sheet.occasion || "";
      occ.addEventListener("change", function () {
        sheet.occasion = occ.value;
        save();
      });
    }
    if (dat) {
      dat.value = sheet.date || "";
      dat.addEventListener("change", function () {
        sheet.date = dat.value;
        save();
      });
    }

    /* ---- the request ---- */
    var form = $("#request");
    if (form) {
      /* The error text was on screen but not attached to anything: a screen reader
         got focus moved into a field with no idea it was wrong, or why. Give every
         message an id, wire it to its input, and announce the failure once. */
      $$(".field[data-required]", form).forEach(function (f) {
        var input = $("input, select, textarea", f);
        var err = $(".err", f);
        if (input && err && !err.id) err.id = input.id + "-err";
      });
      var live = document.createElement("p");
      live.className = "sr";
      live.setAttribute("role", "status");
      live.setAttribute("aria-live", "polite");
      form.appendChild(live);

      var mark = function (input, err, bad) {
        input.setAttribute("aria-invalid", bad ? "true" : "false");
        var d = (input.getAttribute("aria-describedby") || "")
          .split(/\s+/)
          .filter(function (x) {
            return x && x !== err.id;
          });
        if (bad) d.push(err.id);
        if (d.length) input.setAttribute("aria-describedby", d.join(" "));
        else input.removeAttribute("aria-describedby");
      };

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var ok = true;
        var count = 0;
        $$(".field[data-required]", form).forEach(function (f) {
          var input = $("input, select, textarea", f);
          var err = $(".err", f);
          var bad = !input.value.trim() || (input.type === "email" && !/^\S+@\S+\.\S+$/.test(input.value));
          f.setAttribute("data-invalid", String(bad));
          if (err) mark(input, err, bad);
          if (bad) count++;
          if (bad && ok) {
            input.focus();
            ok = false;
          }
        });
        if (!ok) {
          live.textContent =
            count === 1
              ? "One field still needs filling in. Focus has moved to it."
              : count + " fields still need filling in. Focus has moved to the first.";
          return;
        }
        live.textContent = "";

        var out = buildSummary(form);
        var box = $("#result");
        box.hidden = false;
        $("#result-text").value = out;
        box.scrollIntoView({ behavior: "smooth", block: "center" });
        /* Never hand a finished order to an address that does not exist. While the
           contact details are placeholders the mail route is closed, visibly. */
        var mail = $("#result-mail");
        if (mail) {
          if (D.CONTACT.placeholder) {
            mail.removeAttribute("href");
            mail.setAttribute("aria-disabled", "true");
            mail.classList.add("is-off");
            mail.innerHTML =
              svg("i-mail") + "Mail is off until Ajia's address is added";
          } else {
            mail.href =
              "mailto:" +
              D.CONTACT.email +
              "?subject=" +
              encodeURIComponent("Order request: " + ($("#name").value || "new")) +
              "&body=" +
              encodeURIComponent(out);
          }
        }
      });

      var copyBtn = $("#result-copy");
      if (copyBtn)
        copyBtn.addEventListener("click", function () {
          var ta = $("#result-text");
          ta.select();
          try {
            navigator.clipboard
              ? navigator.clipboard.writeText(ta.value)
              : document.execCommand("copy");
            toast("Cart copied. Paste it into an email or a message.");
          } catch (err) {
            toast("Select the text above and copy it.");
          }
        });
    }

    function buildSummary(form) {
      var t = totals();
      var v = function (id) {
        var el = $("#" + id);
        return el ? el.value.trim() : "";
      };
      var L = [];
      L.push("ORDER REQUEST: AJIA'S MARZIPAN");
      L.push("(no payment has been taken; this is a request)");
      L.push("");
      L.push("FROM");
      L.push("  Name      " + v("name"));
      L.push("  Email     " + v("email"));
      L.push("  Phone     " + v("phone"));
      L.push("  Town      " + v("town"));
      L.push("");
      L.push("OCCASION");
      L.push("  Occasion  " + v("occasion"));
      L.push("  Date      " + (v("event-date") || "not set"));
      L.push("  Guests    " + (v("guests") || "not set"));
      L.push("  Handover  " + v("handover"));
      L.push("");
      L.push("THE CART");
      Object.keys(sheet.items).forEach(function (id) {
        var p = byId[id];
        var q = sheet.items[id];
        if (!p || !q) return;
        L.push(
          "  No." +
            p.no +
            "  " +
            pad(p.name, 32) +
            pad(q + " " + unitWord(p, q), 14) +
            money.format(p.price * q)
        );
      });
      L.push("");
      L.push("  Pieces        " + t.pieces);
      L.push("  Trays         " + t.trays);
      L.push("  Boxes & jars  " + t.packs);
      L.push("  Estimate      " + money.format(t.sum) + (D.PLACEHOLDER.on ? "  (placeholder pricing)" : ""));
      if (v("notes")) {
        L.push("");
        L.push("NOTES");
        L.push("  " + v("notes").replace(/\n/g, "\n  "));
      }
      return L.join("\n");
    }
    function pad(s, n) {
      s = String(s);
      return s.length >= n ? s.slice(0, n - 1) + " " : s + new Array(n - s.length + 1).join(" ");
    }

    paintSheet();
  }

  /* --------------------------------------------------------- tray gallery */
  var trayGroupsEl = $("#tray-groups");
  if (trayGroupsEl && D.TRAY_GROUPS) {
    trayGroupsEl.innerHTML = D.TRAY_GROUPS.map(function (group) {
      return (
        '<article class="tray-group">' +
        '<div class="tray-group__head"><h3>' + esc(group.name) + '</h3><p>' + esc(group.description) + '</p></div>' +
        '<div class="tray-group__photos">' +
        group.photos.map(function (photo, index) {
          return '<figure><img src="img/card/' + photo + '.jpg" alt="' + esc(group.name + ' example ' + (index + 1)) + '" loading="lazy" decoding="async"><figcaption>' + esc(group.name) + ' ' + (index + 1) + '</figcaption></figure>';
        }).join("") +
        '</div>' +
        '<div class="tray-group__order"><p>Made to order. Call Ajia to discuss your tray.</p><a class="btn btn--brass btn--sm" href="' + esc(D.CONTACT.phoneHref || "#") + '">' + svg("i-phone") + 'Call ' + esc(D.CONTACT.phone) + '</a></div>' +
        '</article>'
      );
    }).join("");
  }

  /* --------------------------------------------------------- placeholders */
  $$("[data-contact]").forEach(function (el) {
    var k = el.getAttribute("data-contact");
    if (D.CONTACT[k]) el.textContent = D.CONTACT[k];
    if (k === "phone") {
      el.setAttribute("href", D.CONTACT.phoneHref || "#");
      return;
    }
    if (D.CONTACT.placeholder) {
      el.removeAttribute("href");
      el.setAttribute("aria-disabled", "true");
      return;
    }
    if (k === "email") el.setAttribute("href", "mailto:" + D.CONTACT.email);
  });

  paintCount();
  armStrikes();
})();
