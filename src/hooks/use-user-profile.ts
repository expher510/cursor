
'use client';

import { useFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useMemoFirebase } from "@/firebase/provider";
import { useState, useCallback } from "react";

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  targetLanguage: string;
  proficiencyLevel: "beginner" | "intermediate" | "advanced";
  learningGoal?: string;
  onboardingCompleted: boolean;
};

export function useUserProfile() {
  const { firestore, user } = useFirebase();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore, refetchTrigger]);

  const { data, isLoading, error } = useDoc<UserProfile>(userProfileRef);

  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  return { 
      userProfile: data, 
      isLoading, 
      error, 
      refetch,
      isEditing,
      setIsEditing
    };
}
