import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { adminApi, type UserAdminListFilter } from "./admin";
import { bookingsApi, type BookingListFilter } from "./bookings";
import { complaintsApi, type ComplaintListFilter } from "./complaints";
import {
  curatorApi,
  type LandlordListFilter,
  type StudentListFilter,
} from "./curator";
import { amenitiesApi, housesApi } from "./houses";
import { notificationsApi, type NotificationListFilter } from "./notifications";
import { reviewsApi, type ReviewListFilter } from "./reviews";
import { subscriptionsApi } from "./subscriptions";
import { universitiesApi, type UniversityListFilter } from "./universities";
import type { HouseFilter } from "./types";

export function useHouses(filters: HouseFilter) {
  return useQuery({
    queryKey: ["houses", "list", filters],
    queryFn: () => housesApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useMyHouses(filters: HouseFilter = {}) {
  return useQuery({
    queryKey: ["houses", "mine", filters],
    queryFn: () => housesApi.listMine(filters),
    placeholderData: keepPreviousData,
  });
}

export function useHouse(id: number | null) {
  return useQuery({
    queryKey: ["houses", "detail", id],
    queryFn: () => housesApi.detail(id as number),
    enabled: id !== null && Number.isFinite(id),
  });
}

export function useAmenities() {
  return useQuery({
    queryKey: ["amenities"],
    queryFn: () => amenitiesApi.list(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBookings(filters: BookingListFilter = {}) {
  return useQuery({
    queryKey: ["bookings", "list", filters],
    queryFn: () => bookingsApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useBooking(id: number | null) {
  return useQuery({
    queryKey: ["bookings", "detail", id],
    queryFn: () => bookingsApi.detail(id as number),
    enabled: id !== null && Number.isFinite(id),
  });
}

export function useReviews(filters: ReviewListFilter, enabled = true) {
  return useQuery({
    queryKey: ["reviews", filters],
    queryFn: () => reviewsApi.list(filters),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useNotifications(filters: NotificationListFilter = {}, enabled = true) {
  return useQuery({
    queryKey: ["notifications", "list", filters],
    queryFn: () => notificationsApi.list(filters),
    enabled,
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

// ---------- Subscriptions ----------
export function useSubscriptionStatus(enabled = true) {
  return useQuery({
    queryKey: ["subscriptions", "status"],
    queryFn: () => subscriptionsApi.status(),
    enabled,
    staleTime: 60_000,
  });
}

export function useMySubscriptions(enabled = true) {
  return useQuery({
    queryKey: ["subscriptions", "mine"],
    queryFn: () => subscriptionsApi.listMine(),
    enabled,
  });
}

// ---------- Curator ----------
export function useCuratorStudents(filters: StudentListFilter = {}, enabled = true) {
  return useQuery({
    queryKey: ["curator", "students", filters],
    queryFn: () => curatorApi.listStudents(filters),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useCuratorStudent(id: number | null) {
  return useQuery({
    queryKey: ["curator", "student", id],
    queryFn: () => curatorApi.getStudent(id as number),
    enabled: id !== null && Number.isFinite(id),
  });
}

export function useCuratorLandlords(filters: LandlordListFilter = {}, enabled = true) {
  return useQuery({
    queryKey: ["curator", "landlords", filters],
    queryFn: () => curatorApi.listLandlords(filters),
    enabled,
    placeholderData: keepPreviousData,
  });
}

// ---------- Complaints ----------
export function useComplaints(filters: ComplaintListFilter = {}, enabled = true) {
  return useQuery({
    queryKey: ["complaints", "list", filters],
    queryFn: () => complaintsApi.list(filters),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useComplaint(id: number | null) {
  return useQuery({
    queryKey: ["complaints", "detail", id],
    queryFn: () => complaintsApi.detail(id as number),
    enabled: id !== null && Number.isFinite(id),
  });
}

// ---------- Admin ----------
export function useAdminStats(enabled = true) {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminApi.stats(),
    enabled,
    staleTime: 30_000,
  });
}

export function useAdminAnalytics(enabled = true) {
  return useQuery({
    queryKey: ["admin", "analytics", "overview"],
    queryFn: () => adminApi.analyticsOverview(),
    enabled,
    staleTime: 60_000,
  });
}

export function useUniversities(filters: UniversityListFilter = {}, enabled = true) {
  return useQuery({
    queryKey: ["universities", filters],
    queryFn: () => universitiesApi.list(filters),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useAdminUsers(filters: UserAdminListFilter = {}, enabled = true) {
  return useQuery({
    queryKey: ["admin", "users", filters],
    queryFn: () => adminApi.listUsers(filters),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useAdminHouses(filters: HouseFilter = {}, enabled = true) {
  return useQuery({
    queryKey: ["admin", "houses", filters],
    queryFn: () => adminApi.listHouses(filters),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationsApi.unreadCount(),
    enabled,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

export function useBookingEstimate(
  house_id: number | null,
  start_date: string | null,
  end_date: string | null,
) {
  return useQuery({
    queryKey: ["bookings", "estimate", house_id, start_date, end_date],
    queryFn: () => bookingsApi.estimate(house_id as number, start_date as string, end_date as string),
    enabled:
      house_id !== null &&
      Number.isFinite(house_id) &&
      !!start_date &&
      !!end_date &&
      start_date !== end_date,
    staleTime: 30_000,
  });
}
