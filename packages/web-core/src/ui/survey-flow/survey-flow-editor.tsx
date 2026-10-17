import { addEdge, Background, BackgroundVariant, type Connection, ConnectionMode, ControlButton, Controls, Handle, MiniMap, type NodeProps, type NodeTypes, Position, ReactFlow, type ReactFlowInstance, useEdgesState, useNodesState, ViewportPortal } from '@xyflow/react';
import { ArrowDown, ChevronDown, ChevronUp, CircleDot, Eye, EyeOff, FileText, GitBranch, PanelTop, Pencil, Play, Plus, Redo2, Square, Trash2, Undo2, WandSparkles } from 'lucide-react';
import { createContext, type SetStateAction, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '#.generated/shadcn/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, Button, Checkbox, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '#ui';
import { EditorViewer } from '#ui/editor';
import { FormLayout, useAppForm } from '#ui/form';
import { Modal } from '#ui/modal';

import { initialSurveyFlow, type SurveyFlow, type SurveyFlowEdge, type SurveyFlowEditorProps, type SurveyFlowNode, type SurveyFlowNodeData, type SurveyNodeKind, type SurveyQuestionType } from './survey-flow.types';
import { connectOpenOutputsToEnd, endHandleKey, getAutoLayoutedNodes, getPreviewFlow, getSurveyFlowValidationIssues, getSurveyNodeSize, getSurveyPageRegions, isValidSurveyFlowConnection, serializeFlow, toSurveyFlow } from './survey-flow-model';

export type { SurveyFlow, SurveyFlowEdge, SurveyFlowEditorProps, SurveyFlowNode, SurveyFlowNodeData, SurveyNodeKind, SurveyQuestionType } from './survey-flow.types';
export { initialSurveyFlow } from './survey-flow.types';

type SourceHandleSelection = { nodeId: string, handleId: string } | null;
type SelectedOutput = { sourceHandle: string, targetHandle?: string, isChoiceBranch: boolean, sourceLabel?: string };
type QuestionSurveyFlowNode = Omit<SurveyFlowNode, 'data'> & { data: SurveyFlowNodeData & { kind: 'question' } };
type ContentSurveyFlowNode = Omit<SurveyFlowNode, 'data'> & { data: SurveyFlowNodeData & { kind: 'content' } };

function wouldCreateCycle(connection: Connection | SurveyFlowEdge, edges: SurveyFlowEdge[]) {
  if (!connection.source || !connection.target) return true;
  const paths = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.source === connection.source && edge.sourceHandle === connection.sourceHandle) continue;
    const targets = paths.get(edge.source) ?? [];
    targets.push(edge.target);
    paths.set(edge.source, targets);
  }
  const pending = [connection.target];
  const visited = new Set<string>();
  while (pending.length > 0) {
    const nodeId = pending.pop();
    if (!nodeId || visited.has(nodeId)) continue;
    if (nodeId === connection.source) return true;
    visited.add(nodeId);
    pending.push(...(paths.get(nodeId) ?? []));
  }
  return false;
}

function serializeHistorySnapshot(flowSnapshot: string, suppressedEndHandles: Set<string>) {
  return JSON.stringify({ ...JSON.parse(flowSnapshot), suppressedEndHandles: [...suppressedEndHandles] });
}

function reindexOptionHandle(handle: string | null | undefined, prefix: string, deletedIndex: number) {
  if (!handle?.startsWith(prefix)) return { handle, shouldDelete: false };
  const index = Number(handle.slice(prefix.length));
  if (!Number.isInteger(index)) return { handle, shouldDelete: false };
  if (index === deletedIndex) return { handle, shouldDelete: true };
  return { handle: index > deletedIndex ? `${prefix}${index - 1}` : handle, shouldDelete: false };
}

function reindexSuppressedOptions(handles: Set<string>, nodeId: string, deletedIndex: number) {
  const prefix = `${nodeId}\u0000`;
  const result = new Set<string>();
  for (const key of handles) {
    if (!key.startsWith(prefix)) {
      result.add(key);
      continue;
    }
    const updated = reindexOptionHandle(key.slice(prefix.length), 'option-', deletedIndex);
    if (!updated.shouldDelete && updated.handle) result.add(endHandleKey(nodeId, updated.handle));
  }
  return result;
}

function getChoiceBranchLayouts(options: string[] = []) {
  const visibleIndexes = options.flatMap((option, index) => option.trim() ? [index] : []);
  const leftCount = Math.ceil(visibleIndexes.length / 2);
  return new Map(visibleIndexes.map((optionIndex, optionRank) => {
    const goesLeft = optionRank < leftCount;
    return [optionIndex, { goesLeft, row: goesLeft ? optionRank : optionRank - leftCount }];
  }));
}

function getChoiceBranchLayout(optionIndex: number, options: string[] = []) {
  return getChoiceBranchLayouts(options).get(optionIndex) ?? { goesLeft: false, row: 0 };
}

function prepareInitialFlow(flow: SurveyFlow) {
  const nodes = flow.nodes.map((node) => node.data.kind === 'start' || node.data.kind === 'end'
    ? { ...node, deletable: false }
    : node);
  const edges = flow.edges.map((edge) => edge.targetHandle === 'left' || edge.targetHandle === 'right'
    ? { ...edge, targetHandle: 'top' }
    : edge);
  return {
    ...flow,
    nodes,
    edges: connectOpenOutputsToEnd(nodes, edges, new Set()),
  };
}

function getSelectedOutput(node: SurveyFlowNode, selection: SourceHandleSelection): SelectedOutput | null {
  const selectedHandle = selection?.nodeId === node.id ? selection.handleId : undefined;
  if (node.data.kind === 'end') return null;
  if (node.data.kind === 'question' && node.data.questionType !== 'text' && selectedHandle?.startsWith('option-')) {
    const optionIndex = Number(selectedHandle.slice('option-'.length));
    if (Number.isInteger(optionIndex) && optionIndex >= 0 && optionIndex < (node.data.options?.length ?? 0)) {
      return {
        sourceHandle: selectedHandle,
        targetHandle: 'top',
        isChoiceBranch: true,
        sourceLabel: node.data.options?.[optionIndex],
      };
    }
  }
  return { sourceHandle: 'bottom', isChoiceBranch: false, sourceLabel: undefined };
}

function createNodeEdges(
  currentEdges: SurveyFlowEdge[],
  nodes: SurveyFlowNode[],
  sourceNodeId: string,
  node: SurveyFlowNode,
  output: NonNullable<ReturnType<typeof getSelectedOutput>>,
  continuationTarget: { nodeId: string, targetHandle?: string | null } | undefined,
  suppressedEndHandles: Set<string>,
) {
  const existing = currentEdges.find((edge) => edge.source === sourceNodeId && edge.sourceHandle === output.sourceHandle);
  const nextEdges = existing
    ? currentEdges.map((edge) => edge.id === existing.id
      ? { ...edge, target: node.id, targetHandle: output.targetHandle ?? 'top', ...(output.sourceLabel ? { label: output.sourceLabel } : {}) }
      : edge)
    : [...currentEdges,
      {
        id: `edge-${crypto.randomUUID()}`,
        source: sourceNodeId,
        sourceHandle: output.sourceHandle,
        target: node.id,
        targetHandle: output.targetHandle ?? 'top',
        type: 'smoothstep',
        ...(output.sourceLabel ? { label: output.sourceLabel } : {}),
      }];
  const continuationHandle = node.data.kind === 'question' || node.data.kind === 'page' || node.data.kind === 'content' ? 'bottom' : undefined;
  const withContinuation = continuationTarget && continuationHandle
    ? [
      ...nextEdges,
      {
        id: `edge-${crypto.randomUUID()}`,
        source: node.id,
        sourceHandle: continuationHandle,
        target: continuationTarget.nodeId,
        ...(continuationTarget.targetHandle ? { targetHandle: continuationTarget.targetHandle } : {}),
        type: 'smoothstep',
      },
    ]
    : nextEdges;
  return connectOpenOutputsToEnd([...nodes, node], withContinuation, suppressedEndHandles);
}

function getNodePositionSeed(selected: SurveyFlowNode, sourceHandle: string, isChoiceBranch: boolean, nodeSize: { width: number, height: number }) {
  const selectedSize = getSurveyNodeSize(selected);
  if (isChoiceBranch) {
    const optionIndex = Math.max(0, Number(sourceHandle.slice('option-'.length)) || 0);
    const options = selected.data.kind === 'question' ? selected.data.options : [];
    const { goesLeft, row } = getChoiceBranchLayout(optionIndex, options);
    return {
      x: goesLeft
        ? selected.position.x - nodeSize.width - 120
        : selected.position.x + selectedSize.width + 120,
      y: selected.position.y + row * (nodeSize.height + 80),
    };
  }
  return { x: selected.position.x, y: selected.position.y + selectedSize.height + 120 };
}

function getContinuationPosition(selected: SurveyFlowNode, nodeSize: { width: number, height: number }, continuationNode: SurveyFlowNode | undefined) {
  if (!continuationNode) return undefined;
  const firstAvailableY = selected.position.y + getSurveyNodeSize(selected).height + 40;
  const lastAvailableY = continuationNode.position.y - nodeSize.height - 40;
  if (lastAvailableY < firstAvailableY) return undefined;
  return { x: selected.position.x, y: firstAvailableY + (lastAvailableY - firstAvailableY) / 2 };
}

function overlapsExistingNode(position: { x: number, y: number }, nodeSize: { width: number, height: number }, nodes: SurveyFlowNode[]) {
  return nodes.some((existing) => {
    const size = getSurveyNodeSize(existing);
    return position.x < existing.position.x + size.width + 40
      && position.x + nodeSize.width + 40 > existing.position.x
      && position.y < existing.position.y + size.height + 40
      && position.y + nodeSize.height + 40 > existing.position.y;
  });
}

function getNodePosition(selected: SurveyFlowNode, node: SurveyFlowNode, sourceHandle: string, isChoiceBranch: boolean, nodes: SurveyFlowNode[], continuationNode?: SurveyFlowNode) {
  const nodeSize = getSurveyNodeSize(node);
  const seed = getNodePositionSeed(selected, sourceHandle, isChoiceBranch, nodeSize);
  const continuationPosition = isChoiceBranch ? undefined : getContinuationPosition(selected, nodeSize, continuationNode);
  const start = continuationPosition ?? seed;
  const optionIndex = Number(sourceHandle.slice('option-'.length));
  const options = selected.data.kind === 'question' ? selected.data.options : [];
  const scanDirection = isChoiceBranch && getChoiceBranchLayout(optionIndex, options).goesLeft ? -1 : 1;
  for (let row = 0; ; row++) {
    for (let column = 0; column < 20; column++) {
      const position = {
        x: start.x + scanDirection * column * (nodeSize.width + 120),
        y: start.y + row * (nodeSize.height + 120),
      };
      if (!overlapsExistingNode(position, nodeSize, nodes)) return position;
    }
  }
}
const SourceHandleSelectionContext = createContext<{
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
                ? `border-primary ring-2 ring-primary/30`
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
  children?: React.ReactNode
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

const nodeMeta = {
  start: { label: '시작', icon: Play, iconClass: 'bg-emerald-500/10 text-emerald-600' },
  question: { label: '질문', icon: CircleDot, iconClass: 'bg-blue-500/10 text-blue-600' },
  page: { label: '페이지 구분', icon: PanelTop, iconClass: 'bg-violet-500/10 text-violet-600' },
  content: { label: '콘텐츠 페이지', icon: FileText, iconClass: 'bg-amber-500/10 text-amber-600' },
  end: { label: '종료', icon: Square, iconClass: 'bg-muted text-muted-foreground' },
} satisfies Record<SurveyNodeKind, { label: string, icon: typeof Play, iconClass: string }>;

const nodeTypes: NodeTypes = {
  start: TerminalNode,
  question: QuestionNode,
  page: PageBreakNode,
  content: ContentPageNode,
  end: TerminalNode,
};

const sectionRegionStyles = [
  {
    region: 'border-blue-500/25 bg-blue-500/5',
    label: 'border-blue-500/20 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  {
    region: 'border-violet-500/25 bg-violet-500/5',
    label: 'border-violet-500/20 bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  },
  {
    region: 'border-emerald-500/25 bg-emerald-500/5',
    label: 'border-emerald-500/20 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  {
    region: 'border-amber-500/25 bg-amber-500/5',
    label: 'border-amber-500/20 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
];

function PageSectionRegions({ regions }: { regions: ReturnType<typeof getSurveyPageRegions> }) {
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

function questionTypeLabel(type?: SurveyQuestionType) {
  if (type === 'multiple') return '복수 선택';
  if (type === 'text') return '주관식';
  return '단일 선택';
}

function nodeColor(kind: SurveyNodeKind) {
  const colors: Record<SurveyNodeKind, string> = {
    start: '#10b981',
    question: '#3b82f6',
    page: '#8b5cf6',
    content: '#f59e0b',
    end: '#94a3b8',
  };
  return colors[kind];
}

export function SurveyFlowEditor({ initialFlow = initialSurveyFlow, onChange, onSave, className }: SurveyFlowEditorProps) {
  const [initialFlowState] = useState(() => prepareInitialFlow(initialFlow));
  const [initialSnapshot] = useState(() => serializeFlow(
    initialFlowState.title ?? '새 설문',
    initialFlowState.nodes,
    initialFlowState.edges,
  ));
  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlowState.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlowState.edges);
  const [suppressedEndHandles, setSuppressedEndHandles] = useState<Set<string>>(() => new Set());
  const [title, setTitle] = useState(initialFlowState.title ?? '새 설문');
  const [isTitleDialogOpen, setIsTitleDialogOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState(initialFlowState.title ?? '새 설문');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedSourceHandle, setSelectedSourceHandle] = useState<SourceHandleSelection>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState(initialSnapshot);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isContentEditorOpen, setIsContentEditorOpen] = useState(false);
  const [isMiniMapVisible, setIsMiniMapVisible] = useState(true);
  const [areControlsExpanded, setAreControlsExpanded] = useState(true);
  const [saveValidation, setSaveValidation] = useState<{ snapshot: string, issues: string[] } | null>(null);
  const [previewPage, setPreviewPage] = useState(0);
  const [responses, setResponses] = useState<Record<string, string | string[]>>({});
  const [pendingChoiceDelete, setPendingChoiceDelete] = useState<{ nodeId: string, index: number, label: string } | null>(null);
  const [historyAvailability, setHistoryAvailability] = useState({ canUndo: false, canRedo: false });
  const editingContentNodeIdRef = useRef<string | null>(null);
  const contentEditorForm = useAppForm({
    defaultValues: { content: '' },
    onSubmit: async ({ value }) => {
      const editingNodeId = editingContentNodeIdRef.current;
      if (!editingNodeId) return;
      setNodes((current) => current.map((node) => node.id === editingNodeId && node.data.kind === 'content'
        ? { ...node, data: { ...node.data, content: value.content } }
        : node));
      setIsContentEditorOpen(false);
    },
  });
  const editorRef = useRef<HTMLElement | null>(null);
  const historyRef = useRef({
    past: [] as string[],
    future: [] as string[],
    last: serializeHistorySnapshot(initialSnapshot, suppressedEndHandles),
    isDraggingNode: false,
  });
  const reactFlowInstance = useRef<ReactFlowInstance<SurveyFlowNode, SurveyFlowEdge> | null>(null);
  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId), [nodes, selectedNodeId]);
  const pageRegions = useMemo(() => getSurveyPageRegions(nodes, edges), [edges, nodes]);
  const previewFlow = useMemo(() => getPreviewFlow(nodes, edges, responses), [edges, nodes, responses]);
  const previewPages = previewFlow.pages;
  const currentPreviewPage = Math.min(previewPage, Math.max(previewPages.length - 1, 0));
  const currentPreviewQuestions = previewPages[currentPreviewPage];
  const isLastPreviewPage = previewPages.length > 0 && currentPreviewPage === previewPages.length - 1;
  const hasPendingRoutingResponse = isLastPreviewPage && previewFlow.blockedRouting?.reason === 'response';
  const hasBrokenPreviewRoute = isLastPreviewPage && previewFlow.blockedRouting?.reason === 'route';
  let previewCompletionLabel = '설문 완료';
  if (hasPendingRoutingResponse) previewCompletionLabel = '응답 후 계속';
  else if (hasBrokenPreviewRoute) previewCompletionLabel = '경로 연결 필요';
  const currentSnapshot = serializeFlow(title, nodes, edges);
  const validationIssues = useMemo(() => {
    const issues = getSurveyFlowValidationIssues(nodes, edges);
    if (!title.trim()) issues.unshift('설문 제목을 입력하세요.');
    return issues;
  }, [edges, nodes, title]);
  const visibleSaveIssues = saveValidation?.snapshot === currentSnapshot ? saveValidation.issues : [];
  const { canUndo, canRedo } = historyAvailability;
  const isDirty = currentSnapshot !== savedSnapshot;
  let saveStatus = '변경 사항 없음';
  if (savedAt) saveStatus = `저장됨 ${savedAt}`;
  if (isDirty) saveStatus = '저장되지 않은 변경 사항';

  const commitHistorySnapshot = useCallback((snapshot: string) => {
    const history = historyRef.current;
    if (snapshot === history.last) return;
    history.past = [...history.past.slice(-99), history.last];
    history.future = [];
    history.last = snapshot;
    setHistoryAvailability({ canUndo: history.past.length > 0, canRedo: false });
  }, []);

  const restoreHistorySnapshot = useCallback((snapshot: string) => {
    const historySnapshot = JSON.parse(snapshot) as SurveyFlow & { suppressedEndHandles?: string[] };
    const flow = historySnapshot;
    historyRef.current.last = snapshot;
    setTitle(flow.title ?? '새 설문');
    setNodes(flow.nodes);
    setEdges(flow.edges);
    setSuppressedEndHandles(new Set(historySnapshot.suppressedEndHandles ?? []));
    setHistoryAvailability({ canUndo: historyRef.current.past.length > 0, canRedo: historyRef.current.future.length > 0 });
  }, [setEdges, setNodes]);

  const undo = useCallback(() => {
    const history = historyRef.current;
    const snapshot = history.past.pop();
    if (!snapshot) return;
    history.future = [history.last, ...history.future].slice(0, 100);
    restoreHistorySnapshot(snapshot);
  }, [restoreHistorySnapshot]);

  const redo = useCallback(() => {
    const history = historyRef.current;
    const snapshot = history.future.shift();
    if (!snapshot) return;
    history.past = [...history.past, history.last].slice(-100);
    restoreHistorySnapshot(snapshot);
  }, [restoreHistorySnapshot]);

  useEffect(() => {
    const completedEdges = connectOpenOutputsToEnd(nodes, edges, suppressedEndHandles);
    if (completedEdges !== edges) {
      setEdges(completedEdges);
      return;
    }
    onChange?.(toSurveyFlow(title, nodes, edges));
    if (!historyRef.current.isDraggingNode) commitHistorySnapshot(serializeHistorySnapshot(currentSnapshot, suppressedEndHandles));
  }, [commitHistorySnapshot, currentSnapshot, edges, nodes, onChange, setEdges, suppressedEndHandles, title]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      const target = event.target;
      if (!(target instanceof Element) || !editorRef.current?.contains(target)) return;
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return;

      const key = event.key.toLowerCase();
      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
      else if (key === 'y' && !event.shiftKey) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [redo, undo]);

  const onConnect = useCallback((connection: Connection) => {
    setSuppressedEndHandles((current) => {
      const next = new Set(current);
      next.delete(endHandleKey(connection.source, connection.sourceHandle));
      return next;
    });
    setEdges((current) => {
      const samePath = current.find((edge) => edge.source === connection.source && edge.sourceHandle === connection.sourceHandle);
      if (samePath?.target === connection.target && samePath.targetHandle === connection.targetHandle) return current;
      const withoutSamePath = current.filter((edge) => edge.source !== connection.source || edge.sourceHandle !== connection.sourceHandle);
      const sourceNode = nodes.find((node) => node.id === connection.source);
      const optionIndex = connection.sourceHandle?.startsWith('option-')
        ? Number(connection.sourceHandle.slice('option-'.length))
        : -1;
      const sourceLabel = sourceNode?.data.kind === 'question' && sourceNode.data.questionType !== 'text'
        ? sourceNode.data.options?.[optionIndex]
        : undefined;
      return addEdge({ ...connection, type: 'smoothstep', ...(sourceLabel ? { label: sourceLabel } : {}) }, withoutSamePath);
    });
  }, [nodes, setEdges]);

  const isValidConnection = useCallback((connection: SurveyFlowEdge | Connection) => {
    if (!isValidSurveyFlowConnection(connection, nodes, edges)) return false;
    return !wouldCreateCycle(connection, edges);
  }, [edges, nodes]);

  const updateSingleResponse = useCallback((questionId: string, option: string) => {
    setResponses((current) => ({ ...current, [questionId]: option }));
  }, []);

  const updateMultipleResponse = useCallback((questionId: string, option: string, checked: boolean | 'indeterminate') => {
    setResponses((current) => {
      const selected = Array.isArray(current[questionId]) ? current[questionId] : [];
      const updated = checked === true
        ? [...selected, option]
        : selected.filter((value) => value !== option);
      return { ...current, [questionId]: updated };
    });
  }, []);

  const addNode = useCallback((kind: 'question' | 'page' | 'content') => {
    const selected = nodes.find((current) => current.id === selectedNodeId)
      ?? nodes.find((current) => current.data.kind === 'start');
    if (!selected) return;
    const output = getSelectedOutput(selected, selectedSourceHandle);
    if (!output) return;
    const { sourceHandle, isChoiceBranch } = output;
    const connectedEdge = edges.find((edge) => edge.source === selected.id && edge.sourceHandle === sourceHandle);
    const sharedContinuation = !connectedEdge && sourceHandle?.startsWith('option-')
      ? edges.find((edge) => edge.source === selected.id && edge.sourceHandle === 'bottom')
      : undefined;
    const continuation = connectedEdge ?? sharedContinuation;
    const continuationTargetNode = continuation ? nodes.find((node) => node.id === continuation.target) : undefined;
    const continuationTarget = continuation && continuationTargetNode && continuationTargetNode.data.kind !== 'end'
      ? { nodeId: continuation.target, targetHandle: continuation.targetHandle }
      : undefined;
    const count = nodes.filter((node) => node.type === kind).length + 1;
    const id = `${kind}-${crypto.randomUUID()}`;
    const data: SurveyFlowNodeData = {
      kind,
      title: `${kind === 'question' ? '새 질문' : nodeMeta[kind].label} ${count}`,
      ...(kind === 'question' ? { questionType: 'single' as const, options: ['선택지 1', '선택지 2'] } : {}),
    };
    const node: SurveyFlowNode = {
      id,
      type: kind,
      position: { x: 0, y: 0 },
      data,
    };
    node.position = getNodePosition(selected, node, sourceHandle, isChoiceBranch, nodes, continuationTargetNode);
    setSuppressedEndHandles((current) => {
      const next = new Set(current);
      next.delete(endHandleKey(selected.id, sourceHandle));
      return next;
    });
    setNodes((current) => [...current, node]);
    setEdges((current) => createNodeEdges(current, nodes, selected.id, node, output, continuationTarget, suppressedEndHandles));
    setSelectedSourceHandle(null);
    setSelectedNodeId(id);
  }, [edges, nodes, selectedNodeId, selectedSourceHandle, setEdges, setNodes, suppressedEndHandles]);

  const updateSelectedNode = useCallback((patch: Partial<SurveyFlowNodeData>) => {
    if (!selectedNodeId) return;
    setNodes((current) => current.map((node) => node.id === selectedNodeId ? { ...node, data: { ...node.data, ...patch } } : node));
  }, [selectedNodeId, setNodes]);

  const updateQuestionType = useCallback((questionType: SurveyQuestionType) => {
    if (!selectedNode || selectedNode.data.kind !== 'question') return;
    setSelectedSourceHandle(null);
    if (questionType === 'text') {
      setSuppressedEndHandles((current) => new Set([...current].filter((key) => !key.startsWith(`${selectedNode.id}\u0000option-`))));
      setEdges((current) => current.flatMap((edge) => {
        if (edge.source === selectedNode.id && edge.sourceHandle?.startsWith('option-')) return [];
        if (edge.target === selectedNode.id && edge.targetHandle?.startsWith('option-input-')) return [{ ...edge, targetHandle: 'top' }];
        return [edge];
      }));
    }
    updateSelectedNode({ questionType });
  }, [selectedNode, setEdges, updateSelectedNode]);

  const updateChoice = useCallback((index: number, value: string) => {
    if (!selectedNode || selectedNode.data.kind !== 'question') return;
    const previousValue = selectedNode.data.options?.[index];
    if (previousValue === undefined) return;
    setNodes((current) => current.map((node) => {
      if (node.id === selectedNode.id && node.data.kind === 'question') {
        const options = [...(node.data.options ?? [])];
        options[index] = value;
        return { ...node, data: { ...node.data, options } };
      }
      return node;
    }));
  }, [selectedNode, setNodes]);

  const addChoice = useCallback(() => {
    if (!selectedNode || selectedNode.data.kind !== 'question') return;
    updateSelectedNode({ options: [...(selectedNode.data.options ?? []), ''] });
  }, [selectedNode, updateSelectedNode]);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId || selectedNode?.data.kind === 'start' || selectedNode?.data.kind === 'end') return;
    const incomingHandleKeys = edges
      .filter((edge) => edge.target === selectedNodeId)
      .map((edge) => endHandleKey(edge.source, edge.sourceHandle));
    setSuppressedEndHandles((current) => {
      const next = new Set(current);
      for (const key of incomingHandleKeys) next.delete(key);
      for (const key of next) {
        if (key.startsWith(`${selectedNodeId}\u0000`)) next.delete(key);
      }
      return next;
    });
    setNodes((current) => current.filter((node) => node.id !== selectedNodeId));
    setEdges((current) => current.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
    setSelectedNodeId(null);
  }, [edges, selectedNode, selectedNodeId, setEdges, setNodes]);

  useEffect(() => {
    const handleDeleteKey = (event: KeyboardEvent) => {
      if (event.key !== 'Backspace' && event.key !== 'Delete') return;
      const target = event.target;
      if (!(target instanceof Element) || !editorRef.current?.contains(target)) return;
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return;

      const selectedEdges = edges.filter((edge) => edge.selected);
      if (selectedEdges.length > 0) {
        event.preventDefault();
        const selectedIds = new Set(selectedEdges.map((edge) => edge.id));
        setSuppressedEndHandles((current) => {
          const next = new Set(current);
          for (const edge of selectedEdges) next.add(endHandleKey(edge.source, edge.sourceHandle));
          return next;
        });
        setEdges(edges.filter((edge) => !selectedIds.has(edge.id)));
        return;
      }

      if (nodes.some((node) => node.id === selectedNodeId && node.selected && node.data.kind !== 'start' && node.data.kind !== 'end')) {
        event.preventDefault();
        deleteSelectedNode();
      }
    };

    window.addEventListener('keydown', handleDeleteKey);
    return () => window.removeEventListener('keydown', handleDeleteKey);
  }, [deleteSelectedNode, edges, nodes, selectedNodeId, setEdges]);

  const autoArrangeNodes = useCallback(() => {
    const instance = reactFlowInstance.current;
    const viewport = instance?.getViewport();
    setNodes((current) => getAutoLayoutedNodes(current, edges));
    if (instance && viewport) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          void instance.setViewport(viewport, { duration: 0 });
        });
      });
    }
  }, [edges, setNodes]);

  return (
    <section
      ref={editorRef}
      className={cn(`
        survey-flow-editor relative flex min-h-0 flex-col overflow-hidden
        rounded-xl border bg-background text-foreground
      `, className)}
    >
      <header className="
        flex min-h-14 flex-wrap items-center justify-between gap-3 border-b px-4
        py-2
      "
      >
        <div className="flex items-center gap-3">
          <div className="
            grid size-8 place-items-center rounded-lg bg-primary/10 text-primary
          "
          >
            <GitBranch className="size-4" />
          </div>
          <div>
            <div className="flex h-8 items-center gap-1">
              <h1 className="max-w-56 truncate px-1 text-sm font-semibold">{title || '제목 없음'}</h1>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="설문 제목 수정"
                title="설문 제목 수정"
                onClick={() => {
                  setTitleDraft(title);
                  setIsTitleDialogOpen(true);
                }}
              >
                <Pencil />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="
            hidden text-xs text-muted-foreground
            sm:inline
          "
          >
            {saveStatus}
          </span>
          <Button variant="ghost" size="icon-sm" title="실행 취소 (Ctrl+Z)" aria-label="실행 취소" onClick={undo} disabled={!canUndo}>
            <Undo2 />
          </Button>
          <Button variant="ghost" size="icon-sm" title="다시 실행 (Ctrl+Shift+Z)" aria-label="다시 실행" onClick={redo} disabled={!canRedo}>
            <Redo2 />
          </Button>
          <Button variant="outline" size="sm" onClick={autoArrangeNodes}>
            <WandSparkles />
            자동 정렬
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!onSave}
            onClick={() => {
              if (!onSave) return;
              if (validationIssues.length > 0) {
                setSaveValidation({ snapshot: currentSnapshot, issues: validationIssues });
                return;
              }
              setSaveValidation(null);
              onSave?.(toSurveyFlow(title, nodes, edges));
              setSavedSnapshot(currentSnapshot);
              setSavedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
            }}
          >
            저장
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setPreviewPage(0);
              setResponses({});
              setIsPreviewOpen(true);
            }}
          >
            <Play />
            미리보기
          </Button>
        </div>
      </header>

      {visibleSaveIssues.length > 0 && (
        <div
          className="
            border-b border-destructive/30 bg-destructive/5 px-4 py-3 text-sm
          "
          role="alert"
          aria-live="assertive"
        >
          <p className="font-medium text-destructive">설문 흐름을 저장할 수 없습니다. 아래 항목을 확인하세요.</p>
          <ul className="mt-1 list-inside list-disc text-muted-foreground">
            {visibleSaveIssues.map((issue) => <li key={issue}>{issue}</li>)}
          </ul>
        </div>
      )}

      <div className="
        grid min-h-0 flex-1 grid-cols-[190px_minmax(0,1fr)_270px]
        max-lg:grid-cols-[160px_minmax(0,1fr)]
      "
      >
        <aside className="
          min-w-0 overflow-hidden border-r p-3
          max-lg:hidden
        "
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold">요소 추가</h2>
          </div>
          <div className="grid min-w-0 gap-2">
            <PaletteButton kind="question" onClick={() => addNode('question')} />
            <PaletteButton kind="page" onClick={() => addNode('page')} />
            <PaletteButton kind="content" onClick={() => addNode('content')} />
          </div>
        </aside>

        <div className="relative min-h-[540px] min-w-0 bg-muted/20">
          <div className="
            absolute left-3 top-3 z-10 flex gap-1 rounded-lg border
            bg-background/95 p-1 shadow-sm
            lg:hidden
          "
          >
            <Button variant="ghost" size="sm" onClick={() => addNode('question')}>
              <Plus />
              질문
            </Button>
            <Button variant="ghost" size="sm" onClick={() => addNode('page')}>
              <PanelTop />
              페이지
            </Button>
            <Button variant="ghost" size="sm" onClick={() => addNode('content')}>
              <FileText />
              콘텐츠
            </Button>
          </div>
          <SourceHandleSelectionContext.Provider
            value={{
              selection: selectedSourceHandle,
              onSelect: (nodeId, handleId) => {
                setSelectedNodeId(nodeId);
                setSelectedSourceHandle({ nodeId, handleId });
              },
            }}
          >
            <ReactFlow
              connectionMode={ConnectionMode.Loose}
              onInit={(instance) => {
                reactFlowInstance.current = instance;
                requestAnimationFrame(() => {
                  void (async () => {
                    await instance.fitView({ padding: 0.22, maxZoom: 0.8 });
                    const viewport = instance.getViewport();
                    await instance.setViewport({ ...viewport, zoom: 0.8 });
                  })();
                });
              }}
              onNodeDragStart={() => {
                historyRef.current.isDraggingNode = true;
              }}
              onNodeDragStop={(_event, _node, draggedNodes) => {
                historyRef.current.isDraggingNode = false;
                const draggedNodesById = new Map(draggedNodes.map((node) => [node.id, node]));
                const snapshotNodes = nodes.map((node) => draggedNodesById.get(node.id) ?? node);
                const snapshot = serializeFlow(title, snapshotNodes, edges);
                commitHistorySnapshot(serializeHistorySnapshot(snapshot, suppressedEndHandles));
              }}
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              isValidConnection={isValidConnection}
              onNodeClick={(_, node) => {
                setSelectedSourceHandle(null);
                setSelectedNodeId(node.id);
              }}
              onPaneClick={() => {
                setSelectedSourceHandle(null);
                setSelectedNodeId(null);
              }}
              minZoom={0.35}
              maxZoom={1.5}
              deleteKeyCode={null}
              defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
            >
              <PageSectionRegions regions={pageRegions} />
              <Background variant={BackgroundVariant.Dots} gap={18} size={1} />
              <SurveyFlowControls
                isMiniMapVisible={isMiniMapVisible}
                isExpanded={areControlsExpanded}
                onToggleMiniMap={() => setIsMiniMapVisible((visible) => !visible)}
                onToggleExpanded={() => setAreControlsExpanded((expanded) => !expanded)}
              />
              {isMiniMapVisible && <MiniMap position="bottom-right" pannable zoomable nodeColor={(node) => nodeColor((node.data as SurveyFlowNodeData).kind)} />}
            </ReactFlow>
          </SourceHandleSelectionContext.Provider>
        </div>

        <SelectedNodePanel
          selectedNode={selectedNode}
          onAddChoice={addChoice}
          onDeleteNode={deleteSelectedNode}
          onDeleteChoice={(nodeId, index, label) => setPendingChoiceDelete({ nodeId, index, label })}
          onEditContent={(node) => {
            editingContentNodeIdRef.current = node.id;
            contentEditorForm.setFieldValue('content', node.data.content ?? '');
            setIsContentEditorOpen(true);
          }}
          onUpdateChoice={updateChoice}
          onUpdateNode={updateSelectedNode}
          onUpdateQuestionType={updateQuestionType}
        />
      </div>
      <Dialog open={isTitleDialogOpen} onOpenChange={setIsTitleDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>설문 제목 수정</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              setTitle(titleDraft.trim());
              setIsTitleDialogOpen(false);
            }}
          >
            <Input
              autoFocus
              aria-label="설문 제목"
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsTitleDialogOpen(false)}>취소</Button>
              <Button type="submit" disabled={!titleDraft.trim()}>저장</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={pendingChoiceDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingChoiceDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>선택지를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>{pendingChoiceDelete?.label}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!pendingChoiceDelete) return;
                const { nodeId, index } = pendingChoiceDelete;
                setSuppressedEndHandles((current) => reindexSuppressedOptions(current, nodeId, index));
                setNodes((current) => {
                  const question = current.find((node) => node.id === nodeId && node.data.kind === 'question');
                  if (!question || question.data.kind !== 'question') return current;
                  const options = (question.data.options ?? []).filter((_, optionIndex) => optionIndex !== index);
                  return current.map((node) => {
                    if (node.id === nodeId && node.data.kind === 'question') return { ...node, data: { ...node.data, options } };
                    return node;
                  });
                });
                setEdges((current) => current.flatMap((edge) => {
                  const source = edge.source === nodeId
                    ? reindexOptionHandle(edge.sourceHandle, 'option-', index)
                    : { handle: edge.sourceHandle, shouldDelete: false };
                  const target = edge.target === nodeId
                    ? reindexOptionHandle(edge.targetHandle, 'option-input-', index)
                    : { handle: edge.targetHandle, shouldDelete: false };
                  if (source.shouldDelete || target.shouldDelete) return [];
                  return [{ ...edge, sourceHandle: source.handle, targetHandle: target.handle }];
                }));
                setSelectedSourceHandle((current) => {
                  if (current?.nodeId !== nodeId || !current.handleId.startsWith('option-')) return current;
                  const selectedIndex = Number(current.handleId.slice('option-'.length));
                  if (selectedIndex === index) return null;
                  return selectedIndex > index ? { ...current, handleId: `option-${selectedIndex - 1}` } : current;
                });
                setPendingChoiceDelete(null);
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Modal open={isContentEditorOpen} onOpenChange={setIsContentEditorOpen}>
        <Modal.Content
          className="
            h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]
            overflow-hidden
          "
          size="xl"
        >
          <Modal.Header>
            <Modal.Title>콘텐츠 편집</Modal.Title>
            <Modal.Description>서식과 이미지를 포함해 페이지 본문을 작성할 수 있습니다.</Modal.Description>
          </Modal.Header>
          <contentEditorForm.AppForm>
            <Modal.Body className="content-page-editor-body">
              <FormLayout
                id="content-page-editor-form"
                onSubmit={() => void contentEditorForm.handleSubmit()}
                className="content-page-editor-form grid gap-4 py-2"
              >
                <contentEditorForm.AppField name="content">
                  {(field) => (
                    <field.Editor
                      className="content-page-editor-suneditor"
                      height="100%"
                      label="본문"
                      placeholder="페이지에 표시할 내용을 입력하세요."
                    />
                  )}
                </contentEditorForm.AppField>
              </FormLayout>
            </Modal.Body>
            <Modal.Footer>
              <Button type="button" variant="outline" onClick={() => setIsContentEditorOpen(false)}>취소</Button>
              <contentEditorForm.Submit form="content-page-editor-form">적용</contentEditorForm.Submit>
            </Modal.Footer>
          </contentEditorForm.AppForm>
        </Modal.Content>
      </Modal>
      <SurveyPreviewDialog
        title={title}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        pages={previewPages}
        currentPage={currentPreviewPage}
        currentQuestions={currentPreviewQuestions}
        responses={responses}
        onResponsesChange={setResponses}
        hasPendingRoutingResponse={hasPendingRoutingResponse}
        hasBrokenPreviewRoute={hasBrokenPreviewRoute}
        completionLabel={previewCompletionLabel}
        onPageChange={setPreviewPage}
        onUpdateSingleResponse={updateSingleResponse}
        onUpdateMultipleResponse={updateMultipleResponse}
      />
    </section>
  );
}

function SurveyPreviewDialog({
  title,
  open,
  onOpenChange,
  pages,
  currentPage,
  currentQuestions,
  responses,
  onResponsesChange,
  hasPendingRoutingResponse,
  hasBrokenPreviewRoute,
  completionLabel,
  onPageChange,
  onUpdateSingleResponse,
  onUpdateMultipleResponse,
}: {
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  pages: SurveyFlowNode[][]
  currentPage: number
  currentQuestions: SurveyFlowNode[] | undefined
  responses: Record<string, string | string[]>
  onResponsesChange: (action: SetStateAction<Record<string, string | string[]>>) => void
  hasPendingRoutingResponse: boolean
  hasBrokenPreviewRoute: boolean
  completionLabel: string
  onPageChange: (page: number) => void
  onUpdateSingleResponse: (questionId: string, option: string) => void
  onUpdateMultipleResponse: (questionId: string, option: string, checked: boolean | 'indeterminate') => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          h-[90dvh] max-w-xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden
        "
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>설문 미리보기</DialogDescription>
        </DialogHeader>
        <div className="survey-preview-body overflow-y-auto">
          {currentQuestions
            ? (
              <div className={cn(
                'grid gap-5',
                currentQuestions.length === 1 && currentQuestions[0]?.data.kind === 'content' && `
                  survey-preview-content-page
                `,
              )}
              >
                <div className="grid gap-2">
                  <div className="
                    flex items-center justify-between text-xs
                    text-muted-foreground
                  "
                  >
                    <span>
                      페이지
                      {currentPage + 1}
                    </span>
                    <span>
                      {currentPage + 1}
                      {' '}
                      /
                      {' '}
                      {pages.length}
                    </span>
                  </div>
                  <progress className="h-1.5 w-full accent-primary" max={pages.length} value={currentPage + 1} />
                </div>
                {currentQuestions.map((question, index) => question.data.kind === 'content'
                  ? (
                    <article
                      className="
                        survey-preview-content-card grid gap-3 rounded-lg border
                        bg-card p-5
                      "
                      key={question.id}
                    >
                      {question.data.showTitle !== false && (
                        <h2 className="text-lg font-semibold">
                          {question.data.title}
                        </h2>
                      )}
                      {question.data.content && (
                        <EditorViewer
                          content={question.data.content}
                          className="text-sm/6"
                        />
                      )}
                    </article>
                  )
                  : (
                    <fieldset className="grid gap-2" key={question.id}>
                      <legend className="mb-2 text-sm font-medium">
                        {index + 1}
                        .
                        {' '}
                        {question.data.title}
                      </legend>
                      {question.data.questionType === 'text'
                        ? (
                          <Textarea
                            placeholder="답변을 입력하세요"
                            value={typeof responses[question.id] === 'string' ? responses[question.id] as string : ''}
                            onChange={(event) => onResponsesChange((current) => ({ ...current, [question.id]: event.target.value }))}
                          />
                        )
                        : (question.data.options ?? []).filter((option) => option.trim().length > 0).map((option) => (
                          <label
                            className="
                              flex items-center gap-2 rounded-md border p-2.5
                              text-sm
                            "
                            key={`${question.id}-${option}`}
                          >
                            {question.data.questionType === 'multiple'
                              ? (
                                <Checkbox
                                  checked={Array.isArray(responses[question.id]) && (responses[question.id] as string[]).includes(option)}
                                  onCheckedChange={(checked) => onUpdateMultipleResponse(question.id, option, checked)}
                                />
                              )
                              : (
                                <input
                                  checked={responses[question.id] === option}
                                  className="size-4 accent-primary"
                                  name={question.id}
                                  onChange={() => onUpdateSingleResponse(question.id, option)}
                                  type="radio"
                                />
                              )}
                            {option}
                          </label>
                        ))}
                    </fieldset>
                  ))}
              </div>
            )
            : (
              <div className="grid gap-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  미리볼 질문이 없습니다.
                </p>
              </div>
            )}
          {hasBrokenPreviewRoute && (
            <p className="text-sm text-destructive" role="alert">이 응답 경로가 연결되지 않았습니다. 편집기에서 흐름을 연결한 뒤 다시 미리보기 하세요.</p>
          )}
        </div>
        {currentQuestions && (
          <DialogFooter className="sm:justify-between">
            <Button disabled={currentPage === 0} variant="outline" onClick={() => onPageChange(Math.max(currentPage - 1, 0))}>이전 페이지</Button>
            {currentPage < pages.length - 1
              ? (
                <Button disabled={hasPendingRoutingResponse || hasBrokenPreviewRoute} onClick={() => onPageChange(Math.min(currentPage + 1, pages.length - 1))}>
                  다음 페이지
                </Button>
              )
              : <Button disabled={hasPendingRoutingResponse || hasBrokenPreviewRoute} onClick={() => onOpenChange(false)}>{completionLabel}</Button>}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SelectedNodePanel({
  selectedNode,
  onAddChoice,
  onDeleteNode,
  onDeleteChoice,
  onEditContent,
  onUpdateChoice,
  onUpdateNode,
  onUpdateQuestionType,
}: {
  selectedNode?: SurveyFlowNode
  onAddChoice: () => void
  onDeleteNode: () => void
  onDeleteChoice: (nodeId: string, index: number, label: string) => void
  onEditContent: (node: ContentSurveyFlowNode) => void
  onUpdateChoice: (index: number, value: string) => void
  onUpdateNode: (patch: Partial<SurveyFlowNodeData>) => void
  onUpdateQuestionType: (questionType: SurveyQuestionType) => void
}) {
  return (
    <aside className="
      border-l p-4
      max-lg:hidden
    "
    >
      {selectedNode
        ? (
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">노드 편집</h2>
              {selectedNode.data.kind !== 'start' && selectedNode.data.kind !== 'end' && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="
                    text-destructive
                    hover:text-destructive
                  "
                  aria-label="노드 삭제"
                  onClick={onDeleteNode}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
            <label className="grid gap-1.5 text-xs font-medium">
              제목
              <Input value={selectedNode.data.title} onChange={(event) => onUpdateNode({ title: event.target.value })} />
            </label>
            {selectedNode.data.kind === 'question' && (
              <QuestionNodeSettings
                node={selectedNode as QuestionSurveyFlowNode}
                onAddChoice={onAddChoice}
                onDeleteChoice={onDeleteChoice}
                onUpdateChoice={onUpdateChoice}
                onUpdateQuestionType={onUpdateQuestionType}
              />
            )}
            {selectedNode.data.kind === 'content' && (
              <ContentNodeSettings node={selectedNode as ContentSurveyFlowNode} onEditContent={() => onEditContent(selectedNode as ContentSurveyFlowNode)} onUpdateNode={onUpdateNode} />
            )}
          </div>
        )
        : (
          <div className="
            flex h-full flex-col items-center justify-center gap-2 text-center
            text-xs text-muted-foreground
          "
          >
            <ArrowDown className="size-5 -rotate-90 opacity-50" />
            <p>편집할 노드를 선택하세요.</p>
            <p className="max-w-48 text-[11px]">선택한 노드의 제목과 내용을 여기서 편집합니다.</p>
          </div>
        )}
    </aside>
  );
}

function QuestionNodeSettings({
  node,
  onAddChoice,
  onDeleteChoice,
  onUpdateChoice,
  onUpdateQuestionType,
}: {
  node: QuestionSurveyFlowNode
  onAddChoice: () => void
  onDeleteChoice: (nodeId: string, index: number, label: string) => void
  onUpdateChoice: (index: number, value: string) => void
  onUpdateQuestionType: (questionType: SurveyQuestionType) => void
}) {
  const options = node.data.options ?? [];
  return (
    <>
      <label className="grid gap-1.5 text-xs font-medium">
        질문 형식
        <Select value={node.data.questionType ?? 'single'} onValueChange={(value) => onUpdateQuestionType(value as SurveyQuestionType)}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="single">단일 선택</SelectItem>
            <SelectItem value="multiple">복수 선택</SelectItem>
            <SelectItem value="text">주관식</SelectItem>
          </SelectContent>
        </Select>
      </label>
      {node.data.questionType !== 'text' && (
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">선택지</span>
            <Button variant="ghost" size="icon-sm" aria-label="선택지 추가" title="선택지 추가" disabled={options.some((option) => !option.trim())} onClick={onAddChoice}>
              <Plus />
            </Button>
          </div>
          {options.map((option, index) => {
            const duplicate = options.some((value, optionIndex) => optionIndex !== index && Boolean(option.trim()) && value.trim() === option.trim());
            return (
              <div className="flex min-w-0 items-center gap-1.5" key={`option-${index}`}>
                <Input
                  aria-label={`선택지 ${index + 1}`}
                  aria-invalid={duplicate}
                  placeholder={`선택지 ${index + 1} 입력`}
                  value={option}
                  onChange={(event) => onUpdateChoice(index, event.target.value)}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="
                    text-destructive
                    hover:text-destructive
                  "
                  aria-label={`선택지 ${index + 1} 삭제`}
                  onClick={() => onDeleteChoice(node.id, index, option)}
                >
                  <Trash2 />
                </Button>
              </div>
            );
          })}
          {options.some((option) => {
            const trimmedOption = option.trim();
            return Boolean(trimmedOption) && options.filter((value) => value.trim() === trimmedOption).length > 1;
          }) && <p className="text-xs text-destructive">같은 선택지가 이미 있습니다.</p>}
        </div>
      )}
    </>
  );
}

function ContentNodeSettings({
  node,
  onEditContent,
  onUpdateNode,
}: {
  node: ContentSurveyFlowNode
  onEditContent: () => void
  onUpdateNode: (patch: Partial<SurveyFlowNodeData>) => void
}) {
  return (
    <div className="grid gap-2">
      <label className="flex items-center gap-2 text-xs font-medium">
        <Checkbox checked={node.data.showTitle ?? true} onCheckedChange={(checked) => onUpdateNode({ showTitle: checked === true })} />
        제목 표시
      </label>
      <span className="text-xs font-medium">본문</span>
      {node.data.content && (
        <div className="scroll-y max-h-40 rounded-md border p-2 text-xs">
          <EditorViewer content={node.data.content} />
        </div>
      )}
      <Button type="button" variant="outline" onClick={onEditContent}>본문 편집</Button>
    </div>
  );
}

function SurveyFlowControls({
  isMiniMapVisible,
  isExpanded,
  onToggleMiniMap,
  onToggleExpanded,
}: {
  isMiniMapVisible: boolean
  isExpanded: boolean
  onToggleMiniMap: () => void
  onToggleExpanded: () => void
}) {
  return (
    <Controls
      className={isExpanded
        ? 'survey-flow-controls'
        : 'survey-flow-controls is-collapsed'}
      position="bottom-left"
      showFitView={false}
      style={{ bottom: 10 }}
    >
      <ControlButton
        aria-label={isMiniMapVisible ? '미니맵 숨기기' : '미니맵 표시'}
        title={isMiniMapVisible ? '미니맵 숨기기' : '미니맵 표시'}
        aria-pressed={isMiniMapVisible}
        onClick={onToggleMiniMap}
      >
        {isMiniMapVisible ? <EyeOff /> : <Eye />}
      </ControlButton>
      <ControlButton
        aria-label={isExpanded ? '컨트롤 접기' : '컨트롤 펼치기'}
        title={isExpanded ? '컨트롤 접기' : '컨트롤 펼치기'}
        aria-expanded={isExpanded}
        onClick={onToggleExpanded}
      >
        {isExpanded ? <ChevronDown /> : <ChevronUp />}
      </ControlButton>
    </Controls>
  );
}

function PaletteButton({ kind, onClick }: { kind: 'question' | 'page' | 'content', onClick: () => void }) {
  const meta = nodeMeta[kind];
  const Icon = meta.icon;
  const label = meta.label;
  return (
    <Button
      variant="outline"
      className="
        h-auto w-full min-w-0 justify-start gap-2.5 whitespace-normal p-2.5
      "
      onClick={onClick}
    >
      <span className={cn('grid size-7 place-items-center rounded-md', meta.iconClass)}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1 text-left text-xs font-semibold">{label}</span>
      <Plus className="size-3.5 text-muted-foreground" />
    </Button>
  );
}
