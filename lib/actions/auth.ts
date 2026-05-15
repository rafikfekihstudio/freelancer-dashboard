"use server"

import { signIn } from "@/lib/auth"

export async function signInAction(
  _prev: { error?: string } | { ok: boolean } | null,
  formData: FormData
): Promise<{ error?: string } | { ok: boolean } | null> {
  try {
    const result = await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    })

    if (result?.error) {
      return { error: "Invalid email or password" }
    }

    return { ok: true }
  } catch {
    return { error: "Invalid email or password" }
  }
}
