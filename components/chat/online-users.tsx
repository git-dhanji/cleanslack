"use client"

import { Users } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface OnlineUser {
  _id: string
  username: string
  avatar?: string
  isOnline: boolean
}

interface OnlineUsersProps {
  users: OnlineUser[]
  currentUserId: string
}

export function OnlineUsers({ users, currentUserId }: OnlineUsersProps) {
  // Filter to only online users and sort (current user first, then alphabetical)
  const sortedUsers = [...users]
    .filter((u) => u.isOnline)
    .sort((a, b) => {
      if (a._id === currentUserId) return -1
      if (b._id === currentUserId) return 1
      return a.username.localeCompare(b.username)
    })

  return (
    <div className="h-full flex flex-col bg-sidebar border-l border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 text-sidebar-foreground">
          <Users className="h-5 w-5" />
          <span className="font-semibold">Online</span>
          <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">{sortedUsers.length}</span>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sortedUsers.map((user) => (
            <div
              key={user._id}
              className={cn("flex items-center gap-2 p-2 rounded-md", "hover:bg-sidebar-accent transition-colors")}
            >
              <div className="relative">
                <div className="h-8 w-8 rounded-md bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">{user.username[0].toUpperCase()}</span>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-online border-2 border-sidebar" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.username}
                  {user._id === currentUserId && <span className="text-muted-foreground font-normal ml-1">(you)</span>}
                </p>
              </div>
            </div>
          ))}
          {sortedUsers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No users online</p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
