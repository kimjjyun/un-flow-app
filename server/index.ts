import express from 'express';
import { buildLocalManseReport } from '../src/engine/localManseEngine';
import { formatKstDateTime, getSolarTermBoundaries } from '../src/engine/solarTerms';
import { BirthTimeMode, CalendarType, Gender, UserProfile } from '../src/types/saju';

const app = express();
const port = Number(process.env.PORT ?? 5174);

app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    service: 'un-flow-manse-api',
    calculationMode: 'local-manse',
  });
});

app.get('/api/solar-terms/:year', (request, response) => {
  const year = Number(request.params.year);

  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    response.status(400).json({
      error: 'INVALID_YEAR',
      message: 'year must be an integer between 1900 and 2100.',
    });
    return;
  }

  response.json({
    year,
    timezone: 'Asia/Seoul',
    terms: getSolarTermBoundaries(year).map((term) => ({
      name: term.name,
      targetLongitude: term.targetLongitude,
      branchIndex: term.branchIndex,
      startsAtKst: formatKstDateTime(term.startsAtUtcMs),
    })),
  });
});

app.post('/api/saju/calculate', (request, response) => {
  const validation = validateProfile(request.body);

  if (!validation.ok) {
    response.status(400).json({
      error: 'INVALID_PROFILE',
      message: validation.message,
    });
    return;
  }

  const report = buildLocalManseReport(validation.profile);
  response.json(report);
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Un Flow manse API listening on http://127.0.0.1:${port}`);
});

type ValidationResult =
  | {
      ok: true;
      profile: UserProfile;
    }
  | {
      ok: false;
      message: string;
    };

function validateProfile(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object') {
    return { ok: false, message: 'Request body must be an object.' };
  }

  const candidate = input as Partial<UserProfile>;
  const gender = normalizeEnum(candidate.gender, ['female', 'male', 'none'] satisfies Gender[], 'none');
  const calendarType = normalizeEnum(candidate.calendarType, ['solar', 'lunar'] satisfies CalendarType[], 'solar');
  const birthTimeMode = normalizeEnum(
    candidate.birthTimeMode,
    ['exact', 'approximate', 'unknown'] satisfies BirthTimeMode[],
    'unknown',
  );

  if (!candidate.birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(candidate.birthDate)) {
    return { ok: false, message: 'birthDate must use YYYY-MM-DD format.' };
  }

  if (birthTimeMode === 'exact' && candidate.exactTime && !/^\d{2}:\d{2}$/.test(candidate.exactTime)) {
    return { ok: false, message: 'exactTime must use HH:mm format.' };
  }

  return {
    ok: true,
    profile: {
      name: typeof candidate.name === 'string' ? candidate.name : '',
      gender,
      calendarType,
      birthDate: candidate.birthDate,
      birthTimeMode,
      exactTime: typeof candidate.exactTime === 'string' ? candidate.exactTime : undefined,
      approximateTime: typeof candidate.approximateTime === 'string' ? candidate.approximateTime : undefined,
    },
  };
}

function normalizeEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback;
}
