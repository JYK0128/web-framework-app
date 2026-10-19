import { SURVEY_AUTO_LAYOUT_VERTICAL_GAP, SURVEY_QUESTION_BASE_HEIGHT, SURVEY_QUESTION_OPTION_HEIGHT, SURVEY_TERMINAL_NODE_HEIGHT, type SurveyFlow, type SurveyFlowEdge, type SurveyFlowNode } from './survey-flow.types';

export const endHandleKey = (nodeId: string, handleId?: string | null) => `${nodeId}\u0000${handleId ?? ''}`;

export function getAutomaticEndHandles(node: SurveyFlowNode, edges: SurveyFlowEdge[]) {
  switch (node.data.kind) {
    case 'question': {
      if (node.data.questionType !== 'text') {
        const optionHandles = (node.data.options ?? [])
          .flatMap((option, index) => option.trim() ? [`option-${index}`] : []);
        const hasChoiceBranches = edges.some((edge) => edge.source === node.id && edge.sourceHandle?.startsWith('option-'));
        if (hasChoiceBranches) return optionHandles.filter((handle) => !edges.some((edge) => edge.source === node.id && edge.sourceHandle === handle));
      }
      return ['bottom'];
    }
    case 'start':
    case 'page':
    case 'content':
      return ['bottom'];
    case 'end':
      return [];
  }
}

function getReachableNodeIds(nodes: SurveyFlowNode[], edges: SurveyFlowEdge[]) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const outgoingEdges = new Map<string, string[]>();
  for (const edge of edges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      const targets = outgoingEdges.get(edge.source) ?? [];
      targets.push(edge.target);
      outgoingEdges.set(edge.source, targets);
    }
  }

  const reachable = new Set<string>();
  const pending = nodes.filter((node) => node.data.kind === 'start').map((node) => node.id);
  while (pending.length > 0) {
    const nodeId = pending.pop();
    if (!nodeId || reachable.has(nodeId)) continue;
    reachable.add(nodeId);
    pending.push(...(outgoingEdges.get(nodeId) ?? []));
  }
  return reachable;
}

function getOutputHandles(node: SurveyFlowNode) {
  if (node.data.kind === 'start' || node.data.kind === 'page' || node.data.kind === 'content') return ['bottom'];
  if (node.data.kind !== 'question' || node.data.questionType === 'text') return node.data.kind === 'end' ? [] : ['bottom'];
  return (node.data.options ?? []).flatMap((option, index) => option.trim() ? [`option-${index}`] : []);
}

export function isValidSurveyFlowConnection(
  connection: { source: string | null, target: string | null, sourceHandle?: string | null, targetHandle?: string | null },
  nodes: SurveyFlowNode[],
  edges: SurveyFlowEdge[] = [],
) {
  if (!connection.source || !connection.target || connection.source === connection.target || !connection.sourceHandle) return false;
  const source = nodes.find((node) => node.id === connection.source);
  const target = nodes.find((node) => node.id === connection.target);
  if (!source || !target || target.data.kind === 'start' || source.data.kind === 'end') return false;
  const isChoiceQuestionBottom = source.data.kind === 'question'
    && source.data.questionType !== 'text'
    && connection.sourceHandle === 'bottom';
  if (isChoiceQuestionBottom && edges.some((edge) => edge.source === source.id && edge.sourceHandle?.startsWith('option-'))) return false;
  if (!isChoiceQuestionBottom && !getOutputHandles(source).includes(connection.sourceHandle)) return false;

  const targetHandle = connection.targetHandle;
  if (!targetHandle) return true;
  if (['top', 'right', 'bottom', 'left'].includes(targetHandle)) return true;
  if (target.data.kind !== 'question' || target.data.questionType === 'text' || !targetHandle.startsWith('option-input-')) return false;
  const optionIndex = Number(targetHandle.slice('option-input-'.length));
  return Number.isInteger(optionIndex) && Boolean(target.data.options?.[optionIndex]?.trim());
}

function hasDirectedCycle(nodes: SurveyFlowNode[], edges: SurveyFlowEdge[]) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const indegree = new Map(nodes.map((node) => [node.id, 0]));
  const outgoingEdges = new Map<string, string[]>();
  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    const targets = outgoingEdges.get(edge.source) ?? [];
    targets.push(edge.target);
    outgoingEdges.set(edge.source, targets);
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  }

  const pending = [...indegree].filter(([, degree]) => degree === 0).map(([nodeId]) => nodeId);
  let visitedCount = 0;
  while (pending.length > 0) {
    const nodeId = pending.pop();
    if (!nodeId) continue;
    visitedCount++;
    for (const targetId of outgoingEdges.get(nodeId) ?? []) {
      const nextDegree = (indegree.get(targetId) ?? 0) - 1;
      indegree.set(targetId, nextDegree);
      if (nextDegree === 0) pending.push(targetId);
    }
  }
  return visitedCount !== nodeIds.size;
}

function getRequiredOutputHandles(node: SurveyFlowNode, edges: SurveyFlowEdge[]) {
  if (node.data.kind === 'question' && node.data.questionType !== 'text') {
    const optionHandles = getOutputHandles(node);
    const hasChoiceBranches = edges.some((edge) => edge.source === node.id && edge.sourceHandle?.startsWith('option-'));
    return hasChoiceBranches ? optionHandles : ['bottom'];
  }
  return getOutputHandles(node);
}

function getChoicePreviewEdges(
  node: SurveyFlowNode,
  edges: SurveyFlowEdge[],
  responses: Record<string, string | string[]>,
) {
  const optionEdges = edges.filter((edge) => edge.sourceHandle?.startsWith('option-'));
  if (node.data.questionType === 'text' || optionEdges.length === 0) {
    const nextEdges = edges.filter((edge) => edge.sourceHandle === 'bottom');
    return { edges: nextEdges, blockReason: nextEdges.length === 0 ? 'route' as const : undefined, questionId: node.id };
  }
  const answer = responses[node.id];
  const values = Array.isArray(answer) ? answer : [answer].filter((value): value is string => Boolean(value?.trim()));
  if (values.length === 0) return { edges: [], blockReason: 'response' as const, questionId: node.id };
  const selectedIndexes = (node.data.options ?? [])
    .map((option, index) => values.includes(option) ? index : -1)
    .filter((index) => index >= 0);
  const nextEdges = edges.filter((edge) => selectedIndexes.some((index) => edge.sourceHandle === `option-${index}`));
  const hasUnconnectedSelection = selectedIndexes.some((index) => !edges.some((edge) => edge.sourceHandle === `option-${index}`));
  return { edges: nextEdges, blockReason: nextEdges.length === 0 || hasUnconnectedSelection ? 'route' as const : undefined, questionId: node.id };
}

function getPreviewNextEdges(
  node: SurveyFlowNode,
  edges: SurveyFlowEdge[],
  responses: Record<string, string | string[]>,
) {
  if (node.data.kind === 'end') return { edges: [], blockReason: undefined, questionId: undefined };
  if (node.data.kind === 'question') return getChoicePreviewEdges(node, edges, responses);
  return { edges, blockReason: edges.length === 0 ? 'route' as const : undefined, questionId: undefined };
}

function getConnectionValidationIssues(nodes: SurveyFlowNode[], edges: SurveyFlowEdge[]) {
  const issues = edges.flatMap((edge) => {
    const source = nodes.find((node) => node.id === edge.source);
    const target = nodes.find((node) => node.id === edge.target);
    if (source && target && isValidSurveyFlowConnection(edge, nodes, edges)) return [];
    return [`${source?.data.title ?? edge.source}에서 ${target?.data.title ?? edge.target}로 이어지는 연결이 노드 역할과 맞지 않습니다.`];
  });
  const outputCounts = new Map<string, number>();
  for (const edge of edges) {
    const outputKey = `${edge.source}\u0000${edge.sourceHandle ?? ''}`;
    outputCounts.set(outputKey, (outputCounts.get(outputKey) ?? 0) + 1);
  }
  for (const [outputKey, count] of outputCounts) {
    if (count < 2) continue;
    const [sourceId, handle] = outputKey.split('\u0000');
    const source = nodes.find((node) => node.id === sourceId);
    issues.push(`${source?.data.title ?? sourceId} 노드의 ${handle || '기본'} 출력이 여러 경로에 연결되어 있습니다.`);
  }
  return issues;
}

function getNodeStructureIssues(nodes: SurveyFlowNode[], edges: SurveyFlowEdge[]) {
  const issues: string[] = [];
  const idCounts = new Map<string, number>();
  for (const node of nodes) {
    idCounts.set(node.id, (idCounts.get(node.id) ?? 0) + 1);
    if (!node.id.trim()) issues.push(`${node.data.title || '이름 없는 노드'}의 ID가 비어 있습니다.`);
    if (node.type !== node.data.kind) issues.push(`${node.data.title} 노드의 종류 정보가 서로 다릅니다.`);
    if (!node.data.title.trim()) issues.push('노드 이름을 입력하세요.');
    const questionType = node.data.questionType as string | undefined;
    if (node.data.kind === 'question' && questionType && !['single', 'multiple', 'text'].includes(questionType)) {
      issues.push(`${node.data.title} 질문 형식이 올바르지 않습니다.`);
    }
  }
  if ([...idCounts.values()].some((count) => count > 1)) issues.push('노드 ID가 중복되어 있습니다.');
  const edgeIdCounts = new Map<string, number>();
  for (const edge of edges) {
    edgeIdCounts.set(edge.id, (edgeIdCounts.get(edge.id) ?? 0) + 1);
    if (!edge.id.trim()) issues.push('연결선 ID가 비어 있습니다.');
  }
  if ([...edgeIdCounts.values()].some((count) => count > 1)) issues.push('연결선 ID가 중복되어 있습니다.');
  return issues;
}

function getOutputHandleLabel(node: SurveyFlowNode, handle: string) {
  if (handle.startsWith('option-') && node.data.kind === 'question') {
    return `선택지 “${node.data.options?.[Number(handle.slice('option-'.length))]}”`;
  }
  return '기본';
}

function getOpenOutputIssues(nodes: SurveyFlowNode[], edges: SurveyFlowEdge[], reachable: Set<string>) {
  const issues: string[] = [];
  const reachableNodes = nodes.filter((node) => reachable.has(node.id) && node.data.kind !== 'end');
  for (const node of reachableNodes) {
    const openHandles = getRequiredOutputHandles(node, edges).filter((handle) =>
      !edges.some((edge) => edge.source === node.id && edge.sourceHandle === handle),
    );
    for (const handle of openHandles) {
      issues.push(`${node.data.title} 노드의 ${getOutputHandleLabel(node, handle)} 경로가 연결되지 않았습니다.`);
    }
  }
  return issues;
}

function getQuestionValidationIssues(nodes: SurveyFlowNode[]) {
  const issues: string[] = [];
  for (const question of nodes.filter((node) => node.data.kind === 'question')) {
    if (question.data.questionType === 'text') continue;
    const rawOptions = question.data.options ?? [];
    const options = rawOptions.map((option) => option.trim()).filter(Boolean);
    if (options.length === 0) issues.push(`${question.data.title} 질문에 선택지가 없습니다.`);
    if (rawOptions.some((option) => !option.trim())) issues.push(`${question.data.title} 질문의 선택지를 입력하세요.`);
    if (new Set(options).size !== options.length) issues.push(`${question.data.title} 질문에 중복 선택지가 있습니다.`);
  }
  return issues;
}

export function getSurveyFlowValidationIssues(nodes: SurveyFlowNode[], edges: SurveyFlowEdge[]) {
  const starts = nodes.filter((node) => node.data.kind === 'start');
  const issues = starts.length === 0 ? ['설문 시작 노드가 없습니다.'] : [];
  const ends = nodes.filter((node) => node.data.kind === 'end');
  if (ends.length === 0) issues.push('설문 종료 노드가 없습니다.');
  issues.push(...getNodeStructureIssues(nodes, edges));
  if (hasDirectedCycle(nodes, edges)) issues.push('설문 흐름에 순환 연결이 있습니다.');
  issues.push(...getConnectionValidationIssues(nodes, edges));
  const reachable = getReachableNodeIds(nodes, edges);
  if (ends.length > 0 && !ends.some((node) => reachable.has(node.id))) {
    issues.push('시작점에서 도달할 수 있는 종료 노드가 없습니다.');
  }
  issues.push(...nodes.filter((node) => !reachable.has(node.id)).map((node) => `${node.data.title} 노드가 시작점에서 도달할 수 없습니다.`));
  issues.push(...getOpenOutputIssues(nodes, edges, reachable));
  issues.push(...getQuestionValidationIssues(nodes));
  return issues;
}

function getBranchedChoiceQuestionIds(nodes: SurveyFlowNode[], edges: SurveyFlowEdge[]) {
  return new Set(nodes.flatMap((node) => node.data.kind === 'question'
    && node.data.questionType !== 'text'
    && edges.some((edge) => edge.source === node.id && edge.sourceHandle?.startsWith('option-'))
    ? [node.id]
    : []));
}

function appendAutomaticEndEdge(edges: SurveyFlowEdge[], node: SurveyFlowNode, sourceHandle: string, endNodeId: string, suppressedEndHandles: Set<string>) {
  if (edges.some((edge) => edge.source === node.id && edge.sourceHandle === sourceHandle)) return edges;
  if (suppressedEndHandles.has(endHandleKey(node.id, sourceHandle))) return edges;
  return [...edges,
    {
      id: `auto-end-${encodeURIComponent(JSON.stringify([node.id, sourceHandle]))}`,
      source: node.id,
      ...(sourceHandle ? { sourceHandle } : {}),
      target: endNodeId,
      targetHandle: 'top',
      type: 'smoothstep',
      ...(node.data.kind === 'question' && node.data.questionType !== 'text' && sourceHandle.startsWith('option-')
        ? { label: node.data.options?.[Number(sourceHandle.slice('option-'.length))] }
        : {}),
    }];
}

export function connectOpenOutputsToEnd(nodes: SurveyFlowNode[], edges: SurveyFlowEdge[], suppressedEndHandles: Set<string>) {
  const endNode = nodes.find((node) => node.data.kind === 'end');
  if (!endNode) return edges;

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  let labelsChanged = false;
  const labeledEdges = edges.map((edge) => {
    const source = nodeById.get(edge.source);
    if (source?.data.kind !== 'question' || source.data.questionType === 'text' || !edge.sourceHandle?.startsWith('option-')) return edge;
    const optionIndex = Number(edge.sourceHandle.slice('option-'.length));
    const label = Number.isInteger(optionIndex) && optionIndex >= 0 ? source.data.options?.[optionIndex] : undefined;
    if (!label || edge.label === label) return edge;
    labelsChanged = true;
    return { ...edge, label };
  });
  const activeInputEdges = labelsChanged ? labeledEdges : edges;

  const branchedQuestions = getBranchedChoiceQuestionIds(nodes, activeInputEdges);
  const hasObsoleteCommonOutput = branchedQuestions.size > 0
    && activeInputEdges.some((edge) => branchedQuestions.has(edge.source) && edge.sourceHandle === 'bottom');
  const activeEdges = hasObsoleteCommonOutput
    ? activeInputEdges.filter((edge) => !(branchedQuestions.has(edge.source) && edge.sourceHandle === 'bottom'))
    : activeInputEdges;
  return nodes.reduce((currentEdges, node) => getAutomaticEndHandles(node, currentEdges)
    .reduce((nextEdges, handle) => appendAutomaticEndEdge(nextEdges, node, handle, endNode.id, suppressedEndHandles), currentEdges), activeEdges);
}

export function getSurveyNodeSize(node: SurveyFlowNode) {
  const width = node.measured?.width ?? node.width ?? 256;
  const kind = node.data.kind;
  let estimatedHeight = SURVEY_TERMINAL_NODE_HEIGHT;
  if (kind === 'question') estimatedHeight = SURVEY_QUESTION_BASE_HEIGHT + (node.data.options?.length ?? 0) * SURVEY_QUESTION_OPTION_HEIGHT;
  if (kind === 'page') estimatedHeight = 112;
  if (kind === 'content') estimatedHeight = 144;

  return { width, height: node.measured?.height ?? node.height ?? estimatedHeight };
}

function getPageSectionAssignments(nodes: SurveyFlowNode[], edges: SurveyFlowEdge[]) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const incoming = new Map(nodes.map((node) => [node.id, [] as SurveyFlowEdge[]]));
  const outgoing = new Map(nodes.map((node) => [node.id, [] as SurveyFlowEdge[]]));
  for (const edge of edges) {
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) continue;
    incoming.get(edge.target)?.push(edge);
    outgoing.get(edge.source)?.push(edge);
  }

  const order = getTopologicalOrder(nodes, new Map(nodes.map((node, index) => [node.id, index])), incoming, outgoing);
  const sectionById = new Map<string, number>();
  for (const nodeId of order) {
    const parentSections = (incoming.get(nodeId) ?? []).map((edge) => {
      const parent = nodeById.get(edge.source);
      return (sectionById.get(edge.source) ?? 0) + Number(parent?.data.kind === 'page' || parent?.data.kind === 'content');
    });
    sectionById.set(nodeId, Math.max(0, ...parentSections));
  }
  return sectionById;
}

function getPageSectionRegion(index: number, sectionNodes: SurveyFlowNode[]) {
  const bounds = sectionNodes.map((node) => {
    const size = getSurveyNodeSize(node);
    return { left: node.position.x, top: node.position.y, right: node.position.x + size.width, bottom: node.position.y + size.height };
  });
  const left = Math.min(...bounds.map((bound) => bound.left)) - 36;
  const top = Math.min(...bounds.map((bound) => bound.top)) - 48;
  const right = Math.max(...bounds.map((bound) => bound.right)) + 36;
  const bottom = Math.max(...bounds.map((bound) => bound.bottom)) + 36;
  return { index, label: `구역 ${index + 1}`, left, top, width: right - left, height: bottom - top };
}

export function getSurveyPageRegions(nodes: SurveyFlowNode[], edges: SurveyFlowEdge[]) {
  if (!nodes.some((node) => node.data.kind === 'page' || node.data.kind === 'content')) return [];
  const sectionById = getPageSectionAssignments(nodes, edges);
  const groupedNodes = new Map<number, SurveyFlowNode[]>();
  for (const node of nodes) {
    if (node.data.kind === 'start' || node.data.kind === 'end') continue;
    const section = sectionById.get(node.id) ?? 0;
    const sectionNodes = groupedNodes.get(section) ?? [];
    sectionNodes.push(node);
    groupedNodes.set(section, sectionNodes);
  }

  return [...groupedNodes.entries()]
    .sort(([first], [second]) => first - second)
    .map(([section, sectionNodes]) => getPageSectionRegion(section, sectionNodes));
}

function getTopologicalOrder(nodes: SurveyFlowNode[], nodeOrder: Map<string, number>, incoming: Map<string, SurveyFlowEdge[]>, outgoing: Map<string, SurveyFlowEdge[]>) {
  const indegree = new Map(nodes.map((node) => [node.id, incoming.get(node.id)?.length ?? 0]));
  const ready = nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id);
  const order: string[] = [];
  while (ready.length > 0) {
    ready.sort((first, second) => nodeOrder.get(first)! - nodeOrder.get(second)!);
    const nodeId = ready.shift()!;
    order.push(nodeId);
    for (const edge of outgoing.get(nodeId) ?? []) {
      const degree = (indegree.get(edge.target) ?? 0) - 1;
      indegree.set(edge.target, degree);
      if (degree === 0) ready.push(edge.target);
    }
  }
  return order;
}

function getLayoutRanks(
  nodes: SurveyFlowNode[],
  nodeById: Map<string, SurveyFlowNode>,
  incoming: Map<string, SurveyFlowEdge[]>,
  outgoing: Map<string, SurveyFlowEdge[]>,
  nodeOrder: Map<string, number>,
) {
  const order = getTopologicalOrder(nodes, nodeOrder, incoming, outgoing);
  const rank = new Map<string, number>();
  const lane = new Map<string, number>();
  const branchDepth = new Map<string, number>();
  const roots = nodes.filter((node) => (incoming.get(node.id)?.length ?? 0) === 0 && node.data.kind !== 'end');
  for (const nodeId of order) {
    const node = nodeById.get(nodeId)!;
    const parents = incoming.get(nodeId) ?? [];
    if (parents.length === 0) {
      const rootOffset = node.data.kind === 'start' || node.data.kind === 'end' ? 0 : (roots.indexOf(node) + 1) * 1.5;
      rank.set(nodeId, 0);
      lane.set(nodeId, rootOffset);
      branchDepth.set(nodeId, 0);
      continue;
    }
    rank.set(nodeId, Math.max(...parents.map((edge) => (rank.get(edge.source) ?? 0) + 1)));
    lane.set(nodeId, parents.reduce((total, edge) => total + (lane.get(edge.source) ?? 0) + getBranchOffset(edge, nodeById, branchDepth), 0) / parents.length);
    branchDepth.set(nodeId, Math.max(...parents.map((edge) => (branchDepth.get(edge.source) ?? 0) + Number(isBranchEdge(edge, nodeById)))));
  }
  const lastRank = Math.max(0, ...nodes.filter((node) => node.data.kind !== 'end').map((node) => rank.get(node.id) ?? 0));
  for (const node of nodes.filter((item) => item.data.kind === 'end')) rank.set(node.id, lastRank + 1);
  return { rank, lane };
}

function getLayoutPositions(
  nodes: SurveyFlowNode[],
  rank: Map<string, number>,
  lane: Map<string, number>,
  nodeOrder: Map<string, number>,
  incoming: Map<string, SurveyFlowEdge[]>,
) {
  const nodesByRank = new Map<number, SurveyFlowNode[]>();
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  for (const node of nodes) {
    const nodeRank = rank.get(node.id);
    if (nodeRank === undefined) continue;
    const rankNodes = nodesByRank.get(nodeRank) ?? [];
    rankNodes.push(node);
    nodesByRank.set(nodeRank, rankNodes);
  }
  const positions = new Map<string, { x: number, y: number }>();
  let y = 48;
  const maxRank = Math.max(0, ...nodesByRank.keys());
  for (let currentRank = 0; currentRank <= maxRank; currentRank++) {
    const getParentCenter = (node: SurveyFlowNode) => {
      const parentCenters = (incoming.get(node.id) ?? []).flatMap((edge) => {
        const parentPosition = positions.get(edge.source);
        const parentNode = nodeById.get(edge.source);
        if (!parentPosition || !parentNode) return [];
        return [parentPosition.x + getSurveyNodeSize(parentNode).width / 2];
      });
      if (parentCenters.length === 0) return lane.get(node.id) ?? 0;
      return parentCenters.reduce((total, center) => total + center, 0) / parentCenters.length;
    };
    const rankNodes = (nodesByRank.get(currentRank) ?? []).sort((first, second) =>
      getParentCenter(first) - getParentCenter(second)
      || (lane.get(first.id) ?? 0) - (lane.get(second.id) ?? 0)
      || nodeOrder.get(first.id)! - nodeOrder.get(second.id)!,
    );
    const sizes = rankNodes.map(getSurveyNodeSize);
    const desiredCenters = rankNodes.map((node) => (lane.get(node.id) ?? 0) * 420);
    const centers = getNodeCenters(sizes, desiredCenters);
    if (centers.length === 0) continue;
    const shift = (centers[0] + centers[centers.length - 1] - desiredCenters[0] - desiredCenters[desiredCenters.length - 1]) / 2;
    for (let index = 0; index < rankNodes.length; index++) {
      positions.set(rankNodes[index].id, { x: centers[index] - shift - sizes[index].width / 2 + 48, y });
    }
    y += Math.max(...sizes.map((size) => size.height)) + SURVEY_AUTO_LAYOUT_VERTICAL_GAP;
  }
  return positions;
}

function getNodeCenters(sizes: { width: number, height: number }[], desiredCenters: number[]) {
  const centers: number[] = [];
  for (let index = 0; index < desiredCenters.length; index++) {
    const minCenter = index === 0
      ? Number.NEGATIVE_INFINITY
      : centers[index - 1] + sizes[index - 1].width / 2 + sizes[index].width / 2 + 80;
    centers.push(Math.max(desiredCenters[index], minCenter));
  }
  return centers;
}

export function getAutoLayoutedNodes(nodes: SurveyFlowNode[], edges: SurveyFlowEdge[]) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const incoming = new Map(nodes.map((node) => [node.id, [] as SurveyFlowEdge[]]));
  const outgoing = new Map(nodes.map((node) => [node.id, [] as SurveyFlowEdge[]]));
  for (const edge of edges) {
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) continue;
    outgoing.get(edge.source)?.push(edge);
    incoming.get(edge.target)?.push(edge);
  }
  const nodeOrder = new Map(nodes.map((node, index) => [node.id, index]));
  const { rank, lane } = getLayoutRanks(nodes, nodeById, incoming, outgoing, nodeOrder);
  const positions = getLayoutPositions(nodes, rank, lane, nodeOrder, incoming);
  const startNode = nodes.find((node) => node.data.kind === 'start');
  const startLayoutPosition = startNode ? positions.get(startNode.id) : undefined;
  const layoutOffset = startNode && startLayoutPosition
    ? { x: startNode.position.x - startLayoutPosition.x, y: startNode.position.y - startLayoutPosition.y }
    : { x: 0, y: 0 };
  return nodes.map((node) => {
    const position = positions.get(node.id);
    return position
      ? { ...node, position: { x: position.x + layoutOffset.x, y: position.y + layoutOffset.y } }
      : node;
  });
}

function isBranchEdge(edge: SurveyFlowEdge, nodes: Map<string, SurveyFlowNode>) {
  const source = nodes.get(edge.source);
  if (source?.data.kind !== 'question' || !edge.sourceHandle?.startsWith('option-')) return false;
  return (source.data.options?.filter((option) => option.trim()).length ?? 0) > 1;
}

function getBranchOffset(edge: SurveyFlowEdge, nodes: Map<string, SurveyFlowNode>, branchDepth: Map<string, number>) {
  if (!isBranchEdge(edge, nodes)) return 0;
  const source = nodes.get(edge.source)!;
  const branchCount = source.data.options?.filter((option) => option.trim()).length ?? 0;
  const optionIndex = Number(edge.sourceHandle?.slice('option-'.length));
  const branchIndex = (source.data.options ?? []).slice(0, optionIndex + 1).filter((option) => option.trim()).length - 1;
  const centeredOffset = branchCount < 2 ? 0 : branchIndex / (branchCount - 1) - 0.5;
  return centeredOffset * (0.25 ** ((branchDepth.get(edge.source) ?? 0) + 1));
}

export function getPreviewFlow(nodes: SurveyFlowNode[], edges: SurveyFlowEdge[], responses: Record<string, string | string[]>) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const outgoingEdges = new Map<string, SurveyFlowEdge[]>();
  for (const edge of edges) {
    const sourceEdges = outgoingEdges.get(edge.source) ?? [];
    sourceEdges.push(edge);
    outgoingEdges.set(edge.source, sourceEdges);
  }

  const orderedNodes: SurveyFlowNode[] = [];
  const visited = new Set<string>();
  let blockedRouting: { reason: 'response' | 'route', questionId?: string } | undefined;
  let latestQuestionId: string | undefined;
  const visit = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    const node = nodesById.get(nodeId);
    if (!node) return;
    visited.add(nodeId);
    orderedNodes.push(node);
    if (node.data.kind === 'question') latestQuestionId = node.id;
    const nextEdges = outgoingEdges.get(nodeId) ?? [];
    const routing = getPreviewNextEdges(node, nextEdges, responses);
    if (routing.blockReason && !blockedRouting) {
      blockedRouting = { reason: routing.blockReason, questionId: routing.questionId ?? latestQuestionId };
    }
    for (const edge of routing.edges) {
      if (!nodesById.has(edge.target)) {
        if (!blockedRouting) blockedRouting = { reason: 'route', questionId: latestQuestionId };
        continue;
      }
      visit(edge.target);
    }
  };

  const sortByCanvasPosition = (first: SurveyFlowNode, second: SurveyFlowNode) => first.position.x - second.position.x || first.position.y - second.position.y;
  nodes.filter((node) => node.data.kind === 'start').sort(sortByCanvasPosition).forEach((node) => visit(node.id));

  const pages: SurveyFlowNode[][] = [];
  let currentPage: SurveyFlowNode[] = [];
  for (const node of orderedNodes) {
    if (node.data.kind === 'page') {
      if (currentPage.length > 0) pages.push(currentPage);
      currentPage = [];
    }
    else if (node.data.kind === 'content') {
      if (currentPage.length > 0) pages.push(currentPage);
      pages.push([node]);
      currentPage = [];
    }
    else if (node.data.kind === 'question') {
      currentPage.push(node);
    }
  }
  if (currentPage.length > 0) pages.push(currentPage);
  return { pages, blockedRouting };
}

export function toSurveyFlow(title: string, nodes: SurveyFlowNode[], edges: SurveyFlowEdge[]): SurveyFlow {
  return {
    title,
    nodes: nodes.map(({ id, type, position, data }) => ({ id, type, position, data })),
    edges: edges.map(({ id, source, target, sourceHandle, targetHandle, type, label }) => ({ id, source, target, sourceHandle, targetHandle, type, label })),
  };
}

export function serializeFlow(title: string, nodes: SurveyFlowNode[], edges: SurveyFlowEdge[]) {
  return JSON.stringify(toSurveyFlow(title, nodes, edges));
}
