import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  CircleUserRound,
  Compass,
  Edit3,
  Home,
  LineChart,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { FormEvent, useState } from 'react';
import { defaultProfile } from './data/sampleReport';
import { sajuEngine } from './engine/sajuEngine';
import { BirthTimeMode, FiveElement, FlowType, FortuneMetric, FortuneReport, UserProfile, YearFortune } from './types/saju';

type Step = 'form' | 'analyzing' | 'app';
type Tab = 'home' | 'flow' | 'me';

const analysisMessages = [
  '태어난 날의 기준점을 맞추고 있어요.',
  '오행 균형과 오늘의 흐름을 정리하고 있어요.',
  '올해부터의 변화 포인트를 고르고 있어요.',
];

export default function App() {
  const [step, setStep] = useState<Step>('form');
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [report, setReport] = useState<FortuneReport | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [selectedYear, setSelectedYear] = useState<YearFortune | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);

  const activeYear = selectedYear ?? pickCurrentYear(report) ?? null;

  async function submitProfile(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setStep('analyzing');
    setMessageIndex(0);

    const ticker = window.setInterval(() => {
      setMessageIndex((value) => (value + 1) % analysisMessages.length);
    }, 720);

    const result = await sajuEngine.calculate(profile);
    window.clearInterval(ticker);
    setReport(result);
    setSelectedYear(pickCurrentYear(result) ?? result.lifeFlow[0]);
    setTab('home');
    setStep('app');
  }

  return (
    <div className="min-h-screen bg-[#f3f4f1] text-ink">
      <div className="mx-auto min-h-screen w-full max-w-md bg-[#f7f7f3] md:my-6 md:min-h-[880px] md:overflow-hidden md:rounded-[28px] md:shadow-soft">
        {step === 'form' && (
          <ProfileForm
            profile={profile}
            setProfile={setProfile}
            onSubmit={submitProfile}
            onBack={report ? () => setStep('app') : undefined}
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

function ProfileForm({
  profile,
  setProfile,
  onSubmit,
  onBack,
}: {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  onSubmit: (event?: FormEvent<HTMLFormElement>) => void;
  onBack?: () => void;
}) {
  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setProfile({ ...profile, [key]: value });
  };

  return (
    <main className="min-h-screen px-6 pb-8 pt-5 md:min-h-[880px]">
      <header className="mb-8 flex items-center justify-between">
        {onBack ? (
          <button className="icon-btn" onClick={onBack} aria-label="이전">
            <ChevronLeft size={20} />
          </button>
        ) : (
          <span className="h-10 w-10" />
        )}
        <span className="text-sm font-black text-forest">운의 흐름</span>
        <span className="h-10 w-10" />
      </header>

      <section className="animate-enter">
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-leaf shadow-sm">
          <Sparkles size={14} />
          1분이면 볼 수 있어요
        </span>
        <h1 className="mt-5 text-[34px] font-black leading-tight tracking-[-0.01em]">
          생년월일만 넣으면
          <br />
          오늘 볼 운세가 나와요
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          어렵게 풀이하지 않고, 오늘의 선택과 앞으로의 변화만 먼저 보여드릴게요.
        </p>
      </section>

      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        <label className="field">
          <span>이름 또는 닉네임</span>
          <input value={profile.name} onChange={(event) => update('name', event.target.value)} placeholder="김OO" />
        </label>

        <Segmented
          label="성별"
          value={profile.gender}
          options={[
            ['female', '여성'],
            ['male', '남성'],
            ['none', '선택 안 함'],
          ]}
          onChange={(value) => update('gender', value as UserProfile['gender'])}
        />

        <Segmented
          label="달력"
          value={profile.calendarType}
          options={[
            ['solar', '양력'],
            ['lunar', '음력'],
          ]}
          onChange={(value) => update('calendarType', value as UserProfile['calendarType'])}
        />

        {profile.calendarType === 'lunar' && (
          <Notice>현재 MVP는 음력 변환표가 아직 연결되지 않아, 정확한 비교는 양력 입력을 권장해요.</Notice>
        )}

        <label className="field">
          <span>생년월일</span>
          <input type="date" value={profile.birthDate} onChange={(event) => update('birthDate', event.target.value)} />
        </label>

        <Segmented
          label="출생시간"
          value={profile.birthTimeMode}
          options={[
            ['exact', '정확한 시간'],
            ['approximate', '대략'],
            ['unknown', '모름'],
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

        {profile.birthTimeMode === 'unknown' && (
          <Notice>출생시간이 없어도 큰 흐름은 볼 수 있어요. 시주가 필요한 세부 해석은 달라질 수 있습니다.</Notice>
        )}

        <button className="primary-btn sticky bottom-5 w-full" type="button" onClick={() => onSubmit()}>
          내 운세 보기
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
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef4ee] text-forest">
            <BarChart3 size={22} />
          </div>
          <div>
            <p className="text-xs font-black text-leaf">분석 중</p>
            <h1 className="text-xl font-black">결과를 정리하고 있어요</h1>
          </div>
        </div>
        <div className="mt-8 space-y-3">
          <span className="analysis-line block h-3 w-4/5 rounded-full bg-forest" />
          <span className="analysis-line analysis-line-delay block h-3 w-full rounded-full bg-leaf/45" />
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
  const mainMetric = topMetric(report.today.metrics);
  const needed = report.interpretation.supportiveElements[0];
  const nextChange = report.lifeFlow.find((year) => year.year > activeYear.year && isChangeType(year.type));
  const dayMaster = report.core.dayMaster.label;

  return (
    <section className="space-y-5 animate-enter">
      <TopBar title="오늘의 운세" subtitle={formatToday()} onEdit={onEdit} />

      <section className="rounded-[28px] bg-forest p-6 text-white shadow-[0_18px_40px_rgba(24,63,54,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-white/60">{report.user.name || '나'}님의 오늘</p>
            <h1 className="mt-3 text-[42px] font-black leading-none">{mainMetric.value}</h1>
            <p className="mt-2 text-sm font-bold text-white/60">오늘의 체감 점수</p>
          </div>
          <span className="rounded-full bg-white/12 px-3 py-2 text-xs font-black">{mainMetric.label}</span>
        </div>
        <p className="mt-6 text-[22px] font-black leading-snug">{report.today.summary}</p>
        <button className="mt-6 flex w-full items-center justify-between rounded-2xl bg-white px-4 py-4 text-left text-forest" onClick={() => onPickTab('flow')}>
          <span>
            <span className="block text-xs font-black text-leaf">올해 흐름</span>
            <strong className="mt-1 block text-base">
              {activeYear.year}년 · {shortFlow(activeYear.type)}
            </strong>
          </span>
          <ArrowRight size={18} />
        </button>
      </section>

      <section className="grid grid-cols-3 gap-2">
        {report.today.metrics.slice(1, 4).map((metric) => (
          <MetricMini key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="rounded-[24px] bg-white p-5 shadow-sm">
        <SectionLabel icon={<Compass size={17} />} title="오늘 할 일" />
        <p className="mt-4 text-xl font-black leading-snug">{report.today.advice}</p>
        <div className="mt-5 grid gap-2">
          <CompactLine label="집중" value={report.today.focus} />
          <CompactLine label="피하기" value={report.today.avoid} />
          <CompactLine label="관계" value={relationshipCue(report)} />
        </div>
      </section>

      <section className="grid gap-3">
        <QuestionCard
          label="나는 어떤 사주야?"
          title={`${dayMaster}의 성향`}
          body={userFriendlyPersonality(report)}
          onClick={() => onPickTab('me')}
        />
        {needed && (
          <QuestionCard
            label="나에게 필요한 기운"
            title={`${needed.label} ${needed.hanja}`}
            body={needed.need}
            onClick={() => onPickTab('me')}
          />
        )}
        <QuestionCard
          label="다가오는 변화"
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
      <TopBar title="인생 흐름" subtitle="올해부터 보기" />

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-leaf">선택한 해</p>
            <h1 className="mt-2 text-[38px] font-black leading-none">{selectedYear.year}</h1>
            <p className="mt-3 text-xl font-black text-forest">{flowLabel(selectedYear.type)}</p>
          </div>
          <ScoreRing value={selectedYear.score} />
        </div>
        <p className="mt-5 text-base leading-7 text-slate-600">{selectedYear.summary}</p>
      </section>

      <section>
        <SectionLabel icon={<CalendarDays size={17} />} title="연도별 변화" />
        <div className="mt-3 space-y-2">
          {visibleYears.slice(0, 8).map((year) => (
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
    <section className="rounded-[24px] bg-white p-5 shadow-sm">
      <SectionLabel icon={<Sparkles size={17} />} title={`${year.year}년에 궁금한 것`} />
      <div className="mt-4 flex flex-wrap gap-2">
        {year.keywords.slice(0, 3).map((keyword) => (
          <span key={keyword} className="rounded-full bg-[#edf4ee] px-3 py-2 text-xs font-black text-forest">
            {keyword}
          </span>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        {year.metrics.slice(1, 5).map((metric) => (
          <MetricMini key={metric.label} metric={metric} />
        ))}
      </div>
      <div className="mt-5 grid gap-4">
        <ActionList title="이 해에 해보면 좋은 것" items={year.goodActions} tone="good" />
        <ActionList title="조심하면 좋은 것" items={year.cautions} tone="caution" />
      </div>
    </section>
  );
}

function MeScreen({ report, onEdit }: { report: FortuneReport; onEdit: () => void }) {
  const [showExpert, setShowExpert] = useState(false);
  const needed = report.interpretation.supportiveElements[0];
  const careful = report.interpretation.challengingElements[0];

  return (
    <section className="space-y-5 animate-enter">
      <TopBar title="사주 분석" subtitle="나의 기본값" onEdit={onEdit} />

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-leaf">나의 사주</p>
            <h1 className="mt-2 text-[38px] font-black leading-tight">{report.core.dayMaster.label}</h1>
            <p className="mt-3 text-base leading-7 text-slate-600">{userFriendlyPersonality(report)}</p>
          </div>
          <button className="icon-btn shrink-0" onClick={onEdit} aria-label="출생정보 수정">
            <Edit3 size={18} />
          </button>
        </div>
      </section>

      <section className="rounded-[24px] bg-white p-5 shadow-sm">
        <SectionLabel icon={<BarChart3 size={17} />} title="오행 분포" />
        <div className="mt-5 space-y-4">
          {report.core.elements.map((element) => (
            <ElementBar key={element.key} element={element} />
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        {needed && (
          <ElementAdviceCard
            title="가까이 두면 좋은 기운"
            badge={`${needed.label} ${needed.hanja}`}
            body={needed.reason}
            items={needed.actions}
          />
        )}
        {careful && (
          <ElementAdviceCard
            title="속도를 조절하면 좋은 기운"
            badge={`${careful.label} ${careful.hanja}`}
            body={careful.cautionReason ?? careful.reason}
            items={careful.caution ? [careful.caution] : []}
            quiet
          />
        )}
      </section>

      <section className="rounded-[24px] bg-white p-5 shadow-sm">
        <SectionLabel icon={<UserRound size={17} />} title="내 성향 요약" />
        <div className="mt-4 grid gap-4">
          <PlainInsight title="강점" text={report.interpretation.strength} />
          <PlainInsight title="주의할 점" text={report.interpretation.caution} />
          <PlainInsight title="추천 행동" text={report.interpretation.recommendedAction} />
        </div>
      </section>

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
        <p className="text-xs font-black text-leaf">사주팔자</p>
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
        <p className="text-xs font-black text-leaf">{subtitle}</p>
        <h1 className="mt-1 text-[30px] font-black leading-tight">{title}</h1>
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
              value === key ? 'bg-forest text-white shadow-sm' : 'text-slate-500'
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
    <nav className="fixed bottom-5 left-1/2 z-20 grid w-[calc(100%-44px)] max-w-sm -translate-x-1/2 grid-cols-3 rounded-[24px] bg-white/95 p-2 shadow-[0_14px_44px_rgba(23,32,51,0.16)] backdrop-blur md:bottom-10">
      {items.map(([key, label, Icon]) => (
        <button
          key={key}
          className={`flex min-h-12 items-center justify-center gap-2 rounded-[18px] text-sm font-black transition active:scale-[0.98] ${
            tab === key ? 'bg-forest text-white' : 'text-slate-400'
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
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#edf4ee] text-forest">{icon}</span>
      <h2 className="text-xl font-black">{title}</h2>
    </div>
  );
}

function MetricMini({ metric }: { metric: FortuneMetric }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <span className="block text-xs font-black text-slate-500">{metric.label}</span>
      <strong className="mt-2 block text-2xl font-black text-forest">{metric.value}</strong>
    </div>
  );
}

function CompactLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-[#f3f4f1] px-4 py-3">
      <span className="shrink-0 text-sm font-black text-slate-500">{label}</span>
      <strong className="text-right text-sm leading-6">{value}</strong>
    </div>
  );
}

function QuestionCard({ label, title, body, onClick }: { label: string; title: string; body: string; onClick: () => void }) {
  return (
    <button className="flex w-full items-center justify-between gap-4 rounded-[24px] bg-white p-5 text-left shadow-sm active:scale-[0.99]" onClick={onClick}>
      <span>
        <span className="block text-xs font-black text-leaf">{label}</span>
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
        active ? 'bg-forest text-white' : 'bg-white'
      }`}
      onClick={onClick}
    >
      <strong className={`text-xl font-black ${active ? 'text-white' : 'text-forest'}`}>{year.year}</strong>
      <span>
        <span className="block text-base font-black">{year.title}</span>
        <span className={`mt-1 block text-xs font-bold ${active ? 'text-white/55' : 'text-slate-500'}`}>
          {year.keywords.slice(0, 3).join(' · ')}
        </span>
      </span>
      <span className={`rounded-full px-3 py-2 text-[11px] font-black ${active ? 'bg-white/15 text-white' : 'bg-[#edf4ee] text-forest'}`}>
        {shortFlow(year.type)}
      </span>
    </button>
  );
}

function ScoreRing({ value }: { value: number }) {
  return (
    <div
      className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[#edf4ee]"
      style={{ background: `conic-gradient(#183f36 ${value * 3.6}deg, #edf4ee 0deg)` }}
    >
      <div className="grid h-14 w-14 place-items-center rounded-full bg-white">
        <strong className="text-lg font-black text-forest">{value}</strong>
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
  quiet = false,
}: {
  title: string;
  badge: string;
  body: string;
  items: string[];
  quiet?: boolean;
}) {
  return (
    <section className={`rounded-[24px] p-5 shadow-sm ${quiet ? 'bg-[#f4f1ea]' : 'bg-white'}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black">{title}</h2>
        <span className="rounded-full bg-[#edf4ee] px-3 py-2 text-xs font-black text-forest">{badge}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
      {items.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.slice(0, 3).map((item) => (
            <span key={item} className="rounded-full bg-white/70 px-3 py-2 text-xs font-bold text-slate-600">
              {item}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function PlainInsight({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="text-sm font-black text-leaf">{title}</p>
      <p className="mt-2 text-base leading-7 text-slate-700">{text}</p>
    </div>
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
  return metrics.reduce((best, metric) => (metric.value > best.value ? metric : best), metrics[0]);
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
