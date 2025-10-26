import { getUserData } from "../authentication/auth";

const BASE_URL = "http://localhost:5000";

export interface UpdateUserProfilePayload {
  email: string;
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

export interface UserProfileDataResponse {
  username: string;
  email: string;
  password: string;
  firebase_uid: string;
  profile_picture: string;
  github_link: string;
  linkedin_link: string;
  facebook_link: string;
  rank: number;
  bio: string;
  tech_stack: string[];
  programming_languages: string[];
  role: string;
  badges: string[]
}

export interface UpdateUserProfileResponse {
  message: string;
}

export interface RecordUserActivityPayload {
  userId: string | number;
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

export async function getUserProfile(): Promise<UserProfileDataResponse> {
  const emailId = getUserData()?.email;
  const response = await fetch(
    `${BASE_URL}/api/profile/get-profile/${emailId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || "Failed to retrive profile, check backend logs"
    );
  }

  return response.json();
}

export async function recordUserActivity() {
  const userId = getUserData()?.id;
  const response = await fetch(
    `${BASE_URL}/api/user/record-activity`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to record user activity");
  }

  return response.json();
};

export async function getUserActivityHeatmap() {
  const userId = getUserData()?.id;
  const response = await fetch(
    `${BASE_URL}/api/user/get-heatmap/${userId}`,
    {
      method: "GET"
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to retrive user heatmap");
  }

  return response.json();
};