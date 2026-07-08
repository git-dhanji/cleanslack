"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

// Matches http/https URLs in a run of text.
const URL_RE = /(https?:\/\/[^\s]+)/g

function isImageUrl(url: string): boolean {
  return /\.(gif|png|jpe?g|webp|svg|avif)(\?[^\s]*)?$/i.test(url)
}

function shorten(url: string): string {
  const clean = url.replace(/^https?:\/\//, "").replace(/\/$/, "")
  return clean.length > 48 ? clean.slice(0, 45) + "…" : clean
}

// Renders message text with clickable links. Direct image/GIF links are shown
// inline. Everything is rendered as escaped text/JSX (never dangerouslySetInnerHTML),
// and images load straight from their host — no server proxy, no tracking on our side.
export function MessageText({ text, mine }: { text: string; mine: boolean }) {
  const parts = text.split(URL_RE)
  const images: string[] = []

  const nodes = parts.map((part, i) => {
    // Odd indices are the captured URLs.
    if (i % 2 === 1) {
      if (isImageUrl(part)) images.push(part)
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={cn(
            "underline underline-offset-2 break-all",
            mine ? "text-primary-foreground" : "text-primary",
          )}
        >
          {shorten(part)}
        </a>
      )
    }
    return <span key={i}>{part}</span>
  })

  return (
    <>
      <p className="whitespace-pre-wrap wrap-break-word">{nodes}</p>
      {images.map((src, i) => (
        <InlineImage key={`img-${i}`} src={src} />
      ))}
    </>
  )
}

function InlineImage({ src }: { src: string }) {
  const [ok, setOk] = useState(true)
  if (!ok) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setOk(false)}
      className="mt-2 max-h-64 w-auto max-w-full rounded-lg border border-border/50"
    />
  )
}
