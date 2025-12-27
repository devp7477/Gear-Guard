"use client"

import { SignIn } from "@clerk/nextjs"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold">GearGuard</h1>
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
        />
      </div>
    </div>
  )
}
