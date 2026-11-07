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
})();
