"use client";
import {
  User,
  onAuthStateChanged,
  getAuth,
} from "firebase/auth";
import {app} from "@/lib/firebase"; // Import the initialized app
import {createContext, useContext, useEffect, useState} from "react";

// Function to get the Auth instance, ensuring it's called only when needed.
export function getAuthInstance() {
  if (typeof window !== 'undefined') {
    return getAuth(app);
  }
  return undefined;
}

const FirebaseAuthContext = createContext<{
  user: User | null;
  loading: boolean;
}>({
  user: null,
  loading: true,
});

export const FirebaseAuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authInstance = getAuthInstance();
    if (!authInstance) { // Ensure auth is initialized before subscribing
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <FirebaseAuthContext.Provider value={{user, loading}}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};

export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error(
      "useFirebaseAuth must be used within a FirebaseAuthProvider"
    );
  }
  return context;
};
