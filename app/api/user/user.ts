const BASE_URL = 'http://localhost:5001';

export interface UpdateUserProfilePayload {
	email: string,
  github_link?: string;
  linkedin_link?: string;
  facebook_link?: string;
  rank?: number;
  bio?: string;
  tech_stack?: string[]; 
  programming_languages?: string[]; 
  role?: string;
  profile_picture?: string;
}

export interface UpdateUserProfileResponse {
  message: string;
}

export async function updateUserProfile(
  payload: UpdateUserProfilePayload
): Promise<UpdateUserProfileResponse> {

  const response = await fetch(`${BASE_URL}/api/user/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update profile");
  }

  return response.json();
}