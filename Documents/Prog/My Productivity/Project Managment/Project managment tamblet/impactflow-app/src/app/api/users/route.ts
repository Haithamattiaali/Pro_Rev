import { NextRequest, NextResponse } from 'next/server'

// Simplified User type for assignment purposes
interface SimpleUser {
  id: string
  email: string
  name: string
  role: string
  teamId?: string
}

// Mock users data - in production this would come from database
const mockUsers: SimpleUser[] = [
  {
    id: 'user1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    role: 'PROJECT_MANAGER',
    teamId: 'team1',
  },
  {
    id: 'user2',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    role: 'TEAM_LEAD',
    teamId: 'team1',
  },
  {
    id: 'user3',
    email: 'mike.johnson@example.com',
    name: 'Mike Johnson',
    role: 'DEVELOPER',
    teamId: 'team1',
  },
  {
    id: 'user4',
    email: 'sarah.williams@example.com',
    name: 'Sarah Williams',
    role: 'DEVELOPER' as Role,
    organizationId: 'org1',
    teamIds: ['team2'],
    permissions: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'user5',
    email: 'robert.brown@example.com',
    name: 'Robert Brown',
    role: 'ADMIN',
    teamId: 'team1',
  },
  {
    id: 'user6',
    email: 'emily.davis@example.com',
    name: 'Emily Davis',
    role: 'PROJECT_MANAGER',
    teamId: 'team2',
  },
  {
    id: 'user7',
    email: 'david.miller@example.com',
    name: 'David Miller',
    role: 'MEMBER',
    teamId: 'team1',
  },
  {
    id: 'user8',
    email: 'lisa.wilson@example.com',
    name: 'Lisa Wilson',
    role: 'DEVELOPER',
    teamId: 'team1',
  },
]

export async function GET(request: NextRequest) {
  try {
    // In production, you would:
    // 1. Verify authentication
    // 2. Get organizationId from session
    // 3. Fetch users from database filtered by organization
    // 4. Apply any role-based access control

    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
    const teamId = searchParams.get('teamId')
    
    let filteredUsers = [...mockUsers]
    
    // Filter by team if teamId is provided
    if (teamId) {
      filteredUsers = filteredUsers.filter(user => 
        user.teamId === teamId
      )
    }
    
    // Sort users by role hierarchy
    const roleOrder = ['ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD', 'DEVELOPER', 'MEMBER']
    filteredUsers.sort((a, b) => {
      const aIndex = roleOrder.indexOf(a.role || 'MEMBER')
      const bIndex = roleOrder.indexOf(b.role || 'MEMBER')
      return aIndex - bIndex
    })

    return NextResponse.json({
      users: filteredUsers,
      total: filteredUsers.length,
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}