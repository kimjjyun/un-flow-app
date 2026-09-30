import { FortuneReport, UserProfile } from '../types/saju';
import { formatKstDateTime, getIpchunUtcMs, getMonthBranchBySolarTerm } from './solarTerms';

const stems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const stemHanja = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const branches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
const branchHanja = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const stemElements = ['wood', 'wood', 'fire', 'fire', 'earth', 'earth', 'metal', 'metal', 'water', 'water'] as const;
const branchElements = ['water', 'earth', 'wood', 'wood', 'earth', 'fire', 'fire', 'earth', 'metal', 'metal', 'earth', 'water'] as const;
const tenGods = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'];

const dayMasterCopy = {
  wood: {
    oneLine: '지금은 가능성을 키우고 방향을 넓히기 좋은 흐름이에요.',
    currentFlow: '현재 흐름은 성장의 발판을 넓히는 쪽에 가깝습니다. 작은 시도를 꾸준히 쌓을 때 다음 기회가 보입니다.',
    matchedPeople: ['방향을 함께 키워주는 사람', '새로운 배움을 편하게 나누는 사람', '급하게 재촉하기보다 성장 속도를 존중하는 사람'],
    needs: ['시야를 넓혀주는 경험', '꾸준히 쌓이는 루틴', '장기 목표를 점검할 조용한 시간'],
  },
  fire: {
    oneLine: '지금은 생각을 표현하고 반응을 확인하기 좋은 흐름이에요.',
    currentFlow: '현재 흐름은 안에 있던 생각을 밖으로 꺼내는 쪽에 가깝습니다. 공유와 피드백이 다음 선택을 선명하게 만듭니다.',
    matchedPeople: ['표현을 응원해주는 사람', '반응이 솔직하고 따뜻한 사람', '아이디어를 현실로 옮기게 도와주는 사람'],
    needs: ['말과 감정을 꺼낼 안전한 공간', '작게 공개하고 반응을 보는 기회', '과열되기 전 쉬어가는 리듬'],
  },
  earth: {
    oneLine: '지금은 기반을 다지고 생활의 리듬을 정리하기 좋은 흐름이에요.',
    currentFlow: '현재 흐름은 생활과 일의 기반을 안정시키는 쪽에 가깝습니다. 무리한 확장보다 지속 가능한 구조가 중요합니다.',
    matchedPeople: ['약속과 생활 리듬이 안정적인 사람', '현실적인 계획을 함께 세우는 사람', '부담을 나눠 지는 사람'],
    needs: ['정리된 일정과 역할', '몸과 생활을 회복시키는 루틴', '무리하지 않아도 되는 관계'],
  },
  metal: {
    oneLine: '지금은 기준을 세우고 중요한 선택을 정리하기 좋은 흐름이에요.',
    currentFlow: '현재 흐름은 기준을 분명히 하고 선택지를 정리하는 쪽에 가깝습니다. 덜어낼수록 집중도가 올라갑니다.',
    matchedPeople: ['기준이 분명하고 말이 정확한 사람', '서로의 경계를 존중하는 사람', '결정을 실행으로 옮기는 사람'],
    needs: ['우선순위를 정리할 기준', '덜어낼 것을 덜어내는 시간', '품질을 높일 피드백'],
  },
  water: {
    oneLine: '지금은 정보를 모으고 유연하게 방향을 조정하기 좋은 흐름이에요.',
    currentFlow: '현재 흐름은 여러 정보를 연결하고 흐름을 다시 읽는 쪽에 가깝습니다. 서두르기보다 가능성을 비교해보세요.',
    matchedPeople: ['생각의 폭을 넓혀주는 사람', '감정을 급하게 단정하지 않는 사람', '조용한 대화를 깊게 나누는 사람'],
    needs: ['혼자 생각을 정리할 시간', '선택지를 비교할 정보', '감정을 안전하게 말할 수 있는 관계'],
  },
};

const stemProfiles = [
  ['갑목 甲木', '큰 나무처럼 방향을 세우고 꾸준히 성장하려는 에너지입니다.', '장기 목표를 놓치지 않고 안정감을 줄 수 있습니다.', '기준이 강해질수록 유연한 선택을 놓칠 수 있습니다.', '큰 목표를 작은 실행 단위로 나눠보세요.'],
  ['을목 乙木', '풀과 덩굴처럼 환경에 맞춰 자라는 섬세한 에너지입니다.', '사람과 기회를 자연스럽게 이어내는 감각이 살아납니다.', '타인의 흐름에 맞추다 내 우선순위가 흐려질 수 있습니다.', '중요한 제안은 하루 정도 정리한 뒤 답해보세요.'],
  ['병화 丙火', '태양처럼 넓게 비추는 표현과 활력의 에너지입니다.', '아이디어를 밖으로 꺼내 반응을 얻기 쉽습니다.', '속도가 빨라질수록 세부 확인이 부족해질 수 있습니다.', '초안 상태에서 피드백을 받아보세요.'],
  ['정화 丁火', '작은 불처럼 주변을 밝히는 섬세한 표현의 에너지입니다.', '정보와 사람을 연결해 자신만의 방향으로 정리할 수 있습니다.', '선택지가 많아지면 실행 속도가 늦어질 수 있습니다.', '한 가지 프로젝트를 작게 쪼개 실행해보세요.'],
  ['무토 戊土', '산처럼 중심을 잡는 안정과 현실 판단의 에너지입니다.', '복잡한 일을 구조화하고 기준을 만들 수 있습니다.', '익숙한 방식을 지키느라 새 흐름을 늦게 받아들일 수 있습니다.', '기존 루틴에 새 방식을 하나만 실험해보세요.'],
  ['기토 己土', '밭처럼 돌보고 길러내는 세심한 관리의 에너지입니다.', '작은 개선을 꾸준히 이어가며 결과를 탄탄하게 만들 수 있습니다.', '너무 많은 것을 챙기다 에너지가 분산될 수 있습니다.', '해야 할 일을 세 묶음으로 나누고 가벼운 것부터 마무리해보세요.'],
  ['경금 庚金', '단단한 금속처럼 결단하고 정리하는 에너지입니다.', '애매한 상황에 기준을 세우고 실행으로 옮기는 힘이 있습니다.', '판단이 빠를수록 상대의 맥락을 놓칠 수 있습니다.', '중요한 결정 전 기준 세 가지를 적어보세요.'],
  ['신금 辛金', '보석처럼 정교하게 다듬는 완성도의 에너지입니다.', '작은 차이를 알아보고 결과의 품질을 높일 수 있습니다.', '완벽하게 만들려다 시작이나 공유가 늦어질 수 있습니다.', '80% 완성도로 먼저 공개하고 반응을 보며 다듬어보세요.'],
  ['임수 壬水', '큰 물처럼 넓게 흐르는 사고와 유연함의 에너지입니다.', '변화하는 상황에서도 다른 길을 찾아낼 수 있습니다.', '생각이 넓어질수록 실행 순서가 흐려질 수 있습니다.', '이번 주에 실험할 한 가지만 골라보세요.'],
  ['계수 癸水', '비와 이슬처럼 스며드는 이해와 통찰의 에너지입니다.', '복잡한 감정과 정보를 차분히 정리할 수 있습니다.', '혼자 오래 생각하다 필요한 대화를 미룰 수 있습니다.', '고민을 짧은 메모로 꺼내고 믿을 만한 사람과 나눠보세요.'],
];

export function buildLocalManseReport(user: UserProfile): FortuneReport {
  const birth = parseBirthDate(user.birthDate);
  const birthUtcMs = getBirthUtcMs(user);
  const yearPillar = getYearPillar(birth, birthUtcMs);
  const monthPillar = getMonthPillar(birthUtcMs, yearPillar.stemIndex);
  const dayPillar = getDayPillar(birth);
  const hourPillar = getHourPillar(user, dayPillar.stemIndex);
  const dayElement = stemElements[dayPillar.stemIndex];
  const profile = stemProfiles[dayPillar.stemIndex];
  const elementValues = buildElementDistribution([yearPillar, monthPillar, dayPillar, hourPillar], dayElement);
  const supportiveElements = buildSupportiveElements(elementValues);
  const challengingElements = buildChallengingElements(elementValues);
  const seed = birth.year * 372 + birth.month * 31 + birth.day + dayPillar.index;

  return {
    user,
    calculation: {
      mode: 'local-manse',
      label: '로컬 만세력 계산',
      description:
        user.calendarType === 'lunar'
          ? '외부 API 없이 앱 내부 계산으로 사주 기둥을 산출합니다. 현재 음력 날짜는 로컬 변환표가 없어 양력 기준 계산으로 표시됩니다.'
          : `외부 API 없이 태양 황경으로 절기 시각을 계산해 사주 기둥을 산출합니다. ${birth.year}년 입춘 기준 시각은 ${formatKstDateTime(
              getIpchunUtcMs(birth.year),
            )} KST입니다.`,
    },
    core: {
      pillars: {
        year: yearPillar.label,
        month: monthPillar.label,
        day: dayPillar.label,
        hour: hourPillar?.label ?? '미상',
      },
      dayMaster: {
        label: profile[0],
        description: profile[1],
      },
      tenGods: pickTenGods(seed),
      greatLuck: '절기와 대운 방향을 로컬 테이블로 확장할 수 있는 구조',
      currentYearLuck: '올해는 현재 일간과 세운의 관계를 기준으로 해석을 확장할 수 있어요.',
      elements: elementValues,
    },
    interpretation: {
      oneLine: dayMasterCopy[dayElement].oneLine,
      personality: `${profile[1]} ${profile[2]}`,
      currentFlow: dayMasterCopy[dayElement].currentFlow,
      reason:
        '연주는 입춘 시각 기준, 월주는 절기 시각 기준, 일주는 율리우스 일수 기반 60갑자 순환으로 계산했습니다. 출생시간을 입력하면 시주도 함께 계산합니다.',
      strength: profile[2],
      caution: profile[3],
      recommendedAction: profile[4],
      matchedPeople: dayMasterCopy[dayElement].matchedPeople,
      needs: dayMasterCopy[dayElement].needs,
      supportiveElements,
      challengingElements,
      commonWithoutBirthTime: [
        `${profile[0].split(' ')[0]} 일간의 기본 성향은 출생시간과 관계없이 유지됩니다.`,
        '연주, 월주, 일주를 중심으로 큰 성향과 흐름을 먼저 확인할 수 있습니다.',
        '출생시간이 없을 때는 시주가 만드는 세부 직업/관계 해석을 보수적으로 표시합니다.',
      ],
      variableByBirthTime: [
        '시주가 추가되면 말년운, 자녀/후배운, 세부 직업 성향 해석이 달라질 수 있습니다.',
        '출생시간 경계에 가까운 경우 실제 만세력에서는 지역/절기 시각 보정이 필요할 수 있습니다.',
      ],
    },
    lifeFlow: buildLifeFlow(seed, birth.year),
    today: buildToday(seed, birth.day, dayElement),
  };
}

type Pillar = {
  label: string;
  index: number;
  stemIndex: number;
  branchIndex: number;
};

function getYearPillar(birth: { year: number }, birthUtcMs: number): Pillar {
  const sajuYear = birthUtcMs < getIpchunUtcMs(birth.year) ? birth.year - 1 : birth.year;
  return makePillar(sajuYear - 1984);
}

function getMonthPillar(birthUtcMs: number, yearStemIndex: number): Pillar {
  const monthBranchIndex = getMonthBranchBySolarTerm(birthUtcMs);
  const tigerMonthOffset = positiveModulo(monthBranchIndex - 2, 12);
  const firstTigerStemByYearStem = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0];
  const stemIndex = positiveModulo(firstTigerStemByYearStem[yearStemIndex] + tigerMonthOffset, 10);
  return makePillarFromStemBranch(stemIndex, monthBranchIndex);
}

function getDayPillar(birth: { year: number; month: number; day: number }): Pillar {
  const jdn = getJulianDayNumber(birth.year, birth.month, birth.day);
  return makePillar(jdn + 49);
}

function getHourPillar(user: UserProfile, dayStemIndex: number): Pillar | null {
  const hour = getBirthHour(user);
  if (hour === null) return null;

  const branchIndex = hour === 23 ? 0 : Math.floor((hour + 1) / 2) % 12;
  const firstStemByDayStem = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8];
  const stemIndex = positiveModulo(firstStemByDayStem[dayStemIndex] + branchIndex, 10);
  return makePillarFromStemBranch(stemIndex, branchIndex);
}

function makePillar(index: number): Pillar {
  const normalized = positiveModulo(index, 60);
  return makePillarFromStemBranch(normalized % 10, normalized % 12);
}

function makePillarFromStemBranch(stemIndex: number, branchIndex: number): Pillar {
  return {
    label: `${stems[stemIndex]}${branches[branchIndex]}`,
    index: findCycleIndex(stemIndex, branchIndex),
    stemIndex,
    branchIndex,
  };
}

function findCycleIndex(stemIndex: number, branchIndex: number) {
  for (let index = 0; index < 60; index += 1) {
    if (index % 10 === stemIndex && index % 12 === branchIndex) return index;
  }
  return 0;
}

function buildElementDistribution(pillars: Array<Pillar | null>, primaryElement: keyof typeof dayMasterCopy) {
  const counts = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };

  pillars.forEach((pillar) => {
    if (!pillar) return;
    counts[stemElements[pillar.stemIndex]] += 1.2;
    counts[branchElements[pillar.branchIndex]] += 1;
  });

  counts[primaryElement] += 0.8;
  const max = Math.max(...Object.values(counts), 1);
  const metadata = [
    {
      key: 'wood' as const,
      label: '목',
      hanja: '木',
      meaning: '성장하고 확장하려는 에너지',
      color: '#4f7b65',
      positiveAction: '배우고 키우기',
      negativeAction: '벌리기만 하기',
    },
    {
      key: 'fire' as const,
      label: '화',
      hanja: '火',
      meaning: '표현력과 활동성',
      color: '#d08a57',
      positiveAction: '표현하고 밝히기',
      negativeAction: '감정적으로 반응하기',
    },
    {
      key: 'earth' as const,
      label: '토',
      hanja: '土',
      meaning: '안정과 현실성',
      color: '#d6b98d',
      positiveAction: '정리하고 돌보기',
      negativeAction: '붙잡고 버티기',
    },
    {
      key: 'metal' as const,
      label: '금',
      hanja: '金',
      meaning: '판단과 결단력',
      color: '#8f98a3',
      positiveAction: '정하고 덜어내기',
      negativeAction: '차갑게 평가하기',
    },
    {
      key: 'water' as const,
      label: '수',
      hanja: '水',
      meaning: '생각과 지혜, 유연함',
      color: '#41627d',
      positiveAction: '쉬고 깊게 보기',
      negativeAction: '생각만 반복하기',
    },
  ];

  return metadata.map((element) => ({
    ...element,
    value: clamp(Math.round((counts[element.key] / max) * 92), 18, 92),
  }));
}

function buildSupportiveElements(elements: ReturnType<typeof buildElementDistribution>) {
  return [...elements]
    .sort((left, right) => left.value - right.value)
    .slice(0, 2)
    .map(toElementAdvice);
}

function toElementAdvice(element: ReturnType<typeof buildElementDistribution>[number]) {
  const advice = {
    wood: {
      title: '목의 성장 에너지',
      person: '새로운 시도를 같이 키워주는 사람',
      need: '배움, 확장, 산책처럼 시야가 트이는 루틴',
      reason: '목은 방향을 세우고 가능성을 키우는 힘이라, 부족하면 시작은 해도 다음 단계가 잘 보이지 않을 수 있어요.',
      actions: ['새로운 공부 시작', '식물 돌보기', '산책하며 계획 세우기'],
      caution: '계속 계획만 키우고 마무리를 미루는 패턴',
      cautionReason: '목이 과하면 하고 싶은 일이 많아져 정리보다 확장이 앞설 수 있어요.',
    },
    fire: {
      title: '화의 표현 에너지',
      person: '반응이 따뜻하고 표현을 응원해주는 사람',
      need: '말하기, 보여주기, 작게 공개하는 경험',
      reason: '화는 표현과 활력을 담당해서, 부족하면 생각은 많아도 밖으로 꺼내는 힘이 약해질 수 있어요.',
      actions: ['짧게 발표하기', '햇빛 쐬기', '좋아하는 콘텐츠 공유'],
      caution: '감정이 빨리 달아오르고 반응을 재촉하는 패턴',
      cautionReason: '화가 과하면 속도와 반응이 빨라져 감정 소모가 커질 수 있어요.',
    },
    earth: {
      title: '토의 안정 에너지',
      person: '약속과 생활 리듬이 안정적인 사람',
      need: '정리된 일정, 몸을 회복시키는 루틴',
      reason: '토는 중심과 안정감을 잡아줘서, 부족하면 계획은 있어도 생활 리듬이 흔들리기 쉬워요.',
      actions: ['방 정리하기', '식사 시간 맞추기', '이번 주 일정 고정'],
      caution: '변화를 막고 책임만 늘리는 패턴',
      cautionReason: '토가 과하면 안정이 집착처럼 변해 변화가 답답하게 느껴질 수 있어요.',
    },
    metal: {
      title: '금의 정리 에너지',
      person: '기준이 분명하고 결정이 깔끔한 사람',
      need: '우선순위, 경계, 덜어내는 시간',
      reason: '금은 판단과 정리를 도와줘서, 부족하면 선택지가 많아도 무엇을 덜어낼지 어려울 수 있어요.',
      actions: ['할 일 3개만 남기기', '불필요한 약속 줄이기', '기준표 만들기'],
      caution: '말이 날카롭고 평가가 앞서는 패턴',
      cautionReason: '금이 과하면 기준이 강해져 스스로와 타인을 쉽게 평가하게 될 수 있어요.',
    },
    water: {
      title: '수의 유연 에너지',
      person: '생각을 넓혀주고 감정을 단정하지 않는 사람',
      need: '휴식, 정보 탐색, 깊게 대화할 시간',
      reason: '수는 생각과 유연함을 담당해서, 부족하면 쉬어가며 관점을 바꾸는 힘이 약해질 수 있어요.',
      actions: ['조용히 메모하기', '물 마시며 쉬기', '깊은 대화 나누기'],
      caution: '생각만 많아지고 결정을 계속 미루는 패턴',
      cautionReason: '수가 과하면 가능성을 너무 오래 비교하다 실행이 늦어질 수 있어요.',
    },
  };

  return {
    key: element.key,
    label: element.label,
    hanja: element.hanja,
    color: element.color,
    ...advice[element.key],
  };
}

function buildChallengingElements(elements: ReturnType<typeof buildElementDistribution>) {
  return [...elements]
    .sort((left, right) => right.value - left.value)
    .slice(0, 2)
    .map(toElementAdvice);
}

function buildLifeFlow(seed: number, birthYear: number) {
  const currentYear = 2026;
  const flowTypes = ['기회의 시기', '성장의 시기', '변화의 시기', '정리의 시기', '주의가 필요한 시기'] as const;
  const keywords = [
    ['기회', '확장', '변화'],
    ['학습', '정리', '회복'],
    ['전환', '협업', '실험'],
    ['성과', '평판', '제안'],
    ['점검', '균형', '관리'],
  ];

  return Array.from({ length: 9 }, (_, index) => {
    const year = currentYear + index;
    const score = clamp(62 + ((seed + index * 11) % 31) - (index === 5 ? 7 : 0), 55, 92);
    const type = flowTypes[(seed + index) % flowTypes.length];
    return {
      year,
      age: year - birthYear + 1,
      score,
      type,
      title: {
        '기회의 시기': '새로운 기회가 들어오는 해',
        '성장의 시기': '실력이 차분히 쌓이는 해',
        '변화의 시기': '관점과 역할이 바뀌는 해',
        '정리의 시기': '선택지를 줄이고 정돈하는 해',
        '주의가 필요한 시기': '속도를 조절하고 점검하는 해',
      }[type],
      keywords: keywords[(seed + index * 2) % keywords.length],
      summary:
        '전통 명리학에서는 세운과 원국의 관계를 통해 특정 주제가 부각되는 시기로 해석합니다. 이 해에는 변화 가능성을 열어두되 현실적인 실행 계획을 함께 보는 것이 좋습니다.',
      metrics: [
        { label: '재물', value: clamp(score - 5, 50, 95) },
        { label: '직업', value: clamp(score + 4, 50, 95) },
        { label: '인간관계', value: clamp(score - 13, 50, 95) },
        { label: '연애', value: clamp(score - 17, 50, 95) },
        { label: '건강 관리', value: clamp(score - 19, 50, 95) },
      ],
      goodActions: yearlyActions[type].good,
      cautions: yearlyActions[type].caution,
    };
  });
}

const yearlyActions = {
  '기회의 시기': {
    good: ['새로운 제안 검토하기', '만나고 싶던 사람에게 연락하기', '작게 시작할 프로젝트 고르기'],
    caution: ['준비 없는 확장', '분위기에 휩쓸린 약속', '수익만 보고 결정하기'],
  },
  '성장의 시기': {
    good: ['배움에 시간 투자하기', '반복 업무를 시스템화하기', '성과 기록을 정리하기'],
    caution: ['너무 빠른 결과 기대', '비교로 인한 조급함', '기초를 건너뛰는 선택'],
  },
  '변화의 시기': {
    good: ['역할과 관계 재정의하기', '새 환경을 작게 테스트하기', '오래된 방식 업데이트하기'],
    caution: ['감정적인 방향 전환', '모든 것을 한 번에 바꾸기', '불확실성을 과장해서 보기'],
  },
  '정리의 시기': {
    good: ['불필요한 약속 줄이기', '돈과 시간을 쓰는 패턴 점검하기', '마무리할 일을 먼저 끝내기'],
    caution: ['미룬 일을 더 미루기', '관계 정리를 차갑게 처리하기', '기회까지 함께 닫아버리기'],
  },
  '주의가 필요한 시기': {
    good: ['일정에 여백 만들기', '건강과 컨디션 먼저 점검하기', '큰 결정 전 하루 더 생각하기'],
    caution: ['무리한 일정', '충동적인 소비나 투자', '피곤한 상태에서 중요한 대화하기'],
  },
};

function buildToday(seed: number, day: number, dayElement: keyof typeof dayMasterCopy) {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const dailySeed = seed + kstNow.getUTCFullYear() * 13 + (kstNow.getUTCMonth() + 1) * 17 + kstNow.getUTCDate() * 19;
  const base = clamp(58 + (dailySeed % 34), 50, 95);
  const todayByElement = {
    wood: {
      summary: '오늘은 새 가능성을 넓히되 한 가지 방향을 고르는 데 힘이 실립니다.',
      advice: '관심 있는 일을 목록으로만 두지 말고, 첫 단계 하나를 바로 정해보세요.',
      focus: '시작과 학습',
      avoid: '너무 많은 선택지',
    },
    fire: {
      summary: '오늘은 말과 표현을 통해 흐름이 열리기 쉬운 날입니다.',
      advice: '완벽한 설명보다 솔직한 초안을 먼저 공유해보세요.',
      focus: '표현과 피드백',
      avoid: '과열된 반응',
    },
    earth: {
      summary: '오늘은 생활 리듬과 일의 기반을 다듬을수록 안정감이 커집니다.',
      advice: '정리해야 할 일 하나를 끝내고 다음 선택을 가볍게 잡아보세요.',
      focus: '정리와 루틴',
      avoid: '과도한 책임감',
    },
    metal: {
      summary: '오늘은 기준을 분명히 세우고 중요한 선택지를 정리하기 좋습니다.',
      advice: '결정 전 기준 세 가지를 적고, 맞지 않는 선택은 과감히 덜어내세요.',
      focus: '선택과 정돈',
      avoid: '날카로운 말투',
    },
    water: {
      summary: '오늘은 정보를 모으고 마음의 흐름을 차분히 읽기 좋은 날입니다.',
      advice: '바로 결론내기보다 더 필요한 정보를 하나만 추가로 확인해보세요.',
      focus: '정보와 휴식',
      avoid: '생각만 반복하기',
    },
  };

  return {
    summary: todayByElement[dayElement].summary,
    advice: todayByElement[dayElement].advice,
    focus: todayByElement[dayElement].focus,
    avoid: todayByElement[dayElement].avoid,
    metrics: [
      { label: '전체', value: base },
      { label: '재물', value: clamp(base - 7 + (dailySeed % 13), 50, 95) },
      { label: '일', value: clamp(base - 2 + (day % 12), 50, 95) },
      { label: '관계', value: clamp(base - 8 + (dailySeed % 15), 50, 95) },
      { label: '연애', value: clamp(base - 10 + ((dailySeed + day) % 14), 50, 95) },
    ],
  };
}

function parseBirthDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return {
    year: Number.isFinite(year) ? year : 1992,
    month: Number.isFinite(month) ? month : 1,
    day: Number.isFinite(day) ? day : 1,
  };
}

function getBirthHour(user: UserProfile) {
  if (user.birthTimeMode === 'unknown') return null;
  if (user.birthTimeMode === 'exact' && user.exactTime) {
    const hour = Number(user.exactTime.split(':')[0]);
    return Number.isFinite(hour) ? hour : null;
  }

  const approximateHours: Record<string, number> = {
    dawn: 4,
    morning: 8,
    day: 13,
    afternoon: 16,
    evening: 20,
    night: 23,
  };

  return approximateHours[user.approximateTime ?? 'morning'];
}

function getBirthUtcMs(user: UserProfile) {
  const birth = parseBirthDate(user.birthDate);
  const hour = getBirthHour(user) ?? 12;
  return Date.UTC(birth.year, birth.month - 1, birth.day, hour - 9, 0, 0);
}

function getJulianDayNumber(year: number, month: number, day: number) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function pickTenGods(seed: number) {
  return [0, 3, 6].map((offset) => tenGods[positiveModulo(seed + offset, tenGods.length)]);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}
