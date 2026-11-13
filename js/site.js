/* ==========================================================================
   Ajia's Marzipan: behaviour
   The strike: a cell is carved until it is struck, then the piece comes out.
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
      '<span class="ph" title="' + PH_SIZE + '">' + esc(p.size) +
      '<i aria-hidden="true">?</i><span class="sr"> (estimated, not yet measured)</span></span>'
    );
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

  function variantFor(p, name) {
    if (!p || !name || !Array.isArray(p.variants)) return null;
    return p.variants.filter(function (variant) {
      return variant.name === name;
    })[0] || null;
  }
  function variantPhotoChoices(variants) {
    return variants.reduce(function (choices, variant) {
      var photos = Array.isArray(variant.photos) && variant.photos.length
        ? variant.photos
        : [{ photo: variant.photo, alt: variant.alt, label: variant.name }];
      return choices.concat(photos.map(function (image) {
        return {
          name: variant.name,
          photo: image.photo,
          alt: image.alt || variant.alt,
          label: image.label || variant.name,
        };
      }));
    }, []);
  }
  /* ---------------------------------------------------- catalogue render -- */
  var goodsEl = $("#goods");
  if (goodsEl) {
    var activeCat = "all";
    var filtersEl = $("#filters");
    var selectedVariants = {};
    var selectedVariantPhotos = {};
    var selectedFillings = {};

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
      var variants = Array.isArray(p.variants) && p.variants.length ? p.variants : null;
      var selectedVariant = variants ? variantFor(p, selectedVariants[p.id]) || variants[0] : null;
      var variantChoices = variants ? variantPhotoChoices(variants) : null;
      var fillings = Array.isArray(p.fillings) && p.fillings.length ? p.fillings : null;
      var selectedFilling = fillings
        ? fillings.filter(function (filling) {
            return filling.name === selectedFillings[p.id];
          })[0] || fillings[0]
        : null;
      var shownPrice = selectedFilling && typeof selectedFilling.price === "number"
        ? selectedFilling.price
        : p.price;
      var shown = variants
        ? variantChoices.filter(function (choice) {
            return choice.name === selectedVariant.name &&
              (!selectedVariantPhotos[p.id] || choice.photo === selectedVariantPhotos[p.id]);
          })[0] || variantChoices.filter(function (choice) {
            return choice.name === selectedVariant.name;
          })[0]
        : { photo: p.photo, alt: p.alt };
      return (
        '<article class="good" data-good="' +
        p.id +
        '">' +
        '<div class="good__shot">' +
        '<img src="img/card/' +
        shown.photo +
        '.jpg" alt="' +
        esc(shown.alt) +
        '" loading="lazy" decoding="async" width="900" height="675">' +
        (p.no ? '<span class="good__no num">No. ' + esc(p.no) + "</span>" : "") +
        '<button type="button" class="good__view" data-view-photo="' +
        esc(shown.photo) +
        '" data-view-alt="' +
        esc(shown.alt) +
        '" data-view-title="' +
        esc(p.name) +
        '" aria-label="View a larger image of ' +
        esc(p.name) +
        '">View larger</button>' +
        "</div>" +
        '<div class="good__body">' +
        '<h3 class="good__name">' +
        esc(p.name) +
        "</h3>" +
        '<p class="good__say">' +
        esc(p.blurb) +
        "</p>" +
        (variants
          ? '<div class="good__variants"><p class="good__variant-label">Colour: <strong class="good__variant-name">' +
            esc(shown.name) +
            '</strong></p><div class="good__thumbs" role="group" aria-label="Choose a colour">' +
            variantChoices
              .map(function (variant) {
                return (
                  '<button type="button" class="good__thumb" data-variant-photo="' +
                  esc(variant.photo) +
                  '" data-variant-alt="' +
                  esc(variant.alt) +
                  '" data-variant-name="' +
                  esc(variant.name) +
                  '" aria-pressed="' +
                  (variant.photo === shown.photo ? "true" : "false") +
                  '" aria-label="Show ' +
                  esc(variant.label) +
                  " " +
                  esc(p.name) +
                  '">' +
                  '<img src="img/thumb/' +
                  esc(variant.photo) +
                  '.jpg" alt="" loading="lazy" decoding="async">' +
                  '<span class="good__thumb-label">' +
                  esc(variant.label) +
                  "</span></button>"
                );
              })
              .join("") +
            "</div></div>"
          : "") +
        (fillings
          ? '<div class="good__fillings"><p class="good__variant-label">Filling: <strong class="good__filling-name">' +
            esc(selectedFilling.name) +
            '</strong></p><div class="good__filling-choices" role="group" aria-label="Choose a filling">' +
            fillings
              .map(function (filling) {
                return (
                  '<button type="button" class="good__filling" data-filling-name="' +
                  esc(filling.name) +
                  '" data-filling-price="' +
                  esc(filling.price) +
                  '" data-filling-note="' +
                  esc(filling.note || "") +
                  '" aria-pressed="' +
                  (filling.name === selectedFilling.name ? "true" : "false") +
                  '">' +
                  esc(filling.name) +
                  "</button>"
                );
              })
              .join("") +
            '</div><p class="good__filling-note" data-filling-note-text aria-live="polite">' +
            esc(selectedFilling.note || "") +
            "</p></div>"
          : "") +
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
        '<span data-good-price aria-live="polite">' +
        price(shownPrice) +
        "</span>" +
        "<small>per " +
        p.unit +
        "</small></p>" +
        '<a class="btn btn--brass btn--sm" href="' +
        esc(D.CONTACT.phoneHref || "#") +
        '" aria-label="Call Ajia to order ' +
        esc(p.name) +
        ' at ' +
        esc(D.CONTACT.phone) +
        '">' +
        svg("i-phone") +
        "Call Ajia to order</a>" +
        "</div>" +
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
      var filling = e.target.closest("[data-filling-name]");
      if (filling) {
        var fillingCard = filling.closest(".good");
        var fillingName = $(".good__filling-name", fillingCard);
        var fillingNote = $("[data-filling-note-text]", fillingCard);
        var fillingPrice = $("[data-good-price]", fillingCard);
        selectedFillings[fillingCard.getAttribute("data-good")] = filling.getAttribute("data-filling-name");
        if (fillingName) fillingName.textContent = filling.getAttribute("data-filling-name");
        if (fillingNote) fillingNote.textContent = filling.getAttribute("data-filling-note");
        if (fillingPrice) fillingPrice.innerHTML = price(Number(filling.getAttribute("data-filling-price")));
        $$(".good__filling", fillingCard).forEach(function (choice) {
          choice.setAttribute("aria-pressed", String(choice === filling));
        });
        return;
      }

      var view = e.target.closest("[data-view-photo]");
      if (view) {
        var viewer = $("#photo-viewer");
        var viewerImage = $(".photo-viewer__image", viewer);
        var viewerTitle = $(".photo-viewer__title", viewer);
        if (viewer && viewerImage && viewerTitle) {
          viewerImage.src = "img/full/" + view.getAttribute("data-view-photo") + ".jpg";
          viewerImage.alt = view.getAttribute("data-view-alt");
          viewerTitle.textContent = view.getAttribute("data-view-title");
          viewer.showModal();
        }
        return;
      }

      var variant = e.target.closest("[data-variant-photo]");
      if (variant) {
        var card = variant.closest(".good");
        var main = $(".good__shot img", card);
        var name = $(".good__variant-name", card);
        var viewButton = $("[data-view-photo]", card);
        if (main) {
          main.src = "img/card/" + variant.getAttribute("data-variant-photo") + ".jpg";
          main.alt = variant.getAttribute("data-variant-alt");
        }
        if (viewButton) {
          viewButton.setAttribute("data-view-photo", variant.getAttribute("data-variant-photo"));
          viewButton.setAttribute("data-view-alt", variant.getAttribute("data-variant-alt"));
        }
        selectedVariants[card.getAttribute("data-good")] = variant.getAttribute("data-variant-name");
        selectedVariantPhotos[card.getAttribute("data-good")] = variant.getAttribute("data-variant-photo");
        if (name) name.textContent = variant.getAttribute("data-variant-name");
        $$(".good__thumb", card).forEach(function (thumb) {
          thumb.setAttribute("aria-pressed", String(thumb === variant));
        });
        return;
      }
    });

    paintGoods();

    var photoViewer = $("#photo-viewer");
    if (photoViewer) {
      var photoImageWrap = $("[data-photo-image]", photoViewer);
      if (photoImageWrap) {
        var photoViewerImage = document.createElement("img");
        photoViewerImage.className = "photo-viewer__image";
        photoViewerImage.alt = "";
        photoImageWrap.appendChild(photoViewerImage);
      }
      var closePhotoViewer = $("[data-close-photo]", photoViewer);
      if (closePhotoViewer) {
        closePhotoViewer.addEventListener("click", function () {
          photoViewer.close();
        });
      }
      photoViewer.addEventListener("click", function (e) {
        if (e.target === photoViewer) photoViewer.close();
      });
      photoViewer.addEventListener("close", function () {
        var image = $(".photo-viewer__image", photoViewer);
        if (image) {
          image.removeAttribute("src");
          image.alt = "";
        }
      });
    }
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
      el.classList.remove("todo");
      el.removeAttribute("title");
      return;
    }
    if (k === "instagram") {
      el.setAttribute("href", D.CONTACT.instagramHref || "#");
      el.classList.remove("todo");
      el.removeAttribute("title");
      return;
    }
    if (D.CONTACT.placeholder) {
      el.removeAttribute("href");
      el.setAttribute("aria-disabled", "true");
      return;
    }
    if (k === "email") el.setAttribute("href", "mailto:" + D.CONTACT.email);
  });

  armStrikes();
})();
