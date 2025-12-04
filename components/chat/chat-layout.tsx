"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ChannelSidebar } from "./channel-sidebar";
import { ChannelHeader } from "./channel-header";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { OnlineUsers } from "./online-users";
import { BrowseChannels } from "./browse-channels";
import { useMessages } from "@/hooks/use-messages";
import { usePresence } from "@/hooks/use-presence";
import { toast } from "sonner";
import { Menu, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

interface Member {
  _id: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
}

interface Channel {
  _id: string;
  name: string;
  description?: string;
  members: Member[];
}

interface ChatLayoutProps {
  user: User;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ChatLayout({ user }: ChatLayoutProps) {
  const router = useRouter();
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);

  // Fetch channels
  const { data: channelsData, mutate: mutateChannels } = useSWR<{
    channels: Channel[];
  }>("/api/channels", fetcher, {
    revalidateOnFocus: false,
  });

  const channels = channelsData?.channels || [];

  // Messages hook
  const {
    messages,
    isLoading: isMessagesLoading,
    hasMore,
    isLoadingMore,
    loadMore,
    sendMessage,
  } = useMessages(currentChannel?._id || null);

  // Presence hook
  const { onlineUsers } = usePresence();

  // Set initial channel
  useEffect(() => {
    if (channels.length > 0 && !currentChannel) {
      setCurrentChannel(channels[0]);
    }
  }, [channels, currentChannel]);

  // Refresh channel data when selected
  useEffect(() => {
    if (currentChannel) {
      fetch(`/api/channels/${currentChannel._id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.channel) {
            setCurrentChannel(data.channel);
          }
        })
        .catch(console.error);
    }
  }, [currentChannel?._id]);

  const handleSelectChannel = useCallback((channel: Channel) => {
    setCurrentChannel(channel);
    setIsSidebarOpen(false);
  }, []);

  const handleCreateChannel = useCallback(
    async (name: string, description: string) => {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create channel");
      }

      await mutateChannels();
      setCurrentChannel(data.channel);
    },
    [mutateChannels]
  );

  const handleJoinChannel = useCallback(
    async (channelId: string) => {
      const res = await fetch(`/api/channels/${channelId}/join`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to join channel");
      }

      await mutateChannels();
      setCurrentChannel(data.channel);
    },
    [mutateChannels]
  );

  const handleLeaveChannel = useCallback(async () => {
    if (!currentChannel) return;

    try {
      const res = await fetch(`/api/channels/${currentChannel._id}/leave`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to leave channel");
      }

      toast.success("Left channel");
      await mutateChannels();
      setCurrentChannel(
        channels.find((c) => c._id !== currentChannel._id) || null
      );
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [currentChannel, channels, mutateChannels]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [router]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!currentChannel) return;
      await sendMessage(content);
    },
    [currentChannel, sendMessage]
  );

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:transform-none",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <ChannelSidebar
          channels={channels}
          currentChannel={currentChannel}
          onSelectChannel={handleSelectChannel}
          onCreateChannel={handleCreateChannel}
          onLogout={handleLogout}
          user={user}
        />
        <div className="absolute bottom-20 left-0 right-0 px-2">
          <BrowseChannels onJoinChannel={handleJoinChannel} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center gap-2 p-2 border-b border-border bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-foreground flex-1">
            {currentChannel ? `#${currentChannel.name}` : "TeamChat"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsUsersOpen(!isUsersOpen)}
          >
            <Users className="h-5 w-5" />
          </Button>
        </div>

        {/* Channel Header */}
        <div className="hidden lg:block">
          <ChannelHeader
            channel={currentChannel}
            onLeaveChannel={handleLeaveChannel}
          />
        </div>

        {/* Messages */}
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-w-0">
            <MessageList
              messages={messages}
              currentUserId={user.id}
              isLoading={isMessagesLoading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              isLoadingMore={isLoadingMore}
            />
            {currentChannel && (
              <MessageInput
                channelName={currentChannel.name}
                onSendMessage={handleSendMessage}
              />
            )}
          </div>

          {/* Online Users - Desktop */}
          <aside className="hidden xl:block w-60 shrink-0">
            <OnlineUsers users={onlineUsers} currentUserId={user.id} />
          </aside>
        </div>
      </main>

      {/* Mobile Users Panel */}
      {isUsersOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 xl:hidden"
            onClick={() => setIsUsersOpen(false)}
          />
          <aside className="fixed inset-y-0 right-0 z-50 w-64 xl:hidden">
            <div className="h-full flex flex-col bg-sidebar">
              <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
                <span className="font-semibold text-sidebar-foreground">
                  Online Users
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsUsersOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-auto">
                <OnlineUsers users={onlineUsers} currentUserId={user.id} />
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
