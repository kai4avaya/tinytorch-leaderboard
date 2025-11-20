import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SubmissionsByProblem } from './_components/submissions-by-problem'
import { UserHeader } from './_components/user-header'
import { Submission, ProblemGroupedSubmissions } from './_components/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch all submissions with problem details (limit 10 users worth)
  const { data: allSubmissions, error: allSubmissionsError } = await supabase
    .from('submissions')
    .select('*, problems(title, problem_number, id)')
    .order('created_at', { ascending: false })
    .limit(100) // Limit total submissions

  // Fetch current user's submissions with problem details
  const { data: mySubmissions, error: mySubmissionsError } = await supabase
    .from('submissions')
    .select('*, problems(title, problem_number, id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Get unique user IDs from submissions
  const getAllUserIds = (submissions: Submission[] | null): string[] => {
    if (!submissions) return []
    const userIds = new Set<string>()
    submissions.forEach((s) => userIds.add(s.user_id))
    return Array.from(userIds)
  }

  const allUserIds = getAllUserIds(allSubmissions)
  const myUserIds = getAllUserIds(mySubmissions)
  const uniqueUserIds = Array.from(new Set([...allUserIds, ...myUserIds]))

  // Fetch profiles for all users
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, is_public, institution, websites, website, full_name, email, summary, location, contact_json')
    .in('id', uniqueUserIds)

  // Define profile type
  type Profile = {
    id: string
    display_name: string | null
    username: string | null
    avatar_url: string | null
    is_public: boolean
    institution: string[] | null
    websites: string[] | null
    website: string[] | null
    full_name: string | null
    email: string | null
    summary: string | null
    location: string | null
    contact_json: any
  }

  // Create a map of user_id -> profile for quick lookup
  const profileMap = new Map<string, Profile>()
  if (profiles) {
    profiles.forEach((profile) => {
      if (profile) {
        profileMap.set(profile.id, profile)
      }
    })
  }

  // Merge profiles into submissions
  const mergeProfiles = (submissions: Submission[] | null): Submission[] => {
    if (!submissions) return []
    return submissions.map((submission) => ({
      ...submission,
      profiles: profileMap.get(submission.user_id) || null,
    }))
  }

  const allSubmissionsWithProfiles = mergeProfiles(allSubmissions)
  const mySubmissionsWithProfiles = mergeProfiles(mySubmissions)

  // Group submissions by problem_id and extract problem info
  const groupByProblem = (submissions: Submission[]): ProblemGroupedSubmissions[] => {
    const grouped = new Map<string, { submissions: Submission[], problem_title?: string, problem_number?: number }>()
    
    submissions.forEach((submission) => {
      const problemId = submission.problem_id
      const problem = submission.problems
      
      if (!grouped.has(problemId)) {
        grouped.set(problemId, {
          submissions: [],
          problem_title: problem?.title,
          problem_number: problem?.problem_number,
        })
      }
      grouped.get(problemId)!.submissions.push(submission)
    })

    return Array.from(grouped.entries()).map(([problem_id, data]) => ({
      problem_id,
      problem_title: data.problem_title,
      problem_number: data.problem_number,
      submissions: data.submissions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    }))
  }

  const allGrouped = allSubmissionsWithProfiles ? groupByProblem(allSubmissionsWithProfiles) : []
  const myGrouped = mySubmissionsWithProfiles ? groupByProblem(mySubmissionsWithProfiles) : []

  return (
    <div className="container mx-auto p-6 space-y-6">
      <UserHeader user={user} allSubmissions={allSubmissionsWithProfiles} />

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Users (Top 10)</TabsTrigger>
          <TabsTrigger value="mine">My Submissions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <SubmissionsByProblem groupedSubmissions={allGrouped} />
        </TabsContent>
        
        <TabsContent value="mine" className="mt-6">
          <SubmissionsByProblem groupedSubmissions={myGrouped} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
