import { ArrowRight, ChevronLeft, Home, LineChart, Sparkles, UserRound } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { defaultProfile } from './data/sampleReport';
import { sajuEngine } from './engine/sajuEngine';
import { BirthTimeMode, FiveElement, FlowType, FortuneReport, UserProfile, YearFortune } from './types/saju';

type Step = 'form' | 'analyzing' | 'app';
type Tab = 'home' | 'flow' | 'me';

const analysisMessages = [
  '태어난 날의 기운을 살펴보고 있어요.',
  '절기 기준으로 흐름의 기준점을 맞추고 있어요.',
  '오늘과 앞으로의 변화를 정리하고 있어요.',
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
    }, 760);

    const result = await sajuEngine.calculate(profile);
    window.clearInterval(ticker);
    setReport(result);
    setSelectedYear(pickCurrentYear(result) ?? result.lifeFlow[0]);
    setTab('home');
    setStep('app');
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto min-h-screen w-full max-w-md bg-[#f7f5ef] md:my-6 md:min-h-[880px] md:overflow-hidden md:rounded-[24px] md:shadow-soft">
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
    <main className="min-h-screen px-6 pb-8 pt-6 md:min-h-[880px]">
      <header className="mb-10 flex items-center justify-between">
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
        <p className="text-sm font-black text-leaf">Personal Insight</p>
        <h1 className="mt-3 text-[36px] font-black leading-tight">태어난 순간을 알려주세요</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          사주표보다 먼저, 지금의 흐름과 오늘 해볼 일을 쉽게 정리해드릴게요.
        </p>
      </section>

      <form className="mt-9 space-y-5" onSubmit={onSubmit}>
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
          <Notice tone="caution">
            현재 MVP는 음력-양력 변환표가 아직 연결되지 않았어요. 정확한 음력 계산 전까지는 양력 입력을 권장합니다.
          </Notice>
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
            ['approximate', '대략적인 시간'],
            ['unknown', '시간 모름'],
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

        <button className="primary-btn w-full" type="button" onClick={() => onSubmit()}>
          내 흐름 보기
          <Sparkles size={18} />
        </button>
      </form>
    </main>
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
      <div className={`rounded-lg bg-white/80 p-1 shadow-sm ${wrap ? 'grid grid-cols-3 gap-1' : 'flex'}`}>
        {options.map(([key, text]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`min-h-11 flex-1 rounded-md px-3 text-sm font-bold transition active:scale-[0.98] ${
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

function Analyzing({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-8 text-center md:min-h-[880px]">
      <div className="mb-10 grid h-40 w-40 place-items-center rounded-lg bg-white/70 p-5 shadow-sm">
        <div className="w-full space-y-3">
          <span className="block h-2 w-3/4 rounded-full bg-forest analysis-line" />
          <span className="block h-2 w-full rounded-full bg-leaf/60 analysis-line analysis-line-delay" />
          <span className="block h-2 w-1/2 rounded-full bg-warm analysis-line" />
        </div>
      </div>
      <p className="text-sm font-black text-leaf">운의 흐름</p>
      <h1 className="mt-3 text-2xl font-black">분석 중이에요</h1>
      <p className="mt-4 min-h-14 text-base leading-7 text-slate-600">{message}</p>
    </main>
  );
}

function Shell({ tab, setTab, children }: { tab: Tab; setTab: (tab: Tab) => void; children: React.ReactNode }) {
  return (
    <main className="min-h-screen pb-28 pt-6 md:min-h-[880px]">
      <div className="px-6">{children}</div>
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
  const todayDate = formatToday();
  const nextYear = report.lifeFlow.find((year) => year.year > activeYear.year && isChangeType(year.type));
  const personality = userFriendlyPersonality(report);
  const neededElement = report.interpretation.supportiveElements[0];

  return (
    <section className="space-y-7 animate-enter">
      <section className="pt-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-500">{todayDate}</p>
          <button className="rounded-lg bg-white/70 px-3 py-2 text-xs font-black text-forest" onClick={onEdit}>
            정보 수정
          </button>
        </div>
        <p className="mt-6 text-sm font-black text-leaf">오늘의 운세</p>
        <h1 className="mt-2 text-[36px] font-black leading-tight">오늘은 이렇게</h1>
        <p className="mt-4 text-xl font-black leading-snug text-forest">{makeTodayHeadline(report)}</p>
      </section>

      <section className="rounded-lg bg-white/85 p-5 shadow-sm">
        <PriorityItem label="오늘 할 것" value={report.today.advice} strong />
        <PriorityItem label="집중" value={report.today.focus} />
        <PriorityItem label="피하기" value={report.today.avoid} />
        <PriorityItem label="관계" value={relationshipCue(report)} last />
      </section>

      <section>
        <div className="flex items-end justify-between">
          <SectionHeading title="다가오는 변화" />
          <button className="text-sm font-black text-forest" onClick={() => onPickTab('flow')}>
            흐름 보기 →
          </button>
        </div>
        <button className="mt-4 w-full rounded-lg bg-[#eef4ee] p-4 text-left" onClick={() => onPickTab('flow')}>
          <YearPosition years={report.lifeFlow} currentYear={activeYear} />
          <p className="mt-5 text-sm font-black text-slate-500">현재</p>
          <p className="mt-1 text-2xl font-black text-forest">
            {activeYear.year} · {flowLabel(activeYear.type)}
          </p>
          <p className="mt-3 text-sm font-bold text-slate-600">
            다음 포인트 {nextYear ? `${nextYear.year} · ${shortFlow(nextYear.type)}` : '아직 뚜렷한 변화 전환점 없음'}
          </p>
        </button>
      </section>

      <section>
        <div className="flex items-end justify-between">
          <SectionHeading title="나에게 필요한 것" />
          <button className="text-sm font-black text-forest" onClick={() => onPickTab('me')}>
            자세히 보기 →
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          {neededElement && (
            <div className="rounded-lg bg-white/80 p-4">
              <p className="text-sm font-black text-leaf">
                {neededElement.label} {neededElement.hanja}
              </p>
              <p className="mt-2 text-lg font-black leading-snug">{neededElement.need}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{neededElement.reason}</p>
            </div>
          )}
          <div className="border-l-2 border-forest pl-4">
            <p className="text-sm font-black text-leaf">나의 사주 · {report.core.dayMaster.label}</p>
            <p className="mt-2 text-base font-bold leading-6">{personality}</p>
          </div>
        </div>
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
  return (
    <section className="space-y-7 animate-enter">
      <header className="pt-2">
        <p className="text-sm font-black text-leaf">지금 흐름</p>
        <h1 className="mt-3 text-[36px] font-black leading-none">{selectedYear.year}년의 위치</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">올해의 흐름과 다음 변화 포인트를 먼저 확인하세요.</p>
      </header>

      <CurrentFlowPanel years={report.lifeFlow} selectedYear={selectedYear} onSelectYear={onSelectYear} />
      <YearList years={report.lifeFlow} selectedYear={selectedYear} onSelectYear={onSelectYear} />
      <YearDetail year={selectedYear} />
    </section>
  );
}

function CurrentFlowPanel({
  years,
  selectedYear,
  onSelectYear,
}: {
  years: YearFortune[];
  selectedYear: YearFortune;
  onSelectYear: (year: YearFortune) => void;
}) {
  const selectedIndex = Math.max(0, years.findIndex((year) => year.year === selectedYear.year));
  const prevYear = years[selectedIndex - 1];
  const nextYear = years[selectedIndex + 1];

  return (
    <section className="rounded-lg bg-forest p-5 text-white">
      <p className="text-xs font-black text-white/55">현재 위치</p>
      <p className="mt-3 text-[34px] font-black leading-none">{selectedYear.year}</p>
      <p className="mt-2 text-xl font-black">{flowLabel(selectedYear.type)}</p>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <button
          className="rounded-lg bg-white/10 p-3 text-left disabled:opacity-35"
          disabled={!prevYear}
          onClick={() => prevYear && onSelectYear(prevYear)}
        >
          <span className="block text-[11px] font-black text-white/50">이전</span>
          <strong className="mt-1 block text-sm">{prevYear ? prevYear.year : '-'}</strong>
        </button>
        <div className="rounded-lg bg-white/15 p-3 text-left">
          <span className="block text-[11px] font-black text-white/50">지금</span>
          <strong className="mt-1 block text-sm">{shortFlow(selectedYear.type)}</strong>
        </div>
        <button
          className="rounded-lg bg-white/10 p-3 text-left disabled:opacity-35"
          disabled={!nextYear}
          onClick={() => nextYear && onSelectYear(nextYear)}
        >
          <span className="block text-[11px] font-black text-white/50">다음</span>
          <strong className="mt-1 block text-sm">{nextYear ? nextYear.year : '-'}</strong>
        </button>
      </div>
    </section>
  );
}

function YearList({
  years,
  selectedYear,
  onSelectYear,
}: {
  years: YearFortune[];
  selectedYear: YearFortune;
  onSelectYear: (year: YearFortune) => void;
}) {
  return (
    <section>
      <SectionHeading title="연도별 흐름" />
      <div className="mt-4 divide-y divide-ink/10 rounded-lg bg-white/75">
        {years.slice(0, 7).map((year) => {
          const active = year.year === selectedYear.year;
          return (
            <button
              key={year.year}
              onClick={() => onSelectYear(year)}
              className="grid w-full grid-cols-[58px_1fr_auto] items-center gap-3 p-4 text-left transition active:scale-[0.99]"
            >
              <span className={`text-xl font-black ${active ? 'text-forest' : 'text-slate-400'}`}>{year.year}</span>
              <span>
                <strong className="block text-base">{year.title}</strong>
                <span className="mt-1 block text-xs font-bold text-slate-500">{year.keywords.slice(0, 3).join(' · ')}</span>
              </span>
              <span className={`rounded-md px-2 py-1 text-[11px] font-black ${active ? 'bg-forest text-white' : 'bg-mist text-slate-500'}`}>
                {shortFlow(year.type)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function YearDetail({ year }: { year: YearFortune }) {
  return (
    <section className="rounded-lg bg-white/85 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-leaf">{year.year}</p>
          <h2 className="mt-2 text-2xl font-black leading-tight">{year.title}</h2>
        </div>
        <span className="rounded-md bg-mist px-2 py-1 text-[11px] font-black text-forest">{shortFlow(year.type)}</span>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-600">{year.summary}</p>

      <div className="mt-6 grid grid-cols-2 gap-2">
        {year.metrics.slice(1, 5).map((metric) => (
          <StatusPill key={metric.label} label={metric.label} value={metricState(metric.value)} />
        ))}
      </div>

      <div className="mt-7 grid gap-5">
        <ActionList title="이 시기에 좋은 선택" items={year.goodActions} tone="good" />
        <ActionList title="조심할 것" items={year.cautions} tone="caution" />
      </div>
    </section>
  );
}

function MeScreen({ report, onEdit }: { report: FortuneReport; onEdit: () => void }) {
  const [showExpert, setShowExpert] = useState(false);
  const personality = userFriendlyPersonality(report);

  return (
    <section className="space-y-8 animate-enter">
      <header className="pt-2">
        <p className="text-sm font-black text-leaf">나</p>
        <h1 className="mt-3 text-[38px] font-black leading-none">{report.core.dayMaster.label}</h1>
        <p className="mt-4 text-2xl font-black leading-snug text-forest">{personality}</p>
      </header>

      <section className="grid gap-4">
        <ProfileLine label="생년월일" value={`${report.user.birthDate} · ${report.user.calendarType === 'solar' ? '양력' : '음력'}`} />
        <ProfileLine label="출생시간" value={birthTimeLabel(report.user)} />
        <button className="secondary-btn w-full" onClick={onEdit}>
          출생정보 수정하기
        </button>
      </section>

      <section>
        <SectionHeading title="나의 성향" />
        <div className="mt-4 space-y-4">
          <PlainInsight title="성향" text={report.interpretation.personality} />
          <PlainInsight title="강점" text={report.interpretation.strength} />
          <PlainInsight title="관계 스타일" text={report.interpretation.matchedPeople.slice(0, 2).join(' · ')} />
          <PlainInsight title="필요한 환경" text={report.interpretation.needs.slice(0, 2).join(' · ')} />
        </div>
      </section>

      <section>
        <button className="flex w-full items-center justify-between rounded-lg bg-white/85 p-4 text-left" onClick={() => setShowExpert(!showExpert)}>
          <span>
            <strong className="block text-lg">사주 원국 자세히 보기</strong>
            <span className="mt-1 block text-xs font-bold text-slate-500">천간·지지·오행·계산 기준</span>
          </span>
          <ArrowRight className={`transition ${showExpert ? 'rotate-90' : ''}`} size={20} />
        </button>
        {showExpert && <ExpertSection report={report} />}
      </section>
    </section>
  );
}

function ExpertSection({ report }: { report: FortuneReport }) {
  return (
    <div className="mt-4 space-y-4 animate-expand">
      <section className="rounded-lg bg-white/85 p-5">
        <p className="text-xs font-black text-leaf">원국</p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {Object.entries(report.core.pillars).map(([key, value]) => (
            <div key={key} className="rounded-lg bg-mist p-3 text-center">
              <span className="text-[11px] font-bold text-slate-500">{pillarLabel(key)}</span>
              <strong className="mt-2 block text-sm">{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg bg-white/85 p-5">
        <p className="text-xs font-black text-leaf">오행</p>
        <div className="mt-5 space-y-3">
          {report.core.elements.map((element) => (
            <ElementBar key={element.key} element={element} />
          ))}
        </div>
      </section>

      <section className="rounded-lg bg-[#fff8ed] p-5">
        <p className="text-xs font-black text-leaf">계산 기준</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{report.calculation.description}</p>
        {report.user.calendarType === 'lunar' && (
          <p className="mt-3 text-xs leading-5 text-amber-800">
            음력 변환은 아직 로컬 변환표가 연결되지 않아 추가 검증이 필요합니다.
          </p>
        )}
        <p className="mt-3 text-xs leading-5 text-slate-500">
          연도별 흐름과 월간 달력은 현재 원국과 세운을 확장할 수 있는 규칙 기반 MVP입니다. 실제 대운/세운 정밀 계산으로 교체 가능한 구조를 유지했습니다.
        </p>
      </section>
    </div>
  );
}

function YearPosition({ years, currentYear }: { years: YearFortune[]; currentYear: YearFortune }) {
  return (
    <div className="mt-5 flex items-center gap-1">
      {years.slice(0, 5).map((year) => {
        const active = year.year === currentYear.year;
        return (
          <div key={year.year} className="flex flex-1 items-center gap-1">
            <span className={`h-2 flex-1 rounded-full ${active ? 'bg-forest' : 'bg-forest/15'}`} />
            <span className={`text-xs font-black ${active ? 'text-forest' : 'text-slate-400'}`}>{year.year}</span>
          </div>
        );
      })}
    </div>
  );
}

function BottomNav({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  const items = [
    ['home', '홈', Home],
    ['flow', '흐름', LineChart],
    ['me', '나', UserRound],
  ] as const;

  return (
    <nav className="fixed bottom-5 left-1/2 z-20 grid w-[calc(100%-48px)] max-w-sm -translate-x-1/2 grid-cols-3 rounded-lg bg-white/95 p-2 shadow-[0_14px_40px_rgba(23,32,51,0.14)] backdrop-blur md:bottom-10">
      {items.map(([key, label, Icon]) => (
        <button
          key={key}
          className={`flex min-h-12 items-center justify-center gap-2 rounded-md text-sm font-black transition active:scale-[0.98] ${
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

function SectionHeading({ title }: { title: string }) {
  return <h2 className="text-[22px] font-black leading-tight">{title}</h2>;
}

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[72px_1fr] items-center gap-4 border-b border-ink/10 pb-3 last:border-0">
      <span className="text-sm font-black text-slate-500">{label}</span>
      <strong className="text-base text-ink">{value}</strong>
    </div>
  );
}

function PriorityItem({ label, value, strong = false, last = false }: { label: string; value: string; strong?: boolean; last?: boolean }) {
  return (
    <div className={`grid grid-cols-[76px_1fr] gap-4 py-3 ${last ? '' : 'border-b border-ink/10'} ${strong ? 'pt-0' : ''}`}>
      <span className="text-sm font-black text-slate-500">{label}</span>
      <strong className={`${strong ? 'text-xl leading-snug text-forest' : 'text-base leading-6 text-ink'}`}>{value}</strong>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-mist p-3">
      <span className="block text-xs font-black text-slate-500">{label}</span>
      <strong className="mt-1 block text-sm text-forest">{value}</strong>
    </div>
  );
}

function ProfileLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-ink/10 pb-3 text-sm">
      <span className="font-bold text-slate-500">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PlainInsight({ title, text }: { title: string; text: string }) {
  return (
    <div className="border-l-2 border-forest/30 pl-4">
      <p className="text-sm font-black text-leaf">{title}</p>
      <p className="mt-2 text-base leading-7 text-slate-700">{text}</p>
    </div>
  );
}

function ElementBar({ element }: { element: FiveElement }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-black">
          {element.label} {element.hanja}
        </span>
        <span className="text-xs font-bold text-slate-500">{element.meaning}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-mist">
        <div className="h-full rounded-full" style={{ width: `${element.value}%`, backgroundColor: element.color }} />
      </div>
    </div>
  );
}

function ActionList({ title, items, tone }: { title: string; items: string[]; tone: 'good' | 'caution' }) {
  return (
    <div>
      <h3 className="text-sm font-black">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex gap-3 rounded-lg bg-mist p-3 text-sm leading-6 text-slate-700">
            <span className={`mt-2 h-2 w-2 flex-none rounded-full ${tone === 'good' ? 'bg-leaf' : 'bg-warm'}`} />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function Notice({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'caution' }) {
  return (
    <div className={`rounded-lg p-4 text-sm leading-6 ${tone === 'caution' ? 'bg-[#fff4e4] text-amber-900' : 'bg-white/80 text-slate-600'}`}>
      {children}
    </div>
  );
}

function formatToday() {
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());
}

function pickCurrentYear(report: FortuneReport | null) {
  if (!report) return null;
  const year = new Date().getFullYear();
  return report.lifeFlow.find((item) => item.year === year) ?? report.lifeFlow[0] ?? null;
}

function makeTodayHeadline(report: FortuneReport) {
  return `${report.today.focus}에 힘이 실리는 날이에요.`;
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

function metricState(value: number) {
  if (value >= 82) return '좋은 흐름 ↑';
  if (value >= 70) return '안정적';
  if (value >= 60) return '천천히';
  return '점검 필요';
}

function pillarLabel(key: string) {
  return { year: '년주', month: '월주', day: '일주', hour: '시주' }[key] ?? key;
}

function birthTimeLabel(profile: UserProfile) {
  if (profile.birthTimeMode === 'unknown') return '시간 모름';
  if (profile.birthTimeMode === 'exact') return profile.exactTime || '정확한 시간';
  return profile.approximateTime || '대략적인 시간';
}
