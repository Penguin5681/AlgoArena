'use client';

import styles from './page.module.css';
import Image from "next/image";
import EditText from "@/app/components/inputs/base/EditText";
import {useState} from "react";
import GradientButton from "@/app/components/buttons/base/GradientButton";
import {checkUsernameAvailability, checkEmailAvailability} from "@/app/api/authentication/availability_check";
import {signup} from "@/app/api/authentication/auth";
import {useRouter} from 'next/navigation';

interface AvailabilityState {
    message: string;
    isChecking: boolean;
    isValid?: boolean;
}

export default function SignUpPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSigningUp, setIsSigningUp] = useState(false);

    const [usernameStatus, setUsernameStatus] = useState<AvailabilityState>({message: '', isChecking: false});
    const [emailStatus, setEmailStatus] = useState<AvailabilityState>({message: '', isChecking: false});

    const [formErrors, setFormErrors] = useState<{
        username?: string;
        email?: string;
        password?: string;
        general?: string;
    }>();

    const validateCredentials = () => {
        const errors: {
            username?: string;
            email?: string;
            password?: string;
        } = {};
        
        if (!username.trim()) {
            errors.username = 'Username is required';
        } else if (username.length < 3) {
            errors.username = 'Username must be at least 3 characters';
        } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            errors.username = 'Username can only contain letters, numbers and underscores';
        } else if (usernameStatus.isValid === false) {
            errors.username = 'This username is already taken';
        }
        
        if (!email.trim()) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.email = 'Please enter a valid email address';
        } else if (emailStatus.isValid === false) {
            errors.email = 'This email is already registered';
        }
        
        if (!password) {
            errors.password = 'Password is required';
        } else if (password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            errors.password = 'Password must include uppercase, lowercase and numbers';
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleUsernameBlur = async () => {
        if (!username.trim()) {
            setUsernameStatus({message: '', isChecking: false});
            return;
        }

        setUsernameStatus({message: 'Checking username...', isChecking: true});

        try {
            const result = await checkUsernameAvailability(username);
            setUsernameStatus({
                message: result.available ? 'Username is available!' : 'Username is already taken',
                isChecking: false,
                isValid: result.available
            });
        } catch (error) {
            setUsernameStatus({
                message: 'Error checking username availability',
                isChecking: false,
                isValid: false
            });
        }
    };

    const handleEmailBlur = async () => {
        if (!email.trim()) {
            setEmailStatus({message: '', isChecking: false});
            return;
        }

        setEmailStatus({message: 'Checking email...', isChecking: true});

        try {
            const result = await checkEmailAvailability(email);
            setEmailStatus({
                message: result.available ? 'Email is available!' : 'Email is already registered',
                isChecking: false,
                isValid: result.available
            });
        } catch (error) {
            setEmailStatus({
                message: 'Error checking email availability',
                isChecking: false,
                isValid: false
            });
        }
    };

    const handleSignUp = async () => {
        // Validate form
        if (!validateCredentials()) {
            return;
        }

        // Check if username and email are available
        if (usernameStatus.isValid !== true || emailStatus.isValid !== true) {
            setFormErrors({
                general: 'Please ensure username and email are available before signing up'
            });
            return;
        }

        setIsSigningUp(true);
        setFormErrors({});

        try {
            // Sign up the user
            await signup({
                username,
                email,
                password
            });

            // Redirect to login page with credentials
            const params = new URLSearchParams({
                email: email,
                password: password,
                signup_success: 'true'
            });
            
            router.push(`/auth_module/login?${params.toString()}`);
        } catch (error) {
            setFormErrors({
                general: error instanceof Error ? error.message : 'Signup failed. Please try again.'
            });
        } finally {
            setIsSigningUp(false);
        }
    };

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
                    <div className={styles.formField}>
                        <EditText
                            value={username}
                            placeholder={"Enter your Username"}
                            type={'text'}
                            onChange={(event) => {
                                setUsername(event.target.value)
                                // Clear username status when user types
                                if (usernameStatus.message) {
                                    setUsernameStatus({message: '', isChecking: false});
                                }
                            }}
                            onBlur={handleUsernameBlur}
                        />
                        {usernameStatus.message && (
                            <div className={`${styles.message} ${
                                usernameStatus.isValid
                                    ? styles.messageSuccess
                                    : usernameStatus.isValid === false
                                        ? styles.messageError
                                        : styles.messageInfo
                            }`}>
                                {usernameStatus.message}
                            </div>
                        )}
                        {formErrors?.username && (
                            <div className={`${styles.message} ${styles.messageError}`}>
                                {formErrors.username}
                            </div>
                        )}
                    </div>

                    <div className={styles.formField}>
                        <EditText
                            value={email}
                            placeholder={"Enter your Email"}
                            type={'text'}
                            onChange={(event) => {
                                setEmail(event.target.value)
                                // Clear email status when user types
                                if (emailStatus.message) {
                                    setEmailStatus({message: '', isChecking: false});
                                }
                            }}
                            onBlur={handleEmailBlur}
                        />
                        {emailStatus.message && (
                            <div className={`${styles.message} ${
                                emailStatus.isValid
                                    ? styles.messageSuccess
                                    : emailStatus.isValid === false
                                        ? styles.messageError
                                        : styles.messageInfo
                            }`}>
                                {emailStatus.message}
                            </div>
                        )}
                        {formErrors?.email && (
                            <div className={`${styles.message} ${styles.messageError}`}>
                                {formErrors.email}
                            </div>
                        )}
                    </div>

                    <div className={styles.formField}>
                        <EditText
                            value={password}
                            placeholder={"Enter your Password"}
                            type={'password'}
                            onChange={(event) => {
                                setPassword(event.target.value)
                            }}
                        />
                        {formErrors?.password && (
                            <div className={`${styles.message} ${styles.messageError}`}>
                                {formErrors.password}
                            </div>
                        )}
                    </div>
                </div>

                {formErrors?.general && (
                    <div className={`${styles.message} ${styles.messageError}`}>
                        {formErrors.general}
                    </div>
                )}

                <GradientButton 
                    onClick={handleSignUp}
                    disabled={isSigningUp || usernameStatus.isChecking || emailStatus.isChecking}
                >
                    {isSigningUp ? 'Creating Account...' : 'Sign Up'}
                </GradientButton>

                <div className={styles.signInTextWrapper}>
                    <span>Already have an account? &nbsp;</span>
                    <span 
                        className={styles.signInText}
                        onClick={() => router.push('/auth_module/login')}
                        style={{ cursor: 'pointer' }}
                    >
                        Sign In
                    </span>
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