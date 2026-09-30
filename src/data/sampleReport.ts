import { FortuneReport, UserProfile } from '../types/saju';

export const defaultProfile: UserProfile = {
  name: '김OO',
  gender: 'none',
  calendarType: 'solar',
  birthDate: '1992-05-16',
  birthTimeMode: 'unknown',
};

export const buildSampleReport = (user: UserProfile): FortuneReport => {
  const birth = parseBirthDate(user.birthDate);
  const seed = makeSeed(user);
  const dayMaster = dayMasters[seed % dayMasters.length];
  const pillars = buildMockPillars(seed, user);
  const elements = buildElements(seed, dayMaster.elementKey);
  const lifeFlow = buildLifeFlow(seed, birth.year);
  const todayBase = 64 + (seed % 18);

  return {
    user,
    calculation: {
      mode: 'sample',
      label: 'MVP 샘플 계산',
      description:
        '현재 결과는 실제 만세력 API가 아니라 화면 검증용 샘플 엔진으로 만든 값입니다. 실제 서비스에서는 절기 기준 만세력 계산 결과로 대체됩니다.',
    },
    core: {
      pillars,
      dayMaster: {
        label: dayMaster.label,
        description: dayMaster.description,
      },
      tenGods: pickMany(tenGods, seed, 3),
      greatLuck: flowSentences[seed % flowSentences.length],
      currentYearLuck: currentYearSentences[(seed + birth.month) % currentYearSentences.length],
      elements,
    },
    interpretation: {
      oneLine: oneLineByElement[dayMaster.elementKey],
      personality: dayMaster.personality,
      currentFlow: currentFlowByElement[dayMaster.elementKey],
      reason: `전통 명리학에서는 일간의 성향, 오행 균형, 세운의 작용을 함께 보며 해석합니다. 현재 MVP에서는 ${user.birthDate} 입력값을 계산 엔진 형태의 샘플 데이터로 변환해 화면 구조를 검증합니다.`,
      strength: dayMaster.strength,
    caution: dayMaster.caution,
    recommendedAction: dayMaster.action,
    matchedPeople: dayMaster.matchedPeople,
    needs: dayMaster.needs,
    supportiveElements: [
      {
        key: 'wood',
        label: '목',
        hanja: '木',
        color: '#4f7b65',
        title: '목의 성장 에너지',
        person: '새로운 시도를 같이 키워주는 사람',
        need: '배움과 확장',
        reason: '목은 방향을 세우고 가능성을 키우는 힘이라 부족하면 다음 단계가 잘 보이지 않을 수 있어요.',
        actions: ['새로운 공부 시작', '식물 돌보기', '산책하며 계획 세우기'],
      },
      {
        key: 'water',
        label: '수',
        hanja: '水',
        color: '#41627d',
        title: '수의 유연 에너지',
        person: '생각을 넓혀주는 사람',
        need: '휴식과 정보 탐색',
        reason: '수는 생각과 유연함을 담당해서 부족하면 관점을 바꾸는 힘이 약해질 수 있어요.',
        actions: ['조용히 메모하기', '물 마시며 쉬기', '깊은 대화 나누기'],
      },
    ],
    challengingElements: [
      {
        key: 'fire',
        label: '화',
        hanja: '火',
        color: '#d08a57',
        title: '화의 표현 에너지',
        person: '반응이 따뜻한 사람',
        need: '표현할 기회',
        reason: '화는 표현과 활력을 담당해요.',
        actions: ['짧게 발표하기', '햇빛 쐬기', '좋아하는 콘텐츠 공유'],
        caution: '감정이 빨리 달아오르고 반응을 재촉하는 패턴',
        cautionReason: '화가 과하면 속도와 반응이 빨라져 감정 소모가 커질 수 있어요.',
      },
    ],
    commonWithoutBirthTime: [
        `${dayMaster.shortName}의 성향은 출생시간과 관계없이 기본 해석의 중심으로 유지됩니다.`,
        '연도 흐름에서는 반복적으로 강해지는 기회와 정리 구간을 우선 보여줍니다.',
        '관계와 일의 방향은 생년월일 기반의 큰 흐름을 중심으로 확인할 수 있습니다.',
      ],
      variableByBirthTime: [
        '세부 직업운의 강도와 협업 방식은 출생시간에 따라 달라질 수 있습니다.',
        '대운의 체감 시점과 관계 이벤트의 해석은 시간 기둥이 확인되면 더 정교해집니다.',
      ],
    },
    lifeFlow,
  today: {
    summary: todaySummaries[seed % todaySummaries.length],
    advice: todayAdvice[(seed + birth.day) % todayAdvice.length],
    focus: '우선순위 정리',
    avoid: '무리한 확장',
    metrics: [
        { label: '전체', value: todayBase },
        { label: '재물', value: clamp(todayBase - 4 + (seed % 9), 50, 95) },
        { label: '일', value: clamp(todayBase + 3 + (birth.month % 8), 50, 95) },
        { label: '관계', value: clamp(todayBase - 6 + (birth.day % 11), 50, 95) },
        { label: '연애', value: clamp(todayBase - 8 + ((seed + birth.day) % 10), 50, 95) },
      ],
    },
  };
};

const dayMasters = [
  {
    label: '갑목 甲木',
    shortName: '갑목',
    elementKey: 'wood' as const,
    description: '큰 나무처럼 방향을 세우고 꾸준히 성장하려는 에너지로, 장기적인 계획과 추진력이 강점으로 해석됩니다.',
    personality: '스스로 기준을 세우고 차근차근 키워가는 타입입니다. 시간이 걸려도 납득한 방향에는 꾸준히 힘을 싣는 편입니다.',
    strength: '좋은 점은 장기 목표를 놓치지 않고 주변 사람에게 안정감을 줄 수 있다는 것입니다.',
    caution: '주의할 점은 기준이 강해질수록 유연한 선택을 놓칠 수 있다는 점입니다.',
    action: '이번 달에는 큰 목표 하나를 정하고, 매주 확인할 작은 실행 단위로 나눠보세요.',
    matchedPeople: ['방향을 함께 키워주는 사람', '성장 속도를 존중하는 사람'],
    needs: ['장기 목표를 점검할 시간', '꾸준히 쌓이는 루틴'],
  },
  {
    label: '을목 乙木',
    shortName: '을목',
    elementKey: 'wood' as const,
    description: '풀과 덩굴처럼 환경에 맞춰 자라는 에너지로, 섬세한 적응력과 연결 감각이 강점으로 해석됩니다.',
    personality: '부드럽게 상황을 읽고 관계 속에서 길을 찾는 타입입니다. 작은 변화에도 민감하게 반응해 방향을 조정합니다.',
    strength: '좋은 점은 사람과 기회를 자연스럽게 이어내는 감각이 살아난다는 것입니다.',
    caution: '주의할 점은 타인의 흐름에 맞추다 내 우선순위가 흐려질 수 있다는 점입니다.',
    action: '중요한 약속과 제안은 바로 결정하기보다 하루 정도 정리한 뒤 답해보세요.',
    matchedPeople: ['부드럽게 대화가 통하는 사람', '관계의 균형을 함께 맞추는 사람'],
    needs: ['내 우선순위를 확인할 시간', '편하게 연결되는 관계'],
  },
  {
    label: '병화 丙火',
    shortName: '병화',
    elementKey: 'fire' as const,
    description: '태양처럼 넓게 비추는 에너지로, 표현력과 활력이 강점으로 해석됩니다.',
    personality: '생각과 감정을 밖으로 표현할 때 힘이 커지는 타입입니다. 분위기를 밝히고 방향을 드러내는 역할에 잘 맞습니다.',
    strength: '좋은 점은 주저하던 일을 밖으로 꺼내 사람들의 반응을 얻기 쉽다는 것입니다.',
    caution: '주의할 점은 속도가 빨라질수록 세부 확인이 부족해질 수 있다는 점입니다.',
    action: '아이디어를 혼자 완성하려 하기보다 초안 상태에서 피드백을 받아보세요.',
    matchedPeople: ['표현을 응원해주는 사람', '반응이 솔직한 사람'],
    needs: ['아이디어를 꺼낼 공간', '과열되기 전 쉬는 리듬'],
  },
  {
    label: '정화 丁火',
    shortName: '정화',
    elementKey: 'fire' as const,
    description: '작은 불처럼 주변을 밝히는 에너지로, 섬세한 관찰력과 꾸준한 표현력이 강점으로 해석됩니다.',
    personality: '관찰하고 정리한 뒤 움직일 때 힘이 커지는 타입입니다. 감각적인 판단과 책임감이 함께 드러납니다.',
    strength: '좋은 점은 새로운 정보와 사람을 연결해 자신만의 방향으로 정리하는 능력이 살아난다는 것입니다.',
    caution: '주의할 점은 지나치게 많은 선택지를 한 번에 붙잡으면 실행 속도가 늦어질 수 있다는 점입니다.',
    action: '이번 달에는 한 가지 프로젝트를 정해 일정, 사람, 예산을 작게 쪼개 실행해보세요.',
    matchedPeople: ['감정을 섬세하게 알아주는 사람', '작은 표현을 존중하는 사람'],
    needs: ['집중할 한 가지 주제', '편안하게 표현할 공간'],
  },
  {
    label: '무토 戊土',
    shortName: '무토',
    elementKey: 'earth' as const,
    description: '산처럼 중심을 잡는 에너지로, 안정감과 현실적인 판단이 강점으로 해석됩니다.',
    personality: '쉽게 흔들리기보다 상황을 넓게 보고 중심을 잡는 타입입니다. 책임이 주어질수록 존재감이 또렷해집니다.',
    strength: '좋은 점은 복잡한 일을 구조화하고 사람들이 의지할 기준을 만들 수 있다는 것입니다.',
    caution: '주의할 점은 익숙한 방식을 지키느라 새로운 흐름을 늦게 받아들일 수 있다는 점입니다.',
    action: '기존 루틴을 유지하되 한 가지 도구나 방식을 새로 실험해보세요.',
    matchedPeople: ['생활 리듬이 안정적인 사람', '현실적인 계획을 함께 세우는 사람'],
    needs: ['정리된 일정', '지속 가능한 구조'],
  },
  {
    label: '기토 己土',
    shortName: '기토',
    elementKey: 'earth' as const,
    description: '밭처럼 돌보고 길러내는 에너지로, 세심한 관리와 실용성이 강점으로 해석됩니다.',
    personality: '주변의 필요를 알아차리고 현실적인 방식으로 챙기는 타입입니다. 안정된 환경에서 성과가 잘 쌓입니다.',
    strength: '좋은 점은 작은 개선을 꾸준히 이어가며 결과를 탄탄하게 만들 수 있다는 것입니다.',
    caution: '주의할 점은 너무 많은 것을 챙기다 스스로의 에너지가 분산될 수 있다는 점입니다.',
    action: '해야 할 일을 세 묶음으로 나누고, 가장 부담이 적은 것부터 마무리해보세요.',
    matchedPeople: ['부담을 나눠 지는 사람', '세심함을 당연하게 여기지 않는 사람'],
    needs: ['몸과 마음의 회복 루틴', '역할의 경계'],
  },
  {
    label: '경금 庚金',
    shortName: '경금',
    elementKey: 'metal' as const,
    description: '단단한 금속처럼 결단하고 정리하는 에너지로, 판단력과 실행력이 강점으로 해석됩니다.',
    personality: '필요한 것과 아닌 것을 빠르게 구분하는 타입입니다. 목표가 분명할 때 집중력이 크게 올라갑니다.',
    strength: '좋은 점은 애매한 상황에 기준을 세우고 실행으로 옮기는 힘이 살아난다는 것입니다.',
    caution: '주의할 점은 판단이 빠를수록 상대의 맥락을 놓칠 수 있다는 점입니다.',
    action: '중요한 결정 전에는 기준 세 가지를 적고, 주변 의견을 한 번 더 확인해보세요.',
    matchedPeople: ['기준이 분명한 사람', '서로의 경계를 존중하는 사람'],
    needs: ['선택 기준', '실행할 우선순위'],
  },
  {
    label: '신금 辛金',
    shortName: '신금',
    elementKey: 'metal' as const,
    description: '보석처럼 정교하게 다듬는 에너지로, 감각적인 선택과 완성도가 강점으로 해석됩니다.',
    personality: '디테일과 완성도를 중요하게 보는 타입입니다. 세련된 기준으로 결과물을 다듬는 힘이 있습니다.',
    strength: '좋은 점은 작은 차이를 알아보고 결과의 품질을 높일 수 있다는 것입니다.',
    caution: '주의할 점은 완벽하게 만들려다 시작이나 공유가 늦어질 수 있다는 점입니다.',
    action: '완성도를 80%로 정해 먼저 공개하고, 반응을 보며 다듬어보세요.',
    matchedPeople: ['디테일을 존중하는 사람', '품질을 함께 다듬는 사람'],
    needs: ['피드백', '완벽주의를 낮출 기준'],
  },
  {
    label: '임수 壬水',
    shortName: '임수',
    elementKey: 'water' as const,
    description: '큰 물처럼 넓게 흐르는 에너지로, 사고의 확장성과 유연함이 강점으로 해석됩니다.',
    personality: '여러 가능성을 동시에 열어두고 흐름을 읽는 타입입니다. 새로운 정보가 들어올수록 판단의 폭이 넓어집니다.',
    strength: '좋은 점은 변화하는 상황에서도 다른 길을 찾아낼 수 있다는 것입니다.',
    caution: '주의할 점은 생각이 넓어질수록 실행 순서가 흐려질 수 있다는 점입니다.',
    action: '아이디어를 모두 펼친 뒤 이번 주에 실험할 한 가지만 골라보세요.',
    matchedPeople: ['생각의 폭을 넓혀주는 사람', '감정을 급하게 단정하지 않는 사람'],
    needs: ['혼자 정리할 시간', '선택지를 비교할 정보'],
  },
  {
    label: '계수 癸水',
    shortName: '계수',
    elementKey: 'water' as const,
    description: '비와 이슬처럼 스며드는 에너지로, 섬세한 이해력과 통찰이 강점으로 해석됩니다.',
    personality: '겉으로 드러난 말보다 분위기와 맥락을 깊게 읽는 타입입니다. 조용히 쌓은 생각이 나중에 큰 힘이 됩니다.',
    strength: '좋은 점은 복잡한 감정과 정보를 차분히 정리해 현실적인 선택으로 바꿀 수 있다는 것입니다.',
    caution: '주의할 점은 혼자 오래 생각하다 필요한 대화를 미룰 수 있다는 점입니다.',
    action: '머릿속에만 둔 고민을 짧은 메모로 꺼내고, 믿을 만한 사람과 한 번 나눠보세요.',
    matchedPeople: ['조용한 대화를 깊게 나누는 사람', '감정을 안전하게 들어주는 사람'],
    needs: ['생각을 밖으로 꺼낼 메모', '믿을 수 있는 대화'],
  },
];

const heavenlyStems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const earthlyBranches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
const tenGods = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'];
const flowTypes = ['기회의 시기', '성장의 시기', '변화의 시기', '정리의 시기', '주의가 필요한 시기'] as const;
const keywordGroups = [
  ['기회', '확장', '변화'],
  ['학습', '정리', '회복'],
  ['전환', '협업', '실험'],
  ['성과', '평판', '제안'],
  ['점검', '균형', '관리'],
];

const flowSentences = [
  '확장과 재정비가 함께 들어오는 흐름',
  '관계와 일이 천천히 넓어지는 흐름',
  '선택지를 줄이고 집중도를 높이는 흐름',
  '새로운 역할을 시험해보는 흐름',
];

const currentYearSentences = [
  '새로운 역할을 받아들이기 좋은 시기',
  '기존 루틴을 다듬기 좋은 시기',
  '사람들과의 연결이 넓어지기 쉬운 시기',
  '작은 실험을 통해 방향을 확인하기 좋은 시기',
];

const oneLineByElement = {
  wood: '지금은 가능성을 키우고 방향을 넓히기 좋은 흐름이에요.',
  fire: '지금은 생각을 표현하고 반응을 확인하기 좋은 흐름이에요.',
  earth: '지금은 기반을 다지고 생활의 리듬을 정리하기 좋은 흐름이에요.',
  metal: '지금은 기준을 세우고 중요한 선택을 정리하기 좋은 흐름이에요.',
  water: '지금은 정보를 모으고 유연하게 방향을 조정하기 좋은 흐름이에요.',
};

const currentFlowByElement = {
  wood: '현재 흐름은 성장의 발판을 넓히는 쪽에 가깝습니다. 작은 시도를 꾸준히 쌓을 때 다음 기회가 보입니다.',
  fire: '현재 흐름은 안에 있던 생각을 밖으로 꺼내는 쪽에 가깝습니다. 공유와 피드백이 다음 선택을 선명하게 만듭니다.',
  earth: '현재 흐름은 생활과 일의 기반을 안정시키는 쪽에 가깝습니다. 무리한 확장보다 지속 가능한 구조가 중요합니다.',
  metal: '현재 흐름은 기준을 분명히 하고 선택지를 정리하는 쪽에 가깝습니다. 덜어낼수록 집중도가 올라갑니다.',
  water: '현재 흐름은 여러 정보를 연결하고 흐름을 다시 읽는 쪽에 가깝습니다. 서두르기보다 가능성을 비교해보세요.',
};

const todaySummaries = [
  '오늘은 진행 중인 일을 정리하면서 다음 선택지를 가볍게 테스트하기 좋은 날입니다.',
  '오늘은 사람들과 의견을 맞추고 작은 협업을 시작하기 좋은 흐름입니다.',
  '오늘은 새로운 일을 크게 벌이기보다 기준과 우선순위를 정리하기 좋은 날입니다.',
  '오늘은 혼자 고민하던 생각을 밖으로 꺼내보면 실마리가 생기기 쉬운 흐름입니다.',
];

const todayAdvice = [
  '새로운 일을 크게 벌이기보다 작게 시작하고 반응을 확인해보세요.',
  '중요한 대화는 결론보다 서로의 기준을 맞추는 데 집중해보세요.',
  '일정을 무리하게 채우기보다 핵심 작업 하나를 끝내는 데 힘을 써보세요.',
  '생각만 하던 일을 짧은 메모나 초안으로 꺼내보세요.',
];

function yearFortune(
  year: number,
  age: number,
  score: number,
  type: FortuneReport['lifeFlow'][number]['type'],
  title: string,
  keywords: string[],
) {
  return {
    year,
    age,
    score,
    type,
    title,
    keywords,
    summary:
      '새로운 역할이나 프로젝트가 들어올 가능성이 높아지는 시기로 해석됩니다. 기존 방식만 유지하기보다는 새로운 경험을 받아들이는 것이 좋습니다.',
    metrics: [
      { label: '재물', value: Math.max(58, score - 5) },
      { label: '직업', value: Math.min(96, score + 4) },
      { label: '인간관계', value: Math.max(55, score - 13) },
      { label: '연애', value: Math.max(52, score - 17) },
      { label: '건강 관리', value: Math.max(50, score - 19) },
    ],
    goodActions: ['새로운 공부 시작하기', '사람들과 협업하기', '미뤄두었던 프로젝트 시작하기'],
    cautions: ['충동적인 투자', '감정적인 결정', '무리한 일정'],
  };
}

function buildMockPillars(seed: number, user: UserProfile) {
  return {
    year: ganji(seed),
    month: ganji(seed + 13),
    day: ganji(seed + 27),
    hour: user.birthTimeMode === 'unknown' ? '미상' : ganji(seed + birthTimeOffset(user)),
  };
}

function buildElements(seed: number, primaryKey: FortuneReport['core']['elements'][number]['key']) {
  const base = [
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

  return base.map((element, index) => {
    const rawValue = 42 + ((seed + index * 17) % 39);
    const value = element.key === primaryKey ? 78 + (seed % 15) : clamp(rawValue, 36, 76);

    return {
      ...element,
      value: clamp(value, 36, 92),
    };
  });
}

function buildLifeFlow(seed: number, birthYear: number) {
  const currentYear = 2026;
  const startYear = currentYear + 1;

  return Array.from({ length: 9 }, (_, index) => {
    const year = startYear + index;
    const score = clamp(62 + ((seed + index * 11) % 31) - (index === 5 ? 7 : 0), 55, 92);
    const type = flowTypes[(seed + index) % flowTypes.length];
    const keywords = keywordGroups[(seed + index * 2) % keywordGroups.length];
    const title = titleForFlow(type);

    return yearFortune(year, year - birthYear + 1, score, type, title, keywords);
  });
}

function makeSeed(user: UserProfile) {
  const birth = parseBirthDate(user.birthDate);
  const timeOffset = birthTimeOffset(user);
  const calendarOffset = user.calendarType === 'lunar' ? 37 : 0;
  const genderOffset = user.gender === 'female' ? 11 : user.gender === 'male' ? 23 : 5;
  return birth.year * 372 + birth.month * 31 + birth.day + timeOffset + calendarOffset + genderOffset;
}

function parseBirthDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return {
    year: Number.isFinite(year) ? year : 1992,
    month: Number.isFinite(month) ? month : 1,
    day: Number.isFinite(day) ? day : 1,
  };
}

function birthTimeOffset(user: UserProfile) {
  if (user.birthTimeMode === 'exact' && user.exactTime) {
    const hour = Number(user.exactTime.split(':')[0]);
    return Number.isFinite(hour) ? hour * 3 : 0;
  }

  const approximateOffsets: Record<string, number> = {
    dawn: 4,
    morning: 9,
    day: 14,
    afternoon: 18,
    evening: 23,
    night: 28,
  };

  if (user.birthTimeMode === 'approximate') {
    return approximateOffsets[user.approximateTime ?? 'morning'];
  }

  return 0;
}

function ganji(seed: number) {
  return `${heavenlyStems[positiveModulo(seed, heavenlyStems.length)]}${earthlyBranches[positiveModulo(seed, earthlyBranches.length)]}`;
}

function pickMany(items: string[], seed: number, count: number) {
  return Array.from({ length: count }, (_, index) => items[positiveModulo(seed + index * 3, items.length)]);
}

function titleForFlow(type: (typeof flowTypes)[number]) {
  const titles = {
    '기회의 시기': '새로운 기회가 들어오는 해',
    '성장의 시기': '실력이 차분히 쌓이는 해',
    '변화의 시기': '관점과 역할이 바뀌는 해',
    '정리의 시기': '선택지를 줄이고 정돈하는 해',
    '주의가 필요한 시기': '속도를 조절하고 점검하는 해',
  };

  return titles[type];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}
