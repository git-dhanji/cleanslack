"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Shuffle, ArrowRight, KeyRound, LogIn, Loader2, RotateCcw, X } from "lucide-react"
import type { ConnectMode, LastSession } from "@/hooks/use-peer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateCode } from "@/lib/webrtc"

function sanitize(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 64)
}

export function Lobby({
  onConnect,
  lastSession,
  onReconnect,
  onForgetLast,
}: {
  onConnect: (code: string, mode: ConnectMode) => Promise<{ taken: boolean }>
  lastSession: LastSession | null
  onReconnect: () => Promise<{ taken: boolean }>
  onForgetLast: () => void
}) {
  const [createCode, setCreateCode] = useState(() => generateCode())
  const [joinCode, setJoinCode] = useState("")
  const [busy, setBusy] = useState(false)

  const reconnect = async () => {
    setBusy(true)
    try {
      await onReconnect()
    } finally {
      setBusy(false)
    }
  }

  const submitCreate = async () => {
    const code = sanitize(createCode)
    if (code.length < 3) return toast.error("Code must be at least 3 characters")
    setBusy(true)
    try {
      const { taken } = await onConnect(code, "create")
      if (taken) {
        const fresh = generateCode()
        setCreateCode(fresh)
        toast.error("That code is already in use — here's a fresh one.")
      }
    } finally {
      setBusy(false)
    }
  }

  const submitJoin = async () => {
    const code = sanitize(joinCode)
    if (code.length < 3) return toast.error("Enter the code you were given")
    setBusy(true)
    try {
      await onConnect(code, "join")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      {lastSession && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <RotateCcw className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Reconnect</p>
            <p className="truncate font-mono text-xs text-muted-foreground">{lastSession.code}</p>
          </div>
          <Button size="sm" onClick={reconnect} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resume"}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            aria-label="Forget last connection"
            onClick={onForgetLast}
            disabled={busy}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Tabs defaultValue="create">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">
            <KeyRound className="mr-1.5 h-4 w-4" /> Create
          </TabsTrigger>
          <TabsTrigger value="join">
            <LogIn className="mr-1.5 h-4 w-4" /> Join
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold">Create a connection</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use this code or type your own. Share it with one person to connect.
            </p>
            <div className="mt-5 space-y-2">
              <Label htmlFor="create-code">Your code</Label>
              <div className="flex gap-2">
                <Input
                  id="create-code"
                  value={createCode}
                  onChange={(e) => setCreateCode(sanitize(e.target.value))}
                  onKeyDown={(e) => e.key === "Enter" && submitCreate()}
                  className="font-mono"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={busy}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Generate a new code"
                  onClick={() => setCreateCode(generateCode())}
                  disabled={busy}
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button className="mt-5 w-full" onClick={submitCreate} disabled={busy}>
              {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Create & wait for peer
              {!busy && <ArrowRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="join" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold">Join a connection</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the code someone shared with you.
            </p>
            <div className="mt-5 space-y-2">
              <Label htmlFor="join-code">Connection code</Label>
              <Input
                id="join-code"
                value={joinCode}
                onChange={(e) => setJoinCode(sanitize(e.target.value))}
                onKeyDown={(e) => e.key === "Enter" && submitJoin()}
                placeholder="brave-otter-4821"
                className="font-mono"
                autoComplete="off"
                spellCheck={false}
                disabled={busy}
              />
            </div>
            <Button className="mt-5 w-full" onClick={submitJoin} disabled={busy}>
              {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Connect
              {!busy && <ArrowRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        No account needed. Nothing you send is stored anywhere.
      </p>
    </div>
  )
}
