import { LoginForm } from "./login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Freelancer Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Sign in to your account
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
