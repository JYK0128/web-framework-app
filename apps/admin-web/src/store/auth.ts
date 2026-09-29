import { atom } from 'jotai';

import type { MeResponse } from '#/.generated/api/model';

import { tokenStorage, tokenStore } from './token';

export const authUserAtom = atom<MeResponse | null>(null);

export function clearAuthState(): void {
  tokenStorage.clear();
  tokenStore.set(authUserAtom, null);
}
