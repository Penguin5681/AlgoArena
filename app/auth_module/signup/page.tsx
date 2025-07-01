'use client';

import styles from './page.module.css';
import Image from "next/image";
import EditText from "@/app/components/inputs/base/EditText";
import {useState} from "react";

export default function SignUpPage() {
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	return (
		<div className={styles.pageBackground}>
			<div className={styles.column}>
				<Image
					src={'/app-logo.png'}
					alt={"Logo"}
					width={90}
					height={90}
				/>
				<h2>Welcome to Algo arena</h2>
				<div className={styles.emptySpace}/>
				<h3>Practice. Compete. Grow with your squad.</h3>

				<div className={styles.inputWrapper}>
					<EditText
						value={username}
						placeholder={"Enter your Username"}
						type={'text'}
						onChange={(event) => {
							setUsername(event.target.value)
						}}/>

					<EditText
						value={email}
						placeholder={"Enter your Email"}
						type={'text'}
						onChange={(event) => {
							setEmail(event.target.value)
						}}/>

					<EditText
						value={password}
						placeholder={"Enter your Password"}
						type={'password'}
						onChange={(event) => {
							setPassword(event.target.value)
						}}/>
				</div>

				<div className={styles.bottomContainer}>
					<span className={styles.bottomText}>
						Terms of Services
					</span>
					&nbsp; &#183; &nbsp;
					<span className={styles.bottomText}>
						Privacy Policy
					</span>
				</div>
			</div>
		</div>
	);
}