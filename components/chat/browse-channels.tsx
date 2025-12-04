"use client"

import { useState, useEffect } from "react"
import { Hash, Users, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

interface AvailableChannel {
  _id: string
  name: string
  description?: string
  memberCount: number
}

interface BrowseChannelsProps {
  onJoinChannel: (channelId: string) => Promise<void>
}

export function BrowseChannels({ onJoinChannel }: BrowseChannelsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [channels, setChannels] = useState<AvailableChannel[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [joiningId, setJoiningId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchAvailableChannels()
    }
  }, [isOpen])

  const fetchAvailableChannels = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/channels/available")
      const data = await res.json()
      if (res.ok) {
        setChannels(data.channels)
      }
    } catch (error) {
      console.error("Failed to fetch channels:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoin = async (channelId: string) => {
    setJoiningId(channelId)
    try {
      await onJoinChannel(channelId)
      setChannels((prev) => prev.filter((c) => c._id !== channelId))
      toast.success("Joined channel!")
    } catch (error: any) {
      toast.error(error.message || "Failed to join channel")
    } finally {
      setJoiningId(null)
    }
  }

  const filteredChannels = channels.filter((channel) => channel.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent mx-2 px-2"
        >
          <Search className="h-4 w-4" />
          Browse channels
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Browse Channels</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Find and join channels to start collaborating with your team.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-input border-border text-foreground"
          />
          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-muted-foreground">Loading...</span>
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Hash className="h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">No channels available</p>
                <p className="text-xs text-muted-foreground/70">Create a new channel or wait for invites</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredChannels.map((channel) => (
                  <div
                    key={channel._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-primary/20 flex items-center justify-center">
                        <Hash className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{channel.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{channel.memberCount} members</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleJoin(channel._id)}
                      disabled={joiningId === channel._id}
                      className="bg-primary text-primary-foreground"
                    >
                      {joiningId === channel._id ? "Joining..." : "Join"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
