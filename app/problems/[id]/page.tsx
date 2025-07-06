"use client";
import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Header from "@/app/components/header/base/Header";
import MonacoEditor from "@/app/components/editor/MonacoEditor";
import styles from "./problem.module.css";
import {
  getProblemById,
  submitRawCodeForProblem,
  getRawSubmissionResult,
  getProblemDifficultyColor,
  ProblemWithTestCases,
  RawSubmissionResult,
} from "@/app/api/problems/problems";
import {
  FaPlay,
  FaCheck,
  FaClock,
  FaMemory,
  FaLightbulb,
  FaCode,
  FaChevronDown,
  FaChevronUp,
  FaTerminal,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

const languageTemplates = {
  cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    // Your solution here
    
    return 0;
}`,
  javascript: `// Read input
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (line) => {
    // Your solution here
    console.log(line);
    rl.close();
});`,
  python: `# Your solution here
import sys

for line in sys.stdin:
    # Process input
    print(line.strip())`,
  java: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Your solution here
        
        scanner.close();
    }
}`,
};

export default function ProblemPage() {
  const params = useParams();
  const [problem, setProblem] = useState<ProblemWithTestCases | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("cpp");
  const [code, setCode] = useState(languageTemplates.cpp);
  const [isRunning, setIsRunning] = useState(false);
  const [submission, setSubmission] = useState<RawSubmissionResult | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "description" | "testcases" | "output"
  >("description");
  const [showSampleOnly, setShowSampleOnly] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const problemId = params.id;
    if (problemId) {
      console.log("Loading problem with ID:", problemId);
      loadProblem(problemId as string);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [params.id]);

  const loadProblem = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getProblemById(id);
      if (response.success) {
        setProblem(response.data);
      } else {
        setError("Problem not found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load problem");
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    setCode(languageTemplates[language as keyof typeof languageTemplates]);
  };

  const pollSubmissionStatus = (submissionId: number) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const result = await getRawSubmissionResult(submissionId);
        if (result.success && result.data.status !== 'pending') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setSubmission(result.data);
          setIsRunning(false);
          
          // Show success modal if all tests passed
          if (result.data.status === 'success' && result.data.testsPassed === result.data.totalTests) {
            setShowSuccessModal(true);
          }
        }
      } catch (err) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setError(err instanceof Error ? err.message : "Failed to get submission status");
        setIsRunning(false);
      }
    }, 2000);
  };

  const handleSubmitCode = async () => {
    if (!problem) return;

    setIsRunning(true);
    setActiveTab("output");
    setSubmission(null);
    setError(null);

    try {
      const payload = { 
        language: selectedLanguage, 
        code 
      };
      const response = await submitRawCodeForProblem(problem.id, payload);
      if (response.success) {
        pollSubmissionStatus(response.data.submissionId);
      } else {
        setError("Failed to submit code.");
        setIsRunning(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during submission.");
      setIsRunning(false);
    }
  };

  const renderConstraint = (constraint: string) => {
    const mathPattern = /(\d+(\.\d+)?|\w+)\s*([<>=!]+)\s*(\d+(\.\d+)?|\w+)/g;
    const parts = constraint.split(mathPattern);

    if (parts.length > 1) {
      return <span className={styles.constraintMath}>{constraint}</span>;
    }

    return <span>{constraint}</span>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <FaCheckCircle className="text-green-400" />;
      case 'runtime_error':
      case 'compile_error':
      case 'wrong_answer':
        return <FaTimesCircle className="text-red-400" />;
      case 'time_limit_exceeded':
        return <FaClock className="text-yellow-400" />;
      default:
        return <FaTerminal className="text-blue-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-400';
      case 'runtime_error':
      case 'compile_error':
      case 'wrong_answer':
        return 'text-red-400';
      case 'time_limit_exceeded':
        return 'text-yellow-400';
      default:
        return 'text-blue-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Accepted';
      case 'runtime_error':
        return 'Runtime Error';
      case 'compile_error':
        return 'Compile Error';
      case 'wrong_answer':
        return 'Wrong Answer';
      case 'time_limit_exceeded':
        return 'Time Limit Exceeded';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className={styles.pageBackground}>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading problem...</p>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className={styles.pageBackground}>
        <Header />
        <div className={styles.errorContainer}>
          <h2>Problem Not Found</h2>
          <p>{error || "The requested problem could not be found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageBackground}>
      <Header />

      <div className={styles.container}>
        <div className={styles.problemLayout}>
          {/* Left Panel - Problem Description */}
          <div className={styles.leftPanel}>
            <div className={styles.problemHeader}>
              <div className={styles.problemTitle}>
                <h1>{problem.title}</h1>
                <div
                  className={styles.difficultyBadge}
                  style={{
                    backgroundColor: getProblemDifficultyColor(
                      problem.difficulty
                    ),
                  }}
                >
                  {problem.difficulty}
                </div>
              </div>
              <div className={styles.problemMeta}>
                <span className={styles.topicTag}>{problem.topic}</span>
                <span className={styles.xpValue}>+{problem.xp} XP</span>
              </div>
            </div>

            <div className={styles.problemContent}>
              <div className={styles.tabNavigation}>
                <button
                  className={`${styles.tabButton} ${
                    activeTab === "description" ? styles.active : ""
                  }`}
                  onClick={() => setActiveTab("description")}
                >
                  Description
                </button>
                <button
                  className={`${styles.tabButton} ${
                    activeTab === "testcases" ? styles.active : ""
                  }`}
                  onClick={() => setActiveTab("testcases")}
                >
                  Test Cases
                </button>
                <button
                  className={`${styles.tabButton} ${
                    activeTab === "output" ? styles.active : ""
                  }`}
                  onClick={() => setActiveTab("output")}
                >
                  Output
                </button>
              </div>

              <div className={styles.tabContent}>
                {activeTab === "description" && (
                  <div className={styles.descriptionTab}>
                    <div className={styles.section}>
                      <h3>Problem Description</h3>
                      <div className={styles.descriptionContent}>
                        {problem.description
                          .split("\n")
                          .map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                          ))}
                      </div>
                    </div>

                    <div className={styles.section}>
                      <h3>Constraints</h3>
                      <div className={styles.constraintsContainer}>
                        {problem.constraints.split("\n").map(
                          (constraint, index) =>
                            constraint.trim() && (
                              <div
                                key={index}
                                className={styles.constraintItem}
                              >
                                <span className={styles.constraintBullet}>
                                  •
                                </span>
                                <div className={styles.constraintText}>
                                  {renderConstraint(constraint.trim())}
                                </div>
                              </div>
                            )
                        )}
                      </div>
                    </div>

                    <div className={styles.section}>
                      <h3>Complexity</h3>
                      <div className={styles.complexityInfo}>
                        <div className={styles.complexityItem}>
                          <FaClock />
                          <span>Time: {problem.time_complexity}</span>
                        </div>
                        <div className={styles.complexityItem}>
                          <FaMemory />
                          <span>Space: {problem.space_complexity}</span>
                        </div>
                      </div>
                    </div>

                    {problem.hints && problem.hints.length > 0 && (
                      <div className={styles.section}>
                        <button
                          className={styles.hintsToggle}
                          onClick={() => setShowHints(!showHints)}
                        >
                          <FaLightbulb />
                          Hints ({problem.hints.length})
                          {showHints ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                        {showHints && (
                          <div className={styles.hintsContent}>
                            {problem.hints.map((hint, index) => (
                              <div key={index} className={styles.hint}>
                                <strong>Hint {index + 1}:</strong> {hint}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "testcases" && (
                  <div className={styles.testCasesTab}>
                    <div className={styles.testCaseControls}>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={showSampleOnly}
                          onChange={(e) => setShowSampleOnly(e.target.checked)}
                        />
                        Show sample test cases only
                      </label>
                    </div>

                    <div className={styles.testCasesList}>
                      {(showSampleOnly
                        ? problem.sampleTestCases
                        : problem.testCases
                      ).map((testCase, index) => (
                        <div key={testCase.id} className={styles.testCase}>
                          <h4>Test Case {index + 1}</h4>
                          <div className={styles.testCaseContent}>
                            <div className={styles.testCaseInput}>
                              <strong>Input:</strong>
                              <pre>{testCase.input}</pre>
                            </div>
                            <div className={styles.testCaseOutput}>
                              <strong>Expected Output:</strong>
                              <pre>{testCase.expected_output}</pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "output" && (
                  <div className={styles.outputTab}>
                    {isRunning && !submission && (
                       <div className={styles.emptyOutput}>
                         <div className={styles.spinner}></div>
                         <p>Testing your solution...</p>
                       </div>
                    )}
                    {submission && submission.testResults ? (
                      <div className={styles.testResultsContainer}>
                        <div className={styles.testResultsHeader}>
                          <h3>
                            Test Results: 
                            <span className={`${styles.status} ${getStatusColor(submission.status)}`}>
                              {getStatusIcon(submission.status)}
                              {getStatusText(submission.status)}
                            </span>
                          </h3>
                          <div className={styles.testResultsSummary}>
                            {submission.testsPassed} / {submission.totalTests} passed
                          </div>
                        </div>

                        <div className={styles.testResultsList}>
                          {submission.testResults.map((result, index) => (
                            <div 
                              key={result.testCaseId} 
                              className={`${styles.testResult} ${result.passed ? styles.passed : styles.failed}`}
                            >
                              <div className={styles.testResultHeader}>
                                <div className={styles.testResultTitle}>
                                  {result.passed ? (
                                    <FaCheckCircle className="text-green-400" />
                                  ) : (
                                    <FaTimesCircle className="text-red-400" />
                                  )}
                                  Test Case {index + 1} {result.isSample ? "(Sample)" : ""}
                                </div>
                                <div className={styles.testResultMeta}>
                                  <span>Status: {result.passed ? "Passed" : "Failed"}</span>
                                </div>
                              </div>
                              
                              <div className={styles.testResultContent}>
                                <div className={styles.testResultInput}>
                                  <strong>Input:</strong>
                                  <pre>{result.input}</pre>
                                </div>
                                <div className={styles.testResultOutput}>
                                  <strong>Expected:</strong>
                                  <pre>{result.expectedOutput}</pre>
                                </div>
                                <div className={styles.testResultOutput}>
                                  <strong>Your Output:</strong>
                                  <pre>{result.actualOutput}</pre>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {submission.executionTime && (
                          <div className={styles.executionMeta}>
                            <span>Execution Time: {submission.executionTime}ms</span>
                          </div>
                        )}
                        
                        {submission.stderr && (
                          <div className={styles.stderr}>
                            <strong>Error Output:</strong>
                            <pre>{submission.stderr}</pre>
                          </div>
                        )}
                      </div>
                    ) : !isRunning && (
                      <div className={styles.emptyOutput}>
                        <FaTerminal />
                        <p>Submit your code to see the test results here</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Code Editor */}
          <div className={styles.rightPanel}>
            <div className={styles.editorHeader}>
              <div className={styles.languageSelector}>
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className={styles.languageSelect}
                >
                  <option value="cpp">C++</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                </select>
              </div>

              <div className={styles.editorActions}>
                <button
                  className={styles.submitButton}
                  onClick={handleSubmitCode}
                  disabled={isRunning}
                >
                  {isRunning ? (
                    <>
                      <div className={styles.spinner}></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      Submit
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className={styles.editorContainer}>
              <MonacoEditor
                language={selectedLanguage}
                value={code}
                onCodeChange={setCode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.successModal}>
            <div className={styles.modalContent}>
              <div className={styles.successIcon}>🎉</div>
              <h2>Congratulations!</h2>
              <p>Your solution has been accepted!</p>
              <div className={styles.successStats}>
                <div className={styles.stat}>
                  <FaCheckCircle />
                  <span>All test cases passed</span>
                </div>
                <div className={styles.stat}>
                  <FaClock />
                  <span>Execution time: {submission?.executionTime}ms</span>
                </div>
                <div className={styles.stat}>
                  <FaCode />
                  <span>Language: {selectedLanguage.toUpperCase()}</span>
                </div>
              </div>
              <button
                className={styles.modalButton}
                onClick={() => setShowSuccessModal(false)}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
