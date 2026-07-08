import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const FAQ = [
  {
    q: "Is my conversation really private?",
    a: "Yes. Cove uses WebRTC, whose connections are always encrypted end-to-end with DTLS. Messages and files travel directly between the two devices — the server never receives them, so your conversation is never stored anywhere.",
  },
  {
    q: "What does the server do, then?",
    a: "Only introductions. When you share a code, the server passes the initial connection handshake (network addresses and encryption setup) between the two devices. The moment the direct link is established, the server is no longer involved.",
  },
  {
    q: "Do I need an account?",
    a: "No. There is no sign-up, no email, no password. You are never asked who you are, so there is nothing about you to store or leak.",
  },
  {
    q: "Can I choose my own code?",
    a: "Yes. You can let Cove generate a random code, or type your own number or word. Whoever enters the same code first becomes the host; the second person to enter it joins.",
  },
  {
    q: "How large can the files be?",
    a: "Files transfer directly device-to-device, so there is no upload limit imposed by a server. Large files are split into chunks and sent reliably, so nothing is lost mid-transfer.",
  },
  {
    q: "Does it work between different networks?",
    a: "Most of the time, yes — public STUN servers help the two devices find a path to each other. A small share of very strict corporate or mobile networks may need an optional TURN relay, which still cannot read your encrypted data.",
  },
]

export function Faq() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <div className="text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Questions
        </h2>
      </div>
      <Accordion type="single" collapsible className="mt-10">
        {FAQ.map((item, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left text-base">{item.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
