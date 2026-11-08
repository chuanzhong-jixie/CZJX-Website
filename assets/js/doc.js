/* 文档阅读页：按 ?id= 取目录项与 Markdown 正文 */
(function () {
  "use strict";

  var host = document.querySelector("[data-doc-article]");
  if (!host) return;

  var CZJX = window.CZJX;
  var titleEl = document.querySelector("[data-doc-title]");
  var metaEl = document.querySelector("[data-doc-meta]");
  var categoryEl = document.querySelector("[data-doc-category]");
  var params = new URLSearchParams(window.location.search);
  var docId = params.get("id");

  function setHead(doc) {
    if (titleEl) titleEl.textContent = doc.title;
    if (categoryEl) categoryEl.textContent = doc.category || "未分类";
    document.title = doc.title + " · 川中计协";

    if (metaEl) {
      metaEl.replaceChildren(
        CZJX.el("li", { text: doc.category || "未分类" }),
        CZJX.el("li", { text: "更新于 " + CZJX.formatDate(doc.updatedAt) })
      );
    }
  }

  function notFound(reason) {
    CZJX.renderState(host, "empty", { message: reason });
    var back = CZJX.el("a", {
      className: "btn btn--sm",
      href: "docs.html",
      text: "返回文档库",
    });
    host.lastElementChild.appendChild(back);
    if (titleEl) titleEl.textContent = "文档不可用";
    if (metaEl) metaEl.replaceChildren();
    if (categoryEl) categoryEl.textContent = "未找到";
    document.title = "文档不可用 · 川中计协";
  }

  function load() {
    host.setAttribute("aria-busy", "true");
    CZJX.renderState(host, "loading", { message: "正在载入文档正文…" });

    if (!docId) {
      notFound("链接里没有指定文档编号，无法确定要打开哪一篇。");
      return;
    }

    CZJX.fetchJSON("data/docs.json")
      .then(function (data) {
        var doc = (data.docs || []).filter(function (item) {
          return item.id === docId;
        })[0];

        if (!doc || doc.published === false) {
          notFound("这篇文档不存在，或尚未整理完成。目录里能看到的才可以打开。");
          return null;
        }

        setHead(doc);
        return fetch(doc.path, { headers: { Accept: "text/markdown" } }).then(function (res) {
          if (!res.ok) {
            throw new Error("正文请求失败（HTTP " + res.status + "）");
          }
          return res.text();
        }).then(function (text) {
          host.innerHTML = CZJX.renderMarkdown(text);
          host.removeAttribute("aria-busy");
          CZJX.enableImageZoom(host);
        });
      })
      .catch(function (error) {
        CZJX.renderState(host, "error", {
          title: "文档载入失败",
          message: "正文没能取到，请稍后重试。",
          detail: CZJX.describeError(error),
          onRetry: load,
        });
      });
  }

  load();
})();
