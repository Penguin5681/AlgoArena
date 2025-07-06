"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "@/app/components/header/base/Header";
import styles from "./problems.module.css";
import {
  getAllProblems,
  getTopics,
  Problem,
  Topic,
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
} from "react-icons/fa";
import { SiNetflix, SiTesla, SiUber } from "react-icons/si";
import Link from "next/link";

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
  const [activeTab, setActiveTab] = useState<"practice" | "company">(
    "practice"
  );
  const [problems, setProblems] = useState<Problem[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    "all" | "easy" | "medium" | "hard"
  >("all");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);

  // Load initial data
  useEffect(() => {
    loadTopics();
    loadProblems(true);
  }, []);

  // Load more problems when filters change
  useEffect(() => {
    if (activeTab === "practice") {
      loadProblems(true);
    }
  }, [selectedDifficulty, selectedTopic, activeTab]);

  const loadTopics = async () => {
    try {
      const response = await getTopics();
      if (response.success) {
        setTopics(response.data.topics);
      }
    } catch (error) {
      console.error("Error loading topics:", error);
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

  const filteredProblems = problems.filter(
    (problem) =>
      problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      problem.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCompanySelect = (companyId: number) => {
    setSelectedCompany(companyId);
  };

  return (
    <div className={styles.pageBackground}>
      <Header />

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
              >
                <option value="">All Topics</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.name}>
                    {topic.name} ({topic.problem_count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className={styles.contentArea}>
          {activeTab === "practice" ? (
            <>
              <div className={styles.problemsList}>
                {filteredProblems.map((problem, index) => (
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
                      </div>
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

                    <p className={styles.problemDescription}>
                      {problem.description.length > 150
                        ? `${problem.description.substring(0, 150)}...`
                        : problem.description}
                    </p>

                    <div className={styles.problemFooter}>
                      <div className={styles.problemMeta}>
                        <span className={styles.topicTag}>{problem.topic}</span>
                        <span className={styles.xpValue}>+{problem.xp} XP</span>
                      </div>
                      <div className={styles.testCaseCount}>
                        {problem.test_case_count} test cases
                      </div>
                    </div>
                  </Link>
                ))}
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
