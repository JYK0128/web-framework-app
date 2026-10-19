import { Handle, type NodeProps, type NodeTypes, Position, ViewportPortal } from '@xyflow/react';
import { CircleDot, FileText, PanelTop, Play, Square } from 'lucide-react';
import { createContext, type ReactNode, useContext } from 'react';

import { cn } from '#.generated/shadcn/lib/utils';
import { EditorViewer } from '#ui/editor';

import type { SurveyFlowNode, SurveyNodeKind, SurveyQuestionType } from './survey-flow.types';
import { getSurveyPageRegions } from './survey-flow-model';

export type SourceHandleSelection = { nodeId: string, handleId: string } | null;

export function getChoiceBranchLayouts(options: string[] = []) {
  const visibleIndexes = options.flatMap((option, index) => option.trim() ? [index] : []);
  const leftCount = Math.ceil(visibleIndexes.length / 2);
  return new Map(visibleIndexes.map((optionIndex, optionRank) => {
    const goesLeft = optionRank < leftCount;
    return [optionIndex, { goesLeft, row: goesLeft ? optionRank : optionRank - leftCount }];
  }));
}

export function getChoiceBranchLayout(optionIndex: number, options: string[] = []) {
  return getChoiceBranchLayouts(options).get(optionIndex) ?? { goesLeft: false, row: 0 };
}

export const nodeMeta = {
  start: { label: '시작', icon: Play, iconClass: 'bg-emerald-500/10 text-emerald-600' },
  question: { label: '질문', icon: CircleDot, iconClass: 'bg-blue-500/10 text-blue-600' },
  page: { label: '페이지 구분', icon: PanelTop, iconClass: 'bg-violet-500/10 text-violet-600' },
  content: { label: '콘텐츠 페이지', icon: FileText, iconClass: 'bg-amber-500/10 text-amber-600' },
  end: { label: '종료', icon: Square, iconClass: 'bg-muted text-muted-foreground' },
} satisfies Record<SurveyNodeKind, { label: string, icon: typeof Play, iconClass: string }>;

export const SourceHandleSelectionContext = createContext<{
  selection: SourceHandleSelection
  onSelect: (nodeId: string, handleId: string) => void
}>({ selection: null, onSelect: () => {} });

function TerminalNode({ data, selected }: NodeProps<SurveyFlowNode>) {
  return <NodeShell kind={data.kind} title={data.title} selected={selected} />;
}

function QuestionNode({ id, data, selected }: NodeProps<SurveyFlowNode>) {
  const { selection, onSelect } = useContext(SourceHandleSelectionContext);
  const branchLayouts = getChoiceBranchLayouts(data.options);
  const options = data.questionType === 'text'
    ? []
    : (data.options ?? []).map((option, index) => ({ option, index })).filter(({ option }) => option.trim().length > 0);
  return (
    <NodeShell kind="question" title={data.title} selected={selected}>
      <p className="mb-2 text-xs text-muted-foreground">{questionTypeLabel(data.questionType)}</p>
      {options.length > 0 && (
        <div className="grid w-full gap-1.5">
          {options.map(({ option, index }) => {
            const goesLeft = branchLayouts.get(index)?.goesLeft ?? false;
            return (
              <div
                key={`${option}-${index}`}
                role="button"
                tabIndex={0}
                aria-pressed={selection?.nodeId === id && selection?.handleId === `option-${index}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(id, `option-${index}`);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    onSelect(id, `option-${index}`);
                  }
                }}
                className={`
                  relative rounded-md border bg-background px-2.5 py-1.5 pr-5
                  text-xs
                  ${selection?.nodeId === id && selection?.handleId === `option-${index}`
                ? 'border-primary ring-2 ring-primary/30'
                : ''}
                `}
              >
                <Handle
                  id={`option-input-${index}`}
                  type="target"
                  position={goesLeft ? Position.Right : Position.Left}
                  style={goesLeft ? { right: 0 } : { left: 0 }}
                  className="
                    z-10! size-2! border-2! border-background! bg-primary!
                  "
                />
                {option}
                <Handle
                  id={`option-${index}`}
                  type="source"
                  position={goesLeft ? Position.Left : Position.Right}
                  style={goesLeft ? { left: 0 } : { right: 0 }}
                  className="
                    z-10! size-2! border-2! border-background! bg-primary!
                  "
                />
              </div>
            );
          })}
        </div>
      )}
    </NodeShell>
  );
}

function PageBreakNode({ data, selected }: NodeProps<SurveyFlowNode>) {
  return (
    <NodeShell kind="page" title={data.title} selected={selected}>
      <p className="text-xs text-muted-foreground">여기서 다음 페이지로 넘어갑니다.</p>
    </NodeShell>
  );
}

function ContentPageNode({ data, selected }: NodeProps<SurveyFlowNode>) {
  return (
    <NodeShell kind="content" title={data.title} selected={selected}>
      {data.content
        ? (
          <EditorViewer
            content={data.content}
            className="line-clamp-4 text-xs text-muted-foreground"
          />
        )
        : null}
    </NodeShell>
  );
}

function NodeShell({
  kind,
  title,
  selected,
  children,
}: {
  kind: SurveyNodeKind
  title: string
  selected: boolean
  children?: ReactNode
}) {
  const meta = nodeMeta[kind];
  const Icon = meta.icon;
  return (
    <article className={cn(`
      w-64 overflow-visible rounded-xl border bg-card text-card-foreground
      shadow-sm transition-shadow
    `, selected && `border-primary ring-2 ring-primary/20`)}
    >
      <Handle
        id="top"
        type="source"
        position={Position.Top}
        className="z-10! size-2! border-2! border-background! bg-primary!"
      />
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        style={{ top: 25 }}
        className="z-10! size-2! border-2! border-background! bg-primary!"
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="z-10! size-2! border-2! border-background! bg-primary!"
      />
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        style={{ top: 25 }}
        className="z-10! size-2! border-2! border-background! bg-primary!"
      />
      <header className="flex items-center gap-2 border-b px-3 py-2.5">
        <span className={cn('grid size-7 place-items-center rounded-md', meta.iconClass)}>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="
            text-[10px] font-medium uppercase tracking-wide
            text-muted-foreground
          "
          >
            {meta.label}
          </p>
          <h3 className="truncate text-sm font-semibold">{title}</h3>
        </div>
        {kind === 'question' && (
          <span className="text-muted-foreground">
            <CircleDot className="size-3.5" />
          </span>
        )}
      </header>
      {children && <div className="px-3 pb-3 pt-2">{children}</div>}
    </article>
  );
}

export const nodeTypes: NodeTypes = {
  start: TerminalNode,
  question: QuestionNode,
  page: PageBreakNode,
  content: ContentPageNode,
  end: TerminalNode,
};

const sectionRegionStyles = [
  { region: 'border-blue-500/25 bg-blue-500/5', label: 'border-blue-500/20 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  { region: 'border-violet-500/25 bg-violet-500/5', label: 'border-violet-500/20 bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300' },
  { region: 'border-emerald-500/25 bg-emerald-500/5', label: 'border-emerald-500/20 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  { region: 'border-amber-500/25 bg-amber-500/5', label: 'border-amber-500/20 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
];

export function PageSectionRegions({ regions }: { regions: ReturnType<typeof getSurveyPageRegions> }) {
  if (regions.length === 0) return null;
  return (
    <ViewportPortal>
      {regions.map((region) => {
        const style = sectionRegionStyles[region.index % sectionRegionStyles.length];
        return (
          <div
            key={region.index}
            aria-hidden="true"
            className={`
              absolute rounded-2xl border border-dashed
              ${style.region}
            `}
            style={{ left: region.left, top: region.top, width: region.width, height: region.height, zIndex: -1 }}
          >
            <span className={`
              absolute -top-3 left-4 rounded-full border px-2.5 py-1 text-[11px]
              font-semibold
              ${style.label}
            `}
            >
              {region.label}
            </span>
          </div>
        );
      })}
    </ViewportPortal>
  );
}

export function nodeColor(kind: SurveyNodeKind) {
  const colors: Record<SurveyNodeKind, string> = {
    start: '#10b981',
    question: '#3b82f6',
    page: '#8b5cf6',
    content: '#f59e0b',
    end: '#94a3b8',
  };
  return colors[kind];
}

function questionTypeLabel(type?: SurveyQuestionType) {
  if (type === 'multiple') return '복수 선택';
  if (type === 'text') return '주관식';
  return '단일 선택';
}
