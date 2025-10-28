import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<Omit<SelectUser, "password">, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<Omit<SelectUser, "password">, Error, InsertUser>;
  refetchUser: () => Promise<void>;
};

type LoginData = {
  username: string;
  password: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [currentUser, setCurrentUser] = useState<SelectUser | null>(null);

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    retry: false,
    refetchOnMount: false,
  });

  // Sync query data with local state
  useEffect(() => {
    setCurrentUser(user ?? null);
  }, [user]);

  // Debug logging
  console.log("useAuth - user state:", user);
  console.log("useAuth - currentUser state:", currentUser);
  console.log("useAuth - isLoading:", isLoading);
  console.log("useAuth - error:", error);

  const refetchUser = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Login failed" }));
        throw new Error(errorData.message || "Invalid credentials");
      }
      return await res.json();
    },
    onSuccess: (data: any) => {
      console.log("Login mutation success - data:", data);
      // Set the user data directly in the cache and local state
      queryClient.setQueryData(["/api/auth/user"], data.user);
      setCurrentUser(data.user);
              toast({
          title: "Login successful",
          description: `Welcome back, ${data.user.fullName || data.user.full_name}!`,
        });
      console.log("Navigating to dashboard...");
      navigate("/"); // Redirect to dashboard
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/auth/register", credentials);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Registration failed" }));
        throw new Error(errorData.message || "Registration failed");
      }
      return await res.json();
    },
    onSuccess: (data: any) => {
      // Update cache directly and navigate
      queryClient.setQueryData(["/api/auth/user"], data.user);
      setCurrentUser(data.user);
              toast({
          title: "Registration successful",
          description: `Welcome, ${data.user.fullName || data.user.full_name}!`,
        });
      navigate("/"); // Redirect to dashboard
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout");
      if (!res.ok) {
        throw new Error("Logout failed");
      }
    },
    onSuccess: () => {
      // Clear cache directly and navigate
      queryClient.setQueryData(["/api/auth/user"], null);
      setCurrentUser(null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      navigate("/auth"); // Redirect to login page
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}