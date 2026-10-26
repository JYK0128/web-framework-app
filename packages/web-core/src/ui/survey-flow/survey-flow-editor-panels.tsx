import { ArrowDown, Plus, Trash2 } from 'lucide-react';
import { type SetStateAction } from 'react';

import { cn } from '#.generated/shadcn/lib/utils';
import { Button, Checkbox, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '#ui';
import { EditorViewer } from '#ui/editor';

import type { SurveyFlowNode, SurveyFlowNodeData, SurveyQuestionType } from './survey-flow.types';

type QuestionSurveyFlowNode = Omit<SurveyFlowNode, 'data'> & { data: SurveyFlowNodeData & { kind: 'question' } };
type ContentSurveyFlowNode = Omit<SurveyFlowNode, 'data'> & { data: SurveyFlowNodeData & { kind: 'content' } };

export { ContentNodeSettings, QuestionNodeSettings, SelectedNodePanel, SurveyPreviewDialog };

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
  const questionTypeOptions = [
    { value: 'single', label: '단일 선택' },
    { value: 'multiple', label: '복수 선택' },
    { value: 'text', label: '주관식' },
  ];
  return (
    <>
      <label className="grid gap-1.5 text-xs font-medium">
        질문 형식
        <Select items={questionTypeOptions} value={node.data.questionType ?? 'single'} onValueChange={(value) => onUpdateQuestionType(value as SurveyQuestionType)}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {questionTypeOptions.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
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
