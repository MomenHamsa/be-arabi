# هند — From demo store to production

A complete to-do list for making the store functional: backend, frontend, CRM,
maker portal, analytics, and operations. Organized in phases — each phase is
shippable on its own, and later phases depend on earlier ones.

Roles used throughout:
- **Admin (Momen)** — owns the store, manages products/orders, handles delivery.
- **Maker (الصانعة/الصانع)** — crafts the pieces, sees their own orders, does the packaging.
- **Customer** — browses, orders, pays (or chooses cash on delivery).

---

## ✅ Shipped 2026-07-26 (this session) — front-end launch slice

The storefront was taken from "rough demo" to "presentable, discoverable, bilingual." What landed:

- **Calm & clean redesign** (site.css): the heavy embroidered `border-image` photo frames became a quiet plaster mat + gold hairline + soft shadow; the `sepia` grade was removed so product photos read true-colour; the all-over star lattice now sits only on feature grounds (hero / alt-ground / night) while plain sections rest on calm sand; the loud Alhambra `frieze` band was slimmed to a seam; the hero veil was lightened so the arches read as intent, not emptiness.
- **Catalog** (products.html + site.js): even square cards, a shelf-like hover lift, the real piece leads and pops, and preview pieces now show an honest **"قريباً / Coming soon"** tag instead of a fake add-to-cart. Titles link to their page; the story link is a quiet secondary.
- **SEO & discoverability** (new): `robots.txt`, a bilingual `sitemap.xml` with `hreflang`, JSON-LD structured data (Store, WebSite, Product+Offer, BreadcrumbList, ItemList), and full canonical + OpenGraph/Twitter tags on every page. Product OG is enriched per-product for JS-aware crawlers.
- **English site** (new `/en/`): a full LTR English store — home, pieces, product template, about, film, follow — sharing one `site.css`/`site.js`. English product data in `products/data/en/`, a top-bar **language switch** (AR ⇄ EN) injected on every page, Georgia serif type for Latin, and `hreflang` pairing throughout. `site.js` is now language-aware (`HIND_LANG` / `HIND_BASE` / `HIND_STR`), so every JS-generated string (cart drawer, chips, buttons, notify form) localises.
- **🐛 Bug fixed:** prices are written in Arabic-Indic digits (`٣٥`), but the parser used `/[^\d.]/` (ASCII-only), so the demo **cart total silently computed to 0** for real products and the structured-data price was blank. Added digit normalisation (`hindPriceNumber` / `hindPriceCurrency`); verified the pillow now totals correctly and the Product rich result carries `"price":35`.

**The one launch-blocker introduced here:** the real domain. Everything is wired to the placeholder `hind.example` (99 spots across HTML/xml/txt). At launch: find-and-replace `hind.example` → your domain, and set `HIND_SITE.origin` in `site.js`. See Phase 9.

**Still not done here (deliberately, needs decisions or business input):** the transacting backend (orders/payments/delivery — Phase 1–3), removing the `demo-*` preview pieces (kept so the shelves preview full), the real artisan replacing "أم فارس", real product photography, and the analytics install (Phase 7). Copy note: the English translations are faithful but worth a native read before launch.

---

## Phase 0 — Decisions to lock before writing any code

These decide the shape of everything after. My recommendation is marked, but each is your call.

- [ ] **Backend stack.** Options, in order of my recommendation:
  1. **Supabase** (Postgres + auth + file storage + row-level security) with a small custom admin UI — most control, RLS gives maker-scoped access almost for free, generous free tier.
  2. **Directus** self-hosted over Postgres — the admin/maker portals come nearly free (roles + permissions + file library out of the box), REST API for the storefront. Fastest path to "portal to upload products".
  3. Full e-commerce platform (Shopify/WooCommerce) — fastest checkout, but you'd fight it to keep the current design, story pages, before/after, and the maker-access model. Not recommended for this brand.
- [ ] **Keep the current static frontend** and make it data-driven (fetch products from the API instead of `HIND_PRODUCTS`), rather than rebuilding in a framework. The design is the product — don't throw it away. *(Recommended; revisit only if pages multiply beyond hand-managing.)*
- [ ] **Payment approach for Jordan** — verify current availability before committing:
  - **Cash on delivery** — must-have; it is still the default trust mode for JO e-commerce, and it works day one with zero integration.
  - **CliQ transfer** (manual confirmation by admin) — cheap second option, no gateway fees.
  - **Card gateway**: HyperPay, PayTabs, Montypay, or Checkout.com (Stripe is not available in Jordan). Requires business registration. Can ship in a later phase — COD + CliQ can carry the launch.
- [ ] **Analytics tool.** Recommendation: **Microsoft Clarity** (free session recordings + heatmaps) **+ Plausible or Umami** (privacy-friendly page/event analytics, no cookie banner). GA4 only if you want ad attribution later.
- [ ] **Customer communication channel** for order updates: WhatsApp (manual at first, Business API later) vs email vs SMS. Recommendation: **WhatsApp manual first** — it's where your customers live.
- [ ] **Maker privacy policy**: makers see order items + gift note + order number, but **not** the customer's name/phone/address (you deliver, so only you need the address). Decide and encode this in permissions from day one — retrofitting is painful.
- [ ] **Guest checkout** (recommended: yes, phone number as identity) vs forced accounts.
- [ ] **Legal**: business registration (needed for any card gateway), terms of service, privacy policy (required once analytics + orders store personal data), return/exchange policy — handmade goods need explicit wording.

---

## Phase 1 — Data model & backend core

The schema that carries everything you asked for (before/after, maker + her store, story, sections, gift orders, map location):

- [ ] **`makers`** — name, photo, bio/story, store name, store location/link, phone (private), active flag, auth user id.
- [ ] **`categories`** (الأقسام) — id, name, slug, display order. Examples: منسوجات، نحاسيات، خزف، إضاءة، تطريز.
- [ ] **`products`** — id, slug, name, category id, maker id, price, currency, stock (handmade pieces are often one-of-a-kind → support `stock = 1` and a visible **"بيعت" (sold)** state, don't just hide the piece), status (draft/published/archived — **delete = archive**, never destroy rows referenced by orders), craft story (حكاية الصنعة), short card line, created/updated timestamps.
- [ ] **`product_images`** — product id, file, sort order, role: `gallery` | `before` | `after` | `maker`. This is exactly the current page anatomy (carousel + compare + maker photo) made into data.
- [ ] **`orders`** — order number (human-friendly, e.g. HND-0042), customer name, phone, delivery address text, **map coordinates (lat/lng)**, **is_gift flag**, **gift note / general comment**, payment method (cod/cliq/card), payment status (pending/paid/refunded), order status, totals, timestamps.
- [ ] **`order_items`** — order id, product id, maker id (denormalized so maker queries are trivial), qty, unit price snapshot (prices change; orders must not).
- [ ] **`order_events`** — order id, status change, actor, timestamp, note. This is your CRM timeline *and* the audit log.
- [ ] **Order status lifecycle** (agree on it now, wire everything to it):
  `new → confirmed → packaging (maker) → ready_for_pickup → out_for_delivery → delivered`
  plus `cancelled` and `returned` branches.
- [ ] **Auth + roles**: admin, maker (scoped to own products/orders via row-level security or role permissions), customer optional.
- [ ] **File storage** for product images + an **image pipeline** (resize/compress to the web sizes on upload — replaces today's manual `products/pillow/web/` step; originals are 6–8 MB, that must never reach a visitor).
- [ ] **API endpoints** the storefront needs: list products (with category filter), get product, create order, get order status by order number + phone.
- [ ] **Backups**: automated daily DB backup + storage backup. Test a restore once.
- [ ] **Notifications on new order**: to you (WhatsApp/email) and to the affected maker(s).

---

## Phase 2 — Storefront: catalog, sections, filters

- [ ] Replace hardcoded `HIND_PRODUCTS` in `site.js` with a fetch from the API (keep a local JSON fallback for dev).
- [ ] **Delete the `demo-*` preview pieces** (site.js block + their cards in products.html) once real products exist.
- [ ] Make **products.html data-driven**: render the shelf grid from the API.
- [ ] **Sections/filters** (keep it simple and on-brand — chips, not a sidebar):
  - [ ] Category chips row above the shelf (الكل / منسوجات / نحاسيات / خزف / …).
  - [ ] Optional second filter: by maker (بأيدي من؟) and price range. Ship category first; add the rest when >15 products.
  - [ ] Filters update the URL (`?قسم=منسوجات`) so filtered views are shareable and analytics can see them.
- [ ] **Product page becomes a template** (one `product.html?slug=…` or generated pages) with the exact anatomy pillow.html already proved: carousel gallery → buy panel → craft story → maker section (with her name, photo, story, **and her store**) → before/after compare → closing CTA. Data-driven, so a new product = a portal upload, not a new HTML file.
- [ ] **Stock states in UI**: sold pieces stay visible with a "بيعت — اطلب قطعة مثلها" (sold — commission a similar piece) action instead of add-to-cart. For one-of-a-kind crafts this *is* the social proof.
- [ ] SEO per product: title/description/og-image from data, `Product` JSON-LD structured data.

## Phase 3 — Checkout & orders (customer side)

- [ ] **Checkout page** (the cart drawer's "أكّد الطلب" leads here instead of the demo message):
  - [ ] Contact: name + phone (WhatsApp-capable) — phone is the identity.
  - [ ] **Delivery location on a map**: embedded picker (Leaflet + OpenStreetMap is free and license-clean; Google Maps has better JO coverage but needs billing) — drop a pin + a free-text landmark field ("بجانب مسجد…"), which is how addresses actually work in Amman.
  - [ ] **Gift option**: checkbox "هذه هدية 🎁" → reveals gift note textarea + "who is it for" → order flagged for **gift packaging** so the maker sees it.
  - [ ] General order comment field.
  - [ ] Payment method choice: COD / CliQ (show transfer details + "we confirm within X hours") / card (when gateway lands).
  - [ ] Order review step with totals + delivery fee logic (flat fee? free above X د.أ? — decide).
- [ ] **Confirmation page** with order number + what happens next, and a WhatsApp confirmation message.
- [ ] **Order tracking**: a "أين طلبي؟" page — order number + phone → current status from the lifecycle. (Manual WhatsApp updates can substitute at launch; build the page in v1.1.)
- [ ] **Cart hardening**: stock check at checkout (two people, one pillow — first confirmed order wins, the other gets an honest message), keep localStorage cart but validate server-side.

## Phase 4 — Support section

- [ ] **تواصلوا معنا page**: WhatsApp deep link (primary), phone, email, expected response time.
- [ ] **FAQ (أسئلة تتكرر)**: delivery areas + times, payment methods, returns/exchanges on handmade goods, custom orders/commissions, gift packaging, how to become a maker (this doubles as a recruiting channel).
- [ ] Policies pages: returns, privacy, terms (from Phase 0 legal work).
- [ ] Add support entry points in the footer and the order confirmation page.

---

## Phase 5 — Admin portal + CRM (you)

- [ ] **Products manager**: create/edit/archive product; upload gallery images + **before/after pair** + assign maker + category + story fields; publish toggle; drag-to-reorder gallery. (This is the "upload new products and delete others" portal — with archive instead of hard delete.)
- [ ] **Makers manager**: add/edit makers, their bio, photos, store info; create their portal login; deactivate.
- [ ] **Orders CRM**:
  - [ ] Pipeline board or filtered list by status (the lifecycle from Phase 1).
  - [ ] Order detail: items, customer info, **map pin link (opens in Google Maps for navigation)**, payment method + status, **gift flag + note highlighted**, timeline of events, internal notes.
  - [ ] Actions: confirm order, mark payment received (CliQ/COD), advance status, cancel/refund with reason.
  - [ ] **Payments view**: unpaid/paid/COD-to-collect totals, simple reconciliation list (what cash you're owed from deliveries).
- [ ] **Dashboard**: orders this week, revenue, top products, pending actions (unconfirmed orders, pieces waiting packaging, deliveries due).
- [ ] Admin audit log (who changed what — matters once makers have access too).

## Phase 6 — Maker portal (الصانعات)

- [ ] Scoped login per maker: sees **only** orders containing their pieces.
- [ ] Order card shows: order number, their items, **gift flag + gift note** ("غلاف هدية 🎁" prominently), packaging deadline — **no customer name/phone/address** (per the Phase 0 privacy decision).
- [ ] One action: mark **"جاهزة للاستلام" (ready for pickup)** → notifies you to schedule pickup + delivery.
- [ ] Notification to maker on new order (WhatsApp/SMS at first can be manual-forwarded; automate later).
- [ ] Their product list with stock: mark a piece sold offline / add "I've woven another one" (stock +1 request → you approve).
- [ ] Keep it phone-first: makers will use this from a phone, likely low tech comfort — one screen, big buttons, Arabic only.
- [ ] Write a one-page illustrated guide (or a voice-note walkthrough) for onboarding a maker.

---

## Phase 7 — User journey analytics ("review the journey, store it, analyze, enhance")

- [ ] Install **Microsoft Clarity** (session recordings + heatmaps + rage-click detection) — this is the "watch the journey" tool.
- [ ] Install **Plausible/Umami** for counts and funnels.
- [ ] **Define the event taxonomy** (this is the part people skip and regret). Track:
  - product card click, carousel swipe/arrow (which slide), before/after slider drag (it's your signature interaction — does it convert?), story-section scroll depth, add-to-cart, cart open, checkout started, map pin placed, gift checked, payment method chosen, order completed, support/FAQ opened.
- [ ] **Define the funnel**: home → القطع → product → add to cart → checkout → order. Instrument each step.
- [ ] Store raw events somewhere you own (Plausible/Umami DB or a simple events table) so future analysis isn't locked in a tool.
- [ ] **Review cadence**: a monthly ritual — watch 10 Clarity sessions, read the funnel, pick ONE fix, ship it. Write findings in a running `docs/journey-notes.md`.
- [ ] Cookie/consent banner only if a chosen tool requires it (Plausible/Umami/Clarity configured cookie-less generally don't; GA4 does).

---

## Phase 8 — Operations (the offline half of the store)

- [ ] **Fulfillment flow agreed with makers**: order confirmed → maker packages (gift kit if flagged) → marks ready → you pick up → deliver → mark delivered → COD cash reconciled.
- [ ] **Packaging standard**: normal + **gift tier** (better box, ribbon, the story card with the maker's name — you already promise "بطاقة تحمل اسم صانعتها"; make it real). Stock makers with materials.
- [ ] Delivery zones + fees + promise ("عمّان خلال ٢-٣ أيام"، خارج عمّان؟) published on FAQ and checkout.
- [ ] Decide COD cash handling with makers: when does the maker get paid — on delivery? weekly settlement? Track payouts per maker in the CRM (a `maker_payouts` note/table saves fights later).
- [ ] **Replace the generated persona**: "أم فارس" and her quotes are invented — before launch this MUST be a real artisan, her real story, her real photo, with her consent (flagged when the page was written).
- [ ] Photograph real products: gallery set + before/after room shots per piece (the current pillow set defines the standard).

## Phase 9 — Launch checklist (includes the long-standing open items)

- [ ] **Real domain + HTTPS.** All SEO tags are wired to the placeholder `hind.example` — find-and-replace it repo-wide (`grep -rl hind.example`) and set `HIND_SITE.origin` in site.js. canonical, hreflang, OpenGraph/Twitter, `sitemap.xml`, `robots.txt`, and JSON-LD are already in place and will go absolute automatically once the origin is set.
- [ ] `HIND_CONFIG`: real Instagram/YouTube URLs, real notify endpoint or contact email.
- [ ] **DG Tebian font license** confirmed for web use (abulbara91@gmail.com — noted in index.html).
- [ ] Remove every "متجر تجريبي" demo notice (topbar drawer, buy panels, footer) — grep for `تجريبي`.
- [ ] Remove `demo-*` products and `_qa.html` from the deployed site.
- [ ] Payment sandbox test end-to-end (if gateway), plus a full real order rehearsal: order → maker packages → pickup → deliver → mark delivered — with a friend as the customer.
- [ ] Mobile RTL pass on real devices (iOS Safari especially: map picker, carousel swipe, checkout inputs).
- [ ] Performance pass: image sizes, lazy loading, Lighthouse on 3G.
- [ ] Error states: API down, payment failed, out of stock mid-checkout — honest Arabic messages for each.
- [ ] Rate limiting + spam protection on order creation and forms.
- [ ] Uptime monitor + error alerting to your phone.

## Phase 10 — After launch (the loop)

- [ ] Monthly journey review ritual (Phase 7) → one enhancement per cycle.
- [ ] Add card payments if launch ran on COD/CliQ.
- [ ] Order tracking page if it didn't make launch.
- [ ] Search + richer filters when the catalog justifies them.
- [ ] Email/WhatsApp automation for order status changes.
- [ ] Maker self-service product submission (maker uploads → you approve → published).
- [ ] Customer accounts + order history, wishlist ("قطع أحلم بها").
- [ ] The documentary page gets its film; stories.html revival with maker stories.

---

## Suggested build order (dependency-honest)

1. Phase 0 decisions (one sitting — everything blocks on the stack + payment choices)
2. Phase 1 backend + Phase 5 admin products manager (you can't fill a store without the portal)
3. Phase 2 storefront made data-driven
4. Phase 3 checkout with COD + map + gift (launchable store exists here)
5. Phase 4 support + Phase 8 ops + Phase 9 launch list → **launch**
6. Phase 6 maker portal (until then: you forward orders to makers on WhatsApp — fine for the first weeks)
7. Phase 7 analytics from launch day, first review after 2–4 weeks
8. Phase 10 loop forever

The one deliberately contrarian call: the maker portal is *after* launch, not before. With 2–5 makers, WhatsApp-forwarding orders costs you minutes a day and teaches you what the portal actually needs; building it first delays revenue and risks building the wrong screens.
