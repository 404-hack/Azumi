import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { api } from "./api";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

interface User {
  id: string;
  phoneNumber: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (
    phoneNumber: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<void>;
  sendOTP: (
    phoneNumber: string
  ) => Promise<{ success: boolean; message?: string }>;
  verifyPhone: (
    phoneNumber: string,
    code: string
  ) => Promise<{ success: boolean; message?: string }>;
  forgetPassword: (
    phoneNumber: string
  ) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (
    otp: string,
    phoneNumber: string,
    newPassword: string
  ) => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      setUser(null);
      storage.delete("user");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);

      const storedUser = storage.getString("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);

        try {
          const profile = await api.rider.getProfile();
          if (profile) {
            const updatedUser = {
              id: profile.userId || userData.id,
              phoneNumber: profile.phoneNumber || userData.phoneNumber,
              email: profile.email || userData.email,
              firstName: profile.firstName || userData.firstName,
              lastName: profile.lastName || userData.lastName,
              role: userData.role || "rider",
            };
            setUser(updatedUser);
            storage.set("user", JSON.stringify(updatedUser));
          }
        } catch {
          console.log("Session expired or invalid, clearing user data");
          signOut();
        }
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [signOut]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const signIn = async (
    phoneNumber: string,
    password: string,
    rememberMe = false
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);

      const response = await api.auth.signInWithPhone(
        phoneNumber,
        password,
        rememberMe ? "true" : "false"
      );

      if (response && response.user) {
        const userData: User = {
          id: response.user.id,
          phoneNumber: response.user.phoneNumber || phoneNumber,
          email: response.user.email,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          role: response.user.role || "rider",
        };

        setUser(userData);
        storage.set("user", JSON.stringify(userData));

        return { success: true, message: "Sign in successful" };
      } else {
        return { success: false, message: "Invalid credentials" };
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      return {
        success: false,
        message: error.message || "Sign in failed. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async (
    phoneNumber: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.auth.sendOTP(phoneNumber);
      return { success: true, message: "OTP sent successfully" };
    } catch (error: any) {
      console.error("Send OTP error:", error);
      return {
        success: false,
        message: error.message || "Failed to send OTP",
      };
    }
  };

  const verifyPhone = async (
    phoneNumber: string,
    code: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.auth.verifyPhone(phoneNumber, code);
      return { success: true, message: "Phone verified successfully" };
    } catch (error: any) {
      console.error("Verify phone error:", error);
      return {
        success: false,
        message: error.message || "Phone verification failed",
      };
    }
  };

  const forgetPassword = async (
    phoneNumber: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.auth.forgetPassword(phoneNumber);
      return { success: true, message: "Password reset OTP sent" };
    } catch (error: any) {
      console.error("Forget password error:", error);
      return {
        success: false,
        message: error.message || "Failed to send password reset OTP",
      };
    }
  };

  const resetPassword = async (
    otp: string,
    phoneNumber: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.auth.resetPassword(otp, phoneNumber, newPassword);
      return { success: true, message: "Password reset successful" };
    } catch (error: any) {
      console.error("Reset password error:", error);
      return {
        success: false,
        message: error.message || "Password reset failed",
      };
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (!user) return;

    try {
      const profile = await api.rider.getProfile();
      if (profile) {
        const updatedUser: User = {
          id: profile.userId || user.id,
          phoneNumber: profile.phoneNumber || user.phoneNumber,
          email: profile.email || user.email,
          firstName: profile.firstName || user.firstName,
          lastName: profile.lastName || user.lastName,
          role: user.role || "rider",
        };
        setUser(updatedUser);
        storage.set("user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
    sendOTP,
    verifyPhone,
    forgetPassword,
    resetPassword,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
