"use client"

import { Hash, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Member {
  _id: string
  username: string
  avatar?: string
  isOnline: boolean
}

interface Channel {
  _id: string
  name: string
  description?: string
  members: Member[]
}

interface ChannelHeaderProps {
  channel: Channel | null
  onLeaveChannel: () => void
}

export function ChannelHeader({ channel, onLeaveChannel }: ChannelHeaderProps) {
  if (!channel) {
    return (
      <div className="h-14 border-b border-border bg-card flex items-center px-4">
        <span className="text-muted-foreground">Select a channel</span>
      </div>
    )
  }

  const onlineMembers = channel.members.filter((m) => m.isOnline)

  return (
    <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <Hash className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="font-semibold text-foreground">{channel.name}</h2>
          {channel.description && <p className="text-xs text-muted-foreground line-clamp-1">{channel.description}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">{channel.members.length}</span>
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-card border-border">
            <SheetHeader>
              <SheetTitle className="text-foreground flex items-center gap-2">
                <Hash className="h-5 w-5" />
                {channel.name}
              </SheetTitle>
              <SheetDescription className="text-muted-foreground">
                {channel.members.length} members • {onlineMembers.length} online
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <h3 className="text-sm font-medium text-foreground mb-3">Members</h3>
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-2">
                  {channel.members.map((member) => (
                    <div key={member._id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
                      <div className="relative">
                        <div className="h-8 w-8 rounded-md bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">{member.username[0].toUpperCase()}</span>
                        </div>
                        <span
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
                            member.isOnline ? "bg-online" : "bg-offline",
                          )}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{member.username}</p>
                        <p className="text-xs text-muted-foreground">{member.isOnline ? "Online" : "Offline"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="absolute bottom-6 left-6 right-6">
              <Button
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive/10 bg-transparent"
                onClick={onLeaveChannel}
              >
                Leave Channel
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
