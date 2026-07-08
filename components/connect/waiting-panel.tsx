"use client"

import { useState } from "react"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.react"
import { Copy, Check, Link2, X, Loader2, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { copyText } from "@/lib/clipboard"

export function WaitingPanel({ code, onCancel }: { code: string; onCancel: () => void }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null)
  const [showQr, setShowQr] = useState(false)

  const shareLink =
    (typeof window !== "undefined" ? window.location.origin : "") + `/connect?code=${encodeURIComponent(code)}`

  const copy = async (value: string, which: "code" | "link") => {
    const ok = await copyText(value)
    if (ok) {
      setCopied(which)
      toast.success(which === "code" ? "Code copied" : "Invite link copied")
      setTimeout(() => setCopied(null), 1500)
    } else {
      toast.error("Couldn't copy — select the text and copy manually")
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </span>
        <h2 className="mt-4 font-semibold">Waiting for your peer…</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share this code or the invite link. The connection opens the moment they join.
        </p>

        <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-4">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Your code</span>
          <div className="mt-1 select-all font-mono text-2xl font-semibold tracking-tight">{code}</div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="flex-1" onClick={() => copy(code, "code")}>
            {copied === "code" ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
            Copy code
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => copy(shareLink, "link")}>
            {copied === "link" ? <Check className="mr-1 h-4 w-4" /> : <Link2 className="mr-1 h-4 w-4" />}
            Copy link
          </Button>
        </div>

        <Button
          variant="ghost"
          className="mt-2 w-full text-muted-foreground"
          onClick={() => setShowQr((v) => !v)}
        >
          <QrCode className="mr-1 h-4 w-4" />
          {showQr ? "Hide QR code" : "Show QR code"}
        </Button>

        {showQr && (
          <div className="mt-2 flex flex-col items-center">
            {/* White backing so the code scans in both light and dark themes. */}
            <div className="rounded-xl bg-white p-3">
              <QRCodeSVG value={shareLink} size={152} level="M" marginSize={0} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Scan with another device to join
            </p>
          </div>
        )}

        <Button variant="ghost" className="mt-3 text-muted-foreground" onClick={onCancel}>
          <X className="mr-1 h-4 w-4" /> Cancel
        </Button>
      </div>
    </div>
  )
}
