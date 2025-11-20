// Shared types for dashboard components

export interface Problem {
  id: string
  title: string
  problem_number: number
  description: string | null
  category: string | null
}

export interface Profile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  is_public: boolean
  institution: string[] | null
  website: string[] | null
  websites: string[] | null
  full_name: string | null
  email: string | null
  summary: string | null
  location: string | null
  contact_json: Record<string, any> | null
}

export interface Submission {
  id: string
  created_at: string
  user_id: string
  problem_id: string
  code: string
  language: string | null
  metrics: Record<string, any> | null
  status: string | null
  problems?: Problem | null
  profiles?: Profile | null
}

export interface ProblemGroupedSubmissions {
  problem_id: string
  problem_title?: string
  problem_number?: number
  submissions: Submission[]
}
