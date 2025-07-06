"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Header from "@/app/components/header/base/Header";
import MonacoEditor from "@/app/components/editor/MonacoEditor";
import {
  getProblemById,
  ProblemWithTestCases,
  getProblemDifficultyColor,
  submitCodeForProblem,
  submitCodeForCompilation,
  getSubmissionResult,
  Submission,
  SubmissionTestResult,
} from "@/app/api/problems/problems";
import styles from "./problem.module.css";
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
  javascript: `function solution(input) {
    // Your solution here
    
    return result;
}`,
  python: `def solution(input):
    # Your solution here
    
    return result`,
  java: `public class Solution {
    public static String solution(String input) {
        // Your solution here
        
        return result;
    }
}`,
  cpp: `#include <iostream>
#include <string>
using namespace std;

string solution(string input) {
    // Your solution here
    
    return result;
}`,
};

export default function ProblemPage() {
  const params = useParams();
  const [problem, setProblem] = useState<ProblemWithTestCases | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState(languageTemplates.javascript);
  const [isRunning, setIsRunning] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [output, setOutput] = useState<string>("");
  const [showHints, setShowHints] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "description" | "testcases" | "output"
  >("description");
  const [showSampleOnly, setShowSampleOnly] = useState(true);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const problemId = params.id;
    if (problemId) {
      console.log("Loading problem with ID:", problemId);
      loadProblem(problemId as string); // No need to parse as integer
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
        const result = await getSubmissionResult(submissionId);
        if (result.success && result.data.status !== 'pending') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setSubmission(result.data);
          setOutput(result.data.stdout || result.data.stderr || "");
          setIsRunning(false);
        }
      } catch (err) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setError(err instanceof Error ? err.message : "Failed to get submission status");
        setIsRunning(false);
      }
    }, 2000);
  };

  const handleRunCode = async () => {
    if (!problem) return;

    setIsRunning(true);
    setActiveTab("output");
    setSubmission(null);
    setOutput("");
    setError(null);

    try {
      const payload = {
        language: selectedLanguage,
        code,
        stdin: problem.sampleTestCases[0]?.input || "",
      };
      const response = await submitCodeForCompilation(payload);
      if (response.success) {
        pollSubmissionStatus(response.data.submissionId);
      } else {
        setError("Failed to start compilation.");
        setIsRunning(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while running code.");
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!problem) return;

    setIsRunning(true);
    setActiveTab("output");
    setSubmission(null);
    setOutput("");
    setError(null);

    try {
      const payload = { language: selectedLanguage, code };
      const response = await submitCodeForProblem(problem.id, payload);
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

  // Optional: Enhanced constraint rendering with mathematical expression detection
  const renderConstraint = (constraint: string) => {
    // Check if constraint contains mathematical expressions
    const mathPattern = /(\d+(\.\d+)?|\w+)\s*([<>=!]+)\s*(\d+(\.\d+)?|\w+)/g;
    const parts = constraint.split(mathPattern);

    if (parts.length > 1) {
      return <span className={styles.constraintMath}>{constraint}</span>;
    }

    return <span>{constraint}</span>;
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
                         <p>Executing code...</p>
                       </div>
                    )}
                    {submission && submission.test_results ? (
                      <div className={styles.testResultsContainer}>
                        <div className={styles.testResultsHeader}>
                          <h3>Test Results: <span className={`${styles.status} ${styles[submission.status]}`}>{submission.status.replace('_', ' ')}</span></h3>
                          <div className={styles.testResultsSummary}>
                            {submission.tests_passed} /{" "}
                            {submission.total_tests} passed
                          </div>
                        </div>

                        <div className={styles.testResultsList}>
                          {submission.test_results.map((result, index) => (
                            <div
                              key={result.testCaseId}
                              className={`${styles.testResult} ${
                                result.passed ? styles.passed : styles.failed
                              }`}
                            >
                              <div className={styles.testResultHeader}>
                                <div className={styles.testResultTitle}>
                                  {result.passed ? (
                                    <FaCheckCircle />
                                  ) : (
                                    <FaTimesCircle />
                                  )}
                                  Test Case {index + 1}
                                </div>
                                <div className={styles.testResultMeta}>
                                  <span>{result.executionTime}ms</span>
                                  <span>{result.memory}MB</span>
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
                                  <strong>Actual:</strong>
                                  <pre>{result.actualOutput}</pre>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : submission ? (
                       <div className={styles.outputContainer}>
                         <h3>Output</h3>
                         <pre className={`${styles.outputContent} ${submission.stderr ? styles.errorOutput : ''}`}>
                           {output}
                         </pre>
                       </div>
                    ) : !isRunning && (
                      <div className={styles.emptyOutput}>
                        <FaTerminal />
                        <p>Run your code to see the output here</p>
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
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>

              <div className={styles.editorActions}>
                <button
                  className={styles.runButton}
                  onClick={handleRunCode}
                  disabled={isRunning}
                >
                  {isRunning ? (
                    <>
                      <div className={styles.spinner}></div>
                      Running...
                    </>
                  ) : (
                    <>
                      <FaPlay />
                      Run
                    </>
                  )}
                </button>

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
    </div>
  );
}
