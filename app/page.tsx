import { Button } from "@/components/ui/button"
import { Wrench } from "lucide-react"
import Link from "next/link"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const user = await currentUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-2xl">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Wrench className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Welcome to GearGuard</h1>
        <p className="text-lg text-muted-foreground">
          Your comprehensive maintenance management system. Track equipment, manage requests, coordinate teams, and
          schedule maintenance all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/auth/sign-in">Sign In</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/sign-up">Create Account</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
