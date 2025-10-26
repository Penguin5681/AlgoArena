import axios from "axios";
import { getUserData } from "../authentication/auth";

const BASE_URL = 'http://localhost:5000/api/learn';

// Corrected: Removed slug and difficulty as they are not in the summary response.
export type TopicSummary = {
  id: number;
  title: string;
  section: 'core' | 'linear' | 'nonlinear';
  xp: number;
  status: 'not_started' | 'ongoing' | 'completed';
};

export type CodeExample = {
  language: 'cpp' | 'java' | 'javascript' | 'python';
  code: string;
};

export type TopicDetails = {
  id: number;
  title: string;
  slug: string;
  markdown: string;
  diagrams: [string, string][] | null; // Diagrams can be null
  code_examples: CodeExample[];
  xp: number;
};

export type Question = {
  id: string;
  topic_id: number;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xp: number;
  is_passed: boolean | null;
  duration_sec: number | null;
  status: 'not_started' | 'ongoing' | 'completed' | null;
};

export type Mcq = {
  id: string;
  topic_id: number;
  question: string;
  options: string[];
  correct_index: number;
};

export type UserXP = {
  total_xp: number;
};

export type TopicProgress = {
  topic_id: number;
  status: 'completed';
};

export type QuestionProgress = {
  question_id: string;
  is_passed: boolean;
};

export type UserProgress = {
  topic_progress: TopicProgress[];
  question_progress: QuestionProgress[];
};

export const fetchTopicSummary = async (): Promise<TopicSummary[]> => {
  const res = await axios.get(`${BASE_URL}/summary`);
  return res.data;
};

export const fetchTopicDetails = async (id: number, ): Promise<TopicDetails> => {
  const res = await axios.get(`${BASE_URL}/topic/${id}`);
  return res.data;
};

export const fetchTopicQuestions = async (topicId: number, ): Promise<Question[]> => {
  const userId = getUserData()?.id;
  const res = await axios.get(`${BASE_URL}/topic/${topicId}/questions`, {
    params: { user_id: userId },
  });
  return res.data;
};

export const fetchTopicMcqs = async (id: number, ): Promise<Mcq[]> => {
  const res = await axios.get(`${BASE_URL}/topic/${id}/mcqs`);
  return res.data;
};

export const fetchUserXP = async (id: number | undefined): Promise<UserXP> => {
  const res = await axios.post(`${BASE_URL}/xp`, { user_id: id });
  return res.data;
};

export const fetchUserProgress = async (id: number | undefined): Promise<UserProgress> => {
  const res = await axios.get(`${BASE_URL}/progress`, { params: { user_id: id } });
  return res.data;
};

export const updateTopicProgress = async ({
  topicId,
  status,
  userId,
}: {
  topicId: number;
  status: "completed";
  userId: number | undefined;
}) => {
  await axios.post(`${BASE_URL}/progress/topic`, { user_id: userId, topic_id: topicId, status });
};

export const updateQuestionProgress = async ({
  questionId,
  isPassed,
  durationSec,
  userId,
}: {
  questionId: string;
  isPassed: boolean;
  durationSec: number;
  userId: number | undefined;
}) => {
  await axios.post(`${BASE_URL}/progress/question`, {
    user_id: userId,
    question_id: questionId,
    is_passed: isPassed,
    duration_sec: durationSec,
    status: "completed",
  });
};