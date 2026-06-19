import { apiClient } from "./client";
import type {
  HemisLoginRequest,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  TokenResponse,
  UserResponse,
  VerifyPhoneRequest,
} from "./types";

export interface UserUpdateInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
}

export interface StudentProfileUpdateInput {
  university_id?: number | null;
  faculty?: string;
  course?: number;
  group_name?: string;
  gender?: "male" | "female";
  birth_date?: string;
}

export interface LandlordProfileUpdateInput {
  passport_series?: string;
  passport_number?: string;
  pinfl?: string;
}

export interface CuratorProfileUpdateInput {
  university_id?: number | null;
  position?: string;
}

export const authApi = {
  register: async (data: RegisterRequest) => {
    const res = await apiClient.post<RegisterResponse>("/auth/register", data);
    return res.data;
  },

  verify: async (data: VerifyPhoneRequest) => {
    const res = await apiClient.post<TokenResponse>("/auth/verify", data);
    return res.data;
  },

  resendCode: async (phone: string) => {
    const res = await apiClient.post<{ message: string; dev_code?: string | null }>(
      "/auth/resend-code",
      { phone },
    );
    return res.data;
  },

  login: async (data: LoginRequest) => {
    const res = await apiClient.post<TokenResponse>("/auth/login", data);
    return res.data;
  },

  loginHemis: async (data: HemisLoginRequest) => {
    const res = await apiClient.post<TokenResponse>("/auth/login/hemis", data);
    return res.data;
  },

  me: async () => {
    const res = await apiClient.get<UserResponse>("/auth/me");
    return res.data;
  },

  updateMe: async (payload: UserUpdateInput) => {
    const res = await apiClient.patch<UserResponse>("/auth/me", payload);
    return res.data;
  },

  updateStudentProfile: async (payload: StudentProfileUpdateInput) => {
    const res = await apiClient.patch<UserResponse>("/auth/me/student", payload);
    return res.data;
  },

  updateLandlordProfile: async (payload: LandlordProfileUpdateInput) => {
    const res = await apiClient.patch<UserResponse>("/auth/me/landlord", payload);
    return res.data;
  },

  updateCuratorProfile: async (payload: CuratorProfileUpdateInput) => {
    const res = await apiClient.patch<UserResponse>("/auth/me/curator", payload);
    return res.data;
  },
};
