import axios, { AxiosError } from "axios";

/* -------------------------------------------------------------------------- */
/* ⚙️  Axios instance                                                         */
/* -------------------------------------------------------------------------- */
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8080";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

/* -------------------------------------------------------------------------- */
/* 🛂  Token handling (in-memory + localStorage)                               */
/* -------------------------------------------------------------------------- */
const TOKEN_KEY = "jwt";
let _token: string | null = null;

export function setAuthToken(token: string | null) {
  _token = token;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else       localStorage.removeItem(TOKEN_KEY);
}

export function bootstrapAuth() {
  const stored = localStorage.getItem(TOKEN_KEY);
  if (stored) _token = stored;
}

export function logout() {
  setAuthToken(null);
}

api.interceptors.request.use((cfg) => {
  if (_token) cfg.headers!["Authorization"] = `Bearer ${_token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    if (err.response?.status === 401) logout();
    return Promise.reject(err);
  }
);

/* -------------------------------------------------------------------------- */
/* 💳  Auth                                                                   */
/* -------------------------------------------------------------------------- */
export async function login(username: string, password: string) {
  const res = await api.post<{ token: string }>("/auth/login", {
    username,
    password,
  });
  setAuthToken(res.data.token);
  return res.data.token;
}

/* -------------------------------------------------------------------------- */
/* 👥  Users (admin endpoints)                                                */
/* -------------------------------------------------------------------------- */
export interface UserDto {
  id: string;
  userName: string;
  roles: string[];          // NEW – exposed by the backend
  isFirstLogin?: boolean;
}

export async function listUsers() {
  return (await api.get<UserDto[]>("/users")).data;
}

export async function createUser(username: string,
                                 password: string,
                                 role: "Admin" | "User") {
  await api.post("/users", { username, password, role });
}

export async function updateUser(
  id: string,
  payload: { username?: string; newPassword?: string; role?: "Admin" | "User" }
) {
  await api.put(`/users/${id}`, payload);
}

export async function deleteUser(id: string) {
  await api.delete(`/users/${id}`);
}

export async function resetOwnPassword(
  currentPassword: string,
  newPassword: string
) {
  await api.post(`/users/me/password`, { currentPassword, newPassword });
}

/* -------------------------------------------------------------------------- */
/* 📟  Devices                                                                */
/* -------------------------------------------------------------------------- */
export interface DeviceDto {
  mac: string;
  name: string;
  ownerId: string | null;
  ownerUserName: string | null;
}

export async function listDevices() {
  return (await api.get<DeviceDto[]>("/device")).data;
}

export async function assignDevice(mac: string, userId: string) {
  await api.post(`/device/${mac}/assign/${userId}`);
}

export async function deleteDevice(mac: string) {
  await api.delete(`/device/${mac}`);
}


/* -------------------------------------------------------------------------- */
/* 🛠️  Settings                                                              */
/* -------------------------------------------------------------------------- */
export interface SettingsDto {
  watering: {
    manual: boolean;
    soilMin: number;
    soilMax: number;
    maxPumpSeconds: number;
    fertHours: number;
  };
  lighting: {
    manual: boolean;
    luxLow: number;
    onHour: number;
    offHour: number;
  };
  security: {
    armed: boolean;
    alarmWindow: { start: string; end: string };
  };
}

export async function getSettings(devMac: string) {
  return (
    await api.get<SettingsDto>("/settings", { params: { dev: devMac } })
  ).data;
}

export async function updateSettings(devMac: string, dto: SettingsDto) {
  await api.put("/settings", dto, { params: { dev: devMac } });
}

/* -------------------------------------------------------------------------- */
/* 📈  Telemetry                                                              */
/* -------------------------------------------------------------------------- */
/* Telemetry -----------------------------------------------------------------*/
export interface TelemetryDto {
  timestamp  : string;
  temperature: number;
  humidity   : number;
  soil       : number;
  lux        : number;
  level      : number;
  motion     : boolean;
  tamper     : boolean;

  /** 🆕 axes sent by the device – raw counts or milli-g, whatever the MCU pushes */
  accelX     : number;
  accelY     : number;
  accelZ     : number;
}


export async function getTelemetry(devMac: string, limit = 100) {
  const res = await api.get<TelemetryDto[]>(`/telemetry/${devMac}/telemetry`, {
    params: { limit },
  });
  return res.data;
}

export interface TelemetryRangeDto {
  first:  string | null;
  last:   string | null;
  online: boolean;
}

export async function getTelemetryRange(devMac: string) {
  return (await api.get<TelemetryRangeDto>(`/telemetry/${devMac}/range`)).data;
}