// NEW  src/utils/telemetry.ts
export const waterIcon = (lvl: number) =>
  lvl >= 70 ? '💧💧💧'
: lvl >= 40 ? '💧💧'
: lvl >= 10 ? '💧'
:             '—';

export const inWindow = (time: string, start: string, end: string) =>
  start === end
    ? true
    : start < end
    ? time >= start && time < end
    : time >= start || time < end;
