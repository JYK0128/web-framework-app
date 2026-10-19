import type { Edge, Node } from '@xyflow/react';

export type SurveyNodeKind = 'start' | 'question' | 'page' | 'content' | 'end';
export type SurveyQuestionType = 'single' | 'multiple' | 'text';

export type SurveyFlowNodeData = {
  kind: SurveyNodeKind
  title: string
  questionType?: SurveyQuestionType
  options?: string[]
  content?: string
  showTitle?: boolean
};

export type SurveyFlowNode = Node<SurveyFlowNodeData>;
export type SurveyFlowEdge = Edge;

export type SurveyFlow = {
  title?: string
  nodes: SurveyFlowNode[]
  edges: SurveyFlowEdge[]
};

export type SurveyFlowEditorProps = {
  initialFlow?: SurveyFlow
  onChange?: (flow: SurveyFlow) => void
  onSave?: (flow: SurveyFlow) => void
  className?: string
};

export const SURVEY_TERMINAL_NODE_HEIGHT = 58;
export const SURVEY_AUTO_LAYOUT_VERTICAL_GAP = 160;
export const SURVEY_QUESTION_BASE_HEIGHT = 112;
export const SURVEY_QUESTION_OPTION_HEIGHT = 36;

export const initialSurveyFlow: SurveyFlow = {
  title: '고객 만족도 조사',
  nodes: [
    { id: 'start', type: 'start', position: { x: 560, y: 64 }, data: { kind: 'start', title: '설문 시작' }, deletable: false },
    {
      id: 'end',
      type: 'end',
      position: { x: 560, y: 64 + SURVEY_TERMINAL_NODE_HEIGHT + SURVEY_AUTO_LAYOUT_VERTICAL_GAP },
      data: { kind: 'end', title: '설문 완료' },
      deletable: false,
    },
  ],
  edges: [],
};
