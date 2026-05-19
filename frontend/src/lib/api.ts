import axios from "axios";
import { auth } from "./firebase";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
  timeout: 60_000, // longer for Gemini vision calls
});

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Types ──────────────────────────────────────────────────────────────────────

export type EventCategory = "Exam" | "Assignment" | "Study Session" | "Class" | "Other";

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_time: string;   // ISO 8601
  end_time: string;     // ISO 8601
  category: EventCategory;
  created_at: string;
  updated_at?: string;
}

export interface CalendarEventCreate {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  category: EventCategory;
}

export interface CalendarChatResponse {
  event: CalendarEventCreate;
  confirmation_message: string;
}

export interface AcademicNote {
  id: string;
  user_id: string;
  title: string;
  raw_canvas_data?: string;
  extracted_text?: string;
  ai_summary?: string;
  action_items: string[];
  created_at: string;
  updated_at?: string;
}

// ── Calendar API ───────────────────────────────────────────────────────────────

export const calendarApi = {
  list: (month?: number, year?: number) =>
    api.get<CalendarEvent[]>("/api/v1/calendar/", {
      params: month && year ? { month, year } : undefined,
    }),
  create: (data: CalendarEventCreate) =>
    api.post<CalendarEvent>("/api/v1/calendar/", data),
  update: (id: string, data: Partial<CalendarEventCreate>) =>
    api.patch<CalendarEvent>(`/api/v1/calendar/${id}`, data),
  delete: (id: string) =>
    api.delete(`/api/v1/calendar/${id}`),
  parseChat: (message: string) =>
    api.post<CalendarChatResponse>("/api/v1/calendar/chat/parse", { message }),
};

// ── Notes API ──────────────────────────────────────────────────────────────────

export const notesApi = {
  list: () => api.get<AcademicNote[]>("/api/v1/notes/"),
  create: (title: string, raw_canvas_data: string) =>
    api.post<AcademicNote>("/api/v1/notes/", { title, raw_canvas_data }),
  get: (id: string) => api.get<AcademicNote>(`/api/v1/notes/${id}`),
  delete: (id: string) => api.delete(`/api/v1/notes/${id}`),
};

export default api;
