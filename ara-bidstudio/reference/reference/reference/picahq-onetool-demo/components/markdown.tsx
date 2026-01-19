"use client";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
//@ts-ignore
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneLight,
  oneDark,
  //@ts-ignore
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, DotIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { CodeBlock } from "./codeblock";

export function Markdown({
  content,
  fontSize = "sm",
  truncate = false,
  maxLength = 150,
}: {
  content: string;
  fontSize?: "xs" | "sm" | "md" | "lg";
  truncate?: boolean;
  maxLength?: number;
}) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const processedContent = truncate
    ? content.length > maxLength
      ? content.slice(0, maxLength).split(" ").slice(0, 50).join(" ") + "..."
      : content
    : content;

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );
    setIsDarkMode(darkModeMediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener("change", handleChange);

    return () => darkModeMediaQuery.removeEventListener("change", handleChange);
  }, []);

  const fontSizeClasses = {
    xs: "text-xs leading-5",
    sm: "text-sm leading-6",
    md: "text-base leading-7",
    lg: "text-lg leading-8",
  };

  return (
    <ReactMarkdown
      className={`prose max-w-none ${isDarkMode ? "prose-invert" : ""} ${fontSizeClasses[fontSize]} max-w-full overflow-x-auto`}
      remarkPlugins={[rehypeHighlight as any]}
      components={{
        h1: ({ node, ...props }) => (
          <h1
            {...props}
            className="first:mt-0 mb-4 mt-8 text-4xl font-bold tracking-tight text-foreground"
          />
        ),
        h2: ({ node, ...props }) => (
          <h2
            {...props}
            className="first:mt-0 mb-3 mt-6 text-3xl font-semibold tracking-tight text-foreground"
          />
        ),
        h3: ({ node, ...props }) => (
          <h3
            {...props}
            className="first:mt-0 mb-3 mt-5 text-2xl font-medium tracking-tight text-foreground"
          />
        ),
        h4: ({ node, ...props }) => (
          <h4
            {...props}
            className="first:mt-0 mb-2 mt-4 text-xl font-medium tracking-tight text-foreground"
          />
        ),
        h5: ({ node, ...props }) => (
          <h5
            {...props}
            className="first:mt-0 mb-2 mt-4 text-lg font-medium text-foreground"
          />
        ),
        h6: ({ node, ...props }) => (
          <h6
            {...props}
            className="first:mt-0 mb-2 mt-3 text-base font-medium text-foreground"
          />
        ),
        p: ({ node, ...props }) => (
          <p
            {...props}
            className={`first:my-0 my-2 text-foreground/70 ${fontSizeClasses[fontSize]}`}
          />
        ),
        a: ({ node, ...props }) => (
          <a
            {...props}
            className="text-primary hover:text-primary/80 underline transition-colors duration-200"
          />
        ),
        ul: ({ node, children, ...props }) => (
          <ul
            className={`list-item list-inside pl-6 space-y-1 text-foreground/70 ${fontSizeClasses[fontSize]}`}
          >
            {children}
          </ul>
        ),
        ol: ({ node, children, ...props }) => (
          <ol
            className={`list-decimal space-y-1 text-foreground/70 ${fontSizeClasses[fontSize]}`}
          >
            {children}
          </ol>
        ),
        li: ({ node, ...props }) => (
          <li {...props} className="flex justify-start items-start">
            <DotIcon className="text-muted-foreground" />
            <span>{props.children}</span>
          </li>
        ),
        blockquote: ({ node, ...props }) => (
          <blockquote
            {...props}
            className="border-l-4 border-primary pl-4 italic text-muted-foreground"
          />
        ),
        hr: ({ node, ...props }) => (
          <hr
            {...props}
            className="my-6 border-border"
          />
        ),
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto">
            <table
              {...props}
              className="min-w-full divide-y divide-border"
            />
          </div>
        ),
        th: ({ node, ...props }) => (
          <th
            {...props}
            className="px-4 py-3 text-left text-sm font-semibold text-foreground uppercase tracking-wider"
          />
        ),
        td: ({ node, ...props }) => (
          <td
            {...props}
            className="px-4 py-3 text-sm text-foreground"
          />
        ),
        tr: ({ node, ...props }) => (
          <tr
            {...props}
            className="bg-background even:bg-muted"
          />
        ),
        //@ts-ignore
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <CodeBlock
              language={match[1]}
              value={children as string}
              fontSize={fontSize}
            />
          ) : (
            <code
              {...props}
              className={`${className} px-1 py-0.5 rounded bg-muted text-muted-foreground`}
            >
              {children}
            </code>
          );
        },
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
}
