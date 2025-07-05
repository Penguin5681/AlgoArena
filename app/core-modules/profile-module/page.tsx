"use client";

import React from "react";
import styles from "./profile.module.css";
import Header from "@/app/components/header/base/Header";
import { FaFacebookF, FaLinkedinIn, FaGithub } from "react-icons/fa";

const ProfilePage = () => {
  const generateHeatmapData = () => {
    const data = [];
    for (let i = 0; i < 365; i++) {
      const level = Math.floor(Math.random() * 5); // 0-4 levels
      data.push(level);
    }
    return data;
  };

  const heatmapData = generateHeatmapData();

  return (
    <>
      <div style={{ paddingBottom: 50 }}>
        <Header />
      </div>
      <div className={styles.pageBackground}>
        <div className={styles.profileContainer}>
          {/* Profile Header */}
          <div className={styles.profileHeader}>
            <div className={styles.profileImageSection}>
              <img
                src="/panda.jpg"
                alt="Profile"
                className={styles.profileImage}
              />
              <div className={styles.socialLinks}>
                <a href="#" className={styles.socialLink} title="Facebook">
                  <FaFacebookF />
                </a>
                <a href="#" className={styles.socialLink} title="LinkedIn">
                  <FaLinkedinIn />
                </a>
                <a href="#" className={styles.socialLink} title="GitHub">
                  <FaGithub />
                </a>
              </div>
              <div className={styles.contactInfo}>
                <strong>Contact me at:</strong>
                <br />
                abc@example.com
              </div>
            </div>

            <div className={styles.userInfo}>
              <h1 className={styles.userName}>Pranav Sinha</h1>
              <p className={styles.userTitle}>
                Full Stack Developer & Competitive Programmer
              </p>

              <div className={styles.badgesContainer}>
                <h3 className={styles.badgesTitle}>Achievements & Badges</h3>
                <div className={styles.badgesPlaceholder}>
                  Badges will be displayed here
                </div>
              </div>

              <div className={styles.userBio}>
                <p>
                  Passionate software developer with 5+ years of experience in
                  building scalable web applications. I love solving complex
                  algorithmic problems and participating in competitive
                  programming contests. Always eager to learn new technologies
                  and contribute to open-source projects.
                </p>
              </div>
            </div>
          </div>

          {/* Profile Content Grid */}
          <div className={styles.profileContent}>
            {/* Contest Ranking & Heatmap */}
            <div className={styles.glassCard}>
              <h3 className={styles.cardTitle}>Contest Ranking</h3>
              <div className={styles.rankingInfo}>
                <div className={styles.rankStat}>
                  <div className={styles.rankNumber}>1,247</div>
                  <div className={styles.rankLabel}>Global Rank</div>
                </div>
                <div className={styles.rankStat}>
                  <div className={styles.rankNumber}>2,150</div>
                  <div className={styles.rankLabel}>Rating</div>
                </div>
                <div className={styles.rankStat}>
                  <div className={styles.rankNumber}>89</div>
                  <div className={styles.rankLabel}>Contests</div>
                </div>
              </div>

              <div className={styles.heatmapContainer}>
                <h4 style={{ marginBottom: "15px", color: "#e0e0e0" }}>
                  Activity Heatmap
                </h4>
                <div className={styles.heatmapGrid}>
                  {heatmapData.map((level, index) => (
                    <div
                      key={index}
                      className={`${styles.heatmapCell} ${
                        level > 0 ? styles[`level${level}`] : ""
                      }`}
                      title={`Day ${index + 1}: ${level} problems solved`}
                    />
                  ))}
                </div>
                <div className={styles.heatmapLegend}>
                  <span>Less</span>
                  <div className={styles.legendItem}>
                    <div
                      className={`${styles.legendColor} ${styles.heatmapCell}`}
                    />
                    <div
                      className={`${styles.legendColor} ${styles.heatmapCell} ${styles.level1}`}
                    />
                    <div
                      className={`${styles.legendColor} ${styles.heatmapCell} ${styles.level2}`}
                    />
                    <div
                      className={`${styles.legendColor} ${styles.heatmapCell} ${styles.level3}`}
                    />
                    <div
                      className={`${styles.legendColor} ${styles.heatmapCell} ${styles.level4}`}
                    />
                  </div>
                  <span>More</span>
                </div>
              </div>
            </div>

            {/* Problems Solved */}
            <div className={styles.glassCard}>
              <h3 className={styles.cardTitle}>Problems Solved</h3>
              <div className={styles.problemsChart}>
                <div className={styles.pieChart}></div>
                <div className={styles.problemsLegend}>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendDot} ${styles.easy}`}></div>
                    <span>Easy: 245</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div
                      className={`${styles.legendDot} ${styles.medium}`}
                    ></div>
                    <span>Medium: 156</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendDot} ${styles.hard}`}></div>
                    <span>Hard: 89</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <div className={styles.rankNumber}>490</div>
                <div className={styles.rankLabel}>Total Problems</div>
              </div>
            </div>

            {/* Tech Stack */}
            <div className={`${styles.glassCard} ${styles.fullWidthCard}`}>
              <h3 className={styles.cardTitle}>
                Programming Languages & Tech Stack
              </h3>
              <div className={styles.techStack}>
                <div className={styles.techTag}>JavaScript</div>
                <div className={styles.techTag}>Python</div>
                <div className={styles.techTag}>Java</div>
                <div className={styles.techTag}>C++</div>
                <div className={styles.techTag}>React</div>
                <div className={styles.techTag}>Node.js</div>
                <div className={styles.techTag}>MongoDB</div>
                <div className={styles.techTag}>PostgreSQL</div>
                <div className={styles.techTag}>Docker</div>
                <div className={styles.techTag}>AWS</div>
                <div className={styles.techTag}>Git</div>
                <div className={styles.techTag}>TypeScript</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
