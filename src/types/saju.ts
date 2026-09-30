export type BirthTimeMode = 'exact' | 'approximate' | 'unknown';
export type CalendarType = 'solar' | 'lunar';
export type Gender = 'female' | 'male' | 'none';
export type FlowType = '기회의 시기' | '성장의 시기' | '변화의 시기' | '정리의 시기' | '주의가 필요한 시기';

export interface UserProfile {
  name: string;
  gender: Gender;
  calendarType: CalendarType;
  birthDate: string;
  birthTimeMode: BirthTimeMode;
  exactTime?: string;
  approximateTime?: string;
}

export interface FiveElement {
  key: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  label: string;
  hanja: string;
  meaning: string;
  value: number;
  color: string;
  positiveAction: string;
  negativeAction: string;
}

export interface ElementAdvice {
  key: FiveElement['key'];
  label: string;
  hanja: string;
  color: string;
  title: string;
  person: string;
  need: string;
  reason: string;
  actions: string[];
  caution?: string;
  cautionReason?: string;
}

export interface FortuneMetric {
  label: string;
  value: number;
}

export interface YearFortune {
  year: number;
  age: number;
  score: number;
  type: FlowType;
  title: string;
  summary: string;
  keywords: string[];
  metrics: FortuneMetric[];
  goodActions: string[];
  cautions: string[];
}

export interface SajuCoreData {
  pillars: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  dayMaster: {
    label: string;
    description: string;
  };
  tenGods: string[];
  greatLuck: string;
  currentYearLuck: string;
  elements: FiveElement[];
}

export interface InterpretationResult {
  oneLine: string;
  personality: string;
  currentFlow: string;
  reason: string;
  strength: string;
  caution: string;
  recommendedAction: string;
  matchedPeople: string[];
  needs: string[];
  supportiveElements: ElementAdvice[];
  challengingElements: ElementAdvice[];
  commonWithoutBirthTime: string[];
  variableByBirthTime: string[];
}

export interface FortuneReport {
  user: UserProfile;
  calculation: {
    mode: 'sample' | 'local-manse' | 'manse-api';
    label: string;
    description: string;
  };
  core: SajuCoreData;
  interpretation: InterpretationResult;
  lifeFlow: YearFortune[];
  today: {
    summary: string;
    advice: string;
    focus: string;
    avoid: string;
    metrics: FortuneMetric[];
  };
}
