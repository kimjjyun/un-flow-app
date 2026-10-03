import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  CircleUserRound,
  Edit3,
  Heart,
  Download,
  ChevronRight,
  Home,
  LineChart,
  Share2,
  Sparkles,
  Target,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { defaultProfile } from './data/sampleReport';
import { sajuEngine } from './engine/sajuEngine';
import { downloadFortuneCard } from './lib/shareCard';
import { BirthTimeMode, FiveElement, FlowType, FortuneMetric, FortuneReport, UserProfile, YearFortune } from './types/saju';

type Step = 'intro' | 'form' | 'analyzing' | 'app';
type Tab = 'home' | 'flow' | 'me';

interface SharedPreview {
  name: string;
  score: number;
  metric: string;
  dayMaster: string;
  element: string;
  summary: string;
}

const analysisMessages = [
  '오늘 바로 쓸 수 있는 카드부터 고르고 있어요.',
  '성향과 오행 균형을 쉬운 말로 정리하고 있어요.',
  '친구에게 보내기 좋은 한 줄을 만들고 있어요.',
];

const demoPreview: SharedPreview = {
  name: '민지',
  score: 82,
  metric: '일',
  dayMaster: '정화',
  element: '화',
  summary: '오늘은 생각을 꺼내고 반응을 확인하면 운이 열리는 흐름이에요.',
};

export default function App() {
  const initialShare = useMemo(() => readSharedPreview(), []);
  const [step, setStep] = useState<Step>('intro');
  const [sharedPreview, setSharedPreview] = useState<SharedPreview | null>(initialShare);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [report, setReport] = useState<FortuneReport | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [selectedYear, setSelectedYear] = useState<YearFortune | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const activeYear = selectedYear ?? pickCurrentYear(report) ?? null;

  async function submitProfile(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const birth = new Date(`${profile.birthDate}T00:00:00`);
    const [year, month, day] = profile.birthDate.split('-').map(Number);
    if (!profile.birthDate || !Number.isFinite(birth.getTime()) || birth.getFullYear() !== year || birth.getMonth() + 1 !== month || birth.getDate() !== day || year < 1900 || birth > new Date()) {
      setErrorMessage('1900년부터 오늘 사이의 올바른 생일을 입력해주세요.');
      setStep('form');
      return;
    }

    setStep('analyzing');
    setErrorMessage('');
    setMessageIndex(0);

    const ticker = window.setInterval(() => {
      setMessageIndex((value) => (value + 1) % analysisMessages.length);
    }, 620);

    try {
    const result = await sajuEngine.calculate({
      ...profile,
      name: profile.name.trim() || '나',
      calendarType: 'solar',
    });
    window.clearInterval(ticker);
    setReport(result);
    setSelectedYear(pickCurrentYear(result) ?? result.lifeFlow[0]);
    setSharedPreview(null);
    setTab('home');
    setStep('app');
    window.scrollTo(0, 0);
    } catch {
      setErrorMessage('카드를 만들지 못했어요. 생일을 확인하고 다시 시도해주세요.');
      setStep('form');
    } finally {
      window.clearInterval(ticker);
    }
  }

  return (
    <div className="min-h-screen bg-[#e9edf3] text-ink">
      <div className="app-frame mx-auto min-h-screen w-full max-w-md bg-[#f7f8fb] md:my-6 md:min-h-[880px] md:overflow-hidden md:rounded-[30px] md:shadow-soft">
        {step === 'intro' && (
          <IntroScreen
            sharedPreview={sharedPreview}
            onStart={() => setStep('form')}
            onClearShare={() => {
              setSharedPreview(null);
              window.history.replaceState(null, '', window.location.pathname);
            }}
          />
        )}
        {step === 'form' && (
          <>
          {errorMessage && <p role="alert" className="px-6 pt-4 text-sm text-red-600">{errorMessage}</p>}
          <ProfileForm
            profile={profile}
            setProfile={setProfile}
            onSubmit={submitProfile}
            onBack={() => (report ? setStep('app') : setStep('intro'))}
          />
          </>
        )}
        {step === 'analyzing' && <Analyzing message={analysisMessages[messageIndex]} />}
        {step === 'app' && report && activeYear && (
          <Shell tab={tab} setTab={setTab}>
            {tab === 'home' && (
              <HomeScreen report={report} activeYear={activeYear} onPickTab={setTab} onEdit={() => setStep('form')} />
            )}
            {tab === 'flow' && (
              <FlowScreen report={report} selectedYear={activeYear} onSelectYear={(year) => setSelectedYear(year)} />
            )}
            {tab === 'me' && <MeScreen report={report} onEdit={() => setStep('form')} />}
          </Shell>
        )}
      </div>
    </div>
  );
}

function IntroScreen({
  sharedPreview,
  onStart,
  onClearShare,
}: {
  sharedPreview: SharedPreview | null;
  onStart: () => void;
  onClearShare: () => void;
}) {
  const [previewIndex, setPreviewIndex] = useState(0);
  const topics = [
    { label: '오늘의 운세', icon: '✦', title: '작은 시작이\n좋은 흐름을 만들어요', detail: '미뤄둔 일 하나, 오늘 가볍게 시작해봐요.', color: 'lime' },
    { label: '연애와 관계', icon: '♡', title: '먼저 건넨 한마디가\n하루를 바꿀지도', detail: '생각나는 사람에게 짧은 안부를 보내봐요.', color: 'pink' },
    { label: '나의 성향', icon: '◈', title: '나도 몰랐던\n내 안의 좋은 점', detail: '내 기운을 알고, 나에게 맞는 속도를 찾아요.', color: 'purple' },
  ];
  const topic = topics[previewIndex];
  const preview = sharedPreview ?? demoPreview;
  const isShared = Boolean(sharedPreview);

  return (
    <main className="landing min-h-screen px-6 pb-8 pt-6 md:min-h-[880px]">
      <header className="flex items-center justify-between">
        <span className="brand"><span className="brand-mark">✳</span> 운의 흐름<span className="brand-dot" /></span>
        {isShared && (
          <button className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-500 shadow-sm" onClick={onClearShare}>
            처음 화면
          </button>
        )}
      </header>

      <section className="landing-heading animate-enter">
        <p className="eyebrow">{isShared ? 'A LITTLE LUCK, FROM YOUR FRIEND' : 'A LITTLE LUCK, EVERY DAY'}</p>
        <h1>
          {isShared ? `${preview.name}님의 하루에` : '오늘, 나에게 어떤'}
          <br />
          {isShared ? '찾아온 작은 행운' : '행운이 올까요?'}
        </h1>
        <p className="landing-description">
          {isShared ? '친구가 나눠준 카드예요. 당신의 흐름도 만나보세요.' : '나를 조금 더 알고, 하루를 조금 더 가볍게.'}
        </p>
      </section>
      {!isShared && <div className="topic-tabs" aria-label="카드 미리보기 주제">
        {topics.map((item, index) => <button key={item.label} aria-pressed={previewIndex === index} onClick={() => setPreviewIndex(index)}><span>{item.icon}</span>{item.label}</button>)}
      </div>}
      <section className={`luck-preview ${isShared ? 'lime' : topic.color}`}>
        <div className="preview-top"><span><span className="tiny-star">✦</span> {isShared ? `${preview.name}님의 카드` : topic.label}</span><span>{isShared ? `${preview.score}점 · 전체 흐름` : '미리보기'}</span></div>
        <div className="mascot-stage"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="floating-star star-one">✧</span><span className="floating-star star-two">✦</span><LuckMascot mood={previewIndex} /><span className="floating-label">{isShared ? `${preview.metric} 흐름 ↑` : ['좋은 예감!', '마음이 통하는 날', '내 속도로 가요'][previewIndex]}</span></div>
        <h2>{isShared ? preview.summary : topic.title}</h2>
        <p>{isShared ? `${preview.dayMaster} 타입 · ${preview.element} 기운 중심` : topic.detail}</p>
        <div className="preview-footer"><span>운의 흐름</span><span>YOUR DAILY LUCK ↗</span></div>
      </section>
      <div className="landing-benefits"><span><CheckCircle2 size={14} /> 가입 없이</span><span><CheckCircle2 size={14} /> 생년월일 하나로</span><span><CheckCircle2 size={14} /> 무료로</span></div>
      <button className="primary-btn mt-5 w-full" onClick={onStart}>
        {isShared ? '내 카드도 보기' : '내 운세 카드 만들기'}
        <ArrowRight size={18} />
      </button>
      <p className="landing-note">가볍게 읽고, 좋은 기운은 친구와 나눠요.</p>
      <div className="discover-heading"><h2>내 하루를 위한 작은 힌트</h2><span>3가지 이야기</span></div>
      <div className="discovery-grid">{topics.map((item,index) => <button key={item.label} onClick={() => {setPreviewIndex(index); window.scrollTo({top: 0, behavior: 'smooth'});}}><span className={`discovery-icon ${item.color}`}>{item.icon}</span><strong>{item.label}</strong><span>{['오늘의 흐름과 행동', '연결을 위한 한마디', '나만의 기운 찾기'][index]}</span><ChevronRight size={15}/></button>)}</div>
      <p className="entertainment-note">운세는 하루를 돌아보는 재미있는 참고로 즐겨주세요.</p>
    </main>
  );
}

function LuckMascot({ mood = 0 }: { mood?: number }) {
  return (
    <svg className="luck-mascot" viewBox="0 0 220 200" aria-hidden="true">
      <ellipse cx="112" cy="177" rx="55" ry="9" fill="#182c19" opacity=".08" />
      <path d="M106 160C63 186 30 147 51 113C8 99 27 50 65 58C68 13 119 16 128 53C166 27 201 62 177 93C216 114 192 156 155 145C158 181 117 191 106 160Z" fill={['#b2ed5a','#ffb8d2','#c3b2ff'][mood]} stroke="#ffffff" strokeWidth="3" />
      <ellipse cx="92" cy="104" rx="5" ry="8" fill="#243724" /><ellipse cx="127" cy="99" rx="5" ry="8" fill="#243724" />
      <path d="M104 118Q114 130 126 115" fill="none" stroke="#243724" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="76" cy="117" rx="10" ry="6" fill="#fa9c89" opacity=".65" /><ellipse cx="145" cy="111" rx="10" ry="6" fill="#fa9c89" opacity=".65" />
      <path d="M65 72Q77 49 94 49" fill="none" stroke="white" strokeWidth="6" opacity=".5" strokeLinecap="round" />
    </svg>
  );
}

function ProfileForm({
  profile,
  setProfile,
  onSubmit,
  onBack,
}: {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  onSubmit: (event?: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
}) {
  const [showOptions, setShowOptions] = useState(profile.birthTimeMode !== 'unknown');
  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setProfile({ ...profile, [key]: value });
  };

  return (
    <main className="min-h-screen px-6 pb-8 pt-5 md:min-h-[880px]">
      <header className="mb-8 flex items-center justify-between">
        <button className="icon-btn" onClick={onBack} aria-label="이전">
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-black text-[#101828]">운의 흐름</span>
        <span className="h-10 w-10" />
      </header>

      <section className="animate-enter">
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-[#2563eb] shadow-sm">
          <CheckCircle2 size={14} />
          생년월일만 필수예요
        </span>
        <h1 className="mt-5 text-[34px] font-black leading-tight tracking-[-0.01em]">
          먼저 카드부터
          <br />
          만들어볼게요
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          출생시간은 몰라도 괜찮아요. 정확도를 높이고 싶을 때만 추가하면 됩니다.
        </p>
      </section>

      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        <label className="field">
          <span>생년월일</span>
          <input
            required
            type="text"
            inputMode="numeric"
            placeholder="예: 1998-06-15"
            maxLength={10}
            pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
            value={profile.birthDate}
            onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, '').slice(0, 8);
              update('birthDate', [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean).join('-'));
            }}
          />
        </label>

        <label className="field">
          <span>닉네임 <small className="text-slate-400">선택</small></span>
          <input
            value={profile.name}
            maxLength={20}
            onChange={(event) => update('name', event.target.value)}
            placeholder="없으면 '나'로 표시돼요"
          />
        </label>

        <button type="button" className="optional-toggle" onClick={() => setShowOptions(!showOptions)} aria-expanded={showOptions}>출생시간도 알고 있어요 <ChevronRight size={17} className={showOptions ? 'rotate-90' : ''} /></button>
        {showOptions && <Segmented
          label="출생시간"
          value={profile.birthTimeMode}
          options={[
            ['unknown', '모름'],
            ['exact', '정확히'],
            ['approximate', '대략'],
          ]}
          onChange={(value) => update('birthTimeMode', value as BirthTimeMode)}
        />}

        {showOptions && profile.birthTimeMode === 'exact' && (
          <label className="field">
            <span>정확한 시간</span>
            <input required type="time" value={profile.exactTime ?? ''} onChange={(event) => update('exactTime', event.target.value)} />
          </label>
        )}

        {showOptions && profile.birthTimeMode === 'approximate' && (
          <Segmented
            label="대략적인 시간대"
            value={profile.approximateTime ?? 'morning'}
            options={[
              ['dawn', '새벽'],
              ['morning', '아침'],
              ['day', '낮'],
              ['afternoon', '오후'],
              ['evening', '저녁'],
              ['night', '밤'],
            ]}
            onChange={(value) => update('approximateTime', value)}
            wrap
          />
        )}

        <p className="text-xs leading-6 text-slate-500">양력 생일을 입력해주세요. 출생정보는 공유 카드에 포함되지 않아요.</p>

        <button className="primary-btn sticky bottom-5 w-full" type="submit">
          결과 보기
          <ArrowRight size={18} />
        </button>
      </form>
    </main>
  );
}

function Analyzing({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen flex-col justify-center px-7 md:min-h-[880px]">
      <div className="rounded-[24px] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef4ff] text-[#2563eb]">
            <BarChart3 size={22} />
          </div>
          <div>
            <p className="text-xs font-black text-[#2563eb]">카드 만드는 중</p>
            <h1 className="text-xl font-black">곧 보여드릴게요</h1>
          </div>
        </div>
        <div className="mt-8 space-y-3">
          <span className="analysis-line block h-3 w-4/5 rounded-full bg-[#101828]" />
          <span className="analysis-line analysis-line-delay block h-3 w-full rounded-full bg-[#2563eb]/45" />
          <span className="analysis-line block h-3 w-3/5 rounded-full bg-warm/80" />
        </div>
        <p className="mt-8 min-h-7 text-base font-bold text-slate-600">{message}</p>
      </div>
    </main>
  );
}

function Shell({ tab, setTab, children }: { tab: Tab; setTab: (tab: Tab) => void; children: React.ReactNode }) {
  return (
    <main className="min-h-screen pb-28 pt-5 md:min-h-[880px]">
      <div className="px-5">{children}</div>
      <BottomNav tab={tab} setTab={setTab} />
    </main>
  );
}

function HomeScreen({
  report,
  activeYear,
  onPickTab,
  onEdit,
}: {
  report: FortuneReport;
  activeYear: YearFortune;
  onPickTab: (tab: Tab) => void;
  onEdit: () => void;
}) {
  const [shareMessage, setShareMessage] = useState('');
  const [showShareLink, setShowShareLink] = useState(false);
  const [missionDone, setMissionDone] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('전체');
  const mainMetric = topMetric(report.today.metrics);
  const overallMetric = report.today.metrics.find((metric) => metric.label === '전체') ?? mainMetric;
  const needed = report.interpretation.supportiveElements[0];
  const nextChange = report.lifeFlow.find((year) => year.year > activeYear.year && isChangeType(year.type));
  const dayMaster = report.core.dayMaster.label.split(' ')[0];
  const dominant = dominantElement(report);
  const title = resultTitle(report);
  const shareUrl = buildShareUrl(report);
  const highlighted = report.today.metrics.find(metric => metric.label === selectedMetric) ?? overallMetric;
  const metricHints: Record<string, string> = {
    '전체': report.today.advice,
    '재물': '오늘의 소비를 한 번 돌아보고, 필요한 것부터 골라봐요.',
    '일': '가장 작은 일부터 끝내며 나만의 리듬을 만들어봐요.',
    '관계': '고마웠던 사람에게 짧은 안부를 건네봐요.',
    '연애': '내 마음을 먼저 살피고, 부담 없는 대화부터 시작해봐요.',
  };

  async function saveCard() {
    try {
      await downloadFortuneCard({name: report.user.name || '나', score: overallMetric.value, title, summary: report.today.summary, date: formatToday()});
      setShareMessage('카드 이미지를 저장했어요. 스토리에도 올려보세요.');
    } catch {
      setShareMessage('이미지 저장이 안 되면 링크로 공유해주세요.');
    }
  }

  async function shareToday() {
    const text = `${report.user.name || '나'}님의 운세 카드: ${title}. 오늘 전체 흐름은 ${overallMetric.value}점이에요.`;
    const shareData = {
      title: '운의 흐름',
      text,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareMessage('공유창을 열었어요');
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
      setShareMessage('친구가 볼 수 있는 링크를 복사했어요');
    } catch (error) {
      setShareMessage(error instanceof DOMException && error.name === 'AbortError' ? '공유를 취소했어요' : '링크를 복사하지 못했어요. 다시 시도해주세요.');
      if (!(error instanceof DOMException && error.name === 'AbortError')) setShowShareLink(true);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage('친구가 볼 수 있는 링크를 복사했어요');
    } catch {
      setShowShareLink(true);
      setShareMessage('아래 링크를 길게 누르거나 선택해서 복사해주세요.');
    }
  }

  return (
    <section className="space-y-5 animate-enter">
      <TopBar title={`${report.user.name || '나'}님의 오늘`} subtitle={formatToday()} onEdit={onEdit} />

      <section className="result-hero overflow-hidden rounded-[30px] p-6 text-white">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-black text-white/90">✦ 오늘의 운세 카드</span>
          <span className="text-xs font-black text-[#d7ff63]">{mainMetric.label} 흐름 강함</span>
        </div>
        <div className="mt-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-white/55">{report.user.name || '나'}님의 전체 흐름</p>
            <h1 className="mt-2 text-[56px] font-black leading-none tracking-[-0.02em]">{overallMetric.value}</h1>
            <p className="mt-2 text-sm font-bold text-white/55">오늘 기준 점수</p>
          </div>
          <div className="result-mascot"><LuckMascot /></div>
        </div>
        <h2 className="mt-6 text-[25px] font-black leading-snug tracking-[-0.01em]">{title}</h2>
        <p className="mt-3 text-sm font-bold leading-6 text-white/70">{report.today.summary}</p>
        <div className="share-actions"><button onClick={shareToday}><Share2 size={17} /> 친구에게 보내기</button><button onClick={saveCard} aria-label="카드 이미지 저장"><Download size={19}/></button></div>
        <button className="mt-3 text-xs text-white/80 underline underline-offset-4" onClick={copyLink}>링크만 복사하기</button>
        {shareMessage && <p className="share-feedback" role="status">{shareMessage}</p>}
        {showShareLink && <input aria-label="공유 링크" readOnly value={shareUrl} onFocus={event => event.target.select()} className="mt-2 w-full rounded-lg bg-white/15 p-3 text-xs text-white" />}
      </section>

      <section className="metric-panel">
        <div className="metric-tabs" aria-label="운세 분야">{report.today.metrics.map(metric => <button key={metric.label} aria-pressed={selectedMetric === metric.label} onClick={() => setSelectedMetric(metric.label)}><span>{metric.label}</span><strong>{metric.value}</strong></button>)}</div>
        <div className="metric-insight"><span><Heart size={16}/>{highlighted.label} 흐름</span><p>{metricHints[selectedMetric]}</p></div>
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between"><SectionLabel icon={<CheckCircle2 size={17} />} title="오늘의 작은 미션" /><span className="text-xs font-bold text-slate-400">{missionDone ? '1 / 1 완료' : '0 / 1 완료'}</span></div>
        <div className="mt-5 grid gap-3">
          <button className={`mission-check ${missionDone ? 'is-done' : ''}`} aria-pressed={missionDone} onClick={() => setMissionDone(!missionDone)}><CheckCircle2 size={23}/><span><small>{missionDone ? '좋아요, 오늘도 한 걸음!' : '가볍게 하나만 해볼까요?'}</small><strong>{report.today.advice}</strong></span></button>
          <MissionLine index="2" title="덜어낼 것" value={report.today.avoid} />
        </div>
      </section>

      <button className="w-full rounded-[28px] bg-[#eaf0ff] p-5 text-left active:scale-[0.99]" onClick={() => onPickTab('me')}>
        <SectionLabel icon={<Target size={17} />} title="나는 어떤 타입?" />
        <p className="mt-4 text-xl font-black leading-snug">
          {dayMaster} · {dominant.label} 기운 중심
        </p>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{userFriendlyPersonality(report)}</p>
      </button>

      <section className="grid gap-3 pb-2">
        <QuestionCard
          label="가까이 두면 좋은 것"
          title={needed ? `${needed.label} 기운이 필요해요` : relationshipCue(report)}
          body={needed ? needed.need : '편한 접점을 만드는 쪽이 잘 맞아요.'}
          onClick={() => onPickTab('me')}
        />
        <QuestionCard
          label="다음에 뭐가 바뀌어?"
          title={nextChange ? `${nextChange.year}년 ${shortFlow(nextChange.type)}` : `${activeYear.year}년의 흐름`}
          body={nextChange ? nextChange.title : activeYear.title}
          onClick={() => onPickTab('flow')}
        />
      </section>
      <p className="entertainment-note">점수와 해석은 재미로 참고해주세요.<br/>중요한 선택은 내 상황과 판단을 먼저 살펴요.</p>
    </section>
  );
}

function FlowScreen({
  report,
  selectedYear,
  onSelectYear,
}: {
  report: FortuneReport;
  selectedYear: YearFortune;
  onSelectYear: (year: YearFortune) => void;
}) {
  const visibleYears = yearsFromNow(report.lifeFlow);

  return (
    <section className="space-y-5 animate-enter">
      <TopBar title="흐름 캘린더" subtitle="올해부터 보기" />

      <section className="rounded-[30px] bg-[#dcfce7] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-[#15803d]">선택한 해</p>
            <h1 className="mt-2 text-[42px] font-black leading-none tracking-[-0.02em]">{selectedYear.year}</h1>
            <p className="mt-3 text-xl font-black text-[#14532d]">{flowLabel(selectedYear.type)}</p>
          </div>
          <ScoreRing value={selectedYear.score} />
        </div>
        <p className="mt-5 text-base font-bold leading-7 text-[#14532d]/80">{selectedYear.summary}</p>
      </section>

      <section>
        <SectionLabel icon={<CalendarDays size={17} />} title="연도별 변화" />
        <div className="mt-3 space-y-2">
          {visibleYears.slice(0, 5).map((year) => (
            <YearRow key={year.year} year={year} active={year.year === selectedYear.year} onClick={() => onSelectYear(year)} />
          ))}
        </div>
      </section>

      <YearDetail year={selectedYear} />
    </section>
  );
}

function YearDetail({ year }: { year: YearFortune }) {
  return (
    <section className="rounded-[28px] bg-white p-5 shadow-sm">
      <SectionLabel icon={<Sparkles size={17} />} title={`${year.year}년 요약`} />
      <div className="mt-4 flex flex-wrap gap-2">
        {year.keywords.slice(0, 3).map((keyword) => (
          <span key={keyword} className="rounded-full bg-[#eef4ff] px-3 py-2 text-xs font-black text-[#2563eb]">
            {keyword}
          </span>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        {year.metrics.slice(0, 2).map((metric) => (
          <MetricMini key={metric.label} metric={metric} />
        ))}
      </div>
      <div className="mt-5 grid gap-4">
        <ActionList title="이 해에 해보면 좋은 것" items={year.goodActions.slice(0, 2)} tone="good" />
        <ActionList title="조심하면 좋은 것" items={year.cautions.slice(0, 2)} tone="caution" />
      </div>
    </section>
  );
}

function MeScreen({ report, onEdit }: { report: FortuneReport; onEdit: () => void }) {
  const [showExpert, setShowExpert] = useState(false);
  const needed = report.interpretation.supportiveElements[0];
  const dominant = dominantElement(report);

  return (
    <section className="space-y-5 animate-enter">
      <TopBar title="내 사주 카드" subtitle="나의 기본값" onEdit={onEdit} />

      <section className="rounded-[30px] bg-[#fff7ed] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-[#c2410c]">나의 사주</p>
            <h1 className="mt-2 text-[40px] font-black leading-tight tracking-[-0.02em]">{report.core.dayMaster.label}</h1>
            <p className="mt-3 text-base font-bold leading-7 text-[#7c2d12]/80">{userFriendlyPersonality(report)}</p>
          </div>
          <button className="icon-btn shrink-0" onClick={onEdit} aria-label="출생정보 수정">
            <Edit3 size={18} />
          </button>
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <SectionLabel icon={<BarChart3 size={17} />} title="오행 분포" />
        <div className="mt-5 space-y-4">
          {report.core.elements.map((element) => (
            <ElementBar key={element.key} element={element} />
          ))}
        </div>
        <p className="mt-5 rounded-[20px] bg-[#f5f7fb] p-4 text-sm font-bold leading-6 text-slate-600">
          지금 분포에서는 {dominant.label} {dominant.hanja}가 가장 크게 보여요. 일간은 나를 대표하는 기준이고,
          오행 분포는 전체 기운의 비율이라 서로 다르게 보일 수 있어요.
        </p>
      </section>

      {needed && (
        <ElementAdviceCard
          title="가까이 두면 좋은 기운"
          badge={`${needed.label} ${needed.hanja}`}
          body={needed.reason}
          items={needed.actions}
        />
      )}

      <button className="flex w-full items-center justify-between rounded-[24px] bg-[#edf4ee] p-5 text-left" onClick={() => setShowExpert(!showExpert)}>
        <span>
          <strong className="block text-lg">사주 원국 자세히 보기</strong>
          <span className="mt-1 block text-xs font-bold text-slate-500">천간·지지·계산 기준</span>
        </span>
        <ArrowRight className={`transition ${showExpert ? 'rotate-90' : ''}`} size={20} />
      </button>
      {showExpert && <ExpertSection report={report} />}
    </section>
  );
}

function ExpertSection({ report }: { report: FortuneReport }) {
  return (
    <section className="space-y-3 animate-expand">
      <div className="rounded-[24px] bg-white p-5 shadow-sm">
        <p className="text-xs font-black text-[#2563eb]">사주팔자</p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {Object.entries(report.core.pillars).map(([key, value]) => (
            <div key={key} className="rounded-2xl bg-[#f2f3ef] p-3 text-center">
              <span className="text-[11px] font-bold text-slate-500">{pillarLabel(key)}</span>
              <strong className="mt-2 block text-sm">{value}</strong>
            </div>
          ))}
        </div>
      </div>
      <Notice>{report.calculation.description}</Notice>
    </section>
  );
}

function TopBar({ title, subtitle, onEdit }: { title: string; subtitle: string; onEdit?: () => void }) {
  return (
    <header className="flex items-center justify-between pt-1">
      <div>
        <p className="text-xs font-black text-[#64748b]">{subtitle}</p>
        <h1 className="mt-1 text-[31px] font-black leading-tight tracking-[-0.02em]">{title}</h1>
      </div>
      {onEdit && (
        <button className="icon-btn" onClick={onEdit} aria-label="출생정보 수정">
          <Edit3 size={18} />
        </button>
      )}
    </header>
  );
}

function Segmented({
  label,
  value,
  options,
  onChange,
  wrap = false,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
  wrap?: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-slate-700">{label}</p>
      <div className={`rounded-2xl bg-white p-1 shadow-sm ${wrap ? 'grid grid-cols-3 gap-1' : 'flex'}`}>
        {options.map(([key, text]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-bold transition active:scale-[0.98] ${
              value === key ? 'bg-[#101828] text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function BottomNav({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  const items = [
    ['home', '오늘', Home],
    ['flow', '흐름', LineChart],
    ['me', '나의 기운', CircleUserRound],
  ] as const;

  return (
    <nav className="fixed bottom-5 left-1/2 z-20 grid w-[calc(100%-44px)] max-w-sm -translate-x-1/2 grid-cols-3 rounded-[26px] bg-white/95 p-2 shadow-[0_16px_46px_rgba(15,23,42,0.18)] backdrop-blur md:bottom-10">
      {items.map(([key, label, Icon]) => (
        <button
          key={key}
          className={`flex min-h-12 items-center justify-center gap-2 rounded-[18px] text-sm font-black transition active:scale-[0.98] ${
            tab === key ? 'bg-[#101828] text-white' : 'text-slate-400'
          }`}
          onClick={() => setTab(key)}
          aria-current={tab === key ? 'page' : undefined}
        >
          <Icon size={18} />
          {label}
        </button>
      ))}
    </nav>
  );
}

function SectionLabel({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#eef4ff] text-[#2563eb]">{icon}</span>
      <h2 className="text-xl font-black">{title}</h2>
    </div>
  );
}

function MetricMini({ metric }: { metric: FortuneMetric }) {
  return (
    <div className="rounded-[22px] bg-white p-3 shadow-sm">
      <span className="block text-xs font-black text-slate-500">{metric.label}</span>
      <strong className="mt-2 block text-2xl font-black text-[#2563eb]">{metric.value}</strong>
    </div>
  );
}

function MissionLine({ index, title, value, active = false }: { index: string; title: string; value: string; active?: boolean }) {
  return (
    <div className={`flex gap-3 rounded-[22px] p-4 ${active ? 'bg-[#101828] text-white' : 'bg-[#f5f7fb]'}`}>
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${active ? 'bg-[#d7ff63] text-[#101828]' : 'bg-white text-slate-500'}`}>
        {index}
      </span>
      <span>
        <span className={`block text-xs font-black ${active ? 'text-white/55' : 'text-slate-500'}`}>{title}</span>
        <strong className="mt-1 block text-sm leading-6">{value}</strong>
      </span>
    </div>
  );
}

function QuestionCard({ label, title, body, onClick }: { label: string; title: string; body: string; onClick: () => void }) {
  return (
    <button className="flex w-full items-center justify-between gap-4 rounded-[26px] bg-white p-5 text-left shadow-sm active:scale-[0.99]" onClick={onClick}>
      <span>
        <span className="block text-xs font-black text-[#2563eb]">{label}</span>
        <strong className="mt-2 block text-lg leading-snug">{title}</strong>
        <span className="mt-2 line-clamp-2 block text-sm leading-6 text-slate-600">{body}</span>
      </span>
      <ArrowRight className="shrink-0 text-slate-300" size={20} />
    </button>
  );
}

function YearRow({ year, active, onClick }: { year: YearFortune; active: boolean; onClick: () => void }) {
  return (
    <button
      className={`grid w-full grid-cols-[62px_1fr_auto] items-center gap-3 rounded-[22px] p-4 text-left shadow-sm transition active:scale-[0.99] ${
        active ? 'bg-[#101828] text-white' : 'bg-white'
      }`}
      onClick={onClick}
    >
      <strong className={`text-xl font-black ${active ? 'text-white' : 'text-[#2563eb]'}`}>{year.year}</strong>
      <span>
        <span className="block text-base font-black">{year.title}</span>
        <span className={`mt-1 block text-xs font-bold ${active ? 'text-white/55' : 'text-slate-500'}`}>
          {year.keywords.slice(0, 3).join(' · ')}
        </span>
      </span>
      <span className={`rounded-full px-3 py-2 text-[11px] font-black ${active ? 'bg-white/15 text-white' : 'bg-[#eef4ff] text-[#2563eb]'}`}>
        {shortFlow(year.type)}
      </span>
    </button>
  );
}

function ScoreRing({ value }: { value: number }) {
  return (
    <div
      className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[#edf4ee]"
      style={{ background: `conic-gradient(#2563eb ${value * 3.6}deg, rgba(255,255,255,0.65) 0deg)` }}
    >
      <div className="grid h-14 w-14 place-items-center rounded-full bg-white">
        <strong className="text-lg font-black text-[#2563eb]">{value}</strong>
      </div>
    </div>
  );
}

function ElementBar({ element }: { element: FiveElement }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-black">
          {element.label} {element.hanja}
        </span>
        <span className="text-xs font-bold text-slate-500">{element.meaning}</span>
      </div>
      <div className="mt-2 h-3 rounded-full bg-[#f0f1ed]">
        <div className="h-full rounded-full" style={{ width: `${element.value}%`, backgroundColor: element.color }} />
      </div>
    </div>
  );
}

function ElementAdviceCard({
  title,
  badge,
  body,
  items,
}: {
  title: string;
  badge: string;
  body: string;
  items: string[];
}) {
  return (
    <section className="rounded-[24px] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black">{title}</h2>
        <span className="rounded-full bg-[#eef4ff] px-3 py-2 text-xs font-black text-[#2563eb]">{badge}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
      {items.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.slice(0, 3).map((item) => (
            <span key={item} className="rounded-full bg-[#f5f7fb] px-3 py-2 text-xs font-bold text-slate-600">
              {item}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function ActionList({ title, items, tone }: { title: string; items: string[]; tone: 'good' | 'caution' }) {
  return (
    <div>
      <h3 className="text-sm font-black">{title}</h3>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div key={item} className="flex gap-3 rounded-2xl bg-[#f3f4f1] p-3 text-sm leading-6 text-slate-700">
            <span className={`mt-2 h-2 w-2 flex-none rounded-full ${tone === 'good' ? 'bg-leaf' : 'bg-warm'}`} />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[22px] bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm">{children}</div>;
}

function formatToday() {
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());
}

function pickCurrentYear(report: FortuneReport | null) {
  if (!report) return null;
  const year = new Date().getFullYear();
  return report.lifeFlow.find((item) => item.year === year) ?? report.lifeFlow[0] ?? null;
}

function yearsFromNow(years: YearFortune[]) {
  const year = new Date().getFullYear();
  const upcoming = years.filter((item) => item.year >= year);
  return upcoming.length ? upcoming : years;
}

function topMetric(metrics: FortuneMetric[]) {
  return metrics.reduce((best, metric) => (metric.label !== '전체' && metric.value > best.value ? metric : best), metrics[1] ?? metrics[0]);
}

function dominantElement(report: FortuneReport) {
  return report.core.elements.reduce((top, element) => (element.value > top.value ? element : top), report.core.elements[0]);
}

function relationshipCue(report: FortuneReport) {
  return report.interpretation.matchedPeople[0]?.replace('사람', '관계') ?? '먼저 연락해보기';
}

function userFriendlyPersonality(report: FortuneReport) {
  const label = report.core.dayMaster.label.split(' ')[0];
  if (label.includes('목')) return '배우고 키우는 과정에서 에너지가 살아나는 타입이에요.';
  if (label.includes('화')) return '표현하고 연결할 때 에너지가 살아나는 타입이에요.';
  if (label.includes('토')) return '정리하고 돌보며 기반을 만들 때 안정되는 타입이에요.';
  if (label.includes('금')) return '기준을 세우고 선택을 정리할 때 선명해지는 타입이에요.';
  return '흐름을 읽고 가능성을 비교할 때 생각이 깊어지는 타입이에요.';
}

function resultTitle(report: FortuneReport) {
  const metric = topMetric(report.today.metrics);
  return { '재물': '작은 선택에서 좋은 기회를 발견할 날', '일': '작은 시작이 좋은 흐름을 만들어요', '관계': '먼저 건넨 한마디가 하루를 바꿀지도', '연애': '마음을 나누면 조금 더 가까워지는 날' }[metric.label] ?? '나만의 속도로 좋은 하루를 만들어봐요';
}

function buildShareUrl(report: FortuneReport) {
  const overall = report.today.metrics.find((metric) => metric.label === '전체') ?? topMetric(report.today.metrics);
  const strongest = topMetric(report.today.metrics);
  const dominant = dominantElement(report);
  const params = new URLSearchParams({
    n: report.user.name || '나',
    s: String(overall.value),
    m: strongest.label,
    d: report.core.dayMaster.label.split(' ')[0],
    e: dominant.label,
    t: report.today.summary,
  });

  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

function readSharedPreview(): SharedPreview | null {
  const params = new URLSearchParams(window.location.search);
  const score = Number(params.get('s'));
  const summary = params.get('t');

  if (!Number.isFinite(score) || !summary) return null;

  return {
    name: params.get('n') || '친구',
    score: Math.max(0, Math.min(100, score)),
    metric: params.get('m') || '오늘',
    dayMaster: params.get('d') || '나',
    element: params.get('e') || '오행',
    summary,
  };
}

function flowLabel(type: FlowType) {
  return {
    '기회의 시기': '기회가 열리는 흐름',
    '성장의 시기': '성장의 흐름',
    '변화의 시기': '전환의 흐름',
    '정리의 시기': '정리의 흐름',
    '주의가 필요한 시기': '속도 조절의 흐름',
  }[type];
}

function shortFlow(type: FlowType) {
  return {
    '기회의 시기': '기회',
    '성장의 시기': '성장',
    '변화의 시기': '전환',
    '정리의 시기': '정리',
    '주의가 필요한 시기': '주의',
  }[type];
}

function isChangeType(type: FlowType) {
  return type === '기회의 시기' || type === '변화의 시기';
}

function pillarLabel(key: string) {
  return { year: '년주', month: '월주', day: '일주', hour: '시주' }[key] ?? key;
}
