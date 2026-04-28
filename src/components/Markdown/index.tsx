import React from "react";
import { Streamdown } from "streamdown";
import { createMathPlugin } from "@streamdown/math";
import "katex/dist/katex.min.css";
import { openUrl } from "@tauri-apps/plugin-opener";

interface MarkdownRendererProps {
  children: string;
  isStreaming?: boolean;
}

function normalizeMathDelimiters(md: string): string {
  if (!md) return md;

  // Convert LaTeX \( \) and \[ \] delimiters to Streamdown's $$ delimiter.
  // This is a pragmatic compatibility layer for model outputs.
  let out = md
    .replace(/\\\[/g, "$$\n")
    .replace(/\\\]/g, "\n$$")
    .replace(/\\\(/g, "$$")
    .replace(/\\\)/g, "$$");

  // Convert single-dollar math ($...$) to $$...$$.
  // We do this with a small scanner to avoid breaking $$...$$ blocks and to
  // respect escaped dollars (\$).
  const looksLikeMath = (s: string) =>
    /\\[a-zA-Z]+/.test(s) ||
    /[=<>^_{}]/.test(s) ||
    /[()+\-*/]/.test(s) ||
    /\d\s*[+\-*/]\s*\d/.test(s) ||
    /[a-zA-Z]\s*[+\-*/]\s*[a-zA-Z]/.test(s) ||
    // Common inline math like $x$, $y$, $n$, $abc$, $10$
    /^[a-zA-Z]{1,4}$/.test(s.trim()) ||
    /^\d{1,6}$/.test(s.trim());

  let result = "";
  for (let i = 0; i < out.length; i++) {
    const ch = out[i];
    if (ch !== "$") {
      result += ch;
      continue;
    }

    // Skip escaped \$.
    if (i > 0 && out[i - 1] === "\\") {
      result += ch;
      continue;
    }

    // Skip $$...$$ (already handled by plugin).
    if (out[i + 1] === "$") {
      result += "$$";
      i += 1;
      continue;
    }

    // Find closing single $.
    let j = i + 1;
    while (j < out.length) {
      if (out[j] === "$" && out[j - 1] !== "\\" && out[j + 1] !== "$") break;
      j += 1;
    }
    if (j >= out.length) {
      // Unterminated; keep as-is.
      result += ch;
      continue;
    }

    const inner = out.slice(i + 1, j);
    if (!looksLikeMath(inner.trim())) {
      // Likely currency or normal text.
      result += `$${inner}$`;
      i = j;
      continue;
    }

    result += `$$${inner}$$`;
    i = j;
  }

  out = result;

  return out;
}

export function Markdown({
  children,
  isStreaming = false,
}: MarkdownRendererProps) {
  const StreamdownAny = Streamdown as any;
  return (
    <StreamdownAny
      isAnimating={isStreaming}
      shikiTheme={["github-light", "github-dark"]}
      components={COMPONENTS as any}
      plugins={{
        math: createMathPlugin({
          singleDollarTextMath: true,
        }),
      }}
      controls={{
        table: true,
        code: true,
        mermaid: {
          download: true,
          copy: true,
          fullscreen: false,
          panZoom: false,
        },
      }}
    >
      {normalizeMathDelimiters(children)}
    </StreamdownAny>
  );
}

const COMPONENTS = {
  a: ({ children, href, ...props }: any) => {
    const handleClick = async (e: React.MouseEvent) => {
      e.preventDefault();
      if (href) {
        try {
          await openUrl(href);
        } catch (error) {
          console.error("Failed to open URL:", error);
        }
      }
    };

    return (
      <a
        href={href}
        className="text-gray-600 underline underline-offset-2 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 cursor-pointer"
        onClick={handleClick}
        {...props}
      >
        {children}
      </a>
    );
  },
};
