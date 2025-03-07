import { Profile, Profiles } from "@/@types/profile";

const PROFILES_KEY = "ziht-ai-chat-profiles";

// Simple encryption/decryption for API keys
const encryptApiKey = (apiKey: string): string => {
  // This is a very basic encryption, in a real app you'd use a more secure method
  return btoa(apiKey);
};

export const decryptApiKey = (encryptedKey: string): string => {
  // Decrypt the API key
  return atob(encryptedKey);
};

// Get all profiles from localStorage
export const getProfiles = (): Profiles => {
  if (typeof window === "undefined") return [];
  
  const profilesJson = localStorage.getItem(PROFILES_KEY);
  if (!profilesJson) return [];
  
  try {
    const profiles: Profiles = JSON.parse(profilesJson);
    return profiles.map(profile => ({
      ...profile,
      createdAt: new Date(profile.createdAt),
      lastUsed: new Date(profile.lastUsed),
    }));
  } catch (error) {
    console.error("Failed to parse profiles:", error);
    return [];
  }
};

// Save profiles to localStorage
export const saveProfiles = (profiles: Profiles): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
};

// Add a new profile
export const addProfile = (name: string, apiKey: string): Profile => {
  const profiles = getProfiles();
  
  // Check if profile with this name already exists
  if (profiles.some(p => p.name === name)) {
    throw new Error(`Profile with name "${name}" already exists`);
  }
  
  // Create new profile
  const newProfile: Profile = {
    id: Date.now().toString(),
    name,
    apiKey: encryptApiKey(apiKey),
    isActive: profiles.length === 0, // Make active if it's the first profile
    createdAt: new Date(),
    lastUsed: new Date(),
  };
  
  // If this is set as active, deactivate all others
  const updatedProfiles = newProfile.isActive 
    ? profiles.map(p => ({ ...p, isActive: false }))
    : profiles;
  
  // Add the new profile and save
  saveProfiles([...updatedProfiles, newProfile]);
  return newProfile;
};

// Set a profile as active
export const setActiveProfile = (id: string, lastUsedModel?: string): Profile => {
  const profiles = getProfiles();
  const profile = profiles.find(p => p.id === id);
  
  if (!profile) {
    throw new Error(`Profile with id "${id}" not found`);
  }
  
  // Update all profiles, setting only the selected one as active
  const updatedProfiles = profiles.map(p => ({
    ...p,
    isActive: p.id === id,
    lastUsed: p.id === id ? new Date() : p.lastUsed,
    lastUsedModel: p.id === id && lastUsedModel ? lastUsedModel : p.lastUsedModel
  }));
  
  saveProfiles(updatedProfiles);
  return { 
    ...profile, 
    isActive: true, 
    lastUsed: new Date(),
    lastUsedModel: lastUsedModel || profile.lastUsedModel 
  };
};

// Remove a profile
export const removeProfile = (id: string): void => {
  const profiles = getProfiles();
  const filteredProfiles = profiles.filter(p => p.id !== id);
  
  // If we removed the active profile, make the most recently used one active
  if (profiles.find(p => p.id === id)?.isActive && filteredProfiles.length > 0) {
    const sortedByLastUsed = [...filteredProfiles].sort(
      (a, b) => b.lastUsed.getTime() - a.lastUsed.getTime()
    );
    sortedByLastUsed[0].isActive = true;
  }
  
  saveProfiles(filteredProfiles);
};

// Get the active profile
export const getActiveProfile = (): Profile | null => {
  const profiles = getProfiles();
  const activeProfile = profiles.find(p => p.isActive);
  return activeProfile || null;
};

// Get decrypted API key for the active profile
export const getActiveApiKey = (): string | null => {
  const activeProfile = getActiveProfile();
  if (!activeProfile) return null;
  return decryptApiKey(activeProfile.apiKey);
};