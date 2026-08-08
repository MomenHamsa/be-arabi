/* ============ CONFIGURE BEFORE LAUNCH ============
   socialUrl:      the real profile, e.g. "https://instagram.com/..."
   productsUrl:    the products page; leave empty to use products.html
   storiesUrl:     the stories library; leave empty to use stories.html
   notifyEndpoint: a form endpoint (e.g. Formspree: https://formspree.io/f/XXXX)
   contactEmail:   fallback; signups open the visitor's mail app to this address
   ================================================== */
var HIND_CONFIG = {
  socialUrl: "",
  instagramUrl: "",
  youtubeUrl: "",
  productsUrl: "",
  storiesUrl: "",
  notifyEndpoint: "",
  contactEmail: ""
};

/* The shelves: every piece the store knows about, in one place.
   Prices are demo values - the store takes no payment yet. */
var HIND_PRODUCTS = {
  "sadu-pillow": {
    name: "وسادة السدو",
    price: 35,
    currency: "د.أ",
    img: "products/pillow/web/1.jpg",
    url: "product.html?id=sadu-pillow"
  },

  /* ---- عيّنات المعاينة ----
     Layout placeholders so the shelves can be seen full: no photos,
     no pages, demo prices. Delete this block (and their cards in
     products.html) when real pieces arrive. */
  "demo-rug":        { name: "بساط منسوج",         price: 90, currency: "د.أ", img: "", url: "" },
  "demo-cups":       { name: "طقم فناجين قيشاني",  price: 28, currency: "د.أ", img: "", url: "" },
  "demo-mibkhara":   { name: "مبخرة نحاس منقوشة",  price: 42, currency: "د.أ", img: "", url: "" },
  "demo-tray":       { name: "صينية نحاس محفورة",  price: 55, currency: "د.أ", img: "", url: "" },
  "demo-mirror":     { name: "مرآة بإطار صدف",     price: 75, currency: "د.أ", img: "", url: "" },
  "demo-lantern":    { name: "فانوس مشغول باليد",  price: 38, currency: "د.أ", img: "", url: "" },
  "demo-tablecloth": { name: "غطاء طاولة مطرّز",   price: 60, currency: "د.أ", img: "", url: "" }
};

/* ============ SITE / SEO CONFIG ============
   origin: your real https origin, no trailing slash (e.g. "https://hind.jo").
   Setting this one value at launch makes every canonical link, Open Graph
   URL, and JSON-LD URL absolute and correct site-wide. The static <head>
   tags use the placeholder "https://hind.example"; find-and-replace that
   token across the repo (and in robots.txt + sitemap.xml) with the same
   origin, then set it here too. Until then, links stay relative/placeholder
   and search/social previews are the only thing affected - nothing breaks. */
var HIND_SITE = {
  origin: "",            // e.g. "https://hind.jo"
  brandAr: "هند",
  brandEn: "Hind",
  localeAr: "ar_JO",
  currency: "JOD"        // ISO 4217 for structured data (Jordanian dinar)
};

/* Inject or replace a JSON-LD <script> by id. SEO is progressive
   enhancement: any failure here must never break the page. */
function hindInjectLD(id, obj) {
  try {
    var prune = function (o) {
      if (Array.isArray(o)) return o.map(prune);
      if (o && typeof o === "object") {
        Object.keys(o).forEach(function (k) {
          if (o[k] === undefined || o[k] === null || o[k] === "") delete o[k];
          else o[k] = prune(o[k]);
        });
      }
      return o;
    };
    var prev = document.getElementById(id);
    if (prev) prev.remove();
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.id = id;
    s.text = JSON.stringify(prune(obj));
    document.head.appendChild(s);
  } catch (e) { /* non-fatal */ }
}

/* Site-relative path -> absolute URL, once an origin is configured. */
function hindAbs(path) {
  if (!path) return path;
  if (/^https?:/i.test(path)) return path;
  var o = HIND_SITE.origin;
  if (!o) return path;
  return o.replace(/\/$/, "") + "/" + String(path).replace(/^\//, "");
}

/* Prices are written in Arabic-Indic digits ("٣٥ د.أ"). JS \d matches only
   ASCII 0-9, so the old parseFloat(replace(/[^\d.]/)) returned NaN -> 0 and
   silently zeroed the cart total and the structured-data price. Normalise
   the digits first, then split the number from its currency label. */
function hindNormDigits(s) {
  return String(s == null ? "" : s).replace(/[٠-٩۰-۹]/g, function (d) {
    var c = d.charCodeAt(0);
    return String(c >= 0x06F0 ? c - 0x06F0 : c - 0x0660);
  });
}
function hindPriceNumber(display) {
  var n = parseFloat(hindNormDigits(display).replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
}
function hindPriceCurrency(display) {
  return hindNormDigits(display).replace(/^[\s\d.,]+/, "").trim() || "د.أ";
}

/* ============ LANGUAGE / PATHS ============
   One code path serves both the Arabic site (at /) and the English site
   (at /en/, one level deep). The page's <html lang> drives it: English
   pages read their own data from products/data/en/ and reach shared
   assets (product photos, room shots) via ../ . CSS background images are
   unaffected - url() in site.css resolves against the stylesheet's own
   location, not the page. */
var HIND_LANG = ((document.documentElement.getAttribute("lang") || "ar").slice(0, 2)).toLowerCase();
var HIND_BASE = HIND_LANG === "en" ? "../" : "";
var HIND_DATA_DIR = HIND_BASE + "products/data/" + (HIND_LANG === "en" ? "en/" : "");
/* Prefix a page-relative asset path so it resolves from /en/ too. Leaves
   absolute (http/data) and root-relative (/...) paths untouched. */
function hindAsset(src) {
  if (!src) return src;
  if (/^(https?:|data:|\/)/i.test(src)) return src;
  return HIND_BASE + src;
}

/* UI strings the scripts generate (cart drawer, product renderer, catalog
   chips, notify form). Page copy lives in the HTML/JSON; this table is only
   for text that JavaScript builds, so the English site reads as English. */
var HIND_STR = (HIND_LANG === "en") ? {
  all: "All",
  emptyShelf: "No pieces yet. The shelves are being arranged.",
  imgSoon: "Photo coming soon",
  soon: "Coming soon",
  addToCart: "Add to cart",
  readStory: "Read its story",
  soldSimilar: "Sold - request one like it",
  backToPieces: "Back to all pieces",
  demoHint: "This shop is a demo for now: we take orders, but no money yet.",
  errEyebrow: "Piece not found",
  errHeading: "This piece isn't available right now.",
  errBody: "The shelves may be mid-arrangement. Head back to all pieces.",
  cartTitle: "Your cart",
  cartClose: "Close cart",
  cartDemo: "Demo shop - we take orders, but take no money and ship nothing yet.",
  cartEmpty: "Your cart is empty.",
  browsePieces: "Browse the pieces",
  qtyLess: "Decrease by one",
  qtyMore: "Increase by one",
  qtyLabel: "Quantity",
  remove: "Remove",
  totalLabel: "Total",
  currencyLabel: "JD",
  confirmOrder: "Place the order",
  orderDoneLead: "We've got your order.",
  orderDoneBody: "This is a demo shop: no money is charged and nothing ships yet. When we truly open the doors, these pieces will be the first to arrive.",
  ariaCart: "Shopping cart",
  offSoon: "Coming soon",
  notifyBadEmail: "Please enter a valid email address.",
  notifyOk: "We've got your email. We'll write the moment we open.",
  notifyFail: "Couldn't sign you up right now. Please try again.",
  notifySoon: "Sign-ups open soon. Bookmark the page and come back to us.",
  mailSubject: "I want to know first",
  mailBody: "My email: ",
  roomOther: "Try another room",
  roomFirst: "Back to the first room"
} : {
  all: "الكل",
  emptyShelf: "لا توجد قطع بعد. الرفوف تُرتَّب.",
  imgSoon: "الصورة قريباً",
  soon: "قريباً",
  addToCart: "أضف إلى السلة",
  readStory: "اقرأ حكايتها",
  soldSimilar: "بيعت - اطلب قطعة مثلها",
  backToPieces: "عودة إلى كل القطع",
  demoHint: "المتجر تجريبي حالياً: نستقبل الطلبات ولا نأخذ مالاً بعد.",
  errEyebrow: "لم نجد القطعة",
  errHeading: "هذه القطعة غير متاحة الآن.",
  errBody: "قد تكون الرفوف قيد الترتيب. عد إلى كل القطع.",
  cartTitle: "سلّتك",
  cartClose: "أغلق السلة",
  cartDemo: "متجر تجريبي - نستقبل الطلبات، ولا نأخذ مالاً ولا نشحن بعد.",
  cartEmpty: "سلّتك فارغة.",
  browsePieces: "تفرّج على القطع",
  qtyLess: "أنقص واحدة",
  qtyMore: "زد واحدة",
  qtyLabel: "الكمية",
  remove: "إزالة",
  totalLabel: "المجموع",
  currencyLabel: "د.أ",
  confirmOrder: "أكّد الطلب",
  orderDoneLead: "وصلنا طلبك.",
  orderDoneBody: "هذا متجر تجريبي: لا مال يُدفع ولا قطعة تُشحن بعد. حين نفتح الأبواب فعلياً، ستكون هذه القطع أوّل ما يصل.",
  ariaCart: "سلة المشتريات",
  offSoon: "قريباً",
  notifyBadEmail: "اكتب بريداً إلكترونياً صحيحاً من فضلك.",
  notifyOk: "وصلنا بريدك. سنراسلك أوّل ما نفتح.",
  notifyFail: "تعذّر التسجيل الآن. حاول مرة أخرى.",
  notifySoon: "التسجيل يُفتح قريباً. احفظ الصفحة وعُد إلينا.",
  mailSubject: "أريد أن أعرف أولاً",
  mailBody: "بريدي: ",
  roomOther: "جرّب غرفةً أخرى",
  roomFirst: "عُد إلى الغرفة الأولى"
};

/* Gentle scroll reveals + top bar fade + actions. */
(async function () {

  /* =========================================================
     Catalog loader — used by every page.
     Fetches products/data/catalog.json once (cached), then folds
     each product into HIND_PRODUCTS so the cart drawer can render
     its lines from any page. On products.html, the shelf renderer
     below uses the same cached data.

     WHEN A REAL CRM SHIPS: swap the fetch URL for your list endpoint
     (returns the same shape). Nothing else changes.
     ========================================================= */
  var _catalog = null, _catalogPromise = null;
  function loadCatalog() {
    if (_catalog) return Promise.resolve(_catalog);
    if (_catalogPromise) return _catalogPromise;
    _catalogPromise = fetch(HIND_DATA_DIR + "catalog.json")
      .then(function (r) { return r.ok ? r.json() : { products: [], categories: [] }; })
      .then(function (data) {
        (data.products || []).forEach(function (p) {
          if (p.status && p.status !== "published") return;
          HIND_PRODUCTS[p.id] = {
            name: p.title,
            price: hindPriceNumber(p.price_display),
            currency: hindPriceCurrency(p.price_display),
            img: hindAsset((p.photo && p.photo.src) || ""),
            url: p.detail_url || ""
          };
        });
        _catalog = data;
        return data;
      })
      .catch(function (err) {
        if (window.console) console.warn("[catalog]", err);
        _catalog = { products: [], categories: [] };
        return _catalog;
      });
    return _catalogPromise;
  }

  /* Kick catalog load early — non-blocking; individual pages await it
     as needed. */
  var catalogReady = loadCatalog();

  /* =========================================================
     Shelf renderer (products.html only).
     Populates [data-shelf] with product cards from the catalog,
     builds category chips into [data-category-filter], and syncs
     the active filter to a `?category=<id>` URL parameter.
     ========================================================= */
  var shelf = document.querySelector("[data-shelf]");
  if (shelf) {
    var filterRow = document.querySelector("[data-category-filter]");
    var emptyMsg = document.querySelector("[data-shelf-empty]");
    var data = await catalogReady;
    var published = (data.products || []).filter(function (p) {
      return !p.status || p.status === "published";
    });

    /* Render cards */
    shelf.innerHTML = published.map(buildCardHTML).join("") ||
      '<p class="shelf-empty">' + HIND_STR.emptyShelf + '</p>';
    shelf.removeAttribute("aria-busy");

    /* --- SEO: the shelf as an ItemList of real (non-preview) pieces --- */
    hindInjectLD("ld-itemlist", {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": published
        .filter(function (p) { return p.detail_url && !p.demo; })
        .map(function (p, i) {
          return { "@type": "ListItem", "position": i + 1, "name": p.title, "url": hindAbs(p.detail_url) };
        })
    });

    /* Render chips */
    if (filterRow && (data.categories || []).length) {
      var chipsHtml = '<button type="button" class="chip is-active" data-category-chip="all">' + HIND_STR.all + '</button>';
      data.categories.forEach(function (c) {
        chipsHtml += '<button type="button" class="chip" data-category-chip="' + esc(c.id) + '">' + esc(c.name) + '</button>';
      });
      filterRow.innerHTML = chipsHtml;
    }

    /* Apply initial filter from URL */
    var initialCat = new URLSearchParams(location.search).get("category") || "all";
    applyShelfFilter(initialCat);
    document.querySelectorAll("[data-category-chip]").forEach(function (chip) {
      chip.classList.toggle("is-active", chip.getAttribute("data-category-chip") === initialCat);
    });

    /* Wire chip clicks */
    if (filterRow) {
      filterRow.addEventListener("click", function (e) {
        var chip = e.target.closest("[data-category-chip]");
        if (!chip) return;
        var cat = chip.getAttribute("data-category-chip");
        document.querySelectorAll("[data-category-chip]").forEach(function (c) {
          c.classList.toggle("is-active", c === chip);
        });
        var url = new URL(location.href);
        if (cat === "all") url.searchParams.delete("category");
        else url.searchParams.set("category", cat);
        history.replaceState(null, "", url);
        applyShelfFilter(cat);
      });
    }

    function applyShelfFilter(catId) {
      var cards = shelf.querySelectorAll(".card");
      var visible = 0;
      cards.forEach(function (card) {
        var cat = card.getAttribute("data-category");
        var match = (catId === "all" || cat === catId);
        card.classList.toggle("is-hidden", !match);
        if (match) visible++;
      });
      if (emptyMsg) emptyMsg.hidden = visible !== 0;
    }
  }

  function buildCardHTML(p) {
    var photoBox = (p.photo && p.photo.src)
      ? '<figure class="photo">' +
          '<img src="' + esc(hindAsset(p.photo.src)) + '" alt="' + esc(p.photo.alt || p.title) + '" loading="lazy" decoding="async">' +
        '</figure>'
      : '<figure class="photo">' +
          '<div class="photo-soon">' +
            '<svg viewBox="-30 -30 60 60" aria-hidden="true" focusable="false"><polygon points="28,0 10.9,4.5 19.8,19.8 4.5,10.9 0,28 -4.5,10.9 -19.8,19.8 -10.9,4.5 -28,0 -10.9,-4.5 -19.8,-19.8 -4.5,-10.9 0,-28 4.5,-10.9 19.8,-19.8 10.9,-4.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>' +
            '<span>' + HIND_STR.imgSoon + '</span>' +
          '</div>' +
        '</figure>';
    /* a preview piece: no real photo and no page yet - honest "قريباً",
       never an add-to-cart button for something that does not exist. */
    var comingSoon = p.demo || (!p.detail_url && !(p.photo && p.photo.src));
    var photoWrap = p.detail_url
      ? '<a class="card-photo" href="' + esc(p.detail_url) + '" aria-label="' + esc(p.title + ' - ' + HIND_STR.readStory) + '">' + photoBox + '</a>'
      : photoBox;
    var title = p.detail_url
      ? '<h2><a class="card-title-link" href="' + esc(p.detail_url) + '">' + esc(p.title) + '</a></h2>'
      : '<h2>' + esc(p.title) + '</h2>';
    var action, storyLink = "";
    if (comingSoon) {
      action = '<span class="card-soon-tag">' + HIND_STR.soon + '</span>';
    } else if (p.sold) {
      action = '<a class="btn" href="' + esc(p.similar_action_url || "follow.html") + '">' + HIND_STR.soldSimilar + '</a>';
    } else {
      action = '<button class="btn-solid" type="button" data-add="' + esc(p.id) + '">' + HIND_STR.addToCart + '</button>';
      if (p.detail_url) {
        storyLink = '<a class="card-story-link" href="' + esc(p.detail_url) + '">' + HIND_STR.readStory + '</a>';
      }
    }
    return '<article class="card reveal' + (comingSoon ? ' is-soon' : '') + '" data-category="' + esc(p.category_id || "") + '">' +
      photoWrap +
      title +
      (p.card_line ? '<p class="card-line">' + esc(p.card_line) + '</p>' : "") +
      '<p class="price">' + esc(p.price_display) + '</p>' +
      '<div class="card-actions">' + action + '</div>' +
      storyLink +
    '</article>';
  }

  /* =========================================================
     CRM-ready product renderer.
     Runs first on product.html (detects #product-root). Fetches
     products/data/<id>.json (default id = "sadu-pillow"), builds
     the section HTML, and populates the skeleton. All existing
     init below (carousel, compare-stage, cart-add, reveals) then
     runs against the freshly-populated DOM as if it had been
     server-rendered — no re-init dance needed.

     WHEN A REAL CRM SHIPS: change one line inside loadProductData
     to fetch from your API instead of the static JSON file. The
     rendering code does not change; the CRM just needs to return
     the same JSON shape shown in products/data/sadu-pillow.json.
     ========================================================= */
  var productRoot = document.getElementById("product-root");
  if (productRoot) {
    try {
      var params = new URLSearchParams(location.search);
      var pid = (params.get("id") || "sadu-pillow").replace(/[^a-z0-9_-]/gi, "");
      var data = await loadProductData(pid);
      renderProductInto(productRoot, data);
    } catch (err) {
      renderProductError(productRoot, err);
    }
  }

  async function loadProductData(id) {
    /* SWAP HERE FOR CRM: replace this URL with your CRM endpoint. */
    var url = HIND_DATA_DIR + encodeURIComponent(id) + ".json";
    var res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status + " for " + url);
    return res.json();
  }

  function renderProductInto(root, data) {
    if (data && data.meta) {
      if (data.meta.title) document.title = data.meta.title + " - هند";
      if (data.meta.description) {
        var m = document.querySelector('meta[name="description"]');
        if (m) m.setAttribute("content", data.meta.description);
      }
      /* Register into the cart registry so add-to-cart works. */
      if (data.hero) {
        HIND_PRODUCTS[data.meta.id] = {
          name: data.hero.title,
          price: hindPriceNumber(data.hero.price_display),
          currency: hindPriceCurrency(data.hero.price_display),
          img: hindAsset(((data.hero.gallery || [])[0] || {}).src || ""),
          url: location.pathname + location.search
        };
      }
    }

    var parts = [];
    if (data.hero) parts.push(buildHero(data.hero, data.meta));
    parts.push('<div class="frieze" aria-hidden="true"></div>');
    (data.sections || []).forEach(function (sec) {
      var built = buildSection(sec, data.meta);
      if (built) parts.push(built);
    });
    root.innerHTML = parts.join("");
    root.removeAttribute("aria-busy");

    /* --- SEO: Product rich result, straight from the same data --- */
    var h = data.hero || {};
    var meta = data.meta || {};
    var priceNum = hindPriceNumber(h.price_display) || undefined;
    var pageUrl = hindAbs(location.pathname + location.search);
    hindInjectLD("ld-product", {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": h.title || meta.title,
      "description": meta.description || h.lede,
      "image": (h.gallery || []).map(function (g) { return hindAbs(g.src); }),
      "brand": { "@type": "Brand", "name": HIND_SITE.brandAr },
      "url": pageUrl,
      "offers": {
        "@type": "Offer",
        "price": priceNum,
        "priceCurrency": HIND_SITE.currency,
        "availability": "https://schema.org/InStock",
        "url": pageUrl
      }
    });
    hindInjectLD("ld-breadcrumb", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": hindAbs("index.html") },
        { "@type": "ListItem", "position": 2, "name": "القطع", "item": hindAbs("products.html") },
        { "@type": "ListItem", "position": 3, "name": h.title || meta.title, "item": pageUrl }
      ]
    });

    /* Update OG/Twitter so JS-aware crawlers (Google) get per-product
       previews; the static tags remain the fallback for social scrapers. */
    var setMeta = function (sel, val) { var el = document.querySelector(sel); if (el && val) el.setAttribute("content", val); };
    var ogTitle = (h.title || meta.title || "") + " - " + HIND_SITE.brandAr;
    var ogDesc = meta.description || h.lede || "";
    var ogImg = (h.gallery && h.gallery[0]) ? hindAbs(h.gallery[0].src) : "";
    setMeta('meta[property="og:title"]', ogTitle);
    setMeta('meta[name="twitter:title"]', ogTitle);
    setMeta('meta[property="og:description"]', ogDesc);
    setMeta('meta[name="twitter:description"]', ogDesc);
    setMeta('meta[property="og:image"]', ogImg);
    setMeta('meta[name="twitter:image"]', ogImg);
  }

  function renderProductError(root, err) {
    root.innerHTML =
      '<section class="section below-bar centered breathing">' +
        '<div class="section-inner">' +
          '<span class="eyebrow">' + HIND_STR.errEyebrow + '</span>' +
          '<h1>' + HIND_STR.errHeading + '</h1>' +
          '<p class="body-text" style="margin-top:1rem;">' + HIND_STR.errBody + '</p>' +
          '<a class="btn-solid" href="products.html" style="margin-top:1.6rem;">' + HIND_STR.backToPieces + '</a>' +
        '</div>' +
      '</section>';
    root.removeAttribute("aria-busy");
    if (window.console) console.error("[product]", err);
  }

  /* -------- HTML builders (pure functions, escape all interpolated text) -------- */
  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function num(v) { return (v == null || v === "") ? "" : String(parseInt(v, 10) || ""); }
  function attr(name, value) { return value ? ' ' + name + '="' + esc(value) + '"' : ""; }

  function buildHero(h, meta) {
    var gallery = (h.gallery || []).map(function (img, i) {
      var priority = i === 0
        ? ' decoding="async" fetchpriority="high"'
        : ' loading="lazy" decoding="async"';
      return '<img src="' + esc(hindAsset(img.src)) + '" alt="' + esc(img.alt) + '"' +
             attr("width", num(img.width)) + attr("height", num(img.height)) + priority + '>';
    }).join("");
    var features = (h.features || []).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join("");
    var readMore = h.read_story_label
      ? '<p class="buy-secondary"><a class="quiet-link" href="' + esc(h.read_story_anchor || "#story") + '">' + esc(h.read_story_label) + '</a></p>'
      : "";
    var cartId = h.cart_id || meta.id;
    return '' +
      '<section class="section below-bar" aria-label="' + esc(h.title) + '">' +
        '<p class="crumb-row"><a class="crumb" href="products.html">' + HIND_STR.backToPieces + '</a></p>' +
        '<div class="product-top">' +
          '<div class="gallery-carousel reveal" data-carousel>' +
            '<div class="photo carousel-window">' +
              '<div class="carousel-track" tabindex="0" role="group" aria-label="صور القطعة، تنقّل بالأسهم">' +
                (gallery || '<div class="skeleton skeleton-image" aria-hidden="true"></div>') +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="buy-panel reveal d2">' +
            '<span class="eyebrow">' + esc(h.eyebrow) + '</span>' +
            '<h1>' + esc(h.title) + '</h1>' +
            (h.lede ? '<div class="body-text"><p>' + esc(h.lede) + '</p></div>' : "") +
            (features ? '<ul class="buy-meta">' + features + '</ul>' : "") +
            '<div class="buy-row">' +
              '<p class="price">' + esc(h.price_display) + '</p>' +
              '<button class="btn-solid" type="button" data-add="' + esc(cartId) + '">' + HIND_STR.addToCart + '</button>' +
            '</div>' +
            readMore +
            '<p class="demo-hint">' + HIND_STR.demoHint + '</p>' +
          '</div>' +
        '</div>' +
      '</section>';
  }

  function paragraphsHTML(list) {
    return (list || []).map(function (p) {
      var text = typeof p === "string" ? p : (p.text || "");
      var cls = [];
      if (typeof p === "object" && p.kicker) cls.push("kicker");
      if (typeof p === "object" && p.cold) cls.push("kicker-cold");
      return cls.length
        ? '<p class="' + cls.join(" ") + '">' + esc(text) + '</p>'
        : '<p>' + esc(text) + '</p>';
    }).join("");
  }

  function buildSection(sec, meta) {
    if (!sec || !sec.type) return "";
    if (sec.type === "story") return buildStorySection(sec);
    if (sec.type === "artisan") return buildArtisanSection(sec);
    if (sec.type === "compare") return buildCompareSection(sec);
    if (sec.type === "outro") return buildOutroSection(sec, meta);
    return "";
  }

  function buildStorySection(sec) {
    var id = sec.id || "story";
    return '' +
      '<section class="section centered alt-ground" id="' + esc(id) + '" aria-labelledby="h-' + esc(id) + '">' +
        '<div class="section-inner reveal">' +
          '<span class="eyebrow">' + esc(sec.eyebrow) + '</span>' +
          '<h2 id="h-' + esc(id) + '">' + esc(sec.heading) + '</h2>' +
          '<div class="body-text">' + paragraphsHTML(sec.paragraphs) + '</div>' +
        '</div>' +
      '</section>';
  }

  function buildArtisanSection(sec) {
    var id = sec.id || "artisan";
    var photo = sec.photo || {};
    var paras = (sec.paragraphs || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join("");
    return '' +
      '<section class="section" id="' + esc(id) + '" aria-labelledby="h-' + esc(id) + '">' +
        '<div class="split image-first">' +
          '<figure class="photo reveal d2">' +
            '<img src="' + esc(hindAsset(photo.src)) + '" alt="' + esc(photo.alt) + '"' +
              attr("width", num(photo.width)) + attr("height", num(photo.height)) +
              ' loading="lazy" decoding="async">' +
          '</figure>' +
          '<div class="text reveal">' +
            '<span class="eyebrow">' + esc(sec.eyebrow) + '</span>' +
            '<h2 id="h-' + esc(id) + '">' + esc(sec.heading) + '</h2>' +
            '<div class="body-text">' + paras + '</div>' +
            (sec.quote ? '<p class="maker-quote">' + esc(sec.quote) + '</p>' : "") +
          '</div>' +
        '</div>' +
      '</section>';
  }

  function buildCompareSection(sec) {
    var id = sec.id || "room-test";
    var before = sec.before || {};
    var after = sec.after || {};
    var pairsJson = JSON.stringify([[before.src || "", after.src || ""]]);
    return '' +
      '<section class="section centered proof" id="' + esc(id) + '" aria-labelledby="h-' + esc(id) + '">' +
        '<div class="proof-layout">' +
          '<div class="section-inner reveal">' +
            '<span class="eyebrow">' + esc(sec.eyebrow) + '</span>' +
            '<h2 id="h-' + esc(id) + '">' + esc(sec.heading) + '</h2>' +
            '<div class="body-text">' + paragraphsHTML(sec.intro_paragraphs) + '</div>' +
          '</div>' +
          '<figure class="compare reveal d2">' +
            '<div class="compare-stage is-square" id="compare-stage" data-pairs="' + esc(pairsJson) + '">' +
              '<img class="compare-before" src="' + esc(hindAsset(before.src)) + '" alt="' + esc(before.alt) + '"' +
                attr("width", num(before.width)) + attr("height", num(before.height)) +
                ' loading="lazy" decoding="async" draggable="false">' +
              '<div class="compare-topcoat">' +
                '<img class="compare-after" src="' + esc(hindAsset(after.src)) + '" alt="' + esc(after.alt) + '"' +
                  attr("width", num(after.width)) + attr("height", num(after.height)) +
                  ' loading="lazy" decoding="async" draggable="false">' +
              '</div>' +
              (sec.answer ? '<div class="compare-answer" aria-hidden="true"><span>' + esc(sec.answer) + '</span></div>' : "") +
              '<div class="compare-handle" id="compare-handle" role="slider" tabindex="0" ' +
                   'aria-label="مقدار ما عاد إلى الغرفة من روحها العربية" ' +
                   'aria-valuemin="0" aria-valuemax="100" aria-valuenow="12">' +
                '<span class="compare-knob" aria-hidden="true"></span>' +
              '</div>' +
            '</div>' +
            ((sec.caption_hint || sec.caption_payoff) ? '<figcaption class="compare-caption">' +
              (sec.caption_hint ? '<span class="cap-row cap-row-hint"><span class="compare-hint">' + esc(sec.caption_hint) + '</span></span>' : "") +
              ((sec.caption_payoff || sec.caption_emphasis) ? '<span class="cap-row cap-row-payoff"><span class="compare-payoff">' +
                esc(sec.caption_payoff || "") +
                (sec.caption_emphasis ? ' <strong>' + esc(sec.caption_emphasis) + '</strong>' : "") +
              '</span></span>' : "") +
            '</figcaption>' : "") +
          '</figure>' +
        '</div>' +
      '</section>';
  }

  function buildOutroSection(sec, meta) {
    var id = sec.id || "khulasa";
    return '' +
      '<section class="section centered breathing" aria-labelledby="h-' + esc(id) + '">' +
        '<div class="section-inner reveal">' +
          '<span class="eyebrow">' + esc(sec.eyebrow) + '</span>' +
          '<h2 id="h-' + esc(id) + '">' + esc(sec.heading) + '</h2>' +
          '<div class="body-text">' + paragraphsHTML(sec.paragraphs) + '</div>' +
          '<div class="buy-actions" style="justify-content:center; margin-top:1.6rem;">' +
            '<button class="btn-solid" type="button" data-add="' + esc(meta.id) + '">' + HIND_STR.addToCart + '</button>' +
            '<a class="btn" href="products.html">' + HIND_STR.backToPieces + '</a>' +
          '</div>' +
        '</div>' +
      '</section>';
  }

  /* ==================== end product renderer ==================== */

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var revealed = document.querySelectorAll(".reveal");
  if (!reduced && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealed.forEach(function (el) { io.observe(el); });
  } else {
    revealed.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* fade the cut edge of the tab row only when it actually overflows */
  var tabRow = document.querySelector(".topbar .tabs");
  if (tabRow) {
    var checkClip = function () {
      tabRow.classList.toggle("is-clipped", tabRow.scrollWidth > tabRow.clientWidth + 4);
    };
    checkClip();
    window.addEventListener("resize", checkClip);
  }

  /* Product photos: one framed window, swipe through like a story.
     The track scroll-snaps natively; JS only adds dots and arrows. */
  document.querySelectorAll("[data-carousel]").forEach(function (root) {
    var track = root.querySelector(".carousel-track");
    if (!track) return;
    var slides = Array.prototype.slice.call(track.children);
    if (slides.length < 2) return;
    var frame = root.querySelector(".carousel-window") || root;

    /* RTL: the previous photo lives toward the right edge, so each
       arrow points at the edge it sits on */
    var chevRight = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M6 3 L11 8 L6 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var chevLeft = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M10 3 L5 8 L10 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "carousel-arrow carousel-arrow-prev";
    prevBtn.setAttribute("aria-label", "الصورة السابقة");
    prevBtn.innerHTML = chevRight;
    var nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "carousel-arrow carousel-arrow-next";
    nextBtn.setAttribute("aria-label", "الصورة التالية");
    nextBtn.innerHTML = chevLeft;
    frame.appendChild(prevBtn);
    frame.appendChild(nextBtn);

    var dots = document.createElement("div");
    dots.className = "carousel-dots";
    slides.forEach(function (_, i) {
      var d = document.createElement("button");
      d.type = "button";
      d.setAttribute("aria-label", "الصورة " + (i + 1) + " من " + slides.length);
      dots.appendChild(d);
    });
    root.appendChild(dots);
    var dotEls = Array.prototype.slice.call(dots.children);

    var index = 0;
    var paint = function () {
      dotEls.forEach(function (d, i) {
        if (i === index) d.setAttribute("aria-current", "true");
        else d.removeAttribute("aria-current");
      });
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === slides.length - 1;
    };
    /* scrollIntoView is RTL-safe; raw scrollLeft math is not */
    var goTo = function (i) {
      i = Math.max(0, Math.min(i, slides.length - 1));
      slides[i].scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest", inline: "start" });
    };
    prevBtn.addEventListener("click", function () { goTo(index - 1); });
    nextBtn.addEventListener("click", function () { goTo(index + 1); });
    dotEls.forEach(function (d, i) {
      d.addEventListener("click", function () { goTo(i); });
    });

    /* the slide in view is a plain function of scroll position; each
       slide is exactly one track-width wide (abs: RTL scrollLeft is
       negative in modern browsers) */
    var scrollTick = false;
    track.addEventListener("scroll", function () {
      if (scrollTick) return;
      scrollTick = true;
      requestAnimationFrame(function () {
        scrollTick = false;
        var i = Math.round(Math.abs(track.scrollLeft) / track.clientWidth);
        i = Math.max(0, Math.min(i, slides.length - 1));
        if (i !== index) { index = i; paint(); }
      });
    }, { passive: true });

    /* keyboard on the frame: in RTL the left arrow moves forward */
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index + 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); goTo(index - 1); }
    });

    paint();
  });

  /* Door pages: markup carries relative defaults; config overrides them */
  document.querySelectorAll("[data-door]").forEach(function (el) {
    var key = el.getAttribute("data-door");
    if (HIND_CONFIG[key]) el.href = HIND_CONFIG[key];
  });

  /* Social links: real when configured, honestly disabled when not */
  document.querySelectorAll("[data-social]").forEach(function (el) {
    if (HIND_CONFIG.socialUrl) {
      el.href = HIND_CONFIG.socialUrl;
      el.target = "_blank";
      el.rel = "noopener";
    } else {
      if (!el.classList.contains("door-title") && !el.classList.contains("quiet")) {
        var soon = document.createElement("span");
        soon.className = "soon";
        soon.textContent = HIND_STR.offSoon;
        el.appendChild(soon);
      }
      el.removeAttribute("href");
      el.setAttribute("aria-disabled", "true");
      el.style.cursor = "default";
      el.style.opacity = "0.65";
    }
  });

  /* Notify form: endpoint -> POST; email -> mailto; neither -> honest message */
  var form = document.getElementById("notify-form");
  if (form) {
    var msg = document.getElementById("notify-msg");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("notify-email").value.trim();
      if (!email || email.indexOf("@") < 1) {
        msg.textContent = HIND_STR.notifyBadEmail;
        return;
      }
      if (HIND_CONFIG.notifyEndpoint) {
        var btn = form.querySelector("button");
        btn.disabled = true;
        fetch(HIND_CONFIG.notifyEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ email: email })
        }).then(function (r) {
          msg.textContent = r.ok ? HIND_STR.notifyOk : HIND_STR.notifyFail;
          btn.disabled = false;
          if (r.ok) form.reset();
        }).catch(function () {
          msg.textContent = HIND_STR.notifyFail;
          btn.disabled = false;
        });
      } else if (HIND_CONFIG.contactEmail) {
        location.href = "mailto:" + HIND_CONFIG.contactEmail +
          "?subject=" + encodeURIComponent(HIND_STR.mailSubject) +
          "&body=" + encodeURIComponent(HIND_STR.mailBody + email);
      } else {
        msg.textContent = HIND_STR.notifySoon;
      }
    });
  }

  /* البرهان: drag the golden thread and the Arab room floods back in.
     cut = seam position as % from the left edge; reveal = 100 - cut. */
  var stage = document.getElementById("compare-stage");
  if (stage) {
    var proofSection = document.getElementById("room-test");
    var handle = document.getElementById("compare-handle");
    var beforeImg = stage.querySelector(".compare-before");
    var afterImg = stage.querySelector(".compare-after");
    var switchBtn = document.getElementById("compare-switch");
    /* image pairs come from the page (data-pairs JSON on the stage);
       the homepage rooms remain the default */
    var pairs = null;
    try { pairs = JSON.parse(stage.getAttribute("data-pairs") || "null"); } catch (err) { pairs = null; }
    if (!pairs || !pairs.length) {
      pairs = [
        ["Images/room-before-1.jpg", "Images/room-after-1.jpg"],
        ["Images/room-before-2.jpg", "Images/room-after-2.jpg"]
      ];
    }
    /* resolve every room pair for the current language (../ from /en/) */
    pairs = pairs.map(function (pr) { return pr.map(hindAsset); });
    var pairIndex = 0;
    var cut = 88;
    var warmed = false;
    var nudgeTimers = [];

    /* warm when the Arab room crosses the middle, cool again when it is
       pulled back out; the 45/58 gap keeps it from flickering at the seam */
    var applyCut = function (v) {
      cut = Math.min(Math.max(v, 0), 100);
      stage.style.setProperty("--cut", cut + "%");
      if (handle) handle.setAttribute("aria-valuenow", Math.round(100 - cut));
      if (!proofSection) return;
      if (!warmed && cut <= 45) {
        warmed = true;
        proofSection.classList.add("is-warm");
      } else if (warmed && cut >= 58) {
        warmed = false;
        proofSection.classList.remove("is-warm");
      }
    };
    applyCut(cut);

    var cancelNudge = function () {
      nudgeTimers.forEach(clearTimeout);
      nudgeTimers = [];
      stage.classList.remove("is-anim");
    };

    /* one gentle nudge when the stage first enters view: teach the gesture */
    if (!reduced && "IntersectionObserver" in window) {
      var proofIo = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          proofIo.unobserve(stage);
          stage.classList.add("is-anim");
          applyCut(72);
          nudgeTimers.push(setTimeout(function () { applyCut(88); }, 900));
          nudgeTimers.push(setTimeout(function () { stage.classList.remove("is-anim"); }, 1700));
        }
      }, { threshold: 0.6 });
      proofIo.observe(stage);
    }

    var dragging = false;     /* the seam is following the pointer */
    var pending = false;      /* a finger is down, the axis is not decided yet */
    var startX = 0, startY = 0;
    var AXIS_SLOP = 6;        /* px of travel before we call the gesture */
    var preloaded = false;
    var touchOf = function (e) {
      if (e.touches && e.touches.length) return e.touches[0];
      if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0];
      return null;
    };
    var clientXOf = function (e) { var t = touchOf(e); return t ? t.clientX : e.clientX; };
    var clientYOf = function (e) { var t = touchOf(e); return t ? t.clientY : e.clientY; };
    var cutFromEvent = function (e) {
      var x = clientXOf(e);
      if (typeof x !== "number") return;
      var r = stage.getBoundingClientRect();
      if (!r.width) return;
      applyCut(((x - r.left) / r.width) * 100);
    };

    /* the two rooms are plain <img>: without this the browser starts its own
       image drag on mousedown and swallows the whole gesture. CSS
       -webkit-user-drag covers Chrome and Safari only, so cancel the drag
       event too - that is what Firefox listens to. */
    stage.addEventListener("dragstart", function (e) { e.preventDefault(); });

    var capture = function (e) {
      if (e.pointerId != null && stage.setPointerCapture) {
        try { stage.setPointerCapture(e.pointerId); } catch (err) { /* capture is a nicety */ }
      }
    };
    var beginDrag = function () {
      dragging = true;
      pending = false;
      cancelNudge();
      if (!preloaded) {
        preloaded = true;
        if (pairs[1]) pairs[1].forEach(function (src) { new Image().src = src; });
      }
    };
    var startDrag = function (e) {
      if (e.button != null && e.button !== 0) return;   /* left button only */
      startX = clientXOf(e);
      startY = clientYOf(e);
      var onKnob = e.target && e.target.closest && e.target.closest(".compare-handle");
      var byFinger = e.pointerType === "touch" || e.type === "touchstart";
      /* a finger landing on the room is more often the start of a scroll than
         a drag, so hold off until the first move says which one it is. the
         knob is unambiguous - it grabs straight away. */
      if (byFinger && !onKnob) { pending = true; return; }
      capture(e);
      beginDrag();
      cutFromEvent(e);
      /* stops text selection and the native image drag before they begin */
      if (e.cancelable) e.preventDefault();
    };
    var moveDrag = function (e) {
      if (pending) {
        var dx = Math.abs(clientXOf(e) - startX);
        var dy = Math.abs(clientYOf(e) - startY);
        if (dx < AXIS_SLOP && dy < AXIS_SLOP) return;
        pending = false;
        if (dy > dx) return;                /* the finger is scrolling the page */
        capture(e);
        beginDrag();
      }
      if (!dragging) return;
      cutFromEvent(e);
      if (e.cancelable && e.type === "touchmove") e.preventDefault();
    };
    var endDrag = function () { dragging = false; pending = false; };

    /* move and release are bound to the window, not the stage: if pointer
       capture is refused or revoked mid-gesture (browser claims the drag,
       finger leaves the frame) the seam still follows the pointer. */
    stage.addEventListener("pointerdown", startDrag);
    window.addEventListener("pointermove", moveDrag);
    ["pointerup", "pointercancel"].forEach(function (type) {
      window.addEventListener(type, endDrag);
    });

    /* browsers without Pointer Events (older iOS Safari) get the same
       gesture through mouse and touch */
    if (!window.PointerEvent) {
      stage.addEventListener("mousedown", startDrag);
      window.addEventListener("mousemove", moveDrag);
      window.addEventListener("mouseup", endDrag);
      stage.addEventListener("touchstart", startDrag, { passive: false });
      window.addEventListener("touchmove", moveDrag, { passive: false });
      ["touchend", "touchcancel"].forEach(function (type) {
        window.addEventListener(type, endDrag);
      });
    }

    /* keyboard: in RTL, the left arrow moves the story forward */
    if (handle) {
      handle.addEventListener("keydown", function (e) {
        var step = 6;
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); cancelNudge(); applyCut(cut - step); }
        else if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); cancelNudge(); applyCut(cut + step); }
        else if (e.key === "Home") { e.preventDefault(); cancelNudge(); applyCut(100); }
        else if (e.key === "End") { e.preventDefault(); cancelNudge(); applyCut(0); }
      });
    }

    if (switchBtn && beforeImg && afterImg) {
      switchBtn.addEventListener("click", function () {
        pairIndex = 1 - pairIndex;
        beforeImg.src = pairs[pairIndex][0];
        afterImg.src = pairs[pairIndex][1];
        switchBtn.textContent = pairIndex === 0 ? HIND_STR.roomOther : HIND_STR.roomFirst;
      });
    }
  }

  /* ما نقدّمه: a small mosaic toy. Hover, tap, or drag paints the
     stars in the star-grid colors; each fades back on its own. Purely
     decorative - nothing on the page depends on it. */
  var mosaicWrap = document.getElementById("mosaic-play");
  var mosaicBand = document.getElementById("mosaic-band");
  if (mosaicWrap && mosaicBand) (function () {
    var COLORS = ["#B08D57", "#A2573C", "#2B5E54", "#2C4E6E"];
    var TILES = 32;
    var html = "";
    for (var i = 0; i < TILES; i++) {
      html += '<div class="tile"><svg viewBox="-30 -30 60 60" aria-hidden="true" focusable="false"><use href="#khatam-fass" transform="scale(0.92)"/></svg></div>';
    }
    mosaicBand.innerHTML = html;
    mosaicWrap.hidden = false;
    var ci = 0;
    var light = function (el) {
      var tile = el && el.closest ? el.closest(".tile") : null;
      if (!tile || tile.classList.contains("lit")) return;
      ci = (ci + 1) % COLORS.length;
      tile.style.setProperty("--c", COLORS[ci]);
      tile.classList.add("lit");
      setTimeout(function () { tile.classList.remove("lit"); }, 900);
    };
    mosaicBand.addEventListener("pointermove", function (e) { light(e.target); }, { passive: true });
    mosaicBand.addEventListener("pointerdown", function (e) { light(e.target); }, { passive: true });

    /* one quick wave across the band when it first appears: show, don't tell */
    if (!reduced && "IntersectionObserver" in window) {
      var mosaicIo = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        mosaicIo.disconnect();
        var tiles = mosaicBand.querySelectorAll(".tile");
        var start = Math.max(0, Math.floor(tiles.length / 2) - 4);
        for (var n = 0; n < 7 && start + n < tiles.length; n++) {
          (function (tile, delay) {
            setTimeout(function () { light(tile); }, delay);
          })(tiles[start + n], 350 + n * 90);
        }
      }, { threshold: 0.4 });
      mosaicIo.observe(mosaicBand);
    }
  })();

  /* The golden thread grows as the reader moves through the page */
  var thread = document.getElementById("thread");
  if (thread) {
    var ticking = false;
    var spin = function () {
      ticking = false;
      var d = document.documentElement;
      var p = d.scrollTop / (d.scrollHeight - d.clientHeight);
      thread.style.transform = "scaleX(" + Math.min(Math.max(p, 0), 1) + ")";
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(spin); }
    }, { passive: true });
    spin();
  }

  /* تابعونا: one link per network; honestly disabled until configured */
  document.querySelectorAll("[data-follow]").forEach(function (el) {
    var key = el.getAttribute("data-follow");
    var url = HIND_CONFIG[key] || HIND_CONFIG.socialUrl;
    if (url) {
      el.href = url;
      el.target = "_blank";
      el.rel = "noopener";
    } else {
      var soon = document.createElement("span");
      soon.className = "soon";
      soon.textContent = HIND_STR.offSoon;
      el.appendChild(soon);
      el.removeAttribute("href");
      el.setAttribute("aria-disabled", "true");
      el.classList.add("is-off");
    }
  });
})();

/* ============ المتجر التجريبي ============
   A real store in every way but one: no payments and no shipping yet.
   The cart lives in localStorage; the drawer is built here, so every
   page that loads site.js gets it for free. */
(function () {
  var KEY = "hind-cart-v1";

  function readCart() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (err) { return {}; }
  }
  function writeCart(cart) {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (err) {}
  }
  function count(cart) {
    var n = 0;
    Object.keys(cart).forEach(function (id) { n += cart[id]; });
    return n;
  }
  function total(cart) {
    var t = 0;
    Object.keys(cart).forEach(function (id) {
      if (HIND_PRODUCTS[id]) t += HIND_PRODUCTS[id].price * cart[id];
    });
    return t;
  }
  function num(n) { return n.toLocaleString(HIND_LANG === "en" ? "en-US" : "ar-EG"); }

  /* ---- the drawer, built once per page ---- */
  var layer = document.createElement("div");
  layer.className = "cart-layer";
  layer.id = "cart-layer";
  layer.hidden = true;
  layer.innerHTML =
    '<div class="cart-backdrop" data-cart-close></div>' +
    '<aside class="cart-drawer" role="dialog" aria-modal="true" aria-label="' + HIND_STR.ariaCart + '">' +
      '<header class="cart-head">' +
        '<h2>' + HIND_STR.cartTitle + '</h2>' +
        '<button class="cart-close" type="button" data-cart-close aria-label="' + HIND_STR.cartClose + '">&#215;</button>' +
      '</header>' +
      '<p class="cart-demo">' + HIND_STR.cartDemo + '</p>' +
      '<div class="cart-body" id="cart-body"></div>' +
      '<footer class="cart-foot" id="cart-foot"></footer>' +
    '</aside>';
  document.body.appendChild(layer);

  var bodyEl = layer.querySelector("#cart-body");
  var footEl = layer.querySelector("#cart-foot");
  var lastFocus = null;
  var confirmed = false;   /* success view stays up until the drawer closes */
  var inerted = [];        /* page regions disabled while the drawer is open */

  /* while the drawer is open the rest of the page is inert, so Tab
     stays inside the dialog and screen readers see only the cart */
  function setInert(on) {
    if (on) {
      inerted = [];
      Array.prototype.forEach.call(document.body.children, function (el) {
        if (el !== layer && el.tagName !== "SCRIPT" && !el.inert) {
          el.inert = true;
          inerted.push(el);
        }
      });
    } else {
      inerted.forEach(function (el) { el.inert = false; });
      inerted = [];
    }
  }

  function render() {
    var cart = readCart();
    var n = count(cart);

    document.querySelectorAll(".cart-count").forEach(function (b) {
      b.textContent = num(n);
      b.hidden = n === 0;
    });

    if (confirmed) return;

    if (n === 0) {
      bodyEl.innerHTML =
        '<p class="cart-empty">' + HIND_STR.cartEmpty + '</p>' +
        '<a class="btn" href="products.html">' + HIND_STR.browsePieces + '</a>';
      footEl.innerHTML = "";
      return;
    }

    var html = "";
    Object.keys(cart).forEach(function (id) {
      var p = HIND_PRODUCTS[id];
      if (!p) return;
      /* preview pieces have no photo and no page yet */
      var thumb = p.img
        ? '<a class="cart-item-img" href="' + p.url + '" tabindex="-1" aria-hidden="true"><img src="' + p.img + '" alt=""></a>'
        : '<span class="cart-item-img is-empty" aria-hidden="true"><svg viewBox="-30 -30 60 60" focusable="false"><polygon points="28,0 10.9,4.5 19.8,19.8 4.5,10.9 0,28 -4.5,10.9 -19.8,19.8 -10.9,4.5 -28,0 -10.9,-4.5 -19.8,-19.8 -4.5,-10.9 0,-28 4.5,-10.9 19.8,-19.8 10.9,-4.5" fill="none" stroke="currentColor" stroke-width="2.2"/></svg></span>';
      var nameEl = p.url
        ? '<a class="cart-item-name" href="' + p.url + '">' + p.name + '</a>'
        : '<span class="cart-item-name">' + p.name + '</span>';
      html +=
        '<div class="cart-item" data-id="' + id + '">' +
          thumb +
          '<div class="cart-item-info">' +
            nameEl +
            '<span class="cart-item-price">' + num(p.price) + ' ' + p.currency + '</span>' +
            '<div class="cart-qty">' +
              '<button type="button" data-qty="-1" aria-label="' + HIND_STR.qtyLess + '">&#8722;</button>' +
              '<span aria-label="' + HIND_STR.qtyLabel + '">' + num(cart[id]) + '</span>' +
              '<button type="button" data-qty="1" aria-label="' + HIND_STR.qtyMore + '">+</button>' +
              '<button type="button" class="cart-remove" data-remove>' + HIND_STR.remove + '</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    });
    bodyEl.innerHTML = html;
    footEl.innerHTML =
      '<div class="cart-total"><span>' + HIND_STR.totalLabel + '</span><strong>' + num(total(cart)) + ' ' + HIND_STR.currencyLabel + '</strong></div>' +
      '<button type="button" class="btn-solid cart-confirm" data-confirm>' + HIND_STR.confirmOrder + '</button>';
  }

  function open() {
    lastFocus = document.activeElement;
    confirmed = false;
    render();
    layer.hidden = false;
    setInert(true);
    requestAnimationFrame(function () { layer.classList.add("is-open"); });
    document.body.classList.add("cart-locked");
    var closeBtn = layer.querySelector(".cart-close");
    if (closeBtn) closeBtn.focus();
  }
  function close() {
    layer.classList.remove("is-open");
    document.body.classList.remove("cart-locked");
    confirmed = false;
    setInert(false);
    setTimeout(function () { layer.hidden = true; render(); }, 350);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.querySelectorAll("[data-cart-open]").forEach(function (btn) {
    btn.addEventListener("click", open);
  });

  document.querySelectorAll("[data-add]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-add");
      if (!HIND_PRODUCTS[id]) return;
      var cart = readCart();
      cart[id] = (cart[id] || 0) + 1;
      writeCart(cart);
      open();
    });
  });

  layer.addEventListener("click", function (e) {
    var t = e.target;
    if (t.closest("[data-cart-close]")) { close(); return; }

    var qtyBtn = t.closest("[data-qty]");
    if (qtyBtn) {
      var cart = readCart();
      var id = qtyBtn.closest(".cart-item").getAttribute("data-id");
      cart[id] = (cart[id] || 0) + parseInt(qtyBtn.getAttribute("data-qty"), 10);
      if (cart[id] <= 0) delete cart[id];
      writeCart(cart);
      render();
      return;
    }
    if (t.closest("[data-remove]")) {
      var cart2 = readCart();
      delete cart2[t.closest(".cart-item").getAttribute("data-id")];
      writeCart(cart2);
      render();
      return;
    }
    if (t.closest("[data-confirm]")) {
      writeCart({});
      confirmed = true;
      bodyEl.innerHTML =
        '<div class="cart-done">' +
          '<p class="cart-done-lead">' + HIND_STR.orderDoneLead + '</p>' +
          '<p>' + HIND_STR.orderDoneBody + '</p>' +
        '</div>';
      footEl.innerHTML = "";
      render();   /* refresh the badges: the cart just emptied */
      return;
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !layer.hidden) close();
  });

  render();
})();

/* Prefetch destination pages on first hover / focus / touchstart so any
   internal navigation feels instant. Runs once per URL, only over http(s),
   and only for links that point at another page on this site (skips
   anchors, mailto, tel, external). */
(function () {
  if (location.protocol === "file:") return;
  var prefetched = {};
  function prefetch(url) {
    if (!url || prefetched[url]) return;
    prefetched[url] = true;
    var l = document.createElement("link");
    l.rel = "prefetch";
    l.href = url;
    document.head.appendChild(l);
  }
  var links = document.querySelectorAll('a[href$=".html"], a[href*=".html#"]');
  links.forEach(function (a) {
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#") return;
    var target = href.split("#")[0];
    if (!target) return;
    var arm = function () { prefetch(target); };
    a.addEventListener("pointerenter", arm, { once: true, passive: true });
    a.addEventListener("focus", arm, { once: true });
    a.addEventListener("touchstart", arm, { once: true, passive: true });
  });
})();

/* ============ SEO: site-wide structured data + absolute URLs ============
   Runs on every page. Organization + WebSite JSON-LD help search engines
   understand the brand; the canonical/OG absolutiser rewrites placeholder
   URLs to your real origin once HIND_SITE.origin is set. Social scrapers
   do not run JS, so the static <head> tags carry real absolute URLs at
   launch via the find-and-replace of "hind.example". */
(function () {
  var sameAs = [];
  if (typeof HIND_CONFIG === "object") {
    [HIND_CONFIG.instagramUrl, HIND_CONFIG.youtubeUrl, HIND_CONFIG.socialUrl].forEach(function (u) {
      if (u && sameAs.indexOf(u) < 0) sameAs.push(u);
    });
  }
  var descEl = document.querySelector('meta[name="description"]');
  hindInjectLD("ld-org", {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": HIND_SITE.brandAr,
    "alternateName": HIND_SITE.brandEn,
    "description": descEl ? descEl.getAttribute("content") : undefined,
    "url": HIND_SITE.origin || location.origin,
    "logo": hindAbs("Images/site/icon-512.png"),
    "image": hindAbs("Images/site/og-image.png"),
    "areaServed": { "@type": "Country", "name": "Jordan" },
    "sameAs": sameAs.length ? sameAs : undefined
  });
  hindInjectLD("ld-website", {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": HIND_SITE.brandAr,
    "url": HIND_SITE.origin || location.origin,
    "inLanguage": document.documentElement.lang || "ar"
  });

  /* Absolutise canonical + OG/Twitter only when an origin is configured. */
  if (HIND_SITE.origin) {
    var path = location.pathname.replace(/^\//, "") + location.search;
    var rebase = function (val) {
      if (!val) return val;
      return hindAbs(val.replace(/^https?:\/\/[^/]+\//i, ""));
    };
    var canon = document.querySelector('link[rel="canonical"]');
    if (canon) canon.setAttribute("href", hindAbs(path || "index.html"));
    var ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", hindAbs(path || "index.html"));
    ['meta[property="og:image"]', 'meta[name="twitter:image"]'].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) el.setAttribute("content", rebase(el.getAttribute("content")));
    });
  }
})();

/* ============ Language switch (AR <-> EN) ============
   One link, computed from the current page, injected into the top bar so
   every page gets it without hand-editing each nav. The <head> hreflang
   tags carry the same pairing for search engines regardless of JS. */
(function () {
  var bar = document.querySelector(".topbar");
  if (!bar) return;
  var file = location.pathname.split("/").pop() || "index.html";
  var toEn = HIND_LANG !== "en";
  var a = document.createElement("a");
  a.className = "lang-switch";
  a.href = (toEn ? "en/" : "../") + file + location.search;
  a.textContent = toEn ? "EN" : "ع";
  a.setAttribute("aria-label", toEn ? "English version of this page" : "النسخة العربية من الصفحة");
  a.setAttribute("lang", toEn ? "en" : "ar");
  var cart = bar.querySelector(".cart-btn");
  if (cart) bar.insertBefore(a, cart); else bar.appendChild(a);
})();
