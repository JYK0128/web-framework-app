import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router';

import type { ChartConfig } from '#.generated/shadcn/components/ui/chart';
import { AreaChart, BarChart, ComposedChart, LineChart, PieChart, RadarChart, RadialBarChart, ScatterChart, StackedBarChart, TreemapChart } from '#ui/chart';

const monthlyData = [
  { month: '1월', sales: 186, visitors: 120, orders: 90 },
  { month: '2월', sales: 305, visitors: 220, orders: 140 },
  { month: '3월', sales: 237, visitors: 190, orders: 170 },
  { month: '4월', sales: 273, visitors: 260, orders: 210 },
  { month: '5월', sales: 209, visitors: 180, orders: 160 },
  { month: '6월', sales: 314, visitors: 290, orders: 240 },
];

const seriesConfig: ChartConfig = {
  sales: { label: '매출', color: 'var(--chart-1)' },
  visitors: { label: '방문자', color: 'var(--chart-2)' },
  orders: { label: '주문', color: 'var(--chart-3)' },
};

const shareData = [
  { browser: 'Chrome', share: 48 },
  { browser: 'Safari', share: 25 },
  { browser: 'Firefox', share: 15 },
  { browser: '기타', share: 12 },
];

const shareConfig: ChartConfig = {
  Chrome: { label: 'Chrome', color: 'var(--chart-1)' },
  Safari: { label: 'Safari', color: 'var(--chart-2)' },
  Firefox: { label: 'Firefox', color: 'var(--chart-3)' },
  기타: { label: '기타', color: 'var(--chart-4)' },
};

const skillData = [
  { skill: '기획', design: 82, engineering: 72 },
  { skill: '디자인', design: 91, engineering: 65 },
  { skill: '개발', design: 64, engineering: 94 },
  { skill: '분석', design: 75, engineering: 86 },
  { skill: '협업', design: 88, engineering: 80 },
];

const skillConfig: ChartConfig = {
  design: { label: '디자인', color: 'var(--chart-1)' },
  engineering: { label: '개발', color: 'var(--chart-2)' },
};

const scatterData = [
  { team: 'A팀', points: [{ x: 12, y: 35 }, { x: 22, y: 48 }, { x: 36, y: 52 }, { x: 48, y: 72 }] },
  { team: 'B팀', points: [{ x: 18, y: 24 }, { x: 30, y: 40 }, { x: 42, y: 45 }, { x: 55, y: 63 }] },
];

const fileData = [
  { name: '문서', value: 42 },
  { name: '이미지', value: 28 },
  { name: '영상', value: 18 },
  { name: '기타', value: 12 },
];

const categoryConfig: ChartConfig = {
  문서: { label: '문서', color: 'var(--chart-1)' },
  이미지: { label: '이미지', color: 'var(--chart-2)' },
  영상: { label: '영상', color: 'var(--chart-3)' },
  기타: { label: '기타', color: 'var(--chart-4)' },
};

const rootRoute = createRootRoute({
  component: ChartCatalog,
});
const router = createRouter({ routeTree: rootRoute });

function ChartCatalog() {
  return (
    <main className="grid gap-6">
      <header className="grid gap-1">
        <h1 className="text-2xl font-semibold">차트 컴포넌트</h1>
        <p className="text-muted-foreground">웹코어에서 제공하는 10가지 차트 유형과 데이터 설정 예시입니다.</p>
      </header>
      <div className="
        grid gap-5
        md:grid-cols-2
        xl:grid-cols-3
      "
      >
        <ChartPanel title="Line · 시계열 추이">
          <LineChart id="line" title="월별 매출 및 방문자" data={monthlyData} config={seriesConfig} extra={{ category: 'month', values: ['sales', 'visitors'] }} />
        </ChartPanel>
        <ChartPanel title="Area · 누적 추세">
          <AreaChart id="area" title="월별 추세" data={monthlyData} config={seriesConfig} extra={{ category: 'month', values: ['sales', 'visitors'] }} />
        </ChartPanel>
        <ChartPanel title="Bar · 값 비교">
          <BarChart id="bar" title="월별 매출 비교" data={monthlyData} config={seriesConfig} extra={{ category: 'month', values: ['sales', 'visitors'] }} />
        </ChartPanel>
        <ChartPanel title="Bar · 세로형">
          <BarChart id="bar-vertical" title="월별 매출 비교" data={monthlyData} config={seriesConfig} extra={{ category: 'month', values: ['sales'], layout: 'vertical' }} />
        </ChartPanel>
        <ChartPanel title="Stacked Bar · 구성 비교">
          <StackedBarChart id="stacked-bar" title="월별 실적 구성" data={monthlyData} config={seriesConfig} extra={{ category: 'month', values: ['sales', 'visitors', 'orders'] }} />
        </ChartPanel>
        <ChartPanel title="Composed · 복합 시각화">
          <ComposedChart id="composed" title="월별 실적 복합 차트" data={monthlyData} config={seriesConfig} extra={{ category: 'month', values: ['sales', 'visitors', 'orders'], styles: { sales: { type: 'bar' }, visitors: { type: 'area' }, orders: { type: 'line' } } }} />
        </ChartPanel>
        <ChartPanel title="Pie · 비율">
          <PieChart id="pie" title="브라우저 점유율" data={shareData} config={shareConfig} extra={{ category: 'browser', values: ['share'] }} />
        </ChartPanel>
        <ChartPanel title="Radial Bar · 진행률 비교">
          <RadialBarChart id="radial-bar" title="파일 유형별 사용량" data={fileData} config={categoryConfig} extra={{ category: 'name', values: ['value'] }} />
        </ChartPanel>
        <ChartPanel title="Radar · 다항목 비교">
          <RadarChart id="radar" title="팀 역량 비교" data={skillData} config={skillConfig} extra={{ category: 'skill', values: ['design', 'engineering'] }} />
        </ChartPanel>
        <ChartPanel title="Scatter · 두 값의 상관관계">
          <ScatterChart id="scatter" title="팀별 성과 분포" data={scatterData} config={{ A팀: { label: 'A팀', color: 'var(--chart-1)' }, B팀: { label: 'B팀', color: 'var(--chart-2)' } }} extra={{ category: 'team', values: ['points.x', 'points.y'] }} />
        </ChartPanel>
        <ChartPanel title="Treemap · 계층형 비중">
          <TreemapChart id="treemap" title="파일 유형별 용량" data={fileData} config={categoryConfig} extra={{ category: 'name', values: ['value'] }} />
        </ChartPanel>
      </div>
    </main>
  );
}

function ChartPanel({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <section className="grid min-w-0 gap-3 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="h-64 min-w-0">{children}</div>
    </section>
  );
}

const chartDescription = [
  '차트는 `data`, `config`, `extra`를 받아 렌더링합니다. `ChartConfig` 키를 값 키와 맞추면 범례와 툴팁의 이름 및 색상을 한 곳에서 관리할 수 있습니다. 차트가 들어갈 부모 요소에는 높이를 지정하세요.',
  '',
  '| 컴포넌트 | 용도 | 주요 설정 |',
  '| --- | --- | --- |',
  '| `LineChart` | 시간에 따른 추이 | `category`, `values`, `styles` |',
  '| `AreaChart` | 시계열 면적 비교 | `category`, `values`, `styles` |',
  '| `BarChart` | 항목별 값 비교 | `category`, `values`, `layout` |',
  '| `StackedBarChart` | 시리즈 구성 비교 | `category`, `values`, `styles` |',
  '| `ComposedChart` | 막대·영역·선 조합 | `category`, `values`, `styles` |',
  '| `PieChart` | 범주별 비율 | `category`, `values`, `styles` |',
  '| `RadialBarChart` | 방사형 값 비교 | `category`, `values`, `styles` |',
  '| `RadarChart` | 여러 지표 프로필 비교 | `category`, `values`, `styles` |',
  '| `ScatterChart` | 두 수치의 분포·상관관계 | 그룹의 `category`, 점 경로 `values` |',
  '| `TreemapChart` | 범주별 면적 비교 | `category`, `values`, `styles` |',
  '',
  '`@pkg/web-core/chart`에서 차트와 타입을 가져옵니다.',
  '',
  '```tsx',
  'import { LineChart, type ChartConfig } from \'@pkg/web-core/chart\';',
  '',
  'const config: ChartConfig = {',
  '  sales: { label: \'매출\', color: \'var(--chart-1)\' },',
  '  visitors: { label: \'방문자\', color: \'var(--chart-2)\' },',
  '};',
  '',
  '<LineChart',
  '  id="monthly-performance"',
  '  title="월별 실적"',
  '  data={[{ month: "1월", sales: 186, visitors: 120 }]}',
  '  config={config}',
  '  extra={{ category: "month", values: ["sales", "visitors"] }}',
  '/>',
  '```',
].join('\n');

const meta = {
  title: '웹코어/차트/Chart',
  component: ChartCatalog,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: { component: chartDescription },
    },
  },
} satisfies Meta<typeof ChartCatalog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Chart: Story = {
  render: () => <RouterProvider router={router} />,
};
