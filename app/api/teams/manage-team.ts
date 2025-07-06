const BASE_URL = 'http://localhost:5001';

interface CreateTeamRequest {
  name: string;
}

interface CreateTeamResponse {
  teamId: number;
  joinCode: string;
}

interface JoinTeamRequest {
  joinCode: string;
}

interface JoinTeamResponse {
  message: string;
}

interface LeaveTeamResponse {
  message: string;
}

interface PromoteToAdminRequest {
  targetUserEmail: string;  
}

interface PromoteToAdminResponse {
  message: string;
  user: string;  
}

// Add demote interface
interface DemoteAdminRequest {
  targetUserEmail: string;
}

interface DemoteAdminResponse {
  message: string;
}

interface DeleteTeamResponse {
  message: string;
}

interface TeamAPIError {
  error: string;
}

export interface TeamInfo {
  id: number;
  name: string;
  join_code: string;
  created_at: string;  
  members: TeamMember[];
}

interface TeamMember {
  username: string;
  email: string;
  is_admin: boolean;
  profile_picture?: string;
}

const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

export const createTeam = async (teamData: CreateTeamRequest): Promise<CreateTeamResponse> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const response = await fetch(`${BASE_URL}/api/team/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(teamData),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as TeamAPIError;
      throw new Error(error.error || 'Failed to create team');
    }

    return data as CreateTeamResponse;
  } catch (error) {
    console.error('Create team error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Network error occurred while creating team');
  }
};

export const joinTeam = async (joinData: JoinTeamRequest): Promise<JoinTeamResponse> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const response = await fetch(`${BASE_URL}/api/team/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(joinData),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as TeamAPIError;
      throw new Error(error.error || 'Failed to join team');
    }

    return data as JoinTeamResponse;
  } catch (error) {
    console.error('Join team error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Network error occurred while joining team');
  }
};

export const leaveTeam = async (): Promise<LeaveTeamResponse> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const response = await fetch(`${BASE_URL}/api/team/leave`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as TeamAPIError;
      throw new Error(error.error || 'Failed to leave team');
    }

    return data as LeaveTeamResponse;
  } catch (error) {
    console.error('Leave team error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Network error occurred while leaving team');
  }
};

export const promoteToAdmin = async (promoteData: PromoteToAdminRequest): Promise<PromoteToAdminResponse> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const response = await fetch(`${BASE_URL}/api/team/promote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(promoteData),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as TeamAPIError;
      throw new Error(error.error || 'Failed to promote user');
    }

    return data as PromoteToAdminResponse;
  } catch (error) {
    console.error('Promote user error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Network error occurred while promoting user');
  }
};

// Add demote function
export const demoteAdmin = async (demoteData: DemoteAdminRequest): Promise<DemoteAdminResponse> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const response = await fetch(`${BASE_URL}/api/team/demote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(demoteData),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as TeamAPIError;
      throw new Error(error.error || 'Failed to demote user');
    }

    return data as DemoteAdminResponse;
  } catch (error) {
    console.error('Demote user error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Network error occurred while demoting user');
  }
};

export const deleteTeam = async (): Promise<DeleteTeamResponse> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const response = await fetch(`${BASE_URL}/api/team/delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as TeamAPIError;
      throw new Error(error.error || 'Failed to delete team');
    }

    return data as DeleteTeamResponse;
  } catch (error) {
    console.error('Delete team error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Network error occurred while deleting team');
  }
};

export const getCurrentTeam = async (): Promise<TeamInfo | null> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const response = await fetch(`${BASE_URL}/api/team/current`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; 
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to get team info');
    }

    return await response.json() as TeamInfo;
  } catch (error) {
    console.error('Get current team error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Network error occurred while getting team info');
  }
};

