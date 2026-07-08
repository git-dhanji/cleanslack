import Link from "next/link"
import { KeyRound, Share2, MessageSquare, Paperclip, LogOut, ArrowRight } from "lucide-react"
import { PageShell } from "@/components/content/page-shell"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Tutorial — Peerlink",
  description: "A step-by-step walkthrough of connecting and chatting privately on Peerlink.",
}

const STEPS = [
  {
    icon: KeyRound,
    title: "Open a connection",
    body: (
      <>
        Go to <Link href="/connect" className="text-primary hover:underline">Connect</Link> and pick
        the <strong>Create</strong> tab. Peerlink shows a ready-made code like{" "}
        <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-sm">brave-otter-4821</code>.
        You can keep it, or type your own code or number — anything at least 3 characters. Press{" "}
        <em>Create &amp; wait for peer</em>.
      </>
    ),
  },
  {
    icon: Share2,
    title: "Share your code",
    body: (
      <>
        You will see a waiting screen with your code and two copy buttons. Send the{" "}
        <strong>code</strong> or the <strong>invite link</strong> to the one person you want to talk
        to — over any app you like. Opening the invite link joins automatically; otherwise they use
        the <strong>Join</strong> tab and paste the code.
      </>
    ),
  },
  {
    icon: MessageSquare,
    title: "Start chatting",
    body: (
      <>
        The moment they join, your two devices link directly and the status turns{" "}
        <span className="text-success">Connected · direct &amp; encrypted</span>. Type in the box and
        press Enter to send. Messages appear only on your two screens and are never stored.
      </>
    ),
  },
  {
    icon: Paperclip,
    title: "Send files",
    body: (
      <>
        Click the paperclip to pick one or more files of any size. Each transfer shows a live
        progress bar as it streams straight to the other device. When it finishes, the receiver taps
        the download icon to save it. Nothing passes through a server.
      </>
    ),
  },
  {
    icon: LogOut,
    title: "Leave when done",
    body: (
      <>
        Press <strong>Leave</strong> (or just close the tab) to end the connection. Because nothing
        was ever saved, the conversation simply disappears — there is no history to delete.
      </>
    ),
  },
]

export default function TutorialPage() {
  return (
    <PageShell
      eyebrow="Tutorial"
      title="Your first private connection"
      intro="Five short steps from opening Peerlink to chatting and sharing files directly, device to device."
    >
      <ol className="space-y-8">
        {STEPS.map((step, i) => (
          <li key={i} className="relative flex gap-5">
            <div className="flex flex-col items-center">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <step.icon className="h-5 w-5" />
              </span>
              {i < STEPS.length - 1 && <span className="mt-2 w-px flex-1 bg-border" />}
            </div>
            <div className="pb-2">
              <h3 className="text-lg font-semibold">
                <span className="text-muted-foreground">Step {i + 1} · </span>
                {step.title}
              </h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-14 rounded-2xl border border-border bg-card p-6 text-center">
        <h3 className="text-lg font-semibold">Ready to try it?</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Open a connection on one device and this page&apos;s steps on the other. You will be
          chatting privately in under a minute.
        </p>
        <Button asChild className="mt-5">
          <Link href="/connect">
            Open Connect
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </PageShell>
  )
}
