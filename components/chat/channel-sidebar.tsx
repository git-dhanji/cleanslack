"use client"

import { useState } from "react"
import { Hash, Plus, ChevronDown, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Channel {
  _id: string
  name: string
  description?: string
  members: any[]
}

interface User {
  id: string
  username: string
  email: string
  avatar?: string
}

interface ChannelSidebarProps {
  channels: Channel[]
  currentChannel: Channel | null
  onSelectChannel: (channel: Channel) => void
  onCreateChannel: (name: string, description: string) => Promise<void>
  onLogout: () => void
  user: User | null
}

export function ChannelSidebar({
  channels,
  currentChannel,
  onSelectChannel,
  onCreateChannel,
  onLogout,
  user,
}: ChannelSidebarProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newChannelName, setNewChannelName] = useState("")
  const [newChannelDescription, setNewChannelDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) {
      toast.error("Channel name is required")
      return
    }

    setIsCreating(true)
    try {
      await onCreateChannel(newChannelName, newChannelDescription)
      setNewChannelName("")
      setNewChannelDescription("")
      setIsCreateDialogOpen(false)
      toast.success("Channel created!")
    } catch (error: any) {
      toast.error(error.message || "Failed to create channel")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Workspace Header */}
      <div className="p-4 border-b border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-sidebar-foreground hover:bg-sidebar-accent">
              <span className="font-semibold truncate">TeamChat</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-popover border-border">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-foreground">{user?.username}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="text-foreground focus:bg-accent">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-hidden">
        <div className="p-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider px-2">
            Channels
          </span>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create a channel</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Channels are where your team communicates. They're best organized around a topic.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">
                    Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. marketing, engineering"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground">
                    Description <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="What's this channel about?"
                    value={newChannelDescription}
                    onChange={(e) => setNewChannelDescription(e.target.value)}
                    className="bg-input border-border text-foreground resize-none"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="border-border text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateChannel}
                  disabled={isCreating || !newChannelName.trim()}
                  className="bg-primary text-primary-foreground"
                >
                  {isCreating ? "Creating..." : "Create Channel"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="h-[calc(100%-40px)]">
          <div className="px-2 space-y-0.5">
            {channels.map((channel) => (
              <button
                key={channel._id}
                onClick={() => onSelectChannel(channel)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                  "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  currentChannel?._id === channel._id && "bg-sidebar-accent text-sidebar-foreground font-medium",
                )}
              >
                <Hash className="h-4 w-4 shrink-0 opacity-70" />
                <span className="truncate">{channel.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="h-8 w-8 rounded-md bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">{user?.username?.[0]?.toUpperCase() || "U"}</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-online border-2 border-sidebar" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.username}</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
      </div>
    </div>
  )
}
