import { auth, currentUser } from '@clerk/nextjs/server'

export async function getClerkUser() {
  const user = await currentUser()
  return user
}

export async function getClerkAuth() {
  const { userId } = await auth()
  return { userId }
}

