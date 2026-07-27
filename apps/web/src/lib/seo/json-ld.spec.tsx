import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { JsonLd } from "./json-ld";

function renderedScript(data: Record<string, unknown>): string {
  const { container } = render(<JsonLd data={data} />);
  const script = container.querySelector('script[type="application/ld+json"]');
  expect(script).not.toBeNull();
  return script?.innerHTML ?? "";
}

describe("JsonLd", () => {
  it("renders the data as parseable JSON", () => {
    const html = renderedScript({ "@type": "Thing", name: "Kedland" });

    expect(JSON.parse(html)).toEqual({ "@type": "Thing", name: "Kedland" });
  });

  it("escapes '<' so a value cannot close the script tag early", () => {
    // A `</script>` in a string would otherwise end the element and inject
    // markup into the page — this is the whole reason the component exists.
    const html = renderedScript({ name: "</script><script>alert(1)</script>" });

    expect(html).not.toContain("</script><script>");
    expect(html).toContain("\\u003c/script>");
  });

  it("parses back to the original value, escapes and all", () => {
    const data = { name: "a < b", "@type": "Thing" };

    expect(JSON.parse(renderedScript(data))).toEqual(data);
  });
});
