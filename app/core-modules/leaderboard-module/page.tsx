'use client';

import Header from "@/app/components/header/base/Header";
import styles from "./leaderboard.module.css";
import { getUserData } from "@/app/api/authentication/auth";
import { fetchUserXP } from "@/app/api/learn/learn";
import { useEffect, useState } from "react";

export default function LeaderboardPage() {
	const [userXp, setUserXp] = useState(0);

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

	useEffect(() => {
		getUserXp();
	}, []);

	return (
		<div className={styles.pageBackground}>
			<Header userXP={userXp}/>
		</div>
	);
}
