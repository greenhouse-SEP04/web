export interface Device {
  id: number;
  name: string;
  mac: string;
  ownerId: number | null;
  status: "online" | "offline";
}
export const devices: Device[] = [
  { id: 1, name: "Greenhouse-A", mac: "AA:BB:CC:01", ownerId: 2, status: "online" },
  { id: 2, name: "Lab-Sensor",   mac: "AA:BB:CC:02", ownerId: 1, status: "offline" },
  { id: 3, name: "Field-Node-7", mac: "AA:BB:CC:03", ownerId: 2, status: "online" },
];

export interface User {
  id: number;
  name: string;
  username: string;
  password: string;
  role: "admin" | "user";
  firstLogin: boolean;
}
export const users: User[] = [
  { id: 1, name: "Alice", username: "alice", password: "alice", role: "admin", firstLogin: true },
  { id: 2, name: "Bob",   username: "bob",   password: "bob",   role: "user",  firstLogin: false },
];

export interface Settings {
  deviceMac: string;
  wateringManual: boolean;
  soilMin: number;
  soilMax: number;
  fertHours: number[];
  lightingManual: boolean;
  luxLow: number;
  onHour: number;
  offHour: number;
}
export const settings: Settings[] = devices.map(d => ({
  deviceMac: d.mac,
  wateringManual: false,
  soilMin: 30,
  soilMax: 70,
  fertHours: [8, 20],
  lightingManual: false,
  luxLow: 200,
  onHour: 6,
  offHour: 18,
}));


export interface Telemetry {
  time: string;           // e.g. "14:00"
  timestamp: string;      // full ISO string
  temperature: number;
  humidity: number;
  soil: number;
  lux: number;
  level: number;
  tamper: boolean;
}

export function telemetryFor(devMac: string): Telemetry[] {
  const now = new Date();
  return Array.from({ length: 24 }, (_, i) => {
    const t = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
    const hour = t.getHours().toString().padStart(2, "0");
    return {
      time: `${hour}:00`,
      timestamp: t.toISOString(),
      temperature: 20 + Math.sin(i / 3) * 5,
      humidity: 50 + Math.cos(i / 4) * 10,
      soil: 40 + Math.sin(i / 5) * 15,
      lux: 200 + Math.sin(i / 2) * 100,
      level: Math.random() * 100,
      tamper: Math.random() < 0.1,
    };
  });
}
