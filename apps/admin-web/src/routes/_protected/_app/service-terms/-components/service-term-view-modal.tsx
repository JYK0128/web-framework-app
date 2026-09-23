import { Button } from '#/.generated/shadcn/components/ui';
import type { ModalComponentProps } from '#/components/modal';
import { Modal } from '#/components/modal';
import type { AdminServiceTermItemDto } from '#/.generated/api/model';

export function ServiceTermViewModal({ term, open, onOpenChange }: ModalComponentProps & { term: AdminServiceTermItemDto }) {
  return <Modal open={open} onOpenChange={onOpenChange}><Modal.Content size="xl" className="max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-3xl"><Modal.Header><Modal.Title>약관 상세</Modal.Title><Modal.Description>{term.title} · v{term.version}</Modal.Description></Modal.Header><Modal.Body className="scroll-y"><div className="grid gap-4 py-2"><div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><span>{term.isPublished ? '게시됨' : '초안'}</span><span>·</span><span>{term.isRequired ? '필수 약관' : '선택 약관'}</span></div><div className="grid gap-2"><h3 className="text-sm font-semibold">약관 내용</h3><div className="whitespace-pre-wrap rounded-md border bg-muted/20 p-4 text-sm/6">{term.content}</div></div></div></Modal.Body><Modal.Footer><Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>닫기</Button></Modal.Footer></Modal.Content></Modal>;
}
