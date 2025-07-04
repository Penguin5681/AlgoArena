"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Loader,
  Award,
  Menu,
  X,
  Code,
  FileQuestion,
  Play,
  Timer,
} from "lucide-react";
import styles from "./learn.module.css";
import Header from "@/app/components/header/base/Header";
import MonacoEditor from "@/app/components/editor/MonacoEditor";
import GradientButton from "@/app/components/buttons/base/GradientButton";
import {
  fetchTopicSummary,
  fetchTopicDetails,
  fetchTopicQuestions,
  fetchTopicMcqs,
  TopicDetails as ApiTopicDetails,
  updateQuestionProgress,
  updateTopicProgress,
  fetchUserXP,
  fetchUserProgress,
  UserProgress,
} from "@/app/api/learn/learn";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ZoomableImage from "@/app/components/image/ZoomableImage";
import { useAuth } from "@/app/context/AuthContext";
import { getAuthToken, getUserData } from "@/app/api/authentication/auth";
import {
  submitCodeAndWaitForResult,
  CodeExecutionResult,
  formatExecutionTime,
  formatMemoryUsage,
  Language,
} from "@/app/api/code-exec/code-executor";
import { CheckCircle, XCircle, Clock, Activity } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

type TopicStatus = "completed" | "ongoing" | "not_started";

interface TopicSummary {
  id: number;
  title: string;
  xp_total: number;
  xp_earned: number;
  status: TopicStatus;
}

interface Section {
  name: string;
  topics: TopicSummary[];
}

type Difficulty = "easy" | "medium" | "hard";

interface CodingQuestion {
  id: string;
  topicId: number;
  title: string;
  description: string;
  difficulty: Difficulty;
  xp: number;
  isSolved: boolean; // UI state
}

interface MCQ {
  id: string;
  topicId: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}


const StatusIcon = ({ status }: { status: TopicStatus }) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 size={20} className="text-green-400" />;
    case "ongoing":
      return <Loader size={20} className="text-yellow-400 animate-spin" />;
    case "not_started":
      return <Circle size={20} className="text-gray-500" />;
  }
};


const Sidebar = ({
  sections,
  activeTopicId,
  onSelectTopic,
  isCollapsed,
  onToggle,
}: {
  sections: Section[];
  activeTopicId: number | null;
  onSelectTopic: (id: number) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}) => {
  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}
    >
      <div className={styles.sidebarHeader}>
        {!isCollapsed && <h2>Topics</h2>}
        <button onClick={onToggle} className={styles.toggleButton}>
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      <nav>
        {sections.map((section) => (
          <div key={section.name}>
            <h3 className={styles.sectionTitle}>
              {!isCollapsed && section.name}
            </h3>
            <ul className={styles.topicList}>
              {section.topics.map((topic) => (
                <li
                  key={topic.id}
                  className={`${styles.topicItem} ${
                    activeTopicId === topic.id ? styles.active : ""
                  }`}
                  onClick={() => onSelectTopic(topic.id)}
                  title={topic.title}
                >
                  <div className={styles.statusIndicator}>
                    <StatusIcon status={topic.status} />
                  </div>
                  {!isCollapsed && (
                    <div className={styles.topicDetails}>
                      <div className={styles.topicTitle}>
                        <BookOpen size={16} />
                        <span>{topic.title}</span>
                      </div>
                      <div className={styles.topicMeta}>
                        <span>
                          <Award size={14} />
                          {topic.xp_total} XP
                        </span>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
};

const useStopwatch = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = () => {
    if (!isRunning) {
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }
  };

  const stop = () => {
    if (isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
      setIsRunning(false);
    }
  };

  const reset = () => {
    stop();
    setTime(0);
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (timeInSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return { timeInSeconds: time, formattedTime: formatTime(time), start, stop, reset, isRunning };
};

const CodingChallenge = ({
  question,
  onSolved,
}: {
  question: CodingQuestion;
  onSolved: () => void;
}) => {
  const { timeInSeconds, formattedTime, start, stop } = useStopwatch();
  const [isSolved, setIsSolved] = useState(question.isSolved);
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("javascript");
  const [isExpanded, setIsExpanded] = useState(false);
  const [code, setCode] = useState(
    `// ${question.title}\n// ${question.description}\n\nfunction solve() {\n  // Your code goes here\n  console.log("Hello World");\n}`
  );
  const { user } = useAuth();

  useEffect(() => {
    setIsSolved(question.isSolved);
  }, [question.isSolved]);

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language);
    const templates = {
      javascript: `// ${question.title}\n// ${question.description}\n\nfunction solve() {\n  // Your code goes here\n  console.log("Hello World");\n}`,
      python: `# ${question.title}\n# ${question.description}\n\ndef solve():\n    # Your code goes here\n    print("Hello World")\n\nsolve()`,
      cpp: `// ${question.title}\n// ${question.description}\n\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code goes here\n    cout << "Hello World" << endl;\n    return 0;\n}`,
      java: `// ${question.title}\n// ${question.description}\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Your code goes here\n        System.out.println("Hello World");\n    }\n}`
    };
    setCode(templates[language]);
  };

  const handleRunCode = async () => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    const userId = getUserData()?.id;
    if (!userId) {
      console.error("User ID not found");
      return;
    }

    setIsRunning(true);
    setExecutionResult(null);

    try {
      console.log("Submitting code for execution...");
      const result = await submitCodeAndWaitForResult({
        code,
        language: selectedLanguage,
        stdin: "",
        userId,
      });

      console.log("Execution completed:", result);
      setExecutionResult(result);
    } catch (error) {
      console.error("Code execution failed:", error);
      setExecutionResult({
        id: -1,
        status: "error",
        stdout: "",
        stderr: error instanceof Error ? error.message : "Unknown error occurred",
        executionTime: 0,
        memoryUsage: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleMarkAsSolved = async () => {
    if (isSolved) return;
    stop();
    const token = getAuthToken();
    if (!user || !token) {
      console.error("User not authenticated");
      return;
    }
    const userId = getUserData()?.id;
    try {
      await updateQuestionProgress({
        questionId: question.id,
        isPassed: true,
        durationSec: timeInSeconds,
        userId,
      });
      setIsSolved(true);
      onSolved();
      console.log(`Question ${question.id} progress updated! Time: ${formattedTime}`);
    } catch (error) {
      console.error("Failed to update question progress:", error);
    }
  };

  const difficultyStyles = {
    easy: styles.difficultyEasy,
    medium: styles.difficultyMedium,
    hard: styles.difficultyHard,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle size={16} className="text-green-400" />;
      case "error":
        return <XCircle size={16} className="text-red-400" />;
      case "timeout":
        return <Clock size={16} className="text-yellow-400" />;
      default:
        return <Activity size={16} className="text-blue-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      case "timeout":
        return "text-yellow-400";
      default:
        return "text-blue-400";
    }
  };

  return (
    <div className={`${styles.codingChallenge} ${isExpanded ? styles.expanded : styles.collapsed}`}>
      {/* Minimized Header */}
      <div 
        className={styles.challengeHeaderMinimized}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={styles.challengeHeaderLeft}>
          <div className={styles.expandIcon}>
            <ChevronRight 
              size={20} 
              className={`${styles.chevron} ${isExpanded ? styles.rotated : ''}`} 
            />
          </div>
          <div className={styles.challengeInfo}>
            <h3 className={styles.challengeTitle}>{question.title}</h3>
            <p className={styles.challengeDescription}>{question.description}</p>
          </div>
        </div>
        <div className={styles.challengeHeaderRight}>
          <span
            className={`${styles.difficultyBadge} ${difficultyStyles[question.difficulty]}`}
          >
            {question.difficulty}
          </span>
          <span className={styles.xpBadge}>{question.xp} XP</span>
          <div className={styles.statusBadge}>
            {isSolved ? (
              <CheckCircle2 size={20} className="text-green-400" />
            ) : (
              <Circle size={20} className="text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <div className={`${styles.challengeContent} ${isExpanded ? styles.contentExpanded : styles.contentCollapsed}`}>
        <div className={styles.languageSelector}>
          <label>Language:</label>
          <select 
            value={selectedLanguage} 
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className={styles.languageSelect}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
        </div>

        <div className={styles.challengeBody}>
          <MonacoEditor
            language={selectedLanguage}
            value={code}
            onCodeChange={setCode}
            onFocus={start}
          />
          <div className={styles.runButtonContainer}>
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className={`${styles.runButton} ${isRunning ? styles.running : ''}`}
            >
              <Play size={16} className={styles.runIcon} />
              {isRunning ? 'Running...' : 'Run Code'}
            </button>
          </div>
        </div>

        {executionResult && (
          <div className={styles.executionResult}>
            <div className={styles.resultHeader}>
              <div className={styles.resultStatus}>
                {getStatusIcon(executionResult.status)}
                <span className={getStatusColor(executionResult.status)}>
                  {executionResult.status.toUpperCase()}
                </span>
              </div>
              <div className={styles.resultMeta}>
                <span>⏱️ {formatExecutionTime(executionResult.executionTime)}</span>
                <span>💾 {formatMemoryUsage(executionResult.memoryUsage)}</span>
              </div>
            </div>

            {executionResult.stdout && (
              <div className={styles.resultSection}>
                <h4>Output:</h4>
                <pre className={styles.resultOutput}>
                  {executionResult.stdout}
                </pre>
              </div>
            )}

            {executionResult.stderr && (
              <div className={styles.resultSection}>
                <h4>Error:</h4>
                <pre className={styles.resultError}>
                  {executionResult.stderr}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className={styles.challengeFooter}>
          <div className={styles.stopwatch}>
            <Timer size={20} className="inline-block mr-2" />
            <span>{formattedTime}</span>
          </div>
          <GradientButton onClick={handleMarkAsSolved} disabled={isSolved}>
            {isSolved ? "Solved" : "Mark as Solved"}
          </GradientButton>
        </div>
      </div>
    </div>
  );
};

const PracticeTab = ({ topicId }: { topicId: number }) => {
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const apiQuestions = await fetchTopicQuestions(topicId);
      const uiQuestions = apiQuestions.map((q) => ({
        ...q,
        topicId,
        isSolved: q.is_passed || false,
      }));
      setQuestions(uiQuestions);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadQuestions();
    }
  }, [topicId, user]);

  const handleQuestionSolved = (solvedQuestionId: string) => {
    setQuestions(currentQuestions =>
      currentQuestions.map(q =>
        q.id === solvedQuestionId ? { ...q, isSolved: true } : q
      )
    );
  };

  if (isLoading) return <div>Loading Questions...</div>;
  if (questions.length === 0) {
    return <div>No practice questions available for this topic yet.</div>;
  }

  return (
    <div className={styles.practiceTabContainer}>
      {questions.map((q) => (
        <CodingChallenge
          key={q.id}
          question={q}
          onSolved={() => handleQuestionSolved(q.id)}
        />
      ))}
    </div>
  );
};

const MCQChallenge = ({ mcq }: { mcq: MCQ }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const isCorrect = selectedOption === mcq.correctAnswerIndex;

  const handleCheckAnswer = () => {
    if (selectedOption !== null) {
      setIsAnswered(true);
    }
  };

  const getOptionClassName = (index: number) => {
    if (!isAnswered) return styles.mcqOption;
    if (index === mcq.correctAnswerIndex)
      return `${styles.mcqOption} ${styles.correct}`;
    if (index === selectedOption && index !== mcq.correctAnswerIndex)
      return `${styles.mcqOption} ${styles.incorrect}`;
    return styles.mcqOption;
  };

  return (
    <div className={styles.mcqChallenge}>
      <p className={styles.mcqQuestion}>{mcq.question}</p>
      <div className={styles.mcqOptionsContainer}>
        {mcq.options.map((option, index) => (
          <label key={index} className={getOptionClassName(index)}>
            {option}
            <input
              type="radio"
              name={mcq.id}
              value={index}
              checked={selectedOption === index}
              onChange={() => setSelectedOption(index)}
              disabled={isAnswered}
            />
            <span className={styles.checkmark}></span>
          </label>
        ))}
      </div>
      <div className={styles.mcqFooter}>
        {isAnswered && (
          <span
            className={`${styles.feedbackText} ${
              isCorrect ? styles.correct : styles.incorrect
            }`}
          >
            {isCorrect
              ? "Correct!"
              : "Incorrect. The right answer is highlighted."}
          </span>
        )}
        <GradientButton
          onClick={handleCheckAnswer}
          disabled={selectedOption === null || isAnswered}
        >
          Check Answer
        </GradientButton>
      </div>
    </div>
  );
};

const QuizTab = ({ topicId }: { topicId: number }) => {
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const token = getAuthToken();
    if (!user || !token) return;

    const loadMcqs = async () => {
      setIsLoading(true);
      try {
        const apiMcqs = await fetchTopicMcqs(topicId);
        const uiMcqs = apiMcqs.map((q) => ({
          ...q,
          topicId,
          correctAnswerIndex: q.correct_index,
        }));
        setMcqs(uiMcqs);
      } catch (error) {
        console.error("Failed to fetch MCQs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMcqs();
  }, [topicId, user]);

  if (isLoading) return <div>Loading Quiz...</div>;
  if (mcqs.length === 0) {
    return <div>No quiz questions available for this topic yet.</div>;
  }

  return (
    <div className={styles.quizTabContainer}>
      {mcqs.map((q) => (
        <MCQChallenge key={q.id} mcq={q} />
      ))}
    </div>
  );
};

const TopicCard = ({
  topic,
  onSelect,
}: {
  topic: TopicSummary;
  onSelect: (id: number) => void;
}) => {
  const progress = topic.xp_total > 0 ? (topic.xp_earned / topic.xp_total) * 100 : 0;
  return (
    <div className={styles.topicCard} onClick={() => onSelect(topic.id)}>
      <div>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{topic.title}</h3>
          <StatusIcon status={topic.status} />
        </div>
      </div>
      <div className={styles.cardFooter}>
        <div className={styles.xpInfo}>
          <span>Progress</span>
          <strong>{topic.xp_earned} / {topic.xp_total} XP</strong>
        </div>
        <div className={styles.progressBarContainer}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

const LearnDashboard = ({
  sections,
  onSelectTopic,
}: {
  sections: Section[];
  onSelectTopic: (id: number) => void;
}) => {
  return (
    <div className={styles.learnDashboard}>
      {sections.map((section) => (
        <section key={section.name} className={styles.dashboardSection}>
          <h2 className={styles.dashboardSectionTitle}>{section.name}</h2>
          <div className={styles.topicGrid}>
            {section.topics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                onSelect={onSelectTopic}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

const LearnTab = ({ details }: { details: ApiTopicDetails }) => {
  const [activeCodeTab, setActiveCodeTab] = useState(
    details.code_examples[0]?.language || ""
  );

  // Custom renderer for code blocks
  const CodeBlock = ({ language, children }: { language?: string; children: string }) => {
    return (
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        customStyle={{
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(51, 65, 85, 0.5)',
          borderRadius: '8px',
          padding: '1.2rem',
          fontSize: '14px',
          fontFamily: '"Fira Code", "Courier New", monospace',
          lineHeight: '1.6',
        }}
        showLineNumbers={false}
        wrapLines={true}
        wrapLongLines={true}
      >
        {children}
      </SyntaxHighlighter>
    );
  };

  return (
    <div className={styles.learnTabContainer}>
      <div className={styles.markdownContent}>
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              
              if (!inline && language) {
                return (
                  <CodeBlock language={language}>
                    {String(children).replace(/\n$/, '')}
                  </CodeBlock>
                );
              }
              
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
          }}
        >
          {details.markdown}
        </ReactMarkdown>
      </div>

      {details.diagrams && details.diagrams.length > 0 && (
        <div className={styles.diagramsSection}>
          <h3>Diagrams</h3>
          <div className={styles.diagramsGrid}>
            {details.diagrams.map(([name, base64Image]) => (
              <ZoomableImage key={name} src={base64Image} alt={name} />
            ))}
          </div>
        </div>
      )}

      {details.code_examples && details.code_examples.length > 0 && (
        <div className={styles.codeExamplesSection}>
          <h3>Code Examples</h3>
          <div className={styles.codeTabs}>
            {details.code_examples.map((ex) => (
              <button
                key={ex.language}
                className={`${styles.codeTab} ${
                  activeCodeTab === ex.language ? styles.active : ""
                }`}
                onClick={() => setActiveCodeTab(ex.language)}
              >
                {ex.language}
              </button>
            ))}
          </div>
          <div className={styles.codeContent}>
            <MonacoEditor
              language={activeCodeTab}
              value={
                details.code_examples.find(
                  (ex) => ex.language === activeCodeTab
                )?.code || ""
              }
              onCodeChange={() => {
                
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

const TopicView = ({
  topicId,
  onBack,
  onTopicComplete,
  isTopicCompleted,
}: {
  topicId: number | null;
  onBack: () => void;
  onTopicComplete: () => void;
  isTopicCompleted: boolean;
}) => {
  const [activeTab, setActiveTab] = useState<"learn" | "practice" | "quiz">("learn");
  const [details, setDetails] = useState<ApiTopicDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const token = getAuthToken();
    if (!topicId || !user || !token) return;

    const loadDetails = async () => {
      setIsLoading(true);
      try {
        const data = await fetchTopicDetails(topicId);
        setDetails(data);
      } catch (error) {
        console.error("Failed to fetch topic details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [topicId, user]);

  const handleCompleteTopic = async () => {
    const token = getAuthToken();
    if (!topicId || !user || !token) return;
    try {
      const userId = getUserData()?.id;
      await updateTopicProgress({ userId, topicId, status: "completed" });
      onTopicComplete(); // Refresh summary list
      onBack(); // Go back to dashboard
    } catch (error) {
      console.error("Failed to mark topic as complete:", error);
    }
  };

  if (!topicId) return null;
  if (isLoading) return <div className={styles.topicViewContainer}>Loading Topic...</div>;
  if (!details) return <div className={styles.topicViewContainer}>Failed to load topic.</div>;

  return (
    <div className={styles.topicViewContainer}>
      <div className={styles.topicHeader}>
        <h2>{details.title}</h2>
        <button onClick={onBack} className={styles.backButton}>
          &larr; Back to Dashboard
        </button>
      </div>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "learn" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("learn")}
        >
          <BookOpen size={18} className="inline-block mr-2" />
          Learn
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "practice" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("practice")}
        >
          <Code size={18} className="inline-block mr-2" />
          Practice
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "quiz" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("quiz")}
        >
          <FileQuestion size={18} className="inline-block mr-2" />
          Quiz
        </button>
      </div>
      <div className={styles.tabContent}>
        {activeTab === "learn" && <LearnTab details={details} />}
        {activeTab === "practice" && <PracticeTab topicId={topicId} />}
        {activeTab === "quiz" && <QuizTab topicId={topicId} />}
      </div>
      <div className={styles.topicCompletionSection}>
        <GradientButton onClick={handleCompleteTopic} disabled={isTopicCompleted}>
          {isTopicCompleted ? "Topic Completed" : "Mark Topic as Complete"}
        </GradientButton>
      </div>
    </div>
  );
};

export default function LearnPage() {
  const [isClient, setIsClient] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTopicId, setActiveTopicId] = useState<number | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userXP, setUserXP] = useState(0);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const { user, isLoading: isAuthLoading } = useAuth();

  const loadData = async () => {
    const userId = getUserData()?.id;
    if (!userId) return;

    try {
      const [summaryData, xpData, progressData] = await Promise.all([
        fetchTopicSummary(),
        fetchUserXP(userId),
        fetchUserProgress(userId),
      ]);

      setUserXP(xpData.total_xp);
      setUserProgress(progressData);

      // Now, combine summary with progress data
      const questionProgressMap = new Map(
        progressData.question_progress.map(p => [p.question_id, p])
      );

      const allQuestions = (await Promise.all(
        summaryData.map(t => fetchTopicQuestions(t.id))
      )).flat();

      const questionXpMap = new Map(allQuestions.map(q => [q.id, q.xp]));

      const grouped = summaryData.reduce((acc, topic) => {
        const sectionName = topic.section.charAt(0).toUpperCase() + topic.section.slice(1);
        
        const earnedXP = allQuestions
          .filter(q => q.topic_id === topic.id && questionProgressMap.has(q.id))
          .reduce((sum, q) => sum + (questionXpMap.get(q.id) || 0), 0);

        const isCompleted = progressData.topic_progress.some(p => p.topic_id === topic.id);
        
        const uiTopic: TopicSummary = {
          id: topic.id,
          title: topic.title,
          xp_total: topic.xp,
          xp_earned: isCompleted ? topic.xp : earnedXP,
          status: isCompleted ? 'completed' : earnedXP > 0 ? 'ongoing' : 'not_started',
        };

        const existingSection = acc.find((s) => s.name === sectionName);
        if (existingSection) {
          existingSection.topics.push(uiTopic);
        } else {
          acc.push({ name: sectionName, topics: [uiTopic] });
        }
        return acc;
      }, [] as Section[]);

      setSections(grouped);

    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    }
  };


  useEffect(() => {
    const initialLoad = async () => {
      if (user) {
        await loadData();
        setIsLoading(false);
      } else if (!isAuthLoading) {
        // If auth is done and there's no user, stop loading.
        setIsLoading(false);
      }
    };
    initialLoad();
  }, [user, isAuthLoading]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSelectTopic = (id: number) => {
    setActiveTopicId(id);
  };

  if (!isClient || isLoading) {
    return <div className={styles.learnContainer}>Loading...</div>;
  }

  const isTopicCompleted = !!userProgress?.topic_progress.some(p => p.topic_id === activeTopicId);

  return (
    <div className={styles.learnContainer}>
      <div className={styles.headerWrapper}>
        <Header userXP={userXP} />
      </div>
      <main className={styles.mainContent}>
        <Sidebar
          sections={sections}
          activeTopicId={activeTopicId}
          onSelectTopic={handleSelectTopic}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!isSidebarCollapsed)}
        />
        <div className={styles.contentArea}>
          {activeTopicId === null ? (
            <LearnDashboard sections={sections} onSelectTopic={handleSelectTopic} />
          ) : (
            <TopicView
              topicId={activeTopicId}
              onBack={() => setActiveTopicId(null)}
              onTopicComplete={loadData}
              isTopicCompleted={isTopicCompleted}
            />
          )}
        </div>
      </main>
    </div>
  );
}
