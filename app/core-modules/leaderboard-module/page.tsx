import styles from './leaderboard.module.css';

export default function() {
    return (
        <div className={styles.pageBackground}>
            <h1>You are currently on the leaderboard page.</h1>
            <h1>Start editing the following to see the changes:</h1>
            <br/>
            <h2>app/core-modules/leaderboard-module/page.tsx</h2>
            <h2>app/core-modules/leaderboard-module/leaderboard.module.css</h2>
            <br/>
            <br/>
            <h3>You are currently in 'no-api-branch'</h3>
            <h3>feel free to mess around here</h3>
        </div>
    );
};