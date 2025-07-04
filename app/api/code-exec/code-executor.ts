import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/code';

export type Language = 'cpp' | 'java' | 'javascript' | 'python';

export type CodeStatus = 'success' | 'error' | 'timeout' | 'running';

export interface CodeSubmissionRequest {
  code: string;
  language: Language;
  stdin?: string;
  userId: number;
}

export interface CodeSubmissionResponse {
  submissionId: number;
}

export interface CodeExecutionResult {
  id: number;
  status: CodeStatus;
  stdout: string;
  stderr: string;
  executionTime: number;
  memoryUsage: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Submit code for execution
 * @param payload - Code submission data
 * @returns Promise with submission ID
 */
export const submitCode = async (payload: CodeSubmissionRequest): Promise<CodeSubmissionResponse> => {
  try {
    const response = await axios.post(`${BASE_URL}/submit`, payload);
    return response.data;
  } catch (error) {
    console.error('Error submitting code:', error);
    throw error;
  }
};

/**
 * Get code execution result by submission ID
 * @param submissionId - The submission ID to check
 * @returns Promise with execution result
 */
export const getCodeResult = async (submissionId: number): Promise<CodeExecutionResult> => {
  try {
    const response = await axios.get(`${BASE_URL}/result/${submissionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching code result:', error);
    throw error;
  }
};

/**
 * Submit code and poll for result
 * @param payload - Code submission data
 * @param maxRetries - Maximum number of polling attempts (default: 20)
 * @param pollingInterval - Polling interval in milliseconds (default: 1000)
 * @returns Promise with final execution result
 */
export const submitCodeAndWaitForResult = async (
  payload: CodeSubmissionRequest,
  maxRetries: number = 20,
  pollingInterval: number = 1000
): Promise<CodeExecutionResult> => {
  try {
    // Submit the code
    const { submissionId } = await submitCode(payload);
    
    // Poll for result
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const result = await getCodeResult(submissionId);
      
      // If execution is complete (not running), return result
      if (result.status !== 'running') {
        return result;
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
    }
    
    throw new Error('Code execution timeout - exceeded maximum polling attempts');
  } catch (error) {
    console.error('Error in submitCodeAndWaitForResult:', error);
    throw error;
  }
};

/**
 * Helper function to format execution time
 * @param executionTime - Execution time in milliseconds
 * @returns Formatted time string
 */
export const formatExecutionTime = (executionTime: number): string => {
  if (executionTime < 1000) {
    return `${executionTime}ms`;
  } else {
    return `${(executionTime / 1000).toFixed(2)}s`;
  }
};

/**
 * Helper function to format memory usage
 * @param memoryUsage - Memory usage in bytes
 * @returns Formatted memory string
 */
export const formatMemoryUsage = (memoryUsage: number | null): string => {
  if (memoryUsage === null) return 'N/A';
  
  if (memoryUsage < 1024) {
    return `${memoryUsage}B`;
  } else if (memoryUsage < 1024 * 1024) {
    return `${(memoryUsage / 1024).toFixed(2)}KB`;
  } else {
    return `${(memoryUsage / (1024 * 1024)).toFixed(2)}MB`;
  }
};