const kstOffsetHours = 9;

export type SolarTermBoundary = {
  name: string;
  targetLongitude: number;
  branchIndex: number;
  startsAtUtcMs: number;
};

const jieTerms = [
  { name: '소한', targetLongitude: 285, branchIndex: 1, month: 1, day: 6 },
  { name: '입춘', targetLongitude: 315, branchIndex: 2, month: 2, day: 4 },
  { name: '경칩', targetLongitude: 345, branchIndex: 3, month: 3, day: 6 },
  { name: '청명', targetLongitude: 15, branchIndex: 4, month: 4, day: 5 },
  { name: '입하', targetLongitude: 45, branchIndex: 5, month: 5, day: 6 },
  { name: '망종', targetLongitude: 75, branchIndex: 6, month: 6, day: 6 },
  { name: '소서', targetLongitude: 105, branchIndex: 7, month: 7, day: 7 },
  { name: '입추', targetLongitude: 135, branchIndex: 8, month: 8, day: 8 },
  { name: '백로', targetLongitude: 165, branchIndex: 9, month: 9, day: 8 },
  { name: '한로', targetLongitude: 195, branchIndex: 10, month: 10, day: 8 },
  { name: '입동', targetLongitude: 225, branchIndex: 11, month: 11, day: 7 },
  { name: '대설', targetLongitude: 255, branchIndex: 0, month: 12, day: 7 },
];

const cache = new Map<number, SolarTermBoundary[]>();

export function getSolarTermBoundaries(year: number) {
  const cached = cache.get(year);
  if (cached) return cached;

  const boundaries = jieTerms.map((term) => ({
    name: term.name,
    targetLongitude: term.targetLongitude,
    branchIndex: term.branchIndex,
    startsAtUtcMs: findSolarLongitudeUtcMs(year, term.targetLongitude, term.month, term.day),
  }));

  cache.set(year, boundaries);
  return boundaries;
}

export function getIpchunUtcMs(year: number) {
  return getSolarTermBoundaries(year).find((term) => term.name === '입춘')!.startsAtUtcMs;
}

export function getMonthBranchBySolarTerm(birthUtcMs: number) {
  const birthYearKst = new Date(birthUtcMs + kstOffsetHours * 60 * 60 * 1000).getUTCFullYear();
  const boundaries = [...getSolarTermBoundaries(birthYearKst - 1), ...getSolarTermBoundaries(birthYearKst)]
    .filter((term) => term.startsAtUtcMs <= birthUtcMs)
    .sort((a, b) => b.startsAtUtcMs - a.startsAtUtcMs);

  return boundaries[0]?.branchIndex ?? 1;
}

export function formatKstDateTime(utcMs: number) {
  const date = new Date(utcMs + kstOffsetHours * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(
    date.getUTCHours(),
  )}:${pad(date.getUTCMinutes())}`;
}

function findSolarLongitudeUtcMs(year: number, targetLongitude: number, month: number, day: number) {
  let low = Date.UTC(year, month - 1, day - 4, 0, 0, 0);
  let high = Date.UTC(year, month - 1, day + 4, 0, 0, 0);

  for (let index = 0; index < 60; index += 1) {
    const mid = Math.floor((low + high) / 2);
    const midDiff = signedLongitudeDifference(solarLongitude(mid), targetLongitude);
    const lowDiff = signedLongitudeDifference(solarLongitude(low), targetLongitude);

    if (Math.sign(midDiff) === Math.sign(lowDiff)) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return Math.floor((low + high) / 2);
}

function solarLongitude(utcMs: number) {
  const jd = utcMs / 86400000 + 2440587.5;
  const t = (jd - 2451545.0) / 36525;
  const l0 = normalizeDegrees(280.46646 + 36000.76983 * t + 0.0003032 * t * t);
  const m = normalizeDegrees(357.52911 + 35999.05029 * t - 0.0001537 * t * t);
  const omega = normalizeDegrees(125.04 - 1934.136 * t);

  const c =
    (1.914602 - 0.004817 * t - 0.000014 * t * t) * sinDeg(m) +
    (0.019993 - 0.000101 * t) * sinDeg(2 * m) +
    0.000289 * sinDeg(3 * m);

  return normalizeDegrees(l0 + c - 0.00569 - 0.00478 * sinDeg(omega));
}

function signedLongitudeDifference(value: number, target: number) {
  return ((((value - target + 180) % 360) + 360) % 360) - 180;
}

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function sinDeg(value: number) {
  return Math.sin((value * Math.PI) / 180);
}
