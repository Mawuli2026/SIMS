import {
  DashboardResponse,
  NotificationsResponse,
  ProfileResponse,
  SearchResponse,
  SidebarResponse,
} from "../types/dashboard.types";
import { apiRequest, bearerHeaders } from "./apiClient";

const authenticatedGet = <T>(path: string, token: string) => apiRequest<T>(path, {
  headers: bearerHeaders(token),
});

export const getDashboard = (token: string) =>
  authenticatedGet<DashboardResponse>("/api/dashboard", token);

export const getSidebar = (token: string) =>
  authenticatedGet<SidebarResponse>("/api/dashboard/sidebar", token);

export const getNotifications = (token: string) =>
  authenticatedGet<NotificationsResponse>("/api/dashboard/notifications", token);

export const getProfile = (token: string) =>
  authenticatedGet<ProfileResponse>("/api/profile/me", token);

export const searchDashboard = (token: string, term: string) =>
  authenticatedGet<SearchResponse>(`/api/search?q=${encodeURIComponent(term)}`, token);
