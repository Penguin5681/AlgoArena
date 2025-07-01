import styles from "./page.module.css"
import Image from "next/image";
import GradientButton from "@/app/components/buttons/base/GradientButton";
import GoogleButton from "@/app/components/buttons/base/GoogleButton";
import Link from "next/link";

export default function GetStartedPage() {
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

				<div className={styles.buttonContainer} style={{gap: '16px'}}>
					<Link href={'/auth_module/signup'}>
						<GradientButton>
							Continue with Email
						</GradientButton>
					</Link>
					<GoogleButton onClick={undefined}/>
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