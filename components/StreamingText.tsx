"use client";

import ReactMarkdown from "react-markdown";

export function StreamingText({ text }: { text?: string }) {
  if (text) {
    return (
      <div className="text-(--cream)/80 text-sm leading-relaxed prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_ul]:my-1 [&_li]:my-0.5 [&_p]:my-1 [&_strong]:text-(--cream) [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_h1]:mt-2 [&_h2]:mt-2 [&_h3]:mt-1.5">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 py-2">
      <span className="h-1.5 w-1.5 rounded-full bg-(--accent) animate-bounce [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-(--accent) animate-bounce [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-(--accent) animate-bounce [animation-delay:300ms]" />
    </div>
  );
}
