import { devices, users, settings, telemetryFor } from "@/data/mockData";

export type User = typeof users[number];
export type Device = typeof devices[number];
export type Settings = typeof settings[number];
export type Telemetry = ReturnType<typeof telemetryFor>[number];

const delay = (ms: number) => new Promise(r => setTimeout(r, ms, null));

// — Auth
export async function mockLogin(u: string, p: string): Promise<User | null> {
  await delay(300);
  return users.find(x => x.username === u && x.password === p) ?? null;
}
export async function mockChangePassword(id: number, newPwd: string): Promise<User> {
  await delay(200);
  const usr = users.find(u => u.id === id)!;
  usr.password = newPwd;
  usr.firstLogin = false;
  return usr;
}

// — Users (admin)
export async function getUsers(): Promise<User[]> {
  await delay(200);
  return users.slice();
}
export async function addUser(u: Omit<User, "id" | "firstLogin">): Promise<User> {
  await delay(200);
  const nextId = Math.max(...users.map(u => u.id)) + 1;
  const nu: User = { ...u, id: nextId, firstLogin: true };
  users.push(nu);
  return nu;
}
export async function updateUser(id: number, patch: Partial<User>): Promise<User> {
  await delay(200);
  const u = users.find(u => u.id === id)!;
  Object.assign(u, patch);
  return u;
}

// — Devices
export async function getDevices(forUser?: number): Promise<Device[]> {
  await delay(200);
  return forUser
    ? devices.filter(d => d.ownerId === forUser)
    : devices.slice();
}
export async function addDevice(d: Omit<Device, "id">): Promise<Device> {
  await delay(200);
  const nextId = Math.max(...devices.map(d => d.id)) + 1;
  const nd: Device = { ...d, id: nextId };
  devices.push(nd);
  settings.push({
    deviceMac: d.mac,
    wateringManual: false,
    soilMin: 30,
    soilMax: 70,
    fertHours: [8, 20],
    lightingManual: false,
    luxLow: 200,
    onHour: 6,
    offHour: 18,
  });
  return nd;
}
export async function updateDevice(id: number, patch: Partial<Device>): Promise<Device> {
  await delay(200);
  const d = devices.find(d => d.id === id)!;
  Object.assign(d, patch);
  return d;
}

// — Settings
export async function getSettings(devMac: string): Promise<Settings | null> {
  await delay(200);
  return settings.find(s => s.deviceMac === devMac) ?? null;
}
export async function updateSettings(devMac: string, patch: Partial<Settings>): Promise<Settings> {
  await delay(200);
  const s = settings.find(s => s.deviceMac === devMac)!;
  Object.assign(s, patch);
  return s;
}

// — Telemetry
export async function getTelemetry(
  devMac: string,
  limit = 24
): Promise<Telemetry[]> {
  await delay(200);
  const all = telemetryFor(devMac);
  return all.slice(-limit);
}
