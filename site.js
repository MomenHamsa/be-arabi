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
    url: "pillow.html"
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

/* Gentle scroll reveals + top bar fade + actions. */
(function () {
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
        soon.textContent = "قريباً";
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
        msg.textContent = "اكتب بريداً إلكترونياً صحيحاً من فضلك.";
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
          msg.textContent = r.ok ? "وصلنا بريدك. سنراسلك أوّل ما نفتح." : "تعذّر التسجيل الآن. حاول مرة أخرى.";
          btn.disabled = false;
          if (r.ok) form.reset();
        }).catch(function () {
          msg.textContent = "تعذّر التسجيل الآن. حاول مرة أخرى.";
          btn.disabled = false;
        });
      } else if (HIND_CONFIG.contactEmail) {
        location.href = "mailto:" + HIND_CONFIG.contactEmail +
          "?subject=" + encodeURIComponent("أريد أن أعرف أولاً") +
          "&body=" + encodeURIComponent("بريدي: " + email);
      } else {
        msg.textContent = "التسجيل يُفتح قريباً. احفظ الصفحة وعُد إلينا.";
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
    var pairIndex = 0;
    var cut = 88;
    var warmed = false;
    var nudgeTimers = [];

    /* warm when the Arab room crosses the middle, cool again when it is
       pulled back out; the 45/58 gap keeps it from flickering at the seam */
    var applyCut = function (v) {
      cut = Math.min(Math.max(v, 0), 100);
      stage.style.setProperty("--cut", cut + "%");
      handle.setAttribute("aria-valuenow", Math.round(100 - cut));
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

    var dragging = false;
    var preloaded = false;
    var cutFromEvent = function (e) {
      var r = stage.getBoundingClientRect();
      applyCut(((e.clientX - r.left) / r.width) * 100);
    };
    stage.addEventListener("pointerdown", function (e) {
      dragging = true;
      cancelNudge();
      if (!preloaded) {
        preloaded = true;
        if (pairs[1]) pairs[1].forEach(function (src) { new Image().src = src; });
      }
      if (stage.setPointerCapture) stage.setPointerCapture(e.pointerId);
      cutFromEvent(e);
    });
    stage.addEventListener("pointermove", function (e) {
      if (dragging) cutFromEvent(e);
    });
    ["pointerup", "pointercancel"].forEach(function (type) {
      stage.addEventListener(type, function () { dragging = false; });
    });

    /* keyboard: in RTL, the left arrow moves the story forward */
    handle.addEventListener("keydown", function (e) {
      var step = 6;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); cancelNudge(); applyCut(cut - step); }
      else if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); cancelNudge(); applyCut(cut + step); }
      else if (e.key === "Home") { e.preventDefault(); cancelNudge(); applyCut(100); }
      else if (e.key === "End") { e.preventDefault(); cancelNudge(); applyCut(0); }
    });

    if (switchBtn) {
      switchBtn.addEventListener("click", function () {
        pairIndex = 1 - pairIndex;
        beforeImg.src = pairs[pairIndex][0];
        afterImg.src = pairs[pairIndex][1];
        switchBtn.textContent = pairIndex === 0 ? "جرّب غرفةً أخرى" : "عُد إلى الغرفة الأولى";
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
      soon.textContent = "قريباً";
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
  function num(n) { return n.toLocaleString("ar-EG"); }

  /* ---- the drawer, built once per page ---- */
  var layer = document.createElement("div");
  layer.className = "cart-layer";
  layer.id = "cart-layer";
  layer.hidden = true;
  layer.innerHTML =
    '<div class="cart-backdrop" data-cart-close></div>' +
    '<aside class="cart-drawer" role="dialog" aria-modal="true" aria-label="سلة المشتريات">' +
      '<header class="cart-head">' +
        '<h2>سلّتك</h2>' +
        '<button class="cart-close" type="button" data-cart-close aria-label="أغلق السلة">&#215;</button>' +
      '</header>' +
      '<p class="cart-demo">متجر تجريبي - نستقبل الطلبات، ولا نأخذ مالاً ولا نشحن بعد.</p>' +
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
        '<p class="cart-empty">سلّتك فارغة.</p>' +
        '<a class="btn" href="products.html">تفرّج على القطع</a>';
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
              '<button type="button" data-qty="-1" aria-label="أنقص واحدة">&#8722;</button>' +
              '<span aria-label="الكمية">' + num(cart[id]) + '</span>' +
              '<button type="button" data-qty="1" aria-label="زد واحدة">+</button>' +
              '<button type="button" class="cart-remove" data-remove>إزالة</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    });
    bodyEl.innerHTML = html;
    footEl.innerHTML =
      '<div class="cart-total"><span>المجموع</span><strong>' + num(total(cart)) + ' د.أ</strong></div>' +
      '<button type="button" class="btn-solid cart-confirm" data-confirm>أكّد الطلب</button>';
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
          '<p class="cart-done-lead">وصلنا طلبك.</p>' +
          '<p>هذا متجر تجريبي: لا مال يُدفع ولا قطعة تُشحن بعد. حين نفتح الأبواب فعلياً، ستكون هذه القطع أوّل ما يصل.</p>' +
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
