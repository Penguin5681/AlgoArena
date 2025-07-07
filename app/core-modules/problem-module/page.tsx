"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "@/app/components/header/base/Header";
import styles from "./problems.module.css";
import {
  getAllProblems,
  getTopics,
  getSolvedProblems,
  Problem,
  Topic,
  SolvedProblem,
  ProblemFilters,
  PaginationParams,
  getProblemDifficultyColor,
} from "@/app/api/problems/problems";
import {
  FaSearch,
  FaFilter,
  FaCode,
  FaBuilding,
  FaChevronDown,
  FaInfinity,
  FaGoogle,
  FaMicrosoft,
  FaAmazon,
  FaApple,
  FaFacebook,
  FaSpotify,
  FaLinkedin,
  FaTwitter,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";
import { SiNetflix, SiTesla, SiUber } from "react-icons/si";
import Link from "next/link";
import { getUserData } from "@/app/api/authentication/auth";
import { fetchUserXP } from "@/app/api/learn/learn";

const companies = [
  { id: 1, name: "Google", icon: FaGoogle, color: "#4285F4" },
  { id: 2, name: "Microsoft", icon: FaMicrosoft, color: "#00A1F1" },
  { id: 3, name: "Amazon", icon: FaAmazon, color: "#FF9900" },
  { id: 4, name: "Apple", icon: FaApple, color: "#000000" },
  { id: 5, name: "Meta", icon: FaFacebook, color: "#1877F2" },
  { id: 6, name: "Netflix", icon: SiNetflix, color: "#E50914" },
  { id: 7, name: "Tesla", icon: SiTesla, color: "#CC0000" },
  { id: 8, name: "Uber", icon: SiUber, color: "#000000" },
  { id: 9, name: "Spotify", icon: FaSpotify, color: "#1DB954" },
  { id: 10, name: "Adobe", icon: FaTwitter, color: "#FF0000" },
  { id: 11, name: "LinkedIn", icon: FaLinkedin, color: "#0077B5" },
  { id: 12, name: "Twitter", icon: FaTwitter, color: "#1DA1F2" },
];

export default function ProblemPage() {
  const [activeTab, setActiveTab] = useState<"practice" | "company">("practice");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [solvedProblems, setSolvedProblems] = useState<SolvedProblem[]>([]); // Changed to SolvedProblem[]
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    "all" | "easy" | "medium" | "hard"
  >("all");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedSolved, setSelectedSolved] = useState<"all" | "solved" | "unsolved">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [userXp, setUserXp] = useState(0);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [solvedLoading, setSolvedLoading] = useState(false);

  useEffect(() => {
    loadTopics();
    loadSolvedProblems();
    loadProblems(true);
    getUserXp();
  }, []);

  useEffect(() => {
    if (activeTab === "practice") {
      loadProblems(true);
    }
  }, [selectedDifficulty, selectedTopic, selectedSolved, activeTab]);

  const loadTopics = async () => {
    setTopicsLoading(true);
    try {
      console.log("Loading topics from API...");
      const response = await getTopics();
      console.log("Topics API response:", response);

      if (response.success) {
        setTopics(response.data.topics);
        console.log("Topics loaded successfully:", response.data.topics);
      } else {
        console.error("Failed to load topics:", response);
      }
    } catch (error) {
      console.error("Error loading topics:", error);
    } finally {
      setTopicsLoading(false);
    }
  };

  const loadSolvedProblems = async () => {
    setSolvedLoading(true);
    try {
      console.log("Loading solved problems from API...");
      const response = await getSolvedProblems();
      console.log("Solved problems API response:", response);

      if (response.success) {
        setSolvedProblems(response.data.solvedProblems); // Now stores full SolvedProblem objects
        console.log("Solved problems loaded successfully:", response.data.solvedProblems);
      } else {
        console.error("Failed to load solved problems:", response);
      }
    } catch (error) {
      console.error("Error loading solved problems:", error);
      // Don't throw error here as it's not critical for the page to work
    } finally {
      setSolvedLoading(false);
    }
  };

  const getUserXp = async () => {
    try {
      const userData = await getUserData();
      const userId = userData?.id;
      if (userId) {
        const userXpData = await fetchUserXP(userId);
        setUserXp(userXpData.total_xp);
      }
    } catch (error) {
      console.error("Error fetching user XP:", error);
    }
  };

  const loadProblems = async (reset: boolean = false) => {
    if (loading) return;

    setLoading(true);
    try {
      const filters: ProblemFilters = {};
      if (selectedDifficulty !== "all") {
        filters.difficulty = selectedDifficulty as "easy" | "medium" | "hard";
      }
      if (selectedTopic) {
        filters.topic = selectedTopic;
      }
      if (selectedSolved !== "all") {
        filters.solved = selectedSolved as "solved" | "unsolved";
      }

      const pagination: PaginationParams = {
        limit: 20,
        offset: reset ? 0 : currentOffset,
        sortBy: "created_at",
        sortOrder: "DESC",
      };

      const response = await getAllProblems(filters, pagination);

      if (response.success) {
        if (reset) {
          setProblems(response.data.problems);
          setCurrentOffset(20);
        } else {
          setProblems((prev) => [...prev, ...response.data.problems]);
          setCurrentOffset((prev) => prev + 20);
        }
        setHasMore(response.data.pagination.hasMore);
      }
    } catch (error) {
      console.error("Error loading problems:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = useCallback(() => {
    if (activeTab === "company") return;

    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 5 && hasMore && !loading) {
      loadProblems(false);
    }
  }, [hasMore, loading, activeTab]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Create a set of solved problem IDs for efficient lookup
  const solvedProblemIds = new Set(solvedProblems.map(solved => solved.problem_id));

  // Enhanced filtering logic to include solved status
  const filteredProblems = problems.filter((problem) => {
    const matchesSearch = 
      problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      problem.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSolved = selectedSolved === "all" || 
      (selectedSolved === "solved" && solvedProblemIds.has(problem.id)) ||
      (selectedSolved === "unsolved" && !solvedProblemIds.has(problem.id));
    
    return matchesSearch && matchesSolved;
  });

  const handleCompanySelect = (companyId: number) => {
    setSelectedCompany(companyId);
  };

  // Helper function to check if a problem is solved
  const isProblemSolved = (problemId: string) => {
    return solvedProblemIds.has(problemId);
  };

  // Helper function to get solved problem details
  const getSolvedProblemDetails = (problemId: string) => {
    return solvedProblems.find(solved => solved.problem_id === problemId);
  };

  return (
    <div className={styles.pageBackground}>
      <Header userXP={userXp} />

      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.titleSection}>
            <h1 className={styles.pageTitle}>Coding Problems</h1>
            <p className={styles.pageSubtitle}>
              Practice coding problems and prepare for technical interviews
            </p>
          </div>

          {/* Tab Navigation */}
          <div className={styles.tabNavigation}>
            <button
              className={`${styles.tabButton} ${
                activeTab === "practice" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("practice")}
            >
              <FaCode className={styles.tabIcon} />
              Practice Questions
            </button>
            <button
              className={`${styles.tabButton} ${
                activeTab === "company" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("company")}
            >
              <FaBuilding className={styles.tabIcon} />
              Company Specific
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        {activeTab === "practice" && (
          <div className={styles.searchSection}>
            <div className={styles.searchBar}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search problems..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <button
              className={styles.filterButton}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter />
              Filters
              <FaChevronDown
                className={`${styles.chevron} ${
                  showFilters ? styles.rotated : ""
                }`}
              />
            </button>
          </div>
        )}

        {/* Filter Panel */}
        {showFilters && activeTab === "practice" && (
          <div className={styles.filterPanel}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                className={styles.filterSelect}
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Topic</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className={styles.filterSelect}
                disabled={topicsLoading}
              >
                <option value="">
                  {topicsLoading ? "Loading topics..." : "All Topics"}
                </option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.name}>
                    {topic.name} ({topic.problem_count} problems)
                  </option>
                ))}
              </select>
              {topicsLoading && (
                <div className={styles.loadingSpinner}>
                  <div className={styles.spinner}></div>
                </div>
              )}
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Status</label>
              <select
                value={selectedSolved}
                onChange={(e) => setSelectedSolved(e.target.value as any)}
                className={styles.filterSelect}
                disabled={solvedLoading}
              >
                <option value="all">
                  {solvedLoading ? "Loading status..." : "All Problems"}
                </option>
                <option value="solved">✅ Solved ({solvedProblems.length})</option>
                <option value="unsolved">⏳ Unsolved</option>
              </select>
              {solvedLoading && (
                <div className={styles.loadingSpinner}>
                  <div className={styles.spinner}></div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={styles.contentArea}>
          {activeTab === "practice" ? (
            <>
              <div className={styles.problemsList}>
                {filteredProblems.map((problem, index) => {
                  const solvedDetails = getSolvedProblemDetails(problem.id);
                  return (
                    <Link
                      key={problem.id}
                      href={`/problems/${problem.id}`}
                      className={styles.problemCard}
                    >
                      <div className={styles.problemHeader}>
                        <div className={styles.problemTitle}>
                          <span className={styles.problemNumber}>
                            #{index + 1}
                          </span>
                          <h3>{problem.title}</h3>
                          {/* Add solved indicator */}
                          {isProblemSolved(problem.id) && (
                            <FaCheckCircle className={styles.solvedIcon} />
                          )}
                        </div>
                        <div className={styles.problemBadges}>
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
                          {/* Add solved status badge with more details */}
                          {isProblemSolved(problem.id) && solvedDetails && (
                            <div className={styles.solvedBadge}>
                              <FaCheckCircle />
                              <span>Solved</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className={styles.problemDescription}>
                        {problem.description.length > 150
                          ? `${problem.description.substring(0, 150)}...`
                          : problem.description}
                      </p>

                      <div className={styles.problemFooter}>
                        <div className={styles.problemMeta}>
                          <span className={styles.topicTag}>{problem.topic}</span>
                          <span className={styles.xpValue}>+{problem.xp} XP</span>
                          {/* Show solved date if available */}
                          {solvedDetails && (
                            <span className={styles.solvedDate}>
                              Solved: {new Date(solvedDetails.solved_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className={styles.testCaseCount}>
                          {problem.test_case_count} test cases
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {loading && (
                <div className={styles.loadingIndicator}>
                  <div className={styles.spinner}></div>
                  <span>Loading more problems...</span>
                </div>
              )}

              {!hasMore && problems.length > 0 && (
                <div className={styles.endIndicator}>
                  <FaInfinity />
                  <span>You've reached the end!</span>
                </div>
              )}
            </>
          ) : (
            <div className={styles.companySection}>
              <div className={styles.companyGrid}>
                {companies.map((company) => {
                  const IconComponent = company.icon;
                  return (
                    <div
                      key={company.id}
                      className={`${styles.companyCard} ${
                        selectedCompany === company.id ? styles.selected : ""
                      }`}
                      onClick={() => handleCompanySelect(company.id)}
                    >
                      <div
                        className={styles.companyLogo}
                        style={{ color: company.color }}
                      >
                        <IconComponent />
                      </div>
                      <h3 className={styles.companyName}>{company.name}</h3>
                      <p className={styles.companyProblems}>Coming Soon</p>
                    </div>
                  );
                })}
              </div>

              {selectedCompany && (
                <div className={styles.comingSoon}>
                  <div className={styles.comingSoonContent}>
                    <h2>Company-Specific Questions Coming Soon!</h2>
                    <p>
                      We're working hard to bring you curated problems from top
                      tech companies.
                    </p>
                    <div className={styles.comingSoonFeatures}>
                      <div className={styles.feature}>
                        <FaCode />
                        <span>Real interview questions</span>
                      </div>
                      <div className={styles.feature}>
                        <FaBuilding />
                        <span>Company-specific patterns</span>
                      </div>
                      <div className={styles.feature}>
                        <FaFilter />
                        <span>Difficulty-based filtering</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
