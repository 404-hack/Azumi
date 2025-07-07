import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "~/lib/api";

// Types
export interface Order {
  id: string;
  status: "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "DELIVERED" | "CANCELLED";
  amount: number;
  fee: number;
  store: string;
  storeAddress: string;
  customer: string;
  customerAddress: string;
  date: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Earnings {
  total: number;
  today: number;
  week: number;
  month: number;
  orders: number;
  tips: number;
  bonuses: number;
}

export interface RiderProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "online" | "offline";
  rating: number;
  totalOrders: number;
  totalEarnings: number;
}

// Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  createdAt: string;
  updatedAt: string;
  role: string;
  banned: boolean;
  banReason?: string;
  banExpires?: string;
  phoneNumber: string;
  phoneNumberVerified: boolean;
  tokens: number;
  credits: number;
}

export interface Session {
  id: string;
  expiresAt: string;
  token: string;
  createdAt: string;
  updatedAt: string;
  ipAddress: string;
  userAgent: string;
  userId: string;
  activeOrganizationId?: string;
  impersonatedBy?: string;
}

export interface SignInResponse {
  user: User;
  session: Session;
}

export interface OTPResponse {
  message: string;
}

export interface VerifyPhoneResponse {
  status: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string;
    phoneNumber: string;
    phoneNumberVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface ResetPasswordResponse {
  status: boolean;
}

// Query Keys
export const queryKeys = {
  orders: ["orders"] as const,
  order: (id: string) => ["orders", id] as const,
  earnings: (period?: string) => ["earnings", period] as const,
  profile: ["rider", "profile"] as const,
};

// Hooks
export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: api.orders.getAll,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => api.orders.getById(id),
    enabled: !!id,
  });
}

export function useEarnings(period?: string) {
  return useQuery({
    queryKey: queryKeys.earnings(period),
    queryFn: () => api.rider.getEarnings(period),
  });
}

export function useRiderProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: api.rider.getProfile,
  });
}

// Mutations
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.orders.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.order(id) });
    },
  });
}

export function useUpdateRiderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: "online" | "offline") =>
      api.rider.updateStatus(status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}

// Auth Mutations
export function useSignInWithPhone() {
  return useMutation({
    mutationFn: ({
      phoneNumber,
      password,
      rememberMe,
    }: {
      phoneNumber: string;
      password: string;
      rememberMe?: string;
    }) => api.auth.signInWithPhone(phoneNumber, password, rememberMe),
  });
}

export function useSendOTP() {
  return useMutation({
    mutationFn: ({ phoneNumber }: { phoneNumber: string }) =>
      api.auth.sendOTP(phoneNumber),
  });
}

export function useVerifyPhone() {
  return useMutation({
    mutationFn: ({
      phoneNumber,
      code,
      disableSession,
      updatePhoneNumber,
    }: {
      phoneNumber: string;
      code: string;
      disableSession?: string;
      updatePhoneNumber?: string;
    }) =>
      api.auth.verifyPhone(
        phoneNumber,
        code,
        disableSession,
        updatePhoneNumber
      ),
  });
}

export function useForgetPassword() {
  return useMutation({
    mutationFn: ({ phoneNumber }: { phoneNumber: string }) =>
      api.auth.forgetPassword(phoneNumber),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({
      otp,
      phoneNumber,
      newPassword,
    }: {
      otp: string;
      phoneNumber: string;
      newPassword: string;
    }) => api.auth.resetPassword(otp, phoneNumber, newPassword),
  });
}
