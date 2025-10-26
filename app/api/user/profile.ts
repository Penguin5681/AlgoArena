// app/api/user/profile.ts

const API_BASE_URL = "http://localhost:5000/api/profile";

export const updateProfilePicture = async (email: string, file: File) => {
  const formData = new FormData();
  formData.append("email", email);
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload-profile-picture`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload profile picture");
  }

  return response.json();
};

export const updateBio = async (email: string, bio: string, token: string) => {
  const response = await fetch(`${API_BASE_URL}/update-bio`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, bio }),
  });

  if (!response.ok) {
    throw new Error("Failed to update bio");
  }

  return response.json();
};

export const updateRole = async (email: string, role: string, token: string) => {
  const response = await fetch(`${API_BASE_URL}/update-role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, role }),
  });

  if (!response.ok) {
    throw new Error("Failed to update role");
  }

  return response.json();
};

export const updateTechStack = async (email: string, techStack: string[], token: string) => {
  const response = await fetch(`${API_BASE_URL}/update-tech-stack`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, tech_stack: techStack }),
  });

  if (!response.ok) {
    throw new Error("Failed to update tech stack");
  }

  return response.json();
};

export const updateProgrammingLanguages = async (
  email: string,
  programmingLanguages: string[],
  token: string
) => {
  const response = await fetch(`${API_BASE_URL}/update-programming-languages`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, programming_languages: programmingLanguages }),
  });

  if (!response.ok) {
    throw new Error("Failed to update programming languages");
  }

  return response.json();
};

export const updateSocialLinks = async (
    email: string,
    links: { github_link?: string; linkedin_link?: string; facebook_link?: string },
    token: string
) => {
  const response = await fetch(`${API_BASE_URL}/update-social-links`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, ...links }),
  });

  if (!response.ok) {
    throw new Error("Failed to update social links");
  }

  return response.json();
};