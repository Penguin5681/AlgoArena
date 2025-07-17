import React, { useState, useEffect, useRef } from "react";
import styles from "../css/EditProfileModal.module.css";
import { FaCamera, FaUser, FaCode, FaLink } from "react-icons/fa";
import { useAuth } from "@/app/context/AuthContext";
import {
  updateProfilePicture,
  updateBio,
  updateRole,
  updateTechStack,
  updateProgrammingLanguages,
  updateSocialLinks,
} from "@/app/api/user/profile";
import { getAuthToken } from "@/app/api/authentication/auth";

import ReactCrop, {
  type Crop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

async function getCroppedImg(
  image: HTMLImageElement,
  crop: Crop,
  fileName: string
): Promise<File | null> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(null);
        return;
      }
      const file = new File([blob], fileName, { type: blob.type });
      resolve(file);
    }, "image/jpeg");
  });
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  onProfileUpdate: () => void;
}

type Tab = "profile" | "skills" | "socials";

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  userData,
  onProfileUpdate,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const [bio, setBio] = useState("");
  const [role, setRole] = useState("");
  const [techStack, setTechStack] = useState("");
  const [programmingLanguages, setProgrammingLanguages] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [linkedinLink, setLinkedinLink] = useState("");
  const [facebookLink, setFacebookLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [imageToCrop, setImageToCrop] = useState<string>("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userData) {
      setBio(userData.bio || "");
      setRole(userData.role || "");
      setTechStack(userData.tech_stack?.join(", ") || "");
      setProgrammingLanguages(userData.programming_languages?.join(", ") || "");
      setProfilePicPreview(userData.profile_picture || "");
      setGithubLink(userData.github_link || "");
      setLinkedinLink(userData.linkedin_link || "");
      setFacebookLink(userData.facebook_link || "");
    }
  }, [userData]);

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setImageToCrop(reader.result?.toString() || "")
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(initialCrop);
  };

  const handleCropImage = async () => {
    if (!completedCrop || !imgRef.current) {
      return;
    }

    const croppedFile = await getCroppedImg(
      imgRef.current,
      completedCrop,
      "profile_picture.jpg"
    );

    if (croppedFile) {
      setProfilePicFile(croppedFile);
      setProfilePicPreview(URL.createObjectURL(croppedFile));
    }
    setImageToCrop("");
  };

  const handleSave = async () => {
    const token = getAuthToken();
    if (!user || !token) {
      console.error("User not authenticated");
      return;
    }

    setIsLoading(true);

    try {
      const updatePromises = [];

      if (profilePicFile) {
        updatePromises.push(updateProfilePicture(user.email, profilePicFile));
      }
      if (bio !== userData.bio) {
        updatePromises.push(updateBio(user.email, bio, token));
      }
      if (role !== userData.role) {
        updatePromises.push(updateRole(user.email, role, token));
      }
      const techStackArray = techStack
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (
        JSON.stringify(techStackArray) !==
        JSON.stringify(userData.tech_stack || [])
      ) {
        updatePromises.push(updateTechStack(user.email, techStackArray, token));
      }
      const languagesArray = programmingLanguages
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (
        JSON.stringify(languagesArray) !==
        JSON.stringify(userData.programming_languages || [])
      ) {
        updatePromises.push(
          updateProgrammingLanguages(user.email, languagesArray, token)
        );
      }

      const socialLinksToUpdate: { [key: string]: string } = {};
      if (githubLink !== userData.github_link)
        socialLinksToUpdate.github_link = githubLink;
      if (linkedinLink !== userData.linkedin_link)
        socialLinksToUpdate.linkedin_link = linkedinLink;
      if (facebookLink !== userData.facebook_link)
        socialLinksToUpdate.facebook_link = facebookLink;

      if (Object.keys(socialLinksToUpdate).length > 0) {
        updatePromises.push(
          updateSocialLinks(user.email, socialLinksToUpdate, token)
        );
      }

      await Promise.all(updatePromises);

      onProfileUpdate();
      onClose();
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // NOTE: This function renders the main content OR the cropping UI
  const renderContent = () => {
    if (imageToCrop) {
      return (
        <div className={styles.cropperContainer}>
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1} // Enforce a square crop
            minWidth={100}
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imageToCrop}
              onLoad={onImageLoad}
            />
          </ReactCrop>
          <div className={styles.cropperActions}>
            <button
              className={styles.cancelButton}
              onClick={() => setImageToCrop("")}
            >
              Cancel
            </button>
            <button className={styles.saveButton} onClick={handleCropImage}>
              Crop Image
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "profile":
        return (
          <>
            <div className={styles.editProfilePicSection}>
              <label
                htmlFor="profile-pic-upload"
                className={styles.editProfilePicLabel}
              >
                <div className={styles.editProfilePicPreview}>
                  <img src={profilePicPreview} alt="Profile Preview" />
                  <div className={styles.cameraIcon}>
                    <FaCamera />
                  </div>
                </div>
                <span>Change Photo</span>
              </label>
              <input
                id="profile-pic-upload"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleProfilePicChange}
                ref={fileInputRef}
              />
            </div>
            <div className={styles.editField}>
              <label htmlFor="role">Role</label>
              <input
                id="role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Strawberry Farmer"
              />
            </div>
            <div className={styles.editField}>
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                placeholder="Tell us about yourself"
              />
            </div>
          </>
        );
      case "skills":
        // ... (no changes here)
        return (
          <>
            <div className={styles.editField}>
              <label htmlFor="tech-stack">Tech Stack</label>
              <input
                id="tech-stack"
                type="text"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="e.g., React, Node.js, Python"
              />
              <small>Separate items with a comma</small>
            </div>
            <div className={styles.editField}>
              <label htmlFor="programming-languages">
                Programming Languages
              </label>
              <input
                id="programming-languages"
                type="text"
                value={programmingLanguages}
                onChange={(e) => setProgrammingLanguages(e.target.value)}
                placeholder="e.g., JavaScript, TypeScript, Python"
              />
              <small>Separate items with a comma</small>
            </div>
          </>
        );
      case "socials":
        return (
          <>
            <div className={styles.editField}>
              <label htmlFor="github-link">GitHub Link</label>
              <input
                id="github-link"
                type="text"
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                placeholder="https://github.com/your-username"
              />
            </div>
            <div className={styles.editField}>
              <label htmlFor="linkedin-link">LinkedIn Link</label>
              <input
                id="linkedin-link"
                type="text"
                value={linkedinLink}
                onChange={(e) => setLinkedinLink(e.target.value)}
                placeholder="https://linkedin.com/in/your-profile"
              />
            </div>
            <div className={styles.editField}>
              <label htmlFor="facebook-link">Facebook Link</label>
              <input
                id="facebook-link"
                type="text"
                value={facebookLink}
                onChange={(e) => setFacebookLink(e.target.value)}
                placeholder="https://facebook.com/your-profile"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>
          {imageToCrop ? "Crop Your Photo" : "Edit Profile"}
        </h2>

        {!imageToCrop && (
          <div className={styles.modalTabs}>
            <button
              className={`${styles.tabButton} ${
                activeTab === "profile" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("profile")}
            >
              <FaUser />
              <span>Profile</span>
            </button>
            <button
              className={`${styles.tabButton} ${
                activeTab === "skills" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("skills")}
            >
              <FaCode />
              <span>Skills</span>
            </button>
            <button
              className={`${styles.tabButton} ${
                activeTab === "socials" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("socials")}
            >
              <FaLink />
              <span>Socials</span>
            </button>
          </div>
        )}

        <div className={styles.tabPanel}>{renderContent()}</div>

        {!imageToCrop && (
          <div className={styles.modalActions}>
            <button
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              className={styles.saveButton}
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProfileModal;
