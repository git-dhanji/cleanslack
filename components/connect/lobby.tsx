"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Shuffle, ArrowRight, KeyRound, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateCode } from "@/lib/webrtc"

function sanitize(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 64)
}

export function Lobby({ onConnect }: { onConnect: (code: string) => void }) {
  const [createCode, setCreateCode] = useState(() => generateCode())
  const [joinCode, setJoinCode] = useState("")

  const submitCreate = () => {
    const code = sanitize(createCode)
    if (code.length < 3) return toast.error("Code must be at least 3 characters")
    onConnect(code)
  }

  const submitJoin = () => {
    const code = sanitize(joinCode)
    if (code.length < 3) return toast.error("Enter the code you were given")
    onConnect(code)
  }

  return (
    <div className="mx-auto w-full max-w-md">
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
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Generate a new code"
                  onClick={() => setCreateCode(generateCode())}
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button className="mt-5 w-full" onClick={submitCreate}>
              Create & wait for peer
              <ArrowRight className="ml-1 h-4 w-4" />
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
              />
            </div>
            <Button className="mt-5 w-full" onClick={submitJoin}>
              Connect
              <ArrowRight className="ml-1 h-4 w-4" />
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
