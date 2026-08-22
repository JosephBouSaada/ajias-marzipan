# Ajia's Marzipan

Website for a hand-sculpted marzipan maker in greater Boston: roses, sleeping babies,
bride-and-groom figures, chalice plaques, fruit and centrepiece trays, for weddings,
baptisms, first communions, parties and gifts.

Plain static HTML, CSS and JavaScript. No build step, no dependencies, no framework.
Open `index.html` or serve the folder and it runs.

---

## ⚠️ Not ready to publish as-is

**Every price on this site is a placeholder.** So are the phone number, email, Instagram
handle and all lead times. They are stand-ins so the cart adds up: they are not
Ajia's real figures, and they are marked as fake on screen with a dashed underline and a
`?` at each one.

The contact email is deliberately `ajia-email-not-set@example.invalid`, and the "open in
mail" route is switched off in code, so a finished order cannot be sent into a void.

Most sizes read "approx." because they were read off Ajia's photographs rather than
measured. The one exception is the communion plaque, which she photographed against a ruler.

See `PRODUCT.md` for exactly what is known versus what must not be invented.

### Going live

| Step | Where |
|---|---|
| Real prices | `js/products.json` → each product's `price` |
| Turn off the price warnings | `js/data.js` → `PLACEHOLDER.on = false` |
| Real phone / email / Instagram | `js/data.js` → `CONTACT` |
| Re-enable the mail route | `js/data.js` → `CONTACT.placeholder = false` |
| Drop the "approx." size hedges | `js/data.js` → `SIZES_CONFIRMED = true` (measure first) |
| Allergen + cross-contact statement | Owner-supplied. Currently absent. |

Nothing is charged anywhere on this site. The cart is local-only and ends in an
inquiry, not a payment.

---

## Dietary claim

The marzipan is **gluten-free, dairy-free and vegan**: almonds and sugar, not a
substitution or a special order. This is a first-class product fact, not a footnote.

Chocolate is the one component Ajia buys in rather than makes, so the two chocolate-dipped
products sit outside the claim and say so on their own cards:

- **Milk chocolate**: contains dairy. Not dairy-free, not vegan.
- **Dark chocolate**: not yet confirmed by the owner, so the site does not assert it.

The claim is stated plainly at brand level; the exception is labelled on the two items it
applies to. Do not caveat the headline claim, and do not extend it over the chocolate.

---

## Layout

```
index.html          home
catalogue.html      products, filterable, adds to the cart
gallery.html        grouped photographs and commissioned trays
about.html          about Ajia
order.html          the cart and inquiry form

css/mold.css        the whole design system
js/products.json     human-editable product and tray data
js/data.js           contact and site settings
js/site.js          cart, validation, summary
js/icons.js         inline SVG sprite

img/{full,card,thumb}   processed images the site serves
assets/                 Ajia's original photographs (source for the pipeline)
tools/build-images.mjs  rebuilds img/ from assets/
tools/shots.mjs         design-review screenshots
tools/crops.mjs         design-review region and state crops
```

## Running it

```sh
python3 -m http.server 8811
# then open http://localhost:8811/index.html
```

## Rebuilding images

After adding photographs to `assets/`, update the slug map in `tools/build-images.mjs`
and run:

```sh
node tools/build-images.mjs
```
