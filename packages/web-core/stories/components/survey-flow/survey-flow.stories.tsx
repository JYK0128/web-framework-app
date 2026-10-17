import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { initialSurveyFlow, type SurveyFlow, SurveyFlowEditor } from '#ui/survey-flow';

const description = `
설문 흐름을 노드와 연결선으로 구성하는 편집기입니다. 시작, 질문, 페이지 구분, 종료 노드를 추가하고 캔버스에서 연결할 수 있습니다. 노드를 선택하면 오른쪽 설정 패널에서 제목, 질문 형식, 선택지를 편집합니다.

처음에는 예시 제목과 시작·완료 노드만 있습니다. 제목 옆 연필 아이콘을 눌러 제목을 수정하고, 노드를 추가해 설문 흐름을 구성하세요. 자동 정렬은 노드를 위에서 아래로 배치합니다. 시작·페이지·주관식 질문 출력은 노드 아래쪽에, 다음 노드 입력은 위쪽에 표시됩니다. 선택형 질문은 각 선택지에 출력 핸들이 있습니다. 선택지를 다음 질문에 연결하면 그 응답을 골랐을 때 해당 질문으로 이동합니다. 연결하지 않은 선택지는 종료 노드로 연결됩니다. 선택지 항목을 누르고 노드를 추가하면 해당 선택지에서 새 질문으로 연결됩니다. 선택한 출력에 기존 연결이 있으면 연결 대상을 새 질문 뒤로 이어줍니다. 연결선을 선택하고 Backspace 또는 Delete를 누르면 해당 선을 삭제할 수 있습니다. 노드를 드래그해 배치하고, 연결점을 끌어 직접 연결할 수도 있습니다. 페이지 구분 노드 앞의 질문은 한 페이지에 함께 표시되고, 노드를 기준으로 다음 페이지가 시작됩니다. 선택한 일반 노드도 Delete 또는 Backspace 키로 삭제할 수 있습니다.

미리보기에서는 페이지 구분 노드 기준으로 질문을 묶어 보여주며, 이전 페이지와 다음 페이지로 이동할 수 있습니다.

설문 제목을 편집하고 \`initialFlow\`로 저장된 흐름을 불러옵니다. \`onChange\`는 편집 중 변경을 전달하고 저장 버튼은 제목, 노드와 연결선을 \`onSave\`로 전달합니다. 앱에서 사용할 때는 \`@pkg/web-core/survey-flow\`와 \`@pkg/web-core/survey-flow.css\`를 가져오세요. React Flow 스타일시트는 앱의 Tailwind 스타일 뒤에 포함해야 합니다.

\`\`\`tsx
import { useState } from 'react';
import { initialSurveyFlow, SurveyFlowEditor, type SurveyFlow } from '@pkg/web-core/survey-flow';
import '@pkg/web-core/survey-flow.css';

function SurveyBuilder() {
  const [flow, setFlow] = useState<SurveyFlow>(initialSurveyFlow);
  return <SurveyFlowEditor initialFlow={flow} onChange={setFlow} onSave={saveSurvey} />;
}
\`\`\`
`;

const meta = {
  title: '웹코어/설문 흐름/SurveyFlow',
  component: SurveyFlowEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: description } },
  },
} satisfies Meta<typeof SurveyFlowEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

function SurveyFlowExample() {
  const [flow, setFlow] = useState<SurveyFlow>(initialSurveyFlow);
  return <SurveyFlowEditor className="h-full" initialFlow={flow} onChange={setFlow} onSave={setFlow} />;
}

export const SurveyFlow: Story = {
  render: () => (
    <div className="h-screen min-h-0 p-4">
      <SurveyFlowExample />
    </div>
  ),
};
