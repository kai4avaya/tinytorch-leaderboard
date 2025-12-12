import { CliStateView } from '@/components/cli-state-view'

export default async function CliLoggedInPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const params = await searchParams
  return <CliStateView state="login" email={params.email} />
}
