/* 共享工具：数据加载、日期与状态推导、DOM 构建、状态区渲染 */
(function () {
  "use strict";

  var CZJX = (window.CZJX = window.CZJX || {});

  var TZ = "Asia/Shanghai";
  var dateFmt = new Intl.DateTimeFormat("zh-CN", {
    timeZone: TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  var timeFmt = new Intl.DateTimeFormat("zh-CN", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  var weekFmt = new Intl.DateTimeFormat("zh-CN", {
    timeZone: TZ,
    weekday: "short",
  });
  var shortDateFmt = new Intl.DateTimeFormat("zh-CN", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  var STATUS_TEXT = {
    upcoming: "即将开始",
    ongoing: "进行中",
    ended: "已结束",
  };

  var ICONS = {
    clock:
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></svg>',
    pin:
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/></svg>',
  };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value === null || value === undefined || value === false) return;
        if (key === "text") node.textContent = value;
        else if (key === "className") node.className = value;
        else node.setAttribute(key, value === true ? "" : value);
      });
    }
    (children || []).forEach(function (child) {
      if (child === null || child === undefined) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  function icon(name) {
    var span = document.createElement("span");
    span.className = "ico";
    span.innerHTML = ICONS[name] || "";
    return span;
  }

  CZJX.el = el;
  CZJX.icon = icon;

  CZJX.fetchJSON = function (url) {
    return fetch(url, { headers: { Accept: "application/json" } }).then(function (res) {
      if (!res.ok) {
        throw new Error("请求失败（HTTP " + res.status + "）");
      }
      return res.json();
    });
  };

  function toDate(value) {
    if (!value) return null;
    var d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  function clock(d) {
    return timeFmt.format(d).replace(/\s/g, "");
  }

  /* 活动状态由时间推导，不写死在数据里 */
  CZJX.activityStatus = function (item, now) {
    var start = toDate(item.startAt);
    var end = toDate(item.endAt) || start;
    if (!start) return "upcoming";
    var t = (now || new Date()).getTime();
    if (t < start.getTime()) return "upcoming";
    if (end && t <= end.getTime()) return "ongoing";
    return "ended";
  };

  CZJX.statusText = function (status) {
    return STATUS_TEXT[status] || status;
  };

  CZJX.formatWhen = function (item) {
    var start = toDate(item.startAt);
    if (!start) return "时间待定";
    var end = toDate(item.endAt);
    var text =
      dateFmt.format(start) + " " + weekFmt.format(start) + " " + clock(start);
    if (end) {
      var sameDay =
        shortDateFmt.format(end) === shortDateFmt.format(start);
      text += sameDay
        ? " – " + clock(end)
        : " 起，至 " + dateFmt.format(end) + " " + clock(end);
    }
    return text;
  };

  CZJX.formatDate = function (value) {
    var d = toDate(value);
    return d ? dateFmt.format(d) : "日期未知";
  };

  CZJX.formatIso = function (value) {
    var d = toDate(value);
    return d ? d.toISOString() : "";
  };

  /* 状态区：loading / empty / error 共用一套语义 */
  CZJX.renderState = function (container, kind, options) {
    var opts = options || {};
    container.replaceChildren();
    container.removeAttribute("aria-busy");

    var wrap = el("div", { className: "state state--" + kind });

    if (kind === "loading") {
      wrap.setAttribute("role", "status");
      wrap.appendChild(el("p", { text: opts.message || "正在载入…" }));
    } else if (kind === "empty") {
      wrap.appendChild(el("p", { text: opts.message || "暂无内容。" }));
    } else {
      wrap.setAttribute("role", "alert");
      wrap.appendChild(
        el("p", { className: "state__title", text: opts.title || "载入失败" })
      );
      if (opts.message) {
        wrap.appendChild(el("p", { text: opts.message }));
      }
      if (opts.detail) {
        wrap.appendChild(el("p", { className: "state__detail", text: opts.detail }));
      }
      if (typeof opts.onRetry === "function") {
        var retry = el("button", {
          type: "button",
          className: "btn btn--sm",
          text: opts.retryLabel || "重新载入",
        });
        retry.addEventListener("click", opts.onRetry);
        wrap.appendChild(retry);
      }
    }

    container.appendChild(wrap);
  };

  CZJX.describeError = function (error) {
    if (!error) return "未知错误";
    if (error instanceof TypeError) return "网络不可用，或数据文件路径不正确";
    return error.message || String(error);
  };

  /* 正文配图放大：滚轮 / 双指 / 按钮缩放，可拖动平移，Esc 或点遮罩关闭 */
  CZJX.enableImageZoom = function (root) {
    var images = root.querySelectorAll("img");
    if (!images.length) return;

    var MIN_SCALE = 1;
    var MAX_SCALE = 5;

    var ICONS = {
      close:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>',
      zoomIn:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M10.5 7.5v6M7.5 10.5h6M20 20l-4.2-4.2"/></svg>',
      zoomOut:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M7.5 10.5h6M20 20l-4.2-4.2"/></svg>',
    };

    function iconButton(className, label, icon) {
      var btn = el("button", {
        type: "button",
        className: className,
        "aria-label": label,
      });
      btn.innerHTML = ICONS[icon];
      return btn;
    }

    var box = el("div", {
      className: "lightbox",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "图片预览",
      hidden: true,
    });
    var stage = el("div", { className: "lightbox__stage" });
    var big = el("img", { className: "lightbox__img", alt: "" });
    var closeBtn = iconButton("lightbox__btn lightbox__close", "关闭预览", "close");
    var zoomOutBtn = iconButton("lightbox__btn", "缩小", "zoomOut");
    var zoomInBtn = iconButton("lightbox__btn", "放大", "zoomIn");
    var zoomBar = el("div", { className: "lightbox__zoom" }, [zoomOutBtn, zoomInBtn]);

    stage.appendChild(big);
    box.appendChild(stage);
    box.appendChild(closeBtn);
    box.appendChild(zoomBar);
    document.body.appendChild(box);

    var lastFocus = null;
    var scale = 1;
    var tx = 0;
    var ty = 0;

    function apply() {
      big.style.transform =
        "translate(" + tx + "px," + ty + "px) scale(" + scale + ")";
      stage.classList.toggle("is-zoomed", scale > 1);
      zoomOutBtn.disabled = scale <= MIN_SCALE;
      zoomInBtn.disabled = scale >= MAX_SCALE;
    }

    function clampPan() {
      var overflowX = Math.max(0, (big.offsetWidth * scale - stage.clientWidth) / 2);
      var overflowY = Math.max(0, (big.offsetHeight * scale - stage.clientHeight) / 2);
      tx = Math.max(-overflowX, Math.min(overflowX, tx));
      ty = Math.max(-overflowY, Math.min(overflowY, ty));
    }

    /* 以舞台中心为原点，按住某个点缩放时该点保持不动 */
    function zoomTo(next, cx, cy) {
      var target = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));
      if (target === scale) return;
      var k = target / scale;
      tx = cx - (cx - tx) * k;
      ty = cy - (cy - ty) * k;
      scale = target;
      if (scale === MIN_SCALE) {
        tx = 0;
        ty = 0;
      }
      clampPan();
      apply();
    }

    function zoomBy(factor, clientX, clientY) {
      var rect = stage.getBoundingClientRect();
      var cx = clientX === undefined ? 0 : clientX - rect.left - rect.width / 2;
      var cy = clientY === undefined ? 0 : clientY - rect.top - rect.height / 2;
      zoomTo(scale * factor, cx, cy);
    }

    function reset() {
      scale = MIN_SCALE;
      tx = 0;
      ty = 0;
      apply();
    }

    function close() {
      box.hidden = true;
      big.removeAttribute("src");
      document.body.classList.remove("is-locked");
      pointers.clear();
      if (lastFocus) lastFocus.focus();
    }

    function open(trigger, src, alt) {
      lastFocus = trigger;
      big.setAttribute("src", src);
      big.setAttribute("alt", alt || "");
      box.hidden = false;
      document.body.classList.add("is-locked");
      reset();
      closeBtn.focus();
    }

    /* ---- 指针：单指拖动、双指捏合 ---- */
    var pointers = new Map();
    var dragStart = null;
    var pinchStart = 0;
    var pinchScale = 1;
    var didDrag = false;

    stage.addEventListener("pointerdown", function (event) {
      stage.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      didDrag = false;

      if (pointers.size === 1) {
        dragStart = { x: event.clientX, y: event.clientY, tx: tx, ty: ty };
      } else if (pointers.size === 2) {
        dragStart = null;
        var pts = Array.from(pointers.values());
        pinchStart = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchScale = scale;
      }
    });

    stage.addEventListener("pointermove", function (event) {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.size === 2) {
        var pts = Array.from(pointers.values());
        var dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (pinchStart > 0 && dist > 0) {
          didDrag = true;
          zoomBy(
            (pinchScale * (dist / pinchStart)) / scale,
            (pts[0].x + pts[1].x) / 2,
            (pts[0].y + pts[1].y) / 2
          );
        }
        return;
      }

      if (!dragStart || scale <= MIN_SCALE) return;
      var dx = event.clientX - dragStart.x;
      var dy = event.clientY - dragStart.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true;
      tx = dragStart.tx + dx;
      ty = dragStart.ty + dy;
      clampPan();
      apply();
    });

    function endPointer(event) {
      pointers.delete(event.pointerId);
      if (pointers.size === 0) {
        dragStart = null;
        pinchStart = 0;
      } else if (pointers.size === 1) {
        var rest = Array.from(pointers.values())[0];
        dragStart = { x: rest.x, y: rest.y, tx: tx, ty: ty };
        pinchStart = 0;
      }
      stage.classList.remove("is-dragging");
    }

    stage.addEventListener("pointerup", endPointer);
    stage.addEventListener("pointercancel", endPointer);

    /* ---- 滚轮缩放 ---- */
    stage.addEventListener(
      "wheel",
      function (event) {
        event.preventDefault();
        zoomBy(Math.exp(-event.deltaY * 0.0015), event.clientX, event.clientY);
      },
      { passive: false }
    );

    stage.addEventListener("dblclick", function (event) {
      event.preventDefault();
      if (scale > MIN_SCALE) reset();
      else zoomBy(2.5, event.clientX, event.clientY);
    });

    /* 点遮罩关闭；拖完手松开的那一下不算点击 */
    stage.addEventListener("click", function (event) {
      if (didDrag) {
        didDrag = false;
        return;
      }
      if (event.target === stage) close();
    });

    zoomInBtn.addEventListener("click", function () {
      zoomBy(1.4);
    });
    zoomOutBtn.addEventListener("click", function () {
      zoomBy(1 / 1.4);
    });
    closeBtn.addEventListener("click", close);

    document.addEventListener("keydown", function (event) {
      if (box.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomBy(1.4);
      } else if (event.key === "-") {
        event.preventDefault();
        zoomBy(1 / 1.4);
      } else if (event.key === "0") {
        event.preventDefault();
        reset();
      } else if (event.key === "Tab") {
        /* 焦点只在弹层内的三个按钮之间循环 */
        var list = [closeBtn, zoomOutBtn, zoomInBtn];
        var i = list.indexOf(document.activeElement);
        var next = (i + (event.shiftKey ? -1 : 1) + list.length) % list.length;
        event.preventDefault();
        list[next].focus();
      }
    });

    Array.prototype.forEach.call(images, function (img) {
      var btn = el("button", {
        type: "button",
        className: "prose-figure",
        "aria-label": "放大查看：" + (img.getAttribute("alt") || "文档配图"),
      });
      img.parentNode.insertBefore(btn, img);
      btn.appendChild(img);
      btn.addEventListener("click", function () {
        open(btn, img.getAttribute("src"), img.getAttribute("alt"));
      });
    });
  };
})();
