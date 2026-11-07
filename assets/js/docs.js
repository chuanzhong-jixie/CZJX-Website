/* 文档库列表：按分类分组，未发布文档显示为不可用的整理中状态 */
(function () {
  "use strict";

  var host = document.querySelector("[data-doc-list]");
  if (!host) return;

  var CZJX = window.CZJX;
  var updatedHost = document.querySelector("[data-doc-updated]");

  function buildItem(doc) {
    var main = CZJX.el("div", { className: "doc-item__main" }, [
      CZJX.el("h3", { className: "doc-item__title", text: doc.title }),
      CZJX.el("span", { className: "doc-item__summary", text: doc.summary || "" }),
    ]);

    if (doc.published === false) {
      return CZJX.el("li", {}, [
        CZJX.el(
          "div",
          {
            className: "card doc-item doc-item--pending",
            "aria-disabled": "true",
          },
          [
            main,
            CZJX.el("div", { className: "doc-item__side" }, [
              CZJX.el("span", { text: "更新 " + CZJX.formatDate(doc.updatedAt) }),
              CZJX.el("span", { className: "doc-item__go", text: "整理中" }),
            ]),
          ]
        ),
      ]);
    }

    return CZJX.el("li", {}, [
      CZJX.el(
        "a",
        {
          className: "card doc-item",
          href: "doc.html?id=" + encodeURIComponent(doc.id),
        },
        [
          main,
          CZJX.el("div", { className: "doc-item__side" }, [
            CZJX.el("span", { text: "更新 " + CZJX.formatDate(doc.updatedAt) }),
            CZJX.el("span", { className: "doc-item__go", text: "阅读 →" }),
          ]),
        ]
      ),
    ]);
  }

  function render(data) {
    var docs = Array.isArray(data.docs) ? data.docs : [];

    if (!docs.length) {
      CZJX.renderState(host, "empty", {
        message: "文档库还没有内容。整理完成的资料会陆续归档到这里。",
      });
      return;
    }

    /* 分类顺序按数据中首次出现的顺序，不额外排序 */
    var groups = [];
    var index = {};
    docs.forEach(function (doc) {
      var name = doc.category || "未分类";
      if (!index[name]) {
        index[name] = { name: name, docs: [] };
        groups.push(index[name]);
      }
      index[name].docs.push(doc);
    });

    var frag = document.createDocumentFragment();
    groups.forEach(function (group) {
      var list = CZJX.el("ul", { className: "doc-list" });
      group.docs.forEach(function (doc) {
        list.appendChild(buildItem(doc));
      });

      var published = group.docs.filter(function (doc) {
        return doc.published !== false;
      }).length;

      frag.appendChild(
        CZJX.el("section", { className: "doc-group" }, [
          CZJX.el("div", { className: "doc-group__head" }, [
            CZJX.el("h2", { className: "doc-group__title", text: group.name }),
            CZJX.el("span", {
              className: "doc-group__count",
              text: published + " / " + group.docs.length + " 篇可读",
            }),
          ]),
          list,
        ])
      );
    });

    host.replaceChildren(frag);
    host.removeAttribute("aria-busy");

    if (updatedHost && data.updatedAt) {
      updatedHost.textContent = "目录更新于 " + CZJX.formatDate(data.updatedAt);
    }
  }

  function load() {
    host.setAttribute("aria-busy", "true");
    CZJX.renderState(host, "loading", { message: "正在载入文档目录…" });

    CZJX.fetchJSON("data/docs.json")
      .then(render)
      .catch(function (error) {
        CZJX.renderState(host, "error", {
          title: "文档目录载入失败",
          message: "暂时取不到文档目录，请稍后重试。",
          detail: CZJX.describeError(error),
          onRetry: load,
        });
      });
  }

  load();
})();
