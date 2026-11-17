/* ==========================================================================
   西玛电机 v4.0 交互层 —— 原生 JS，零依赖
   模块：Hero轮播 / 移动抽屉 / 搜索 / 滚动揭示 / 吸顶 / 回顶 / 懒加载
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* ---------- 1. Hero 轮播 ---------- */
  function initHero() {
    var root = $('.xm-hero');
    if (!root) return;
    var slides = $$('.xm-hero__slide', root);
    if (slides.length < 1) return;

    var dotsBox = $('.xm-hero__dots', root);
    var dots = [];
    var idx = 0;
    var timer = null;
    var DELAY = 5200;

    // 生成指示点
    if (dotsBox && slides.length > 1) {
      slides.forEach(function (_, i) {
        var b = doc.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', '第 ' + (i + 1) + ' 张');
        if (i === 0) b.className = 'is-active';
        b.addEventListener('click', function () { go(i); });
        dotsBox.appendChild(b);
        dots.push(b);
      });
    }

    function go(n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); });
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
      restart();
    }
    function next() { go(idx + 1); }
    function restart() {
      if (slides.length < 2) return;
      clearInterval(timer);
      timer = setInterval(next, DELAY);
    }

    slides[0].classList.add('is-active');
    restart();

    // 悬停暂停
    root.addEventListener('mouseenter', function () { clearInterval(timer); });
    root.addEventListener('mouseleave', restart);

    // 移动端手势
    var sx = 0, sy = 0;
    root.addEventListener('touchstart', function (e) {
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    root.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      var dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy)) go(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ---------- 2. 移动端抽屉 ---------- */
  function initDrawer() {
    var burger = $('.xm-burger');
    var drawer = $('.xm-drawer');
    var mask = $('.xm-mask');
    if (!burger || !drawer || !mask) return;

    function open() {
      drawer.classList.add('is-open');
      mask.classList.add('is-open');
      burger.classList.add('is-open');
      doc.body.style.overflow = 'hidden';
      burger.setAttribute('aria-expanded', 'true');
    }
    function close() {
      drawer.classList.remove('is-open');
      mask.classList.remove('is-open');
      burger.classList.remove('is-open');
      doc.body.style.overflow = '';
      burger.setAttribute('aria-expanded', 'false');
      $$('.xm-sub.is-open', drawer).forEach(function (s) { s.classList.remove('is-open'); });
    }

    burger.addEventListener('click', function () {
      drawer.classList.contains('is-open') ? close() : open();
    });
    mask.addEventListener('click', close);
    var closeBtn = $('.xm-drawer__close', drawer);
    if (closeBtn) closeBtn.addEventListener('click', close);

    // 二级菜单展开
    $$('.xm-has-sub > a', drawer).forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var sub = a.nextElementSibling;
        if (sub && sub.classList.contains('xm-sub')) sub.classList.toggle('is-open');
      });
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* ---------- 3. 搜索面板 ---------- */
  function initSearch() {
    var box = $('.xm-search');
    if (!box) return;
    var btn = $('.xm-search__btn', box);
    if (!btn) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      box.classList.toggle('is-open');
      if (box.classList.contains('is-open')) {
        var input = $('.xm-search__form input', box);
        if (input) input.focus();
      }
    });
    doc.addEventListener('click', function (e) {
      if (!box.contains(e.target)) box.classList.remove('is-open');
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') box.classList.remove('is-open');
    });
  }

  /* ---------- 4. 滚动揭示 ---------- */
  function initReveal() {
    var items = $$('.xm-reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
          setTimeout(function () { el.classList.add('is-in'); }, delay);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 5. 吸顶 + 回顶 ---------- */
  function initScroll() {
    var header = $('.xm-header');
    var toTop = $('.xm-float .to-top');
    var ticking = false;

    function onScroll() {
      var y = window.pageYOffset || doc.documentElement.scrollTop;
      if (header) header.classList.toggle('is-stuck', y > 10);
      if (toTop) toTop.classList.toggle('is-show', y > 420);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
    onScroll();

    if (toTop) {
      toTop.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  /* ---------- 6. 图片懒加载兜底 ---------- */
  function initLazy() {
    var imgs = $$('img[loading="lazy"]');
    if (!imgs.length || !('IntersectionObserver' in window)) return;
    imgs.forEach(function (img) {
      if (img.dataset.src) img.src = img.dataset.src;
    });
  }

  /* ---------- 7. 外链与表单安全 ---------- */

  function initGallery() {
    var main = $('#xmMainImg');
    var box = $('#xmGallery');
    if (!main || !box) return;
    $$('.xm-gallery__thumbs button', box).forEach(function (b) {
      b.addEventListener('click', function () {
        var src = b.getAttribute('data-src');
        if (!src) return;
        main.src = src;
        $$('.xm-gallery__thumbs button', box).forEach(function (x) { x.classList.remove('is-on'); });
        b.classList.add('is-on');
      });
    });
  }

  function initMisc() {
    // 外链新窗口
    $$('a[href^="http"]').forEach(function (a) {
      if (a.hostname && a.hostname !== window.location.hostname) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  /* ---------- 8. 悬浮联系：电话 + 微信，居中弹窗 ---------- */
  var CONTACT_CONFIG = {
    phoneDisplay: "139-3791-2882",
    phoneTel: "+8613937912882",
    phoneCopy: "13937912882",
    wechatId: "z13937912882",
    wechatQrImage: "/images/wechat-qr.png",
    workHours: "工作日 8:30–17:30"
  };

  function trackEvent(name) {}

  function siteAsset(path) {
    if (!path || /^([a-z]+:)?\/\//i.test(path) || path.charAt(0) !== "/") return path;
    var script = document.querySelector("script[src*='main.js']");
    var src = script ? (script.getAttribute("src") || "") : "";
    var root = src.replace(/Public\/v4\/js\/main\.js(?:\?.*)?$/, "");
    return root + path.replace(/^\//, "");
  }

  function isMobileContact() {
    return window.matchMedia("(max-width: 768px)").matches;
  }

  function isWeChatBrowser() {
    return /MicroMessenger/i.test(navigator.userAgent);
  }

  function escHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        return fallbackCopy(text);
      });
    }
    return fallbackCopy(text);
  }

  function fallbackCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = doc.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "0";
      ta.style.opacity = "0";
      doc.body.appendChild(ta);
      ta.focus();
      ta.select();
      var ok = false;
      try {
        ok = doc.execCommand("copy");
      } catch (err) {
        ok = false;
      }
      doc.body.removeChild(ta);
      ok ? resolve() : reject(new Error("copy"));
    });
  }

  function phoneIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>';
  }

  function wechatIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#07C160" d="M9.5 3.8C5.4 3.8 2 6.6 2 10c0 1.9 1.1 3.6 2.8 4.7L4.3 17.2l2.4-1.3c.8.3 1.6.4 2.4.4.3 0 .6 0 .9-.1-.2-.6-.3-1.2-.3-1.8 0-3.4 3.2-6.1 7.1-6.1.3 0 .5 0 .8.1C16.6 5.4 13.3 3.8 9.5 3.8zm-2.2 3.3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4.6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM16.8 9.1c-3.3 0-6 2.3-6 5.1s2.7 5.1 6 5.1c.7 0 1.3-.1 1.9-.3l2 .9-.5-1.7c1.4-1 2.3-2.5 2.3-4 0-2.8-2.7-5.1-5.7-5.1zm-2 2.6a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6zm4 0a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6z"/></svg>';
  }

  function initContact() {
    var dock = $("#xmContactDock");
    if (!dock) return;
    var cfg = CONTACT_CONFIG;
    var modal = null;
    var copyTimer = null;
    var lastTrigger = null;
    var scrollLocked = false;

    function lockScroll() {
      if (scrollLocked) return;
      scrollLocked = true;
      doc.documentElement.style.overflow = "hidden";
      doc.body.style.overflow = "hidden";
    }

    function unlockScroll() {
      if (!scrollLocked) return;
      scrollLocked = false;
      doc.documentElement.style.overflow = "";
      doc.body.style.overflow = "";
    }

    function markCopied(button, label) {
      button.textContent = "已复制 ✓";
      button.classList.add("is-done");
      clearTimeout(copyTimer);
      copyTimer = setTimeout(function () {
        button.textContent = label;
        button.classList.remove("is-done");
      }, 2000);
    }

    function bindCopy(button, text, label, eventName) {
      button.addEventListener("click", function () {
        trackEvent(eventName);
        copyText(text).then(function () {
          markCopied(button, label);
        }).catch(function () {});
      });
    }

    function ensureModal() {
      if (modal) return modal;
      modal = doc.createElement("div");
      modal.className = "xm-modal";
      modal.setAttribute("aria-hidden", "true");
      modal.innerHTML =
        '<div class="xm-modal__mask" data-close="1"></div>' +
        '<div class="xm-modal__card" role="dialog" aria-modal="true" aria-labelledby="xmModalTitle">' +
          '<button type="button" class="xm-modal__close" data-close="1" aria-label="关闭">×</button>' +
          '<h2 class="xm-modal__title" id="xmModalTitle"></h2>' +
          '<div class="xm-modal__main"></div>' +
        "</div>";
      doc.body.appendChild(modal);
      modal.addEventListener("click", function (e) {
        if (e.target.getAttribute("data-close") === "1") closeModal();
      });
      return modal;
    }

    function fillModal(kind) {
      var el = ensureModal();
      var title = $(".xm-modal__title", el);
      var main = $(".xm-modal__main", el);
      if (kind === "wechat") {
        title.textContent = "微信扫码，添加专属顾问";
        main.innerHTML =
          '<img class="xm-modal__qr" src="' + escHtml(siteAsset(cfg.wechatQrImage)) + '" alt="微信二维码" width="200" height="200">' +
          '<p class="xm-modal__hint">' + (isWeChatBrowser() ? "长按识别二维码添加" : "扫一扫二维码，添加我为好友") + "</p>" +
          '<div class="xm-modal__bar"><span class="xm-modal__id">微信号：' + escHtml(cfg.wechatId) + '</span>' +
          '<button type="button" class="xm-modal__copy">复制</button></div>';
        bindCopy($(".xm-modal__copy", main), cfg.wechatId, "复制", "contact_wechat_copy");
      } else {
        title.textContent = "电话咨询";
        main.innerHTML =
          '<p class="xm-modal__phone">' + escHtml(cfg.phoneDisplay) + "</p>" +
          '<button type="button" class="xm-modal__copy">复制号码</button>' +
          '<p class="xm-modal__note">' + escHtml(cfg.workHours) + "</p>";
        bindCopy($(".xm-modal__copy", main), cfg.phoneCopy, "复制号码", "contact_phone_copy");
      }
    }

    function openModal(kind, trigger) {
      lastTrigger = trigger || null;
      fillModal(kind);
      var el = ensureModal();
      el.setAttribute("aria-hidden", "false");
      el.classList.remove("is-open");
      void el.offsetWidth;
      el.classList.add("is-open");
      lockScroll();
      var closeBtn = $(".xm-modal__close", el);
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      unlockScroll();
      if (lastTrigger) lastTrigger.focus();
    }

    dock.innerHTML =
      '<a class="xm-contact-btn xm-contact-btn--phone" href="tel:' + escHtml(cfg.phoneTel) + '" aria-label="拨打电话 ' + escHtml(cfg.phoneDisplay) + '">' + phoneIcon() + "</a>" +
      '<button type="button" class="xm-contact-btn xm-contact-btn--wechat" aria-label="微信咨询">' + wechatIcon() + "</button>";

    var phone = $(".xm-contact-btn--phone", dock);
    var wechat = $(".xm-contact-btn--wechat", dock);

    phone.addEventListener("click", function (e) {
      trackEvent("contact_phone_click");
      if (isMobileContact()) return;
      e.preventDefault();
      openModal("phone", phone);
    });

    wechat.addEventListener("click", function () {
      trackEvent("contact_wechat_click");
      openModal("wechat", wechat);
    });

    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal && modal.classList.contains("is-open")) closeModal();
    });
  }

  /* ---------- 9. 语言下拉：跳转到对应语言版本 ---------- */
  function initLang() {
    $$('.xm-lang__select').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var url = sel.value;
        if (url) window.location.href = url;
      });
    });
  }

  /* ---------- 启动 ---------- */
  function boot() {
    initHero();
    initDrawer();
    initSearch();
    initReveal();
    initScroll();
    initLazy();
    initMisc();
    initGallery();
    initContact();
    initLang();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
