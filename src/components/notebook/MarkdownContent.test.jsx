import { render, screen } from "@testing-library/react";
import MarkdownContent from "./MarkdownContent";

describe("MarkdownContent", () => {
  test("renders the supported Markdown subset without creating unsafe links or HTML", () => {
    render(
      <MarkdownContent
        markdown={`**Strong** and *emphasized* with \`inline code\`.

[External](https://example.com/research) and [internal](#projects) are safe.

[Do not follow](javascript:alert(1)) <img src="missing" onerror="alert(1)">`}
      />
    );

    expect(screen.getByText("Strong")).toHaveProperty("tagName", "STRONG");
    expect(screen.getByText("emphasized")).toHaveProperty("tagName", "EM");
    expect(screen.getByText("inline code")).toHaveProperty("tagName", "CODE");

    expect(screen.getByRole("link", { name: "External" })).toHaveAttribute(
      "href",
      "https://example.com/research"
    );
    expect(screen.getByRole("link", { name: "External" })).toHaveAttribute(
      "rel",
      "noopener noreferrer"
    );
    expect(screen.getByRole("link", { name: "internal" })).toHaveAttribute(
      "href",
      "#projects"
    );

    expect(screen.queryByRole("link", { name: "Do not follow" })).not.toBeInTheDocument();
    expect(
      screen.getByText(/Do not follow.*<img src="missing" onerror="alert\(1\)">/)
    ).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  test("keeps lettered steps nested beneath their numbered parent", () => {
    const { container } = render(
      <MarkdownContent
        markdown={`1. Hardware
2. **Firmware written in C** that:
   a. Collects sensor data.
   b. Logs the readings.
3. State estimation`}
      />
    );

    const numberedList = container.querySelector('ol[type="1"]');
    const letteredList = numberedList.querySelector('li:nth-child(2) > ol[type="a"]');

    expect(numberedList).toHaveAttribute("start", "1");
    expect(numberedList).toHaveTextContent("State estimation");
    expect(letteredList).toHaveTextContent("Collects sensor data.");
    expect(letteredList).toHaveTextContent("Logs the readings.");
    expect(letteredList.children).toHaveLength(2);
  });
});
