import React from "react";
import styles from '../css/GoogleButton.module.css';
import Image from "next/image";

export default function GoogleButton({onClick, ...rest}
): React.JSX.Element {
	return (
		<button
			className={styles.googleButton}
			onClick={onClick}
			{...rest}
		>
			<div className={styles.buttonContent}>
				<Image
					src={'/google.png'}
					alt={"Google Icon"}
					width={20}
					height={20}/>
				&nbsp; Continue with Google
			</div>
		</button>
	);
}