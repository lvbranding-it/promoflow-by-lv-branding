"use client";
import {
  User,
  onAuthStateChanged,
  getAuth,
  Auth,
} from "firebase/auth";
import {app} from "@/lib/firebase"; // Import the initialized app
import {createContext, useContext, useEffect, useState} from "react";

interface FirebaseAuthContextType {
  user: User | null;
  loading: boolean;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType>({
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
    let authInstance: Auth | undefined;
    if (typeof window !== 'undefined') {
      authInstance = getAuth(app);
    }

    if (authInstance) {
      const unsubscribe = onAuthStateChanged(authInstance, (user) => {
        setUser(user);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
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
