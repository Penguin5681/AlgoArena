type LeaderboardUser = {
  id: number;
  username: string;
  email: string;
  github_link: string | null;
  linkedin_link: string | null;
  facebook_link: string | null;
  rank: number;
  bio: string | null;
  tech_stack: string[] | null;
  programming_languages: string[] | null;
  role: string | null;
  badges: string[];
  total_xp: number;
  profile_picture: string | null;
};

type LeaderboardResponse = {
  success: boolean;
  data: {
    totalUsers: number;
    users: LeaderboardUser[];
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
    };
  };
};

type UserProfile = {
  email: string;
  username: string;
  github_link: string | null;
  linkedin_link: string | null;
  facebook_link: string | null;
  profile_picture: string | null;
  rank: number;
  bio: string | null;
  tech_stack: string[];
  programming_languages: string[];
  role: string | null;
  badges: string[];
};

type TeamMember = LeaderboardUser & { is_admin?: boolean };

type TeamLeaderboardResponse = {
  success: boolean;
  data: {
    totalMembers: number;
    members: TeamMember[];
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
    };
  };
};