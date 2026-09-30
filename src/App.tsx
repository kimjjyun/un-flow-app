import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  CircleUserRound,
  Edit3,
  Eye,
  Home,
  LineChart,
  Share2,
  Sparkles,
  Target,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { defaultProfile } from './data/sampleReport';
import { sajuEngine } from './engine/sajuEngine';
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

  const activeYear = selectedYear ?? pickCurrentYear(report) ?? null;

  async function submitProfile(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!profile.birthDate) {
      setStep('form');
      return;
    }

    setStep('analyzing');
    setMessageIndex(0);

    const ticker = window.setInterval(() => {
      setMessageIndex((value) => (value + 1) % analysisMessages.length);
    }, 620);

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
  }

  return (
    <div className="min-h-screen bg-[#e9edf3] text-ink">
      <div className="mx-auto min-h-screen w-full max-w-md bg-[#f7f8fb] md:my-6 md:min-h-[880px] md:overflow-hidden md:rounded-[30px] md:shadow-soft">
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
          <ProfileForm
            profile={profile}
            setProfile={setProfile}
            onSubmit={submitProfile}
            onBack={() => (report ? setStep('app') : setStep('intro'))}
          />
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
  const preview = sharedPreview ?? demoPreview;
  const isShared = Boolean(sharedPreview);

  return (
    <main className="min-h-screen px-5 pb-8 pt-5 md:min-h-[880px]">
      <header className="flex items-center justify-between">
        <span className="text-sm font-black text-[#101828]">운의 흐름</span>
        {isShared && (
          <button className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-500 shadow-sm" onClick={onClearShare}>
            처음 화면
          </button>
        )}
      </header>

      <section className="mt-7 animate-enter">
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-[#2563eb] shadow-sm">
          <Sparkles size={14} />
          {isShared ? '친구가 보낸 운세 카드' : '공유하고 싶은 오늘의 운세'}
        </div>
        <h1 className="mt-5 text-[34px] font-black leading-tight tracking-[-0.01em]">
          {isShared ? `${preview.name}님의 흐름을` : '생년월일만 넣으면'}
          <br />
          {isShared ? '먼저 살짝 볼까요?' : '오늘 쓸 말이 나와요'}
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          긴 풀이보다 친구에게 보여주기 좋은 카드, 오늘 할 일, 올해 흐름을 먼저 보여줘요.
        </p>
      </section>

      <section className="mt-8 overflow-hidden rounded-[30px] bg-[#101828] p-5 text-white shadow-[0_18px_44px_rgba(16,24,40,0.24)]">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-black text-white/70">
            {isShared ? '친구 카드' : '미리보기'}
          </span>
          <span className="text-xs font-black text-[#d7ff63]">오늘 바로 보기</span>
        </div>
        <div className="mt-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-white/55">{preview.name}님의 강한 흐름</p>
            <h2 className="mt-2 text-[56px] font-black leading-none tracking-[-0.02em]">{preview.score}</h2>
            <p className="mt-2 text-sm font-bold text-white/55">{preview.metric} 운이 눈에 띄어요</p>
          </div>
          <div className="grid h-16 w-16 place-items-center rounded-[22px] bg-[#d7ff63] text-[#101828]">
            <Eye size={26} />
          </div>
        </div>
        <p className="mt-6 text-[23px] font-black leading-snug tracking-[-0.01em]">{preview.summary}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-black">{preview.dayMaster} 타입</span>
          <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-black">{preview.element} 기운 중심</span>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-2">
        <IntroPoint title="빠르게" body="필수 입력 1개" />
        <IntroPoint title="가볍게" body="한 줄 카드" />
        <IntroPoint title="같이" body="친구 공유" />
      </section>

      <button className="primary-btn mt-6 w-full" onClick={onStart}>
        {isShared ? '내 카드도 보기' : '내 운세 카드 만들기'}
        <ArrowRight size={18} />
      </button>
    </main>
  );
}

function IntroPoint({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[20px] bg-white p-4 shadow-sm">
      <strong className="block text-sm font-black">{title}</strong>
      <span className="mt-1 block text-xs font-bold text-slate-500">{body}</span>
    </div>
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
            type="date"
            value={profile.birthDate}
            onChange={(event) => update('birthDate', event.target.value)}
          />
        </label>

        <label className="field">
          <span>닉네임</span>
          <input
            value={profile.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="없으면 '나'로 표시돼요"
          />
        </label>

        <Segmented
          label="출생시간"
          value={profile.birthTimeMode}
          options={[
            ['unknown', '모름'],
            ['exact', '정확히'],
            ['approximate', '대략'],
          ]}
          onChange={(value) => update('birthTimeMode', value as BirthTimeMode)}
        />

        {profile.birthTimeMode === 'exact' && (
          <label className="field">
            <span>정확한 시간</span>
            <input type="time" value={profile.exactTime ?? ''} onChange={(event) => update('exactTime', event.target.value)} />
          </label>
        )}

        {profile.birthTimeMode === 'approximate' && (
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

        <Notice>음력과 성별은 이번 버전에서 숨겼어요. 첫 경험은 빠르게 만들고, 정확도 옵션은 다음 단계에서 여는 편이 더 자연스럽습니다.</Notice>

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
  const mainMetric = topMetric(report.today.metrics);
  const overallMetric = report.today.metrics.find((metric) => metric.label === '전체') ?? mainMetric;
  const needed = report.interpretation.supportiveElements[0];
  const nextChange = report.lifeFlow.find((year) => year.year > activeYear.year && isChangeType(year.type));
  const dayMaster = report.core.dayMaster.label.split(' ')[0];
  const dominant = dominantElement(report);
  const title = resultTitle(report);
  const shareUrl = buildShareUrl(report);

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
    } catch {
      setShareMessage('공유를 잠시 취소했어요');
    }
  }

  return (
    <section className="space-y-5 animate-enter">
      <TopBar title="오늘의 카드" subtitle={formatToday()} onEdit={onEdit} />

      <section className="overflow-hidden rounded-[30px] bg-[#101828] p-5 text-white shadow-[0_18px_44px_rgba(16,24,40,0.24)]">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-black text-white/70">Share Card</span>
          <span className="text-xs font-black text-[#d7ff63]">{mainMetric.label} 흐름 강함</span>
        </div>
        <div className="mt-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-white/55">{report.user.name || '나'}님의 전체 흐름</p>
            <h1 className="mt-2 text-[56px] font-black leading-none tracking-[-0.02em]">{overallMetric.value}</h1>
            <p className="mt-2 text-sm font-bold text-white/55">오늘 기준 점수</p>
          </div>
          <div className="grid h-16 w-16 place-items-center rounded-[22px] bg-[#d7ff63] text-[#101828]">
            <Sparkles size={26} />
          </div>
        </div>
        <h2 className="mt-6 text-[25px] font-black leading-snug tracking-[-0.01em]">{title}</h2>
        <p className="mt-3 text-sm font-bold leading-6 text-white/70">{report.today.summary}</p>
        <button className="mt-6 flex w-full items-center justify-between rounded-[22px] bg-white px-4 py-4 text-left text-[#101828]" onClick={shareToday}>
          <span>
            <span className="block text-xs font-black text-slate-500">친구에게 보내기</span>
            <strong className="mt-1 block text-base">내 카드 링크 공유</strong>
            {shareMessage && <span className="mt-1 block text-xs font-bold text-slate-500">{shareMessage}</span>}
          </span>
          <Share2 size={18} />
        </button>
      </section>

      <section className="grid grid-cols-3 gap-2">
        {report.today.metrics.slice(1, 4).map((metric) => (
          <MetricPill key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <SectionLabel icon={<CheckCircle2 size={17} />} title="오늘은 이것만" />
        <div className="mt-5 grid gap-3">
          <MissionLine index="1" title="해볼 것" value={report.today.advice} active />
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
    ['home', '홈', Home],
    ['flow', '흐름', LineChart],
    ['me', '분석', CircleUserRound],
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

function MetricPill({ metric }: { metric: FortuneMetric }) {
  return (
    <div className="rounded-[20px] bg-white p-4 text-center shadow-sm">
      <span className="block text-xs font-black text-slate-500">{metric.label}</span>
      <strong className="mt-1 block text-2xl font-black text-[#2563eb]">{metric.value}</strong>
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
  const dayMaster = report.core.dayMaster.label.split(' ')[0];
  const metric = topMetric(report.today.metrics);
  return `${dayMaster} 타입, 오늘은 ${metric.label} 운이 먼저 움직여요`;
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
