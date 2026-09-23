import { atom, createStore } from 'jotai';

import type { MeResponse } from '#/.generated/api/model';

/** 앱 전체에서 공유하는 Jotai 스토어 인스턴스. React 외부(Axios 인터셉터 등)에서도 직접 접근 가능. */
export const tokenStore = createStore();

/** 인메모리 accessToken atom. React 컴포넌트에서 useAtomValue(accessTokenAtom)로 구독 가능. */
export const accessTokenAtom = atom<string | null>(null);
export const authUserAtom = atom<MeResponse | null>(null);

/** Axios 인터셉터 등 React 외부에서 accessToken을 읽고 쓰는 인터페이스. */
export const tokenStorage = {
  getAccessToken(): string | null {
    return tokenStore.get(accessTokenAtom);
  },
  setAccessToken(token: string | null): void {
    tokenStore.set(accessTokenAtom, token);
  },
  clear(): void {
    tokenStore.set(accessTokenAtom, null);
    tokenStore.set(authUserAtom, null);
  },
};
