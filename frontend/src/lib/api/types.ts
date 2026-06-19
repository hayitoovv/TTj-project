// Backend Pydantic schema'lariga to'liq mos kelishi kerak.
// snake_case — backend bilan bir xil format.

export type UserRole = "student" | "landlord" | "curator" | "admin";
export type Gender = "male" | "female";
export type Currency = "UZS" | "USD";
export type HouseStatus = "pending" | "approved" | "rejected" | "rented" | "inactive";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "active"
  | "ended"
  | "cancelled"
  | "refunded";
export type PaymentGateway = "click" | "payme" | "uzum" | "paynet";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

// ---------- Common ----------
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ApiError {
  error?: { code: string; message: string; field?: string | null };
  detail?: { code: string; message: string } | string;
}

// ---------- Auth ----------
export interface RegisterRequest {
  phone: string;
  password: string;
  role: Exclude<UserRole, "admin">;
  first_name?: string;
  last_name?: string;
}

export interface RegisterResponse {
  phone: string;
  message: string;
  code_sent: boolean;
  dev_code?: string | null;
}

export interface VerifyPhoneRequest {
  phone: string;
  code: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface HemisLoginRequest {
  hemis_login: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// ---------- User ----------
export interface StudentProfileRead {
  hemis_id?: string | null;
  university_id?: number | null;
  faculty?: string | null;
  course?: number | null;
  group_name?: string | null;
  gender?: Gender | null;
  birth_date?: string | null;
}

export interface LandlordProfileRead {
  passport_series?: string | null;
  passport_number?: string | null;
  is_pro: boolean;
  pro_until?: string | null;
  free_listings_used: number;
  is_verified_landlord: boolean;
}

export interface CuratorProfileRead {
  university_id?: number | null;
  position?: string | null;
}

export interface AdminProfileRead {
  is_super_admin: boolean;
}

export interface UserResponse {
  id: number;
  phone: string;
  role: UserRole;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  student_profile?: StudentProfileRead | null;
  landlord_profile?: LandlordProfileRead | null;
  curator_profile?: CuratorProfileRead | null;
  admin_profile?: AdminProfileRead | null;
}

// ---------- House ----------
export interface AmenityRead {
  id: number;
  name: string;
  icon?: string | null;
  category?: string | null;
}

export interface HousePhotoRead {
  id: number;
  url: string;
  order_num: number;
  is_main: boolean;
}

export interface HouseListItem {
  id: number;
  title: string;
  region?: string | null;
  district?: string | null;
  address: string;
  latitude: number;
  longitude: number;
  rooms: number;
  area_sqm?: string | null;
  price_per_month: string;
  currency: Currency;
  status: HouseStatus;
  is_top: boolean;
  views_count: number;
  average_rating: string;
  reviews_count: number;
  main_photo?: string | null;
  distance_km?: number | null;
  is_favorited?: boolean;
  created_at: string;
}

export interface HouseDetail extends HouseListItem {
  description?: string | null;
  max_tenants?: number | null;
  floor?: number | null;
  total_floors?: number | null;
  deposit_amount?: string | null;
  landlord_id: number;
  landlord_name?: string | null;
  landlord_avatar?: string | null;
  photos: HousePhotoRead[];
  amenities: AmenityRead[];
}

export interface HouseFilter {
  q?: string;
  region?: string;
  district?: string;
  min_price?: number;
  max_price?: number;
  currency?: Currency;
  rooms?: number;
  amenity_ids?: number[];
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  sort?: "created_desc" | "created_asc" | "price_asc" | "price_desc" | "rating_desc" | "views_desc";
  page?: number;
  page_size?: number;
}

// ---------- Booking ----------
export interface BookingCreate {
  house_id: number;
  start_date: string;
  end_date: string;
}

export interface ContractRead {
  id: number;
  contract_number: string;
  pdf_url?: string | null;
  terms_version: string;
  student_accepted_at?: string | null;
  landlord_accepted_at?: string | null;
}

export interface BookingListItem {
  id: number;
  house_id: number;
  house_title?: string | null;
  house_address?: string | null;
  house_photo?: string | null;
  student_id: number;
  student_name?: string | null;
  start_date: string;
  end_date: string;
  monthly_price: string;
  currency: Currency;
  total_amount: string;
  status: BookingStatus;
  confirmed_at?: string | null;
  created_at: string;
}

export interface BookingDetail extends BookingListItem {
  platform_fee: string;
  service_fee: string;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  contract?: ContractRead | null;
}

// ---------- Review ----------
export type ReviewTargetType = "house" | "user";

export interface ReviewerInfo {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  role: UserRole;
}

export interface ReviewRead {
  id: number;
  booking_id: number;
  target_type: ReviewTargetType;
  house_id?: number | null;
  target_user_id?: number | null;
  rating: number;
  comment?: string | null;
  created_at: string;
  reviewer: ReviewerInfo;
}

export interface ReviewCreateInput {
  booking_id: number;
  target_type: ReviewTargetType;
  house_id?: number | null;
  target_user_id?: number | null;
  rating: number;
  comment?: string | null;
}

// ---------- Complaint ----------
export type ComplaintAgainstType = "user" | "house";
export type ComplaintStatus = "new" | "processing" | "resolved";

export interface ReporterInfo {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  phone: string;
}

export interface ComplaintRead {
  id: number;
  against_type: ComplaintAgainstType;
  target_user_id?: number | null;
  house_id?: number | null;
  booking_id?: number | null;
  subject: string;
  description: string;
  status: ComplaintStatus;
  resolution?: string | null;
  assigned_curator_id?: number | null;
  resolved_at?: string | null;
  created_at: string;
  reporter: ReporterInfo;
  house_title?: string | null;
  target_user_name?: string | null;
}

export interface ComplaintCreateInput {
  against_type: ComplaintAgainstType;
  target_user_id?: number | null;
  house_id?: number | null;
  booking_id?: number | null;
  subject: string;
  description: string;
}

// ---------- Notification ----------
export type NotificationType =
  | "booking"
  | "payment"
  | "message"
  | "complaint"
  | "review"
  | "system";

export interface NotificationRead {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}
