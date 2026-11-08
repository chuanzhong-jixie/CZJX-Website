/* 活动列表渲染：首页取前 N 条，活动页取全部 */
(function () {
  "use strict";

  var host = document.querySelector("[data-activity-feed]");
  if (!host) return;

  var CZJX = window.CZJX;
  var limit = parseInt(host.getAttribute("data-limit"), 10) || 0;
  var headingLevel = host.getAttribute("data-heading") === "h2" ? "h2" : "h3";
  var showDetails = host.getAttribute("data-details") !== "false";
  var updatedHost = document.querySelector("[data-activity-updated]");

  function buildCard(item, now) {
    var status = CZJX.activityStatus(item, now);
    var top = CZJX.el("div", { className: "activity__top" }, [
      CZJX.el("span", {
        className: "badge badge--" + status,
        text: CZJX.statusText(status),
      }),
    ]);

    (item.tags || []).forEach(function (tag) {
      top.appendChild(CZJX.el("span", { className: "tag", text: tag }));
    });

    var meta = CZJX.el("ul", { className: "activity__meta" }, [
      CZJX.el("li", {}, [
        CZJX.icon("clock"),
        CZJX.el("time", {
          datetime: CZJX.formatIso(item.startAt),
          text: CZJX.formatWhen(item),
        }),
      ]),
      CZJX.el("li", {}, [CZJX.icon("pin"), CZJX.el("span", { text: item.location || "地点待定" })]),
    ]);

    var children = [
      top,
      CZJX.el(headingLevel, { className: "activity__title", text: item.title }),
      CZJX.el("p", { className: "activity__summary", text: item.summary || "" }),
      meta,
    ];

    if (showDetails && Array.isArray(item.details) && item.details.length) {
      var details = CZJX.el("ul", { className: "activity__details" });
      item.details.forEach(function (line) {
        details.appendChild(CZJX.el("li", { text: line }));
      });
      children.push(details);
    }

    /* 有独立活动页时给出入口 */
    if (item.link) {
      children.push(
        CZJX.el("a", {
          className: "btn btn--sm activity__cta",
          href: item.link,
          text: item.linkLabel || "了解详情 →",
        })
      );
    }

    return CZJX.el("article", {
      className: "card activity activity--" + status,
      id: item.id,
    }, children);
  }

  function render(data) {
    var list = Array.isArray(data.activities) ? data.activities.slice() : [];

    if (!list.length) {
      CZJX.renderState(host, "empty", {
        message: "暂无已发布的社团活动。新活动排期确定后会在这里更新。",
      });
      return;
    }

    /* 未开始的排前面，已结束的沉底；同组内按开始时间排序 */
    var now = new Date();
    var rank = { ongoing: 0, upcoming: 1, ended: 2 };
    list.sort(function (a, b) {
      var ra = rank[CZJX.activityStatus(a, now)];
      var rb = rank[CZJX.activityStatus(b, now)];
      if (ra !== rb) return ra - rb;
      var diff = new Date(a.startAt) - new Date(b.startAt);
      /* 已结束的活动按时间倒序，最近的排在前面 */
      return ra === 2 ? -diff : diff;
    });

    if (limit > 0) list = list.slice(0, limit);

    var frag = document.createDocumentFragment();
    list.forEach(function (item) {
      frag.appendChild(buildCard(item, now));
    });
    host.replaceChildren(frag);
    host.removeAttribute("aria-busy");

    if (updatedHost && data.updatedAt) {
      updatedHost.textContent = "数据更新于 " + CZJX.formatDate(data.updatedAt);
    }
  }

  function load() {
    host.setAttribute("aria-busy", "true");
    CZJX.renderState(host, "loading", { message: "正在载入活动排期…" });

    CZJX.fetchJSON("data/activities.json")
      .then(render)
      .catch(function (error) {
        CZJX.renderState(host, "error", {
          title: "活动数据载入失败",
          message: "暂时取不到活动排期，请稍后重试。",
          detail: CZJX.describeError(error),
          onRetry: load,
        });
      });
  }

  load();
})();
