import { Button } from "@/components/ui/button"

export function LoggedInView({ userEmail, cliMode = false }: { userEmail?: string, cliMode?: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 text-center">
        <h1 className="mb-2 text-xl font-semibold text-black dark:text-zinc-50">
          You are logged in
        </h1>
        {userEmail && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            Signed in as <span className="font-medium">{userEmail}</span>
          </p>
        )}
        
        {cliMode && (
          <div className="mb-6 rounded-md bg-green-50 p-4 dark:bg-green-900/20">
            <p className="text-sm text-green-700 dark:text-green-300">
               You can close this page and return to your Terminal.
            </p>
          </div>
        )}

        <form action="/auth/signout" method="POST">
          <Button type="submit" variant="outline" className="w-full border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  )
}
