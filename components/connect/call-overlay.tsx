"use client"

import { useEffect, useRef } from "react"
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, PhoneIncoming } from "lucide-react"
import type { CallState } from "@/hooks/use-peer"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CallOverlayProps {
  callState: CallState
  callVideo: boolean
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  micOn: boolean
  camOn: boolean
  onAccept: () => void
  onDecline: () => void
  onEnd: () => void
  onToggleMic: () => void
  onToggleCam: () => void
}

// Binds a MediaStream to a <video> element (which also plays audio-only streams).
function StreamVideo({
  stream,
  muted,
  className,
}: {
  stream: MediaStream | null
  muted: boolean
  className?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream
  }, [stream])
  return <video ref={ref} autoPlay playsInline muted={muted} className={className} />
}

export function CallOverlay(props: CallOverlayProps) {
  const { callState, callVideo, localStream, remoteStream, micOn, camOn } = props
  if (callState === "idle") return null

  // Incoming call prompt.
  if (callState === "incoming") {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary">
            <PhoneIncoming className="h-7 w-7" />
          </span>
          <div>
            <p className="text-lg font-medium text-white">Incoming {callVideo ? "video" : "voice"} call</p>
            <p className="text-sm text-white/60">from your peer</p>
          </div>
          <div className="mt-2 flex gap-4">
            <RoundButton label="Decline" tone="danger" onClick={props.onDecline}>
              <PhoneOff className="h-6 w-6" />
            </RoundButton>
            <RoundButton label="Accept" tone="success" onClick={props.onAccept}>
              <Phone className="h-6 w-6" />
            </RoundButton>
          </div>
        </div>
      </Shell>
    )
  }

  // Outgoing (calling) or active call.
  const showVideo = callVideo && callState === "active"

  return (
    <Shell>
      <div className="relative flex h-full w-full items-center justify-center">
        {/* Remote (plays audio for voice calls too) */}
        {showVideo ? (
          <StreamVideo stream={remoteStream} muted={false} className="h-full w-full object-contain" />
        ) : (
          <>
            <StreamVideo stream={remoteStream} muted={false} className="hidden" />
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="grid h-24 w-24 place-items-center rounded-full bg-white/10 text-white">
                <Phone className="h-9 w-9" />
              </span>
              <p className="text-lg font-medium text-white">
                {callState === "calling" ? "Calling…" : "Voice call"}
              </p>
              <p className="text-sm text-white/60">
                {callState === "calling" ? "Waiting for your peer to answer" : "Connected"}
              </p>
            </div>
          </>
        )}

        {/* Local preview (video calls) */}
        {callVideo && localStream && (
          <div className="absolute bottom-24 right-4 h-40 w-28 overflow-hidden rounded-xl border border-white/20 bg-black sm:h-48 sm:w-36">
            <StreamVideo stream={localStream} muted className="h-full w-full object-cover" />
            {!camOn && (
              <div className="absolute inset-0 grid place-items-center bg-black/70 text-white/70">
                <VideoOff className="h-6 w-6" />
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-4">
          <RoundButton label={micOn ? "Mute" : "Unmute"} tone="neutral" onClick={props.onToggleMic}>
            {micOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </RoundButton>
          {callVideo && (
            <RoundButton label={camOn ? "Camera off" : "Camera on"} tone="neutral" onClick={props.onToggleCam}>
              {camOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
            </RoundButton>
          )}
          <RoundButton label="End call" tone="danger" onClick={props.onEnd}>
            <PhoneOff className="h-6 w-6" />
          </RoundButton>
        </div>
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-neutral-950">
      <div className="mx-auto h-full max-w-4xl">{children}</div>
    </div>
  )
}

function RoundButton({
  children,
  label,
  tone,
  onClick,
}: {
  children: React.ReactNode
  label: string
  tone: "success" | "danger" | "neutral"
  onClick: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <Button
        size="icon"
        onClick={onClick}
        aria-label={label}
        className={cn(
          "h-14 w-14 rounded-full text-white",
          tone === "success" && "bg-success hover:bg-success/90",
          tone === "danger" && "bg-destructive hover:bg-destructive/90",
          tone === "neutral" && "bg-white/15 hover:bg-white/25",
        )}
      >
        {children}
      </Button>
      <span className="text-xs text-white/70">{label}</span>
    </div>
  )
}
