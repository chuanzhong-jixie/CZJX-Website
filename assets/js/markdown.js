/* 极简 Markdown 渲染器：标题、段落、列表、引用、代码块、表格、分割线、行内格式 */
(function () {
  "use strict";

  var CZJX = (window.CZJX = window.CZJX || {});

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* 输入为已转义文本，此处只处理行内标记，链接协议做白名单 */
  function inline(text) {
    var out = escapeHtml(text);

    out = out.replace(/`([^`]+)`/g, function (_, code) {
      return "<code>" + code + "</code>";
    });

    /* 图片必须排在链接之前处理，否则 ![]() 会被链接规则先吃掉 */
    out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (_, alt, src) {
      if (/^\s*(javascript|data):/i.test(src)) return alt;
      return (
        '<img src="' +
        src +
        '" alt="' +
        alt +
        '" loading="lazy" decoding="async">'
      );
    });

    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, label, href) {
      var safe = /^(https?:|mailto:|#|\/|\.{1,2}\/)/i.test(href) ? href : "#";
      var external = /^https?:/i.test(safe);
      return (
        '<a href="' +
        safe +
        '"' +
        (external ? ' target="_blank" rel="noopener noreferrer"' : "") +
        ">" +
        label +
        "</a>"
      );
    });

    /* 强调：先吃三连星，再用两轮「粗体 → 斜体」，
       这样 粗中带斜 和 斜中带粗 两种嵌套都能收敛 */
    out = out.replace(/\*\*\*([^*\n]+)\*\*\*/g, "<strong><em>$1</em></strong>");
    for (var round = 0; round < 2; round += 1) {
      out = out.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
      out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    }
    /* 下划线斜体：两侧要求非字母数字，避免把 snake_case_name 拆开 */
    out = out.replace(
      /(^|[^A-Za-z0-9_])_([^_\n]+)_(?![A-Za-z0-9_])/g,
      "$1<em>$2</em>"
    );
    return out;
  }

  function joinLines(a, b) {
    if (!a) return b;
    var cjkEnd = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]$/;
    var cjkStart = /^[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/;
    return cjkEnd.test(a) && cjkStart.test(b) ? a + b : a + " " + b;
  }

  function isTableSeparator(line) {
    return /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(line.trim());
  }

  function splitRow(line) {
    return line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map(function (cell) {
        return cell.trim();
      });
  }

  function render(source) {
    var lines = String(source).replace(/\r\n?/g, "\n").split("\n");
    var out = [];
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      /* 代码块 */
      if (/^\s*```/.test(line)) {
        var fence = line.trim().slice(3);
        var code = [];
        i += 1;
        while (i < lines.length && !/^\s*```/.test(lines[i])) {
          code.push(lines[i]);
          i += 1;
        }
        i += 1;
        out.push(
          "<pre><code" +
            (fence ? ' class="lang-' + escapeHtml(fence) + '"' : "") +
            ">" +
            escapeHtml(code.join("\n")) +
            "</code></pre>"
        );
        continue;
      }

      /* 空行 */
      if (/^\s*$/.test(line)) {
        i += 1;
        continue;
      }

      /* 标题：页面已有 h1，markdown 的一级标题降级为 h2 */
      var heading = /^(#{1,6})\s+(.*)$/.exec(line);
      if (heading) {
        var depth = heading[1].length;
        var level = depth <= 2 ? 2 : depth === 3 ? 3 : 4;
        out.push("<h" + level + ">" + inline(heading[2]) + "</h" + level + ">");
        i += 1;
        continue;
      }

      /* 分割线 */
      if (/^\s*([-*_])\s*\1\s*\1[\s\1]*$/.test(line)) {
        out.push("<hr>");
        i += 1;
        continue;
      }

      /* 引用 */
      if (/^\s*>\s?/.test(line)) {
        var quote = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
          quote.push(lines[i].replace(/^\s*>\s?/, ""));
          i += 1;
        }
        out.push("<blockquote><p>" + inline(quote.join(" ")) + "</p></blockquote>");
        continue;
      }

      /* 表格 */
      if (/^\s*\|/.test(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
        var head = splitRow(line);
        i += 2;
        var rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) {
          rows.push(splitRow(lines[i]));
          i += 1;
        }
        var table =
          "<table><thead><tr>" +
          head
            .map(function (cell) {
              return "<th>" + inline(cell) + "</th>";
            })
            .join("") +
          "</tr></thead><tbody>" +
          rows
            .map(function (row) {
              return (
                "<tr>" +
                row
                  .map(function (cell) {
                    return "<td>" + inline(cell) + "</td>";
                  })
                  .join("") +
                "</tr>"
              );
            })
            .join("") +
          "</tbody></table>";
        out.push(table);
        continue;
      }

      /* 独立成行的图片不套段落，避免段落外边距和图片外边距叠加 */
      if (/^\s*!\[/.test(line)) {
        out.push(inline(line.trim()));
        i += 1;
        continue;
      }

      /* 无序列表 */
      if (/^\s*[-*+]\s+/.test(line)) {
        var items = [];
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
          i += 1;
        }
        out.push(
          "<ul>" +
            items
              .map(function (item) {
                return "<li>" + inline(item) + "</li>";
              })
              .join("") +
            "</ul>"
        );
        continue;
      }

      /* 有序列表 */
      if (/^\s*\d+[.)]\s+/.test(line)) {
        var ordered = [];
        var startAt = parseInt(line, 10);
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
          ordered.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
          i += 1;
        }
        /* 图片或引用把列表打断时，续接的编号要接着数 */
        out.push(
          "<ol" +
            (startAt > 1 ? ' start="' + startAt + '"' : "") +
            ">" +
            ordered
              .map(function (item) {
                return "<li>" + inline(item) + "</li>";
              })
              .join("") +
            "</ol>"
        );
        continue;
      }

      /* 段落 */
      var buffer = "";
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^\s*(```|#{1,6}\s|>|\||[-*+]\s|\d+[.)]\s)/.test(lines[i])) {
        buffer = joinLines(buffer, lines[i].trim());
        i += 1;
      }
      if (buffer) {
        out.push("<p>" + inline(buffer) + "</p>");
      }
    }

    return out.join("\n");
  }

  CZJX.renderMarkdown = render;
})();
