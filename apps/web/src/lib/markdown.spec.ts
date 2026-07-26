import { describe, expect, it } from "vitest";

import { markdownToText, renderMarkdown } from "./markdown";

describe("renderMarkdown", () => {
  it("renders the ordinary things an editor writes", () => {
    const html = renderMarkdown("A **bold** claim and an *aside*.");

    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>aside</em>");
  });

  it("renders lists", () => {
    const html = renderMarkdown("- one\n- two\n");

    expect(html).toContain("<ul>");
    expect(html).toContain("<li>one</li>");
  });

  it("links a bare URL, because editors paste them", () => {
    expect(renderMarkdown("See https://example.com for more")).toContain('href="https://example.com"');
  });

  /**
   * The security boundary of this whole module.
   *
   * `html: false` means raw HTML in a post is escaped, not parsed. There is no
   * sanitiser here because there is nothing to sanitise: markup an editor types
   * becomes visible text. If any of these ever pass through as live markup, the
   * renderer has been misconfigured and every post body is an XSS vector.
   */
  describe("raw HTML in a post body", () => {
    /**
     * Asserted against a parsed DOM, not against the output string.
     *
     * String matching is the wrong tool here and gives false alarms: escaped
     * output legitimately *contains* the characters `onerror=` as visible text.
     * What matters is whether the browser ends up with a live element or a live
     * attribute, and the only honest way to ask that is to parse it the way a
     * browser would.
     */
    function parse(markdown: string): HTMLElement {
      const host = document.createElement("div");
      host.innerHTML = renderMarkdown(markdown);
      return host;
    }

    /** Attributes that would run code if they survived onto a real element. */
    function eventHandlers(root: HTMLElement): string[] {
      return [...root.querySelectorAll("*")].flatMap((element) =>
        [...element.attributes].map((attribute) => attribute.name).filter((name) => name.startsWith("on")),
      );
    }

    it.each([
      "<script>alert('xss')</script>",
      "<img src=x onerror=alert(1)>",
      "<iframe src='https://evil.example'></iframe>",
      "<div onclick='steal()'>click</div>",
      "<svg/onload=alert(1)>",
      "<a href='javascript:alert(1)'>click</a>",
      "<style>body{display:none}</style>",
      "<object data='evil.swf'></object>",
      "<form action='https://evil.example'><input name='x'></form>",
    ])("yields no live element or handler for %s", (markdown) => {
      const root = parse(markdown);

      expect(root.querySelector("script, iframe, style, img, svg, object, form, input")).toBeNull();
      expect(eventHandlers(root)).toEqual([]);
    });

    it("shows the escaped markup as text, so the editor sees their mistake", () => {
      expect(renderMarkdown("<script>alert(1)</script>")).toContain("&lt;script&gt;");
      expect(parse("<script>alert(1)</script>").textContent).toContain("<script>alert(1)</script>");
    });

    it("produces no anchor at all for a javascript: URL in link syntax", () => {
      // markdown-it's own URL validation, not `html: false` — this is the one
      // injection route escaping does not cover, so it is worth pinning.
      const root = parse("[click](javascript:alert(1))");

      expect(root.querySelector("a")).toBeNull();
    });

    it("still linkifies an ordinary URL, so the guard is not just refusing everything", () => {
      // Without this, a renderer that emitted no links at all would pass every
      // test above.
      expect(parse("[Admissions](/admissions)").querySelector("a")).not.toBeNull();
    });
  });

  /**
   * The post's title is the page's `<h1>`. A `#` in the body must not become a
   * second one: a document with two h1s has no clear outline, and that outline
   * is how a screen-reader user navigates the article.
   */
  describe("heading levels", () => {
    it("shifts a top-level heading to h2", () => {
      const html = renderMarkdown("# A section");

      expect(html).toContain("<h2>A section</h2>");
      expect(html).not.toContain("<h1>");
    });

    it("shifts the rest down with it", () => {
      expect(renderMarkdown("## Sub")).toContain("<h3>Sub</h3>");
      expect(renderMarkdown("### Deeper")).toContain("<h4>Deeper</h4>");
    });

    it("stops at h6 rather than inventing an h7", () => {
      const html = renderMarkdown("###### Deepest");

      expect(html).toContain("<h6>Deepest</h6>");
      expect(html).not.toContain("<h7");
    });
  });

  describe("outbound links", () => {
    it("opens an external link in a new tab, safely", () => {
      const html = renderMarkdown("[Cambridge](https://www.cambridgeinternational.org)");

      expect(html).toContain('target="_blank"');
      expect(html).toContain("noopener");
    });

    it("leaves an internal link alone", () => {
      // Sending a visitor to a new tab to read another page of the same site
      // is rude, and clutters their tab bar.
      const html = renderMarkdown("[Admissions](/admissions)");

      expect(html).not.toContain('target="_blank"');
    });

    it("treats the school's own domain as internal", () => {
      const html = renderMarkdown("[Home](https://kedland.edu.gh/about)");

      expect(html).not.toContain('target="_blank"');
    });
  });

  it("typesets quotes and dashes", () => {
    // The school's copy is British English prose and should read as typeset.
    expect(renderMarkdown("It's here -- really")).not.toContain("--");
  });
});

describe("markdownToText", () => {
  it("strips markup for a meta description", () => {
    expect(markdownToText("A **bold** claim.")).toBe("A bold claim.");
  });

  it("collapses the whitespace markup leaves behind", () => {
    expect(markdownToText("# Heading\n\nParagraph one.\n\nParagraph two.")).toBe(
      "Heading Paragraph one. Paragraph two.",
    );
  });

  it("truncates at a word boundary", () => {
    const text = markdownToText("word ".repeat(100), 40);

    expect(text.length).toBeLessThanOrEqual(41);
    expect(text.endsWith("…")).toBe(true);
    expect(text).not.toContain("wor…");
  });

  it("leaves a short description alone, with no ellipsis", () => {
    expect(markdownToText("Short and sweet.")).toBe("Short and sweet.");
  });

  it("unescapes entities, so a description reads as written", () => {
    // "Races &amp; medals" in a meta tag is what a search result would show.
    expect(markdownToText("Races & medals")).toBe("Races & medals");
  });

  /**
   * Guarantees the output has no angle brackets at all, so it cannot open an
   * element or close a script tag in any context it is later dropped into.
   */
  it("carries no angle brackets, whatever the editor typed", () => {
    const text = markdownToText("<script>alert(1)</script> Sports day");

    expect(text).not.toContain("<");
    expect(text).not.toContain(">");
    expect(text).toContain("Sports day");
  });

  it("cannot terminate a script tag, for the day this lands in JSON-LD", () => {
    expect(markdownToText("Races </script> and medals")).not.toContain("</script>");
  });
});
