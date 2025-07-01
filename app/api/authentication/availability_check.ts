import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:5000';

export interface AvailabilityResponse {
	username?: string;
	email?: string;
	exists: boolean;
	available: boolean;
}

export const checkUsernameAvailability = async (username: string): Promise<AvailabilityResponse> => {
	try {
		console.log(BASE_URL)
		const response = await fetch(`${BASE_URL}/api/auth/check/username/${username}`);

		if (!response.ok) {
			throw new Error('Failed to check username availability');
		}
		return await response.json();
	} catch (error) {
		console.error('Error checking username:', error);
		throw error;
	}
};

export const checkEmailAvailability = async (email: string): Promise<AvailabilityResponse> => {
	try {
		const response = await fetch(`${BASE_URL}/api/auth/check/email/${email}`);

		if (!response.ok) {
			throw new Error('Failed to check email availability');
		}
		return await response.json();
	} catch (error) {
		console.error('Error checking email:', error);
		throw error;
	}
};

