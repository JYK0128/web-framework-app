import { createFileRoute, Link } from '@tanstack/react-router';
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, ChevronDown, ChevronUp, Copy, Cpu, ExternalLink, KeyRound, LoaderCircle, MessageCircle, Play, ShieldCheck, Square, Trash2, UserRound, XCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { Critique, MainLlmConfig, Provider, ResearchResult, WorkerEvent } from '#/features/research/types';

export const Route = createFileRoute('/_protected/research/')({
  component: ResearchPage,
});

const SESSION_CONFIG_KEY = 'gatehouse.research.llm-config';
const DEFAULT_GEMMA_MODEL = 'onnx-community/gemma-4-E2B-it-ONNX';

const providerDefaults: Record<Provider, Pick<MainLlmConfig, 'model' | 'baseUrl'>> = {
  'openai-compatible': {
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
  },
  'anthropic': {
    model: 'claude-3-5-haiku-latest',
    baseUrl: 'https://api.anthropic.com/v1',
  },
  'gemini': {
    model: 'gemini-3.5-flash-lite',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  },
};

function ResearchPage() {
  const { user } = Route.useRouteContext();
  const workerRef = useRef<Worker | null>(null);
  const [storedConfig] = useState<Partial<MainLlmConfig> | null>(() => readStoredConfig());
  const [question, setQuestion] = useState('');
  const [provider, setProvider] = useState<Provider>(storedConfig?.provider ?? 'gemini');
  const [apiKey, setApiKey] = useState(storedConfig?.apiKey ?? '');
  const [model, setModel] = useState(storedConfig?.model ?? providerDefaults.gemini.model);
  const [baseUrl, setBaseUrl] = useState(storedConfig?.baseUrl ?? providerDefaults.gemini.baseUrl);
  const [gemmaModelId, setGemmaModelId] = useState<string>(DEFAULT_GEMMA_MODEL);
  const [maxRounds, setMaxRounds] = useState(2);
  const [progress, setProgress] = useState<ProgressState>({
    phase: 'idle',
    message: '질문을 입력하면 브라우저에서 두 모델의 검증 루프가 시작됩니다.',
    percent: 0,
  });
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);

  const capabilities = useMemo(() => detectCapabilities(), []);

  useEffect(() => () => {
    workerRef.current?.terminate();
  }, []);

  function handleProviderChange(nextProvider: Provider): void {
    setProvider(nextProvider);
    setModel(providerDefaults[nextProvider].model);
    setBaseUrl(providerDefaults[nextProvider].baseUrl);
  }

  function clearStoredKey(): void {
    sessionStorage.removeItem(SESSION_CONFIG_KEY);
    setApiKey('');
  }

  function stopRun(): void {
    workerRef.current?.postMessage({ type: 'stop' });
    workerRef.current?.terminate();
    workerRef.current = null;
    setIsRunning(false);
    setProgress({ phase: 'idle', message: '실행을 중단했습니다.', percent: 0 });
  }

  function startRun(): void {
    if (isRunning) return;
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError('질문을 입력해 주세요.');
      return;
    }
    if (!apiKey.trim()) {
      setError('사용할 메인 LLM의 API 키를 입력해 주세요.');
      setShowSettings(true);
      return;
    }
    if (!capabilities.secureContext) {
      setError('로컬 Gemma는 HTTPS 또는 localhost 환경에서만 실행할 수 있습니다.');
      return;
    }
    if (!capabilities.webGpu) {
      setError('현재 브라우저에서 WebGPU를 사용할 수 없습니다. 최신 Chrome 또는 Edge를 사용해 주세요.');
      return;
    }

    const config: MainLlmConfig = {
      provider,
      apiKey,
      model: model.trim(),
      baseUrl: baseUrl.trim().replace(/\/$/, ''),
    };
    sessionStorage.setItem(SESSION_CONFIG_KEY, JSON.stringify(config));
    setError(null);
    setResult(null);
    setProgress({ phase: 'starting', message: '브라우저 전용 검증 루프를 시작합니다.', percent: 5 });
    setIsRunning(true);

    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../../../features/research/research.worker.ts', import.meta.url),
        { type: 'module' },
      );
    }

    const worker = workerRef.current;

    worker.onmessage = (event: MessageEvent<WorkerEvent>) => {
      const message = event.data;
      if (message.type === 'progress') {
        setProgress({ phase: message.phase, message: message.message, percent: message.percent });
        return;
      }
      if (message.type === 'error') {
        setError(message.message);
        setIsRunning(false);
        return;
      }
      setResult(message.result);
      setIsRunning(false);
      setProgress({ phase: 'complete', message: '검증 루프가 완료되었습니다.', percent: 100 });
    };

    worker.onerror = () => {
      setError('브라우저 로컬 모델 워커를 시작하지 못했습니다. 모델 ID와 WebGPU 지원 여부를 확인해 주세요.');
      setIsRunning(false);
    };

    worker.postMessage({
      type: 'start',
      question: trimmedQuestion,
      config,
      gemmaModelId: gemmaModelId.trim(),
      maxRevisionRounds: maxRounds,
    });
  }

  return (
    <div className="
      min-h-full overflow-y-auto bg-[#f7f8fa]
      dark:bg-zinc-950
    "
    >
      <div className="
        mx-auto grid min-h-full max-w-7xl gap-6 px-4 py-6
        sm:px-6
        lg:grid-cols-[310px_1fr] lg:p-8
      "
      >
        <aside className="
          h-fit rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm
          dark:border-zinc-800 dark:bg-zinc-900
        "
        >
          <Link
            to="/profile"
            className="
              mb-4 inline-flex items-center gap-1.5 text-xs font-bold
              text-zinc-500 transition
              hover:text-zinc-900
              dark:text-zinc-400
              dark:hover:text-zinc-100
            "
          >
            <ArrowLeft className="size-3.5" />
            <span>프로필로 돌아가기</span>
          </Link>

          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="
                flex items-center gap-2 text-xs font-bold uppercase
                tracking-[0.18em] text-violet-600
                dark:text-violet-400
              "
              >
                <Cpu className="size-4" />
                Browser Lab
              </div>
              <h1 className="mt-2 text-xl font-black tracking-tight">Dual LLM Research</h1>
              <p className="
                mt-1 text-sm text-zinc-500
                dark:text-zinc-400
              "
              >
                메인 LLM을 Gemma가 로컬에서 검증합니다.
              </p>
            </div>
            <div className="
              flex size-9 items-center justify-center rounded-xl bg-violet-100
              text-violet-700
              dark:bg-violet-950/60 dark:text-violet-300
            "
            >
              <ShieldCheck className="size-5" />
            </div>
          </div>

          <div className="
            mt-5 flex items-center gap-2 rounded-2xl border border-zinc-200
            bg-zinc-50 px-3 py-2 text-xs
            dark:border-zinc-800 dark:bg-zinc-950
          "
          >
            <UserRound className="size-4 text-zinc-400" />
            <span className="
              truncate text-zinc-600
              dark:text-zinc-300
            "
            >
              {user.name}
            </span>
            <span className="
              ml-auto rounded-full bg-emerald-100 px-2 py-0.5 font-bold
              text-emerald-700
              dark:bg-emerald-950/60 dark:text-emerald-300
            "
            >
              보호됨
            </span>
          </div>

          <button
            type="button"
            className="
              mt-6 flex w-full items-center justify-between text-sm font-bold
            "
            onClick={() => setShowSettings((value) => !value)}
          >
            <span>모델 연결 설정</span>
            {showSettings
              ? <ChevronUp className="size-4" />
              : (
                <ChevronDown className="size-4" />
              )}
          </button>

          {showSettings && (
            <div className="mt-4 grid gap-4">
              <label className="
                grid gap-1.5 text-xs font-bold text-zinc-600
                dark:text-zinc-300
              "
              >
                메인 LLM 제공자
                <select
                  value={provider}
                  onChange={(event) => handleProviderChange(event.target.value as Provider)}
                  className={inputClass}
                  disabled={isRunning}
                >
                  <option value="openai-compatible">OpenAI-compatible</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="gemini">Google Gemini</option>
                </select>
              </label>

              <label className="
                grid gap-1.5 text-xs font-bold text-zinc-600
                dark:text-zinc-300
              "
              >
                API 키
                <div className="relative">
                  <KeyRound className="
                    pointer-events-none absolute left-3 top-3 size-4
                    text-zinc-400
                  "
                  />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder="사용자 소유 API 키"
                    className={`
                      ${inputClass}
                      pl-9 pr-10
                    `}
                    autoComplete="off"
                    disabled={isRunning}
                  />
                  {apiKey && (
                    <button
                      type="button"
                      onClick={clearStoredKey}
                      className="
                        absolute right-2 top-2 rounded-lg p-1 text-zinc-400
                        hover:bg-zinc-200 hover:text-zinc-700
                        dark:hover:bg-zinc-800
                      "
                      title="브라우저 세션에서 삭제"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </label>

              <label className="
                grid gap-1.5 text-xs font-bold text-zinc-600
                dark:text-zinc-300
              "
              >
                모델명
                <input value={model} onChange={(event) => setModel(event.target.value)} className={inputClass} disabled={isRunning} />
              </label>

              <label className="
                grid gap-1.5 text-xs font-bold text-zinc-600
                dark:text-zinc-300
              "
              >
                Base URL
                <input
                  value={baseUrl}
                  onChange={(event) => setBaseUrl(event.target.value)}
                  className={`
                    ${inputClass}
                    select-text
                  `}
                  disabled={isRunning}
                />
              </label>

              <label className="
                grid gap-1.5 text-xs font-bold text-zinc-600
                dark:text-zinc-300
              "
              >
                로컬 Gemma 모델 ID
                <input
                  value={gemmaModelId}
                  onChange={(event) => setGemmaModelId(event.target.value)}
                  className={`
                    ${inputClass}
                    select-text
                  `}
                  disabled={isRunning}
                />
                <span className="font-normal leading-relaxed text-zinc-400">웹 서버 정적 폴더(/public/models/gemma-4)에 내장된 로컬 Gemma 4 모델을 사용합니다.</span>
              </label>

              <label className="
                grid gap-1.5 text-xs font-bold text-zinc-600
                dark:text-zinc-300
              "
              >
                최대 재작성 횟수
                <select value={maxRounds} onChange={(event) => setMaxRounds(Number(event.target.value))} className={inputClass} disabled={isRunning}>
                  <option value={0}>0회 — 비평만</option>
                  <option value={1}>1회</option>
                  <option value={2}>2회</option>
                </select>
              </label>
            </div>
          )}

          <div className={`
            mt-5 rounded-2xl border p-3 text-xs
            ${capabilities.webGpu && capabilities.secureContext
      ? `
        border-emerald-200 bg-emerald-50 text-emerald-800
        dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300
      `
      : `
        border-amber-200 bg-amber-50 text-amber-800
        dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300
      `}
          `}
          >
            <div className="flex items-center gap-2 font-bold">
              {capabilities.webGpu && capabilities.secureContext
                ? (
                  <Check className="size-4" />
                )
                : (
                  <AlertTriangle className="size-4" />
                )}
              로컬 실행 환경
            </div>
            <p className="mt-1 leading-relaxed">{capabilities.webGpu && capabilities.secureContext ? 'WebGPU와 보안 컨텍스트를 사용할 수 있습니다.' : capabilities.reason}</p>
          </div>

          <div className="
            mt-4 rounded-2xl bg-zinc-100 p-3 text-xs/relaxed text-zinc-500
            dark:bg-zinc-950 dark:text-zinc-400
          "
          >
            API 키는 이 브라우저 세션에만 보관하며 서버로 전송하지 않습니다. 제공자의 브라우저 CORS 정책에 따라 직접 호출이 차단될 수 있습니다.
          </div>
        </aside>

        <main className="min-w-0">
          <section className="
            rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm
            sm:p-7
            dark:border-zinc-800 dark:bg-zinc-900
          "
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="
                  text-sm font-bold text-violet-600
                  dark:text-violet-400
                "
                >
                  Local critique loop
                </p>
                <h2 className="
                  mt-1 text-2xl font-black tracking-tight
                  sm:text-3xl
                "
                >
                  검증하고 싶은 질문을 입력하세요.
                </h2>
                <p className="
                  mt-2 max-w-2xl text-sm/relaxed text-zinc-500
                  dark:text-zinc-400
                "
                >
                  메인 LLM의 답변과 근거는 브라우저 안의 Gemma에게 전달되고, 필요한 경우 같은 사용자 API 키로 재작성됩니다.
                </p>
              </div>
              <div className="
                rounded-2xl border border-violet-200 bg-violet-50 px-3 py-2
                text-xs font-bold text-violet-700
                dark:border-violet-900/60 dark:bg-violet-950/30
                dark:text-violet-300
              "
              >
                Web only · no server LLM key
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="예: 2026년 현재 브라우저에서 로컬 LLM을 운영할 때 가장 중요한 제약은 무엇인가요?"
                className="
                  min-h-36 w-full resize-y rounded-2xl border border-zinc-200
                  bg-zinc-50 px-4 py-3 text-sm/relaxed outline-none transition
                  focus:border-violet-400 focus:ring-4 focus:ring-violet-100
                  dark:border-zinc-700 dark:bg-zinc-950
                  dark:focus:ring-violet-950/40
                "
                disabled={isRunning}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-zinc-400">민감정보·비밀번호·개인 API 키 외의 비밀값은 질문에 넣지 마세요.</p>
                {isRunning
                  ? (
                    <button
                      type="button"
                      onClick={stopRun}
                      className="
                        inline-flex items-center gap-2 rounded-xl bg-zinc-900
                        px-4 py-2.5 text-sm font-bold text-white
                        hover:bg-zinc-700
                        dark:bg-zinc-100 dark:text-zinc-900
                      "
                    >
                      <Square className="size-4 fill-current" />
                      중단
                    </button>
                  )
                  : (
                    <button
                      type="button"
                      onClick={startRun}
                      className="
                        inline-flex items-center gap-2 rounded-xl bg-violet-600
                        px-4 py-2.5 text-sm font-bold text-white shadow-sm
                        hover:bg-violet-500
                      "
                    >
                      <Play className="size-4 fill-current" />
                      브라우저에서 실행
                    </button>
                  )}
              </div>
            </div>
          </section>

          <section className="
            mt-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm
            sm:p-7
            dark:border-zinc-800 dark:bg-zinc-900
          "
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {isRunning
                  ? (
                    <LoaderCircle className="
                      size-5 animate-spin text-violet-600
                    "
                    />
                  )
                  : (
                    <MessageCircle className="size-5 text-violet-600" />
                  )}
                <h3 className="font-black">실행 타임라인</h3>
              </div>
              <span className="text-xs font-bold text-zinc-400">
                {progress.percent}
                %
              </span>
            </div>
            <div className="
              mt-4 h-2 overflow-hidden rounded-full bg-zinc-100
              dark:bg-zinc-800
            "
            >
              <div
                className="
                  h-full rounded-full bg-violet-600 transition-all duration-500
                "
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <p className="
              mt-3 text-sm text-zinc-600
              dark:text-zinc-300
            "
            >
              {progress.message}
            </p>
            {error && (
              <div className="
                mt-4 flex items-start gap-2 rounded-2xl border border-red-200
                bg-red-50 p-3 text-sm/relaxed text-red-700
                dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300
              "
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </section>

          {result && <ResultPanel result={result} showTranscript={showTranscript} onToggleTranscript={() => setShowTranscript((value) => !value)} />}
        </main>
      </div>
    </div>
  );
}

function ResultPanel({ result, showTranscript, onToggleTranscript }: { result: ResearchResult, showTranscript: boolean, onToggleTranscript: () => void }) {
  const critique = result.finalCritique;
  const verdict = verdictMeta[critique.verdict];
  const [copied, setCopied] = useState(false);

  function handleCopyReport() {
    const claimsBlock = result.finalDraft.claims.length > 0
      ? ['\n## 추출된 주요 주장 및 검증', ...result.finalDraft.claims.map((c) => `- [${c.status}] ${c.text}`)].join('\n')
      : '';
    const sourcesBlock = result.finalDraft.sources.length > 0
      ? ['\n## 사용된 출처 근거', ...result.finalDraft.sources.map((s) => `- ${s.title} (${s.url})`)].join('\n')
      : '';

    const reportText = [
      `# 질문: ${result.question}`,
      `\n## 최종 답변 (판정: ${verdict.label})\n${result.finalDraft.answerMarkdown}`,
      claimsBlock,
      sourcesBlock,
      `\n## Gemma 검증 요약\n${critique.summary}`,
    ].filter(Boolean).join('\n');

    void navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="mt-6 grid gap-6">
      <article className="
        rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm
        sm:p-7
        dark:border-zinc-800 dark:bg-zinc-900
      "
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="
              text-xs font-bold uppercase tracking-[0.18em] text-zinc-400
            "
            >
              Final answer
            </p>
            <h3 className="mt-2 text-xl font-black">{result.question}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyReport}
              className="
                inline-flex items-center gap-1.5 rounded-xl border
                border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold
                text-zinc-700 transition
                hover:bg-zinc-100
                dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200
                dark:hover:bg-zinc-700
              "
            >
              {copied
                ? <Check className="size-3.5 text-emerald-600" />
                : (
                  <Copy className="size-3.5" />
                )}
              <span>{copied ? '복사됨' : '보고서 복사'}</span>
            </button>
            <span className={`
              rounded-full px-3 py-1.5 text-xs font-black
              ${verdict.className}
            `}
            >
              {verdict.label}
            </span>
          </div>
        </div>
        <div className="
          mt-6 whitespace-pre-wrap text-[15px]/8 text-zinc-800
          dark:text-zinc-200
        "
        >
          {result.finalDraft.answerMarkdown}
        </div>

        {(result.finalDraft.uncertainty.length > 0 || result.finalDraft.warnings.length > 0) && (
          <div className="mt-6 grid gap-2">
            {[...result.finalDraft.uncertainty, ...result.finalDraft.warnings].map((item) => (
              <div
                key={item}
                className="
                  flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2
                  text-xs/relaxed text-amber-800
                  dark:bg-amber-950/30 dark:text-amber-300
                "
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}
      </article>

      {result.finalDraft.claims.length > 0 && (
        <article className="
          rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm
          sm:p-7
          dark:border-zinc-800 dark:bg-zinc-900
        "
        >
          <div className="flex items-center justify-between">
            <h3 className="font-black">주장 및 근거 검증</h3>
            <span className="text-xs font-bold text-zinc-400">
              총
              {result.finalDraft.claims.length}
              개 주장 분석됨
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {result.finalDraft.claims.map((claim) => {
              const meta = claimStatusMeta[claim.status] ?? claimStatusMeta.unsupported;
              const StatusIcon = meta.icon;
              return (
                <div
                  key={claim.id}
                  className="
                    rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs
                    dark:border-zinc-800 dark:bg-zinc-950
                  "
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="
                      font-bold text-zinc-800 leading-relaxed
                      dark:text-zinc-200
                    "
                    >
                      {claim.text}
                    </p>
                    <span className={`
                      inline-flex shrink-0 items-center gap-1 rounded-full
                      px-2.5 py-1 font-bold
                      ${meta.className}
                    `}
                    >
                      <StatusIcon className="size-3" />
                      {meta.label}
                    </span>
                  </div>
                  {claim.sourceIds.length > 0 && (
                    <div className="
                      mt-2 flex flex-wrap gap-1.5 text-[11px] text-zinc-500
                    "
                    >
                      <span>연결된 출처:</span>
                      {claim.sourceIds.map((id) => (
                        <span
                          key={id}
                          className="
                            rounded-md bg-zinc-200/80 px-1.5 py-0.5 font-mono
                            dark:bg-zinc-800
                          "
                        >
                          {id}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </article>
      )}

      {result.finalDraft.sources.length > 0 && (
        <article className="
          rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm
          sm:p-7
          dark:border-zinc-800 dark:bg-zinc-900
        "
        >
          <h3 className="font-black">답변에 사용된 근거</h3>
          <div className="mt-4 grid gap-3">
            {result.finalDraft.sources.map((source) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="
                  group rounded-2xl border border-zinc-200 p-4 transition
                  hover:border-violet-300 hover:bg-violet-50/50
                  dark:border-zinc-800
                  dark:hover:border-violet-800 dark:hover:bg-violet-950/20
                "
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="
                      font-bold
                      group-hover:text-violet-700
                      dark:group-hover:text-violet-300
                    "
                    >
                      {source.title}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">{source.publisher ?? source.url}</p>
                  </div>
                  <ExternalLink className="size-4 shrink-0 text-zinc-400" />
                </div>
                <p className="
                  mt-2 text-sm/relaxed text-zinc-600
                  dark:text-zinc-400
                "
                >
                  {source.excerpt}
                </p>
              </a>
            ))}
          </div>
        </article>
      )}

      <article className="
        rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm
        sm:p-7
        dark:border-zinc-800 dark:bg-zinc-900
      "
      >
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 text-left"
          onClick={onToggleTranscript}
        >
          <div>
            <p className="
              text-xs font-bold uppercase tracking-[0.18em] text-zinc-400
            "
            >
              Discussion trace
            </p>
            <h3 className="mt-1 font-black">메인 LLM ↔ Gemma 검토 과정</h3>
          </div>
          {showTranscript
            ? <ChevronUp className="size-5" />
            : (
              <ChevronDown className="size-5" />
            )}
        </button>
        {showTranscript && (
          <div className="mt-5 grid gap-3">
            {result.steps.map((step, index) => (
              <div
                key={`${step.kind}-${step.round}-${index}`}
                className={`
                  rounded-2xl border p-4
                  ${step.kind === 'gemma'
                ? `
                  border-violet-200 bg-violet-50/60
                  dark:border-violet-900/50 dark:bg-violet-950/20
                `
                : `
                  border-zinc-200 bg-zinc-50
                  dark:border-zinc-800 dark:bg-zinc-950
                `}
                `}
              >
                <div className="
                  flex flex-wrap items-center justify-between gap-2
                "
                >
                  <span className="
                    text-xs font-black uppercase tracking-[0.12em] text-zinc-500
                  "
                  >
                    {step.title}
                  </span>
                  {step.critique && (
                    <span className={`
                      rounded-full px-2 py-1 text-[11px] font-bold
                      ${verdictMeta[step.critique.verdict].className}
                    `}
                    >
                      {verdictMeta[step.critique.verdict].label}
                    </span>
                  )}
                </div>
                <p className="
                  mt-2 whitespace-pre-wrap text-sm/relaxed text-zinc-700
                  dark:text-zinc-300
                "
                >
                  {step.body}
                </p>
                {step.critique && <CritiqueDetails critique={step.critique} />}
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

function CritiqueDetails({ critique }: { critique: Critique }) {
  return (
    <div className="
      mt-4 grid gap-3 border-t border-black/5 pt-3
      dark:border-white/10
    "
    >
      <div className="
        grid grid-cols-2 gap-2 text-xs
        sm:grid-cols-5
      "
      >
        {Object.entries(critique.scores).map(([key, value]) => (
          <div
            key={key}
            className="
              rounded-xl bg-white/70 p-2
              dark:bg-zinc-900/70
            "
          >
            <p className="truncate text-zinc-400">{scoreLabel[key] ?? key}</p>
            <p className="mt-1 font-black">
              {Math.round(value * 100)}
              %
            </p>
          </div>
        ))}
      </div>
      {critique.issues.length > 0 && (
        <div className="grid gap-2">
          {critique.issues.map((issue, index) => (
            <div
              key={`${issue.type}-${index}`}
              className="
                text-xs/relaxed text-zinc-600
                dark:text-zinc-400
              "
            >
              <span className="
                font-bold text-zinc-800
                dark:text-zinc-200
              "
              >
                {issue.type}
              </span>
              {' — '}
              {issue.explanation}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function detectCapabilities(): { webGpu: boolean, secureContext: boolean, reason: string } {
  if (typeof window === 'undefined') return { webGpu: false, secureContext: false, reason: '브라우저에서 실행한 뒤 환경을 확인할 수 있습니다.' };
  const webGpu = 'gpu' in navigator;
  const secureContext = window.isSecureContext;
  if (!secureContext) return { webGpu, secureContext, reason: 'HTTPS 또는 localhost에서만 로컬 모델을 실행할 수 있습니다.' };
  if (!webGpu) return { webGpu, secureContext, reason: 'WebGPU를 지원하는 최신 Chrome 또는 Edge가 필요합니다.' };
  return { webGpu, secureContext, reason: '' };
}

function readStoredConfig(): Partial<MainLlmConfig> | null {
  if (typeof window === 'undefined') return null;
  const stored = sessionStorage.getItem(SESSION_CONFIG_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as Partial<MainLlmConfig>;
    const provider = parsed.provider && parsed.provider in providerDefaults
      ? parsed.provider
      : undefined;
    return {
      provider,
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : undefined,
      model: typeof parsed.model === 'string' ? parsed.model : undefined,
      baseUrl: typeof parsed.baseUrl === 'string' ? parsed.baseUrl : undefined,
    };
  }
  catch {
    sessionStorage.removeItem(SESSION_CONFIG_KEY);
    return null;
  }
}

type ProgressState = { phase: string, message: string, percent: number };

const inputClass = 'w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-normal outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-violet-950/40';

const scoreLabel: Record<string, string> = {
  faithfulness: '충실성',
  citationCoverage: '인용 범위',
  sourceQuality: '출처 품질',
  completeness: '완전성',
  safety: '안전성',
};

const claimStatusMeta: Record<string, { label: string, className: string, icon: typeof CheckCircle2 }> = {
  supported: { label: '근거 입증됨', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300', icon: CheckCircle2 },
  partial: { label: '부분 입증', className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300', icon: AlertTriangle },
  unsupported: { label: '근거 부족', className: 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300', icon: XCircle },
  conflict: { label: '근거 충돌', className: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300', icon: AlertTriangle },
};

const verdictMeta: Record<Critique['verdict'], { label: string, className: string }> = {
  pass: { label: '검증 통과', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' },
  revise: { label: '재작성 필요', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' },
  cannot_verify: { label: '검증 불가', className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
  safety_hold: { label: '전문가 확인 필요', className: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300' },
};
