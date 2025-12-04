import { LoginForm } from "@/components/auth/login-form"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const session = await getSession()

  if (session) {
    redirect("/chat")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">TeamChat</h1>
          <p className="text-muted-foreground">Sign in to your workspace</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
