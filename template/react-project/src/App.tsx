import { useVisualViewport } from '@/hooks/useVisualViewport';
import { Content } from '@/components/layout/Content';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { HeightGuidelineOverlay } from '@/components/layout/HeightGuidelineOverlay';

export default function App() {
  useVisualViewport();

  return (
    <>
      <div className="app">
        <Header className="app-header" />
        <Content className="app-content" />
        <Footer className="app-footer" />
      </div>
      <HeightGuidelineOverlay />
    </>
  );
}
