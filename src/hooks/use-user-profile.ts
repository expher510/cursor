
'use client';

import { useFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useMemoFirebase } from "@/firebase/provider";
import { useState, useCallback } from "react";
import { useToast } from "./use-toast";

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
  const { toast } = useToast();
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
  
  const updateTargetLanguage = useCallback(async (languageCode: string) => {
    if (!user || !firestore) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in to change your language." });
        return;
    };
    const userDocRef = doc(firestore, 'users', user.uid);
    try {
        await updateDoc(userDocRef, {
            targetLanguage: languageCode
        });
        toast({ title: "Language Updated!", description: `Your target language has been set.` });
        refetch();
    } catch (e) {
        console.error("Failed to update target language:", e);
        toast({ variant: "destructive", title: "Update Failed", description: "Could not update your language. Please try again." });
    }
  }, [user, firestore, refetch, toast]);


  return { 
      userProfile: data, 
      isLoading, 
      error, 
      refetch,
      isEditing,
      setIsEditing,
      updateTargetLanguage
    };
}
