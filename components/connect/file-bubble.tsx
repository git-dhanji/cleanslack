import { Download, FileIcon, AlertCircle, Check } from "lucide-react"
import type { FileMessage } from "@/hooks/use-peer"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB", "TB"]
  let value = bytes / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`
}

export function FileBubble({ file }: { file: FileMessage }) {
  const done = file.status === "complete"
  const error = file.status === "error"
  const pct = Math.round(file.progress * 100)
  const isImage = file.mime.startsWith("image/") && !!file.url

  return (
    <div
      className={cn(
        "w-72 max-w-full rounded-2xl px-4 py-3 text-sm",
        file.mine
          ? "rounded-br-sm bg-primary text-primary-foreground"
          : "rounded-bl-sm bg-secondary text-secondary-foreground",
      )}
    >
      {/* Inline preview for images and animated GIFs. */}
      {isImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <a href={file.url} download={file.name} className="mb-3 block">
          <img
            src={file.url}
            alt={file.name}
            className="max-h-64 w-full rounded-lg object-cover"
          />
        </a>
      )}

      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
            file.mine ? "bg-primary-foreground/15" : "bg-background",
          )}
        >
          {error ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : (
            <FileIcon className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{file.name}</p>
          <p className={cn("text-xs", file.mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
            {formatBytes(file.size)}
            {error && " · failed"}
          </p>
        </div>
        {done && !file.mine && file.url && (
          <a
            href={file.url}
            download={file.name}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-background text-foreground transition-opacity hover:opacity-80"
            aria-label={`Download ${file.name}`}
          >
            <Download className="h-4 w-4" />
          </a>
        )}
        {done && file.mine && <Check className="h-5 w-5 shrink-0" />}
      </div>

      {!done && !error && (
        <div className="mt-3">
          <Progress value={pct} className="h-1.5" />
          <span
            className={cn(
              "mt-1 block text-[10px]",
              file.mine ? "text-primary-foreground/70" : "text-muted-foreground",
            )}
          >
            {file.mine ? "Sending" : "Receiving"} · {pct}%
          </span>
        </div>
      )}
    </div>
  )
}
