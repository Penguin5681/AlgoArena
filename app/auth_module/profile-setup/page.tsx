"use client";

import styles from "./page.module.css";
import Image from "next/image";
import { useState, useRef } from "react";
import GradientButton from "@/app/components/buttons/base/GradientButton";
import EditText from "@/app/components/inputs/base/EditText";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FaGithub,
  FaLinkedin,
  FaFacebook,
  FaCamera,
  FaCode,
  FaUser,
  FaLink,
  FaArrowRight,
  FaArrowLeft,
  FaCheck,
  FaPlus,
  FaEdit,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { updateUserProfile } from "@/app/api/user/user";

interface ProfileData {
  profilePicture?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  techStack: string[];
  programmingLanguages: string[];
  customTechStack: string[];
  customProgrammingLanguages: string[];
}

const techStackOptions = [
  "React",
  "Node.js",
  "Python",
  "Java",
  "JavaScript",
  "TypeScript",
  "Angular",
  "Vue.js",
  "Django",
  "Flask",
  "Spring Boot",
  "Express.js",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "Redis",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "GCP",
  "Git",
  "Linux",
  "HTML/CSS",
  "React Native",
  "Flutter",
  "Svelte",
  "Next.js",
  "Nuxt.js",
  "GraphQL",
  "Firebase",
  "Tailwind CSS",
  "Bootstrap",
  "Material-UI",
  "Sass",
  "Webpack",
  "Vite",
  "Elasticsearch",
];

const programmingLanguageOptions = [
  "JavaScript",
  "Python",
  "Java",
  "C++",
  "C#",
  "TypeScript",
  "Go",
  "Rust",
  "PHP",
  "Ruby",
  "Swift",
  "Kotlin",
  "Scala",
  "R",
  "MATLAB",
  "Perl",
  "Haskell",
  "C",
  "Dart",
  "Objective-C",
  "F#",
  "Clojure",
  "Erlang",
  "Elixir",
  "Julia",
  "Lua",
  "Shell",
  "PowerShell",
];

const INITIAL_DISPLAY_COUNT = 12;

export default function ProfileSetupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    techStack: [],
    programmingLanguages: [],
    customTechStack: [],
    customProgrammingLanguages: [],
  });
  const [previewImage, setPreviewImage] = useState<string>("");
  const [customTechInput, setCustomTechInput] = useState("");
  const [customLangInput, setCustomLangInput] = useState("");
  const [showCustomTech, setShowCustomTech] = useState(false);
  const [showCustomLang, setShowCustomLang] = useState(false);
  const [showAllTech, setShowAllTech] = useState(false);
  const [showAllLang, setShowAllLang] = useState(false);
	const [profilePictureUrl, setProfilePictureUrl] = useState('');

  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const password = searchParams.get("password") || "";

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewImage(result);
        setProfileData((prev) => ({ ...prev, profilePicture: result }));
      };
      reader.readAsDataURL(file);
    }


    let profilePictureFile: File | undefined = undefined;
    if (
      fileInputRef.current &&
      fileInputRef.current.files &&
      fileInputRef.current.files[0]
    ) {
      profilePictureFile = fileInputRef.current.files[0];
    }

    let uploadedImageUrl: string | undefined = undefined;

    if (profilePictureFile) {
      const formData = new FormData();
      formData.append("file", profilePictureFile);
      formData.append("email", email);

      const uploadResponse = await fetch(
        "http://localhost:5000/api/profile/upload-profile-picture",
        {
          method: "POST",
          body: formData,
        }
      );

			console.log("Photo Uploaded: " + uploadResponse.json());

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload profile picture");
      }

      const uploadResult = await uploadResponse.json();
      uploadedImageUrl = uploadResult.url;
			setProfilePictureUrl(uploadedImageUrl || '');
    }
  };

  const handleTechStackToggle = (tech: string) => {
    setProfileData((prev) => ({
      ...prev,
      techStack: prev.techStack.includes(tech)
        ? prev.techStack.filter((t) => t !== tech)
        : [...prev.techStack, tech],
    }));
  };

  const handleProgrammingLanguageToggle = (lang: string) => {
    setProfileData((prev) => ({
      ...prev,
      programmingLanguages: prev.programmingLanguages.includes(lang)
        ? prev.programmingLanguages.filter((l) => l !== lang)
        : [...prev.programmingLanguages, lang],
    }));
  };

  const handleAddCustomTech = () => {
    if (
      customTechInput.trim() &&
      !profileData.customTechStack.includes(customTechInput.trim())
    ) {
      setProfileData((prev) => ({
        ...prev,
        customTechStack: [...prev.customTechStack, customTechInput.trim()],
      }));
      setCustomTechInput("");
    }
  };

  const handleAddCustomLang = () => {
    if (
      customLangInput.trim() &&
      !profileData.customProgrammingLanguages.includes(customLangInput.trim())
    ) {
      setProfileData((prev) => ({
        ...prev,
        customProgrammingLanguages: [
          ...prev.customProgrammingLanguages,
          customLangInput.trim(),
        ],
      }));
      setCustomLangInput("");
    }
  };

  const handleRemoveCustomTech = (tech: string) => {
    setProfileData((prev) => ({
      ...prev,
      customTechStack: prev.customTechStack.filter((t) => t !== tech),
    }));
  };

  const handleRemoveCustomLang = (lang: string) => {
    setProfileData((prev) => ({
      ...prev,
      customProgrammingLanguages: prev.customProgrammingLanguages.filter(
        (l) => l !== lang
      ),
    }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setIsLoading(true);

    try {
      await updateUserProfile({
        email,
        github_link: profileData.githubUrl,
        linkedin_link: profileData.linkedinUrl,
        facebook_link: profileData.facebookUrl,
        tech_stack: [...profileData.techStack, ...profileData.customTechStack],
        programming_languages: [
          ...profileData.programmingLanguages,
          ...profileData.customProgrammingLanguages,
        ],
        profile_picture: profilePictureUrl,
      });
      const params = new URLSearchParams({
        email: email,
        password: password,
        signup_success: "true",
      });

      router.push(`/auth_module/login?${params.toString()}`);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStepPreview = (step: number) => {
    switch (step) {
      case 1:
        return previewImage ? (
          <div className={styles.previewItem}>
            <Image
              src={previewImage}
              alt="Profile"
              width={24}
              height={24}
              className={styles.previewAvatar}
            />
            <span>Profile picture added</span>
          </div>
        ) : null;

      case 2:
        const socialLinks = [
          profileData.githubUrl && "GitHub",
          profileData.linkedinUrl && "LinkedIn",
          profileData.facebookUrl && "Facebook",
        ].filter(Boolean);

        return socialLinks.length > 0 ? (
          <div className={styles.previewItem}>
            <FaLink className={styles.previewIcon} />
            <span>{socialLinks.join(", ")} linked</span>
          </div>
        ) : null;

      case 3:
        const allTech = [
          ...profileData.techStack,
          ...profileData.customTechStack,
        ];
        return allTech.length > 0 ? (
          <div className={styles.previewItem}>
            <FaCode className={styles.previewIcon} />
            <span>
              {allTech.length} tech stack{allTech.length > 1 ? "s" : ""}{" "}
              selected
            </span>
          </div>
        ) : null;

      case 4:
        const allLangs = [
          ...profileData.programmingLanguages,
          ...profileData.customProgrammingLanguages,
        ];
        return allLangs.length > 0 ? (
          <div className={styles.previewItem}>
            <FaCode className={styles.previewIcon} />
            <span>
              {allLangs.length} language{allLangs.length > 1 ? "s" : ""}{" "}
              selected
            </span>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepIcon}>
              <FaUser />
            </div>
            <h2 className={styles.stepTitle}>Add Profile Picture</h2>
            <p className={styles.stepDescription}>
              Upload a profile picture to help others recognize you
            </p>

            <div className={styles.profilePictureSection}>
              <div className={styles.profilePictureContainer}>
                <div className={styles.profilePictureWrapper}>
                  {previewImage ? (
                    <Image
                      src={previewImage}
                      alt="Profile preview"
                      width={120}
                      height={120}
                      className={styles.profilePreview}
                    />
                  ) : (
                    <div className={styles.profilePlaceholder}>
                      <FaCamera />
                    </div>
                  )}
                  <div className={styles.uploadOverlay}>
                    <FaCamera />
                  </div>
                </div>
                <button
                  className={styles.uploadButton}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FaCamera />
                  {previewImage ? "Change Photo" : "Upload Photo"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepIcon}>
              <FaLink />
            </div>
            <h2 className={styles.stepTitle}>Connect Social Profiles</h2>
            <p className={styles.stepDescription}>
              Add your social links to showcase your professional presence
            </p>

            <div className={styles.socialLinksSection}>
              <div className={styles.socialField}>
                <div className={`${styles.socialIcon} ${styles.github}`}>
                  <FaGithub />
                </div>
                <EditText
                  value={profileData.githubUrl || ""}
                  placeholder="https://github.com/yourusername"
                  type="text"
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      githubUrl: e.target.value,
                    }))
                  }
                />
              </div>

              <div className={styles.socialField}>
                <div className={`${styles.socialIcon} ${styles.linkedin}`}>
                  <FaLinkedin />
                </div>
                <EditText
                  value={profileData.linkedinUrl || ""}
                  placeholder="https://linkedin.com/in/yourusername"
                  type="text"
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      linkedinUrl: e.target.value,
                    }))
                  }
                />
              </div>

              <div className={styles.socialField}>
                <div className={`${styles.socialIcon} ${styles.facebook}`}>
                  <FaFacebook />
                </div>
                <EditText
                  value={profileData.facebookUrl || ""}
                  placeholder="https://facebook.com/yourusername"
                  type="text"
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      facebookUrl: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        );

      case 3:
        const displayedTechOptions = showAllTech
          ? techStackOptions
          : techStackOptions.slice(0, INITIAL_DISPLAY_COUNT);

        return (
          <div className={styles.stepContent}>
            <div className={styles.stepIcon}>
              <FaCode />
            </div>
            <h2 className={styles.stepTitle}>Select Tech Stack</h2>
            <p className={styles.stepDescription}>
              Choose the technologies and frameworks you work with
            </p>

            <div className={styles.tagsSection}>
              <div className={styles.tagsGrid}>
                {displayedTechOptions.map((tech) => (
                  <button
                    key={tech}
                    className={`${styles.tagButton} ${
                      profileData.techStack.includes(tech)
                        ? styles.selected
                        : ""
                    }`}
                    onClick={() => handleTechStackToggle(tech)}
                  >
                    {tech}
                    {profileData.techStack.includes(tech) && (
                      <FaCheck className={styles.checkIcon} />
                    )}
                  </button>
                ))}

                {/* Custom Tech Stack Items */}
                {profileData.customTechStack.map((tech) => (
                  <div
                    key={tech}
                    className={`${styles.tagButton} ${styles.selected} ${styles.customTag}`}
                  >
                    {tech}
                    <button
                      className={styles.removeButton}
                      onClick={() => handleRemoveCustomTech(tech)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}

                {/* Add Custom Tech Button */}
                <button
                  className={`${styles.tagButton} ${styles.addCustomButton}`}
                  onClick={() => setShowCustomTech(true)}
                >
                  <FaPlus />
                  Add Custom
                </button>
              </div>

              {/* Show More/Less Button */}
              {techStackOptions.length > INITIAL_DISPLAY_COUNT && (
                <div className={styles.showMoreSection}>
                  <button
                    className={styles.showMoreButton}
                    onClick={() => setShowAllTech(!showAllTech)}
                  >
                    {showAllTech ? (
                      <>
                        <FaChevronUp />
                        Show Less
                      </>
                    ) : (
                      <>
                        <FaChevronDown />
                        Show More (
                        {techStackOptions.length - INITIAL_DISPLAY_COUNT} more)
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Custom Tech Input */}
              {showCustomTech && (
                <div className={styles.customInputSection}>
                  <EditText
                    value={customTechInput}
                    placeholder="Enter custom technology"
                    type="text"
                    onChange={(e) => setCustomTechInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddCustomTech();
                        setShowCustomTech(false);
                      }
                    }}
                  />
                  <div className={styles.customInputButtons}>
                    <button
                      className={styles.customAddButton}
                      onClick={() => {
                        handleAddCustomTech();
                        setShowCustomTech(false);
                      }}
                    >
                      <FaCheck />
                    </button>
                    <button
                      className={styles.customCancelButton}
                      onClick={() => {
                        setShowCustomTech(false);
                        setCustomTechInput("");
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <div className={styles.selectedCount}>
                {profileData.techStack.length +
                  profileData.customTechStack.length}{" "}
                selected
              </div>
            </div>
          </div>
        );

      case 4:
        const displayedLangOptions = showAllLang
          ? programmingLanguageOptions
          : programmingLanguageOptions.slice(0, INITIAL_DISPLAY_COUNT);

        return (
          <div className={styles.stepContent}>
            <div className={styles.stepIcon}>
              <FaCode />
            </div>
            <h2 className={styles.stepTitle}>Programming Languages</h2>
            <p className={styles.stepDescription}>
              Select the programming languages you're proficient in
            </p>

            <div className={styles.tagsSection}>
              <div className={styles.tagsGrid}>
                {displayedLangOptions.map((lang) => (
                  <button
                    key={lang}
                    className={`${styles.tagButton} ${
                      profileData.programmingLanguages.includes(lang)
                        ? styles.selected
                        : ""
                    }`}
                    onClick={() => handleProgrammingLanguageToggle(lang)}
                  >
                    {lang}
                    {profileData.programmingLanguages.includes(lang) && (
                      <FaCheck className={styles.checkIcon} />
                    )}
                  </button>
                ))}

                {/* Custom Programming Languages */}
                {profileData.customProgrammingLanguages.map((lang) => (
                  <div
                    key={lang}
                    className={`${styles.tagButton} ${styles.selected} ${styles.customTag}`}
                  >
                    {lang}
                    <button
                      className={styles.removeButton}
                      onClick={() => handleRemoveCustomLang(lang)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}

                {/* Add Custom Language Button */}
                <button
                  className={`${styles.tagButton} ${styles.addCustomButton}`}
                  onClick={() => setShowCustomLang(true)}
                >
                  <FaPlus />
                  Add Custom
                </button>
              </div>

              {/* Show More/Less Button */}
              {programmingLanguageOptions.length > INITIAL_DISPLAY_COUNT && (
                <div className={styles.showMoreSection}>
                  <button
                    className={styles.showMoreButton}
                    onClick={() => setShowAllLang(!showAllLang)}
                  >
                    {showAllLang ? (
                      <>
                        <FaChevronUp />
                        Show Less
                      </>
                    ) : (
                      <>
                        <FaChevronDown />
                        Show More (
                        {programmingLanguageOptions.length -
                          INITIAL_DISPLAY_COUNT}{" "}
                        more)
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Custom Language Input */}
              {showCustomLang && (
                <div className={styles.customInputSection}>
                  <EditText
                    value={customLangInput}
                    placeholder="Enter custom programming language"
                    type="text"
                    onChange={(e) => setCustomLangInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddCustomLang();
                        setShowCustomLang(false);
                      }
                    }}
                  />
                  <div className={styles.customInputButtons}>
                    <button
                      className={styles.customAddButton}
                      onClick={() => {
                        handleAddCustomLang();
                        setShowCustomLang(false);
                      }}
                    >
                      <FaCheck />
                    </button>
                    <button
                      className={styles.customCancelButton}
                      onClick={() => {
                        setShowCustomLang(false);
                        setCustomLangInput("");
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <div className={styles.selectedCount}>
                {profileData.programmingLanguages.length +
                  profileData.customProgrammingLanguages.length}{" "}
                selected
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.pageBackground}>
      <div className={styles.container}>
        {/* Progress Bar */}
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
          <div className={styles.progressText}>Step {currentStep} of 4</div>
        </div>

        {/* Step Preview */}
        <div className={styles.stepPreview}>
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className={styles.stepPreviewItem}>
              <div
                className={`${styles.stepNumber} ${
                  step < currentStep
                    ? styles.completed
                    : step === currentStep
                    ? styles.current
                    : styles.upcoming
                }`}
              >
                {step < currentStep ? <FaCheck /> : step}
              </div>
              {step < currentStep && getStepPreview(step)}
            </div>
          ))}
        </div>

        {/* Logo */}
        <div className={styles.logoContainer}>
          <Image
            src="/app-logo.png"
            alt="Logo"
            width={60}
            height={60}
            className={styles.logo}
          />
        </div>

        {/* Step Content */}
        <div className={styles.contentContainer}>
          <div className={styles.stepTransition} key={currentStep}>
            {renderStep()}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className={styles.navigationButtons}>
          <div className={styles.leftButtons}>
            {currentStep > 1 && (
              <button
                className={styles.backButton}
                onClick={handleBack}
                disabled={isLoading}
              >
                <FaArrowLeft />
                Back
              </button>
            )}
            <button
              className={styles.skipButton}
              onClick={handleSkip}
              disabled={isLoading}
            >
              Skip
            </button>
          </div>

          <GradientButton onClick={handleNext} disabled={isLoading}>
            {isLoading ? (
              <div className={styles.loadingSpinner}>
                <div className={styles.spinner}></div>
                Saving...
              </div>
            ) : currentStep === 4 ? (
              "Get Started"
            ) : (
              <>
                Next <FaArrowRight />
              </>
            )}
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
