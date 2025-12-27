"use client"

import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">GearGuard</h1>
          <p className="text-muted-foreground">Sign in to your maintenance dashboard</p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg border-2"
            }
          }}
          routing="path"
          path="/auth/sign-in"
          signUpUrl="/auth/sign-up"
          afterSignInUrl="/dashboard"
          afterSignUpUrl="/dashboard"
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    </div>
  )
}
