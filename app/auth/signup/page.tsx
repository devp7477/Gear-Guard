"use client"

import { SignUp } from "@clerk/nextjs"
import Link from "next/link"

export default function SignupPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold">GearGuard</h1>
          <p className="text-muted-foreground">Create your technician account</p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg border-2"
            }
          }}
          routing="path"
          path="/auth/sign-up"
          signInUrl="/auth/sign-in"
        />
      </div>
    </div>
  )
}
