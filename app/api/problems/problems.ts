import dotenv from 'dotenv';
import { useState } from 'react';
dotenv.config();

const BASE_URL = 'http://localhost:5001';
const CODE_EXECUTION_URL = `${BASE_URL}/api/code-execution`;

export interface Problem {
  id: string; // Changed from number to string
  title: string;
  description: string;
  constraints: string;
  difficulty: 'easy' | 'medium' | 'hard';
  time_complexity: string;
  space_complexity: string;
  hints: string[];
  xp: number;
  created_at: string;
  topic: string;
  topic_id: number;
  test_case_count: number;
  sample_test_case_count: number;
}

export interface TestCase {
  id: number;
  input: string;
  expected_output: string;
  is_sample: boolean;
}

export interface ProblemWithTestCases extends Problem {
  testCases: TestCase[];
  sampleTestCases: TestCase[];
  totalTestCases: number;
}

export interface Topic {
  id: number;
  name: string;
  problem_count: number;
  easy_count: number;
  medium_count: number;
  hard_count: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ProblemFilters {
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ProblemsResponse {
  success: boolean;
  data: {
    problems: Problem[];
    pagination: PaginationInfo;
  };
}

export interface ProblemResponse {
  success: boolean;
  data: ProblemWithTestCases;
}

export interface TopicsResponse {
  success: boolean;
  data: {
    topics: Topic[];
  };
}

export interface ProblemsByTopicResponse {
  success: boolean;
  data: {
    problems: Problem[];
    topicId: number;
    pagination: {
      limit: number;
      offset: number;
    };
  };
}

export interface SubmitCodePayload {
  language: string;
  code: string;
}

export interface CompileCodePayload extends SubmitCodePayload {
  stdin?: string;
}

export interface SubmitOrCompileResponse {
  success: boolean;
  data: {
    submissionId: number;
    status: string;
    message: string;
  };
}

export interface SubmissionTestResult {
  testCaseId: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  executionTime: number;
  memory: number;
}

export interface Submission {
  submission_id: number;
  language: string;
  status: 'pending' | 'success' | 'runtime_error' | 'compile_error' | 'wrong_answer' | 'time_limit_exceeded';
  stdout: string | null;
  stderr: string | null;
  execution_time: number | null;
  problem_title: string | null;
  test_results: SubmissionTestResult[] | null;
  tests_passed: number | null;
  total_tests: number | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionResponse {
  success: boolean;
  data: Submission;
}

// API Functions
export async function getAllProblems(
  filters: ProblemFilters = {},
  pagination: PaginationParams = {}
): Promise<ProblemsResponse> {
  try {
    const {
      difficulty,
      topic
    } = filters;

    const {
      limit = 50,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = pagination;

    const searchParams = new URLSearchParams();
    
    if (difficulty) searchParams.append('difficulty', difficulty);
    if (topic) searchParams.append('topic', topic);
    searchParams.append('limit', limit.toString());
    searchParams.append('offset', offset.toString());
    searchParams.append('sortBy', sortBy);
    searchParams.append('sortOrder', sortOrder);

    const response = await fetch(`${BASE_URL}/api/seed/problems?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ProblemsResponse = await response.json();
    return result;

  } catch (error) {
    console.error('Error fetching problems:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch problems');
  }
}

export async function getProblemById(id: string): Promise<ProblemResponse> { // Changed parameter type
  try {
    if (!id) {
      throw new Error('Problem ID is required');
    }

    const response = await fetch(`${BASE_URL}/api/seed/problems/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Problem not found');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ProblemResponse = await response.json();
    return result;

  } catch (error) {
    console.error('Error fetching problem by ID:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch problem');
  }
}

export async function getProblemsByTopic(
  topicId: number,
  pagination: { limit?: number; offset?: number } = {}
): Promise<ProblemsByTopicResponse> {
  try {
    if (!topicId) {
      throw new Error('Topic ID is required');
    }

    const { limit = 20, offset = 0 } = pagination;

    const searchParams = new URLSearchParams();
    searchParams.append('limit', limit.toString());
    searchParams.append('offset', offset.toString());

    const response = await fetch(`${BASE_URL}/api/seed/problems/topic/${topicId}?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ProblemsByTopicResponse = await response.json();
    return result;

  } catch (error) {
    console.error('Error fetching problems by topic:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch problems by topic');
  }
}

export async function getTopics(): Promise<TopicsResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/seed/problems/topics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: TopicsResponse = await response.json();
    return result;

  } catch (error) {
    console.error('Error fetching topics:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch topics');
  }
}

export async function submitCodeForProblem(problemId: string, payload: SubmitCodePayload): Promise<SubmitOrCompileResponse> {
  try {
    const response = await fetch(`${CODE_EXECUTION_URL}/problems/${problemId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error submitting code for problem:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to submit code');
  }
}

export async function submitCodeForCompilation(payload: CompileCodePayload): Promise<SubmitOrCompileResponse> {
  try {
    const response = await fetch(`${CODE_EXECUTION_URL}/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error submitting code for compilation:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to compile code');
  }
}

export async function getSubmissionResult(submissionId: number): Promise<SubmissionResponse> {
  try {
    const response = await fetch(`${CODE_EXECUTION_URL}/submissions/${submissionId}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching submission result:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch submission result');
  }
}

export function filterProblemsByDifficulty(problems: Problem[], difficulty: 'easy' | 'medium' | 'hard'): Problem[] {
  return problems.filter(problem => problem.difficulty === difficulty);
}

export function sortProblems(problems: Problem[], sortBy: keyof Problem, sortOrder: 'ASC' | 'DESC' = 'DESC'): Problem[] {
  return [...problems].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (aValue < bValue) {
      return sortOrder === 'ASC' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === 'ASC' ? 1 : -1;
    }
    return 0;
  });
}

export function getProblemDifficultyColor(difficulty: 'easy' | 'medium' | 'hard'): string {
  switch (difficulty) {
    case 'easy':
      return '#10b981'; // green
    case 'medium':
      return '#f59e0b'; // yellow
    case 'hard':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
}

export function formatProblemCreatedAt(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function useProblemFilters() {
  const [filters, setFilters] = useState<ProblemFilters>({});
  const [pagination, setPagination] = useState<PaginationParams>({
    limit: 50,
    offset: 0,
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });

  const updateFilter = (key: keyof ProblemFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, offset: 0 })); 
  };

  const updatePagination = (key: keyof PaginationParams, value: any) => {
    setPagination(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({});
    setPagination({
      limit: 50,
      offset: 0,
      sortBy: 'created_at',
      sortOrder: 'DESC'
    });
  };

  return {
    filters,
    pagination,
    updateFilter,
    updatePagination,
    resetFilters
  };
}