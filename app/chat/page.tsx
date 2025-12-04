import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { ChatLayout } from "@/components/chat/chat-layout"

export default async function ChatPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return <ChatLayout user={session} />
}
