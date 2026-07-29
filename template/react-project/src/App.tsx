import { Content } from '@/components/layout/Content';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

export default function App() {
  return (
    <div className="app h-full w-full grid grid-rows-[auto_1fr_auto] overflow-hidden bg-linear-to-br from-sky-50 via-white to-indigo-50">
      <Header
        className="app-header border-b border-sky-200/70 bg-white/80"
        aria-label="iOS 키보드 테스트 헤더"
        data-area="header"
      />
      <Content
        className="app-content scroll-y"
        aria-label="스크롤 가능한 콘텐츠 영역"
        data-area="content"
      />
      <Footer
        className="app-footer z-10 border-t border-sky-200 bg-white shadow-lg shadow-slate-300/50"
        aria-label="키보드 입력 영역"
        data-area="footer"
      />
    </div>
  );
}
