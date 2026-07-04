import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);
  const [impersonatedUid, setImpersonatedUid] = useState(() => localStorage.getItem('impersonatedUid') || null);
  const [impersonatedUserData, setImpersonatedUserData] = useState(null);

  useEffect(() => {
    if (!impersonatedUid) {
      setImpersonatedUserData(null);
      return;
    }
    const docRef = doc(db, 'users', impersonatedUid);
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setImpersonatedUserData(docSnap.data());
      } else {
        setImpersonatedUserData(null);
      }
    }, (error) => {
      console.error("Error fetching impersonated user data:", error);
    });
    return () => unsub();
  }, [impersonatedUid]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);

      if (user) {
        setUserLoading(true);
        const userDocRef = doc(db, 'users', user.uid);

        // Listen to live data
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            setUserData(null);
          }
          setUserLoading(false);
        }, async (error) => {
          console.error("Error fetching user data:", error);
          // Fallback: try a one-time fetch if the live listener fails
          try {
            const fallbackSnap = await getDoc(userDocRef);
            if (fallbackSnap.exists()) {
              setUserData(fallbackSnap.data());
            } else {
              setUserData(null);
            }
          } catch (fallbackError) {
            console.error("Fallback getDoc also failed:", fallbackError);
          }
          setUserLoading(false);
        });

        return () => {
          unsubscribeSnapshot();
        };
      } else {
        setUserData(null);
        setUserLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const refreshUserData = async (uid) => {
    // With onSnapshot, refreshUserData might be redundant, but we keep the API shape.
    if (!uid) return;
    try {
      const userDocRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  async function signUpFn(email, password, name, phone, chosenPlan, labelCode) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const role = email.toLowerCase().startsWith('admin@') ? 'admin' : 'user';

    const newUser = {
      uid: user.uid,
      name,
      email,
      phone,
      role,
      labelCode: labelCode || '',
      membershipType: chosenPlan || null,
      membershipStatus: role === 'admin' ? 'Active' : 'Pending',
      paymentStatus: role === 'admin' ? 'Paid' : 'Unpaid',
      joinDate: serverTimestamp(),
      totalEarnings: 0
    };

    await setDoc(doc(db, 'users', user.uid), newUser);
    return newUser;
  }

  async function signInFn(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }

  async function signOutFn() {
    localStorage.removeItem('impersonatedUid');
    setImpersonatedUid(null);
    await signOut(auth);
  }

  const impersonateUser = (uid) => {
    localStorage.setItem('impersonatedUid', uid);
    setImpersonatedUid(uid);
  };

  const stopImpersonating = () => {
    localStorage.removeItem('impersonatedUid');
    setImpersonatedUid(null);
  };

  async function updateProfileData(name, phone) {
    const uid = impersonatedUid || currentUser?.uid;
    if (!uid) throw new Error('No authenticated user');
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      name,
      phone
    }, { merge: true });
  }

  async function updateMembershipPlan(planName) {
    const uid = impersonatedUid || currentUser?.uid;
    if (!uid) throw new Error('No authenticated user');
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      membershipType: planName
    }, { merge: true });
  }

  async function changePassword(newPassword) {
    if (impersonatedUid) {
      throw new Error('Password change is disabled during user impersonation.');
    }
    if (!currentUser) throw new Error('No authenticated user');
    await updatePassword(currentUser, newPassword);
  }

  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
  }

  const value = {
    currentUser: impersonatedUid ? { uid: impersonatedUid, email: impersonatedUserData?.email || '', isImpersonated: true } : currentUser,
    userData: impersonatedUid ? impersonatedUserData : userData,
    loading,
    userLoading: impersonatedUid ? !impersonatedUserData : userLoading,
    signUp: signUpFn,
    signIn: signInFn,
    signOut: signOutFn,
    updateProfileData,
    updateMembershipPlan,
    refreshUserData,
    changePassword,
    resetPassword,
    isImpersonating: !!impersonatedUid,
    realUser: currentUser,
    realUserData: userData,
    impersonateUser,
    stopImpersonating
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && !(currentUser && userLoading) && !(impersonatedUid && !impersonatedUserData) && children}
    </AuthContext.Provider>
  );
}