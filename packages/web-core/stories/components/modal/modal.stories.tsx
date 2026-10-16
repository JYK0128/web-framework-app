import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Button } from '#ui';
import { Modal, type ModalComponentProps, ModalContainer, openModal } from '#ui/modal';

function ConfirmModal({ subject, close }: ModalComponentProps<boolean> & { subject: string }) {
  return (
    <Modal open>
      <Modal.Content size="sm">
        <Modal.Header>
          <Modal.Title>변경 사항을 저장할까요?</Modal.Title>
          <Modal.Description>
            {subject}
            {' '}
            변경 내용이 저장됩니다.
          </Modal.Description>
        </Modal.Header>
        <Modal.Body>저장 후에도 다시 수정할 수 있습니다.</Modal.Body>
        <Modal.Footer>
          <Button variant="outline" onClick={() => close(false)}>취소</Button>
          <Button onClick={() => close(true)}>저장</Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}

function ModalExamples() {
  const [controlledOpen, setControlledOpen] = useState(false);
  const [result, setResult] = useState('아직 모달을 열지 않았습니다.');

  const askToSave = async () => {
    const saved = await openModal(ConfirmModal, { subject: '프로필' });
    setResult(saved ? '저장했습니다.' : '저장을 취소했습니다.');
  };

  return (
    <div className="grid max-w-lg gap-6">
      <section className="grid gap-3">
        <h2 className="text-base font-semibold">상태로 열기</h2>
        <p className="text-sm text-muted-foreground">화면 안에서 열림 상태를 직접 제어할 때 사용합니다.</p>
        <Button variant="outline" onClick={() => setControlledOpen(true)}>안내 모달 열기</Button>
        <Modal open={controlledOpen} onOpenChange={setControlledOpen}>
          <Modal.Content size="md">
            <Modal.Header>
              <Modal.Title>프로필 안내</Modal.Title>
              <Modal.Description>필수 항목을 입력한 뒤 저장해 주세요.</Modal.Description>
            </Modal.Header>
            <Modal.Body>이 방식은 열림 상태가 해당 화면의 UI 상태일 때 적합합니다.</Modal.Body>
            <Modal.Footer>
              <Button onClick={() => setControlledOpen(false)}>확인</Button>
            </Modal.Footer>
          </Modal.Content>
        </Modal>
      </section>

      <section className="grid gap-3 border-t pt-5">
        <h2 className="text-base font-semibold">Promise로 결과 받기</h2>
        <p className="text-sm text-muted-foreground">openModal은 모달을 열고 close(result) 값으로 완료됩니다.</p>
        <Button onClick={() => void askToSave()}>저장 확인 모달 열기</Button>
        <p aria-live="polite" className="text-sm">{result}</p>
      </section>

      <ModalContainer />
    </div>
  );
}

const meta = {
  title: '웹코어/모달/Modal',
  component: ModalExamples,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '인라인 상태 제어에는 Modal을 사용하고, 확인 후 결과에 따라 다음 동작을 이어갈 때는 openModal을 사용합니다. openModal을 사용하는 앱은 루트에 ModalContainer를 한 번 마운트해야 합니다.',
      },
    },
  },
} satisfies Meta<typeof ModalExamples>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Usage: Story = {};
