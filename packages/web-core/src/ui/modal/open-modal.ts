import type { ComponentType } from 'react';

import type { ModalComponentProps } from './modal';
import { openOverlay } from './modal-registry';

/**
 * 컴포넌트의 close 콜백 파라미터 타입에서 결과값 TResult를 자동으로 추론합니다.
 */
export type InferModalResult<TComponent> = TComponent extends ComponentType<infer P>
  ? P extends { close?: (result?: infer R) => void }
    ? R
    : void
  : void;

export type OpenModalOptions = {
  modalId?: string
};

/**
 * 프로미스 기반으로 커스텀 모달을 함수 호출로 띄웁니다.
 *
 * - 컴포넌트의 props를 자동으로 검증합니다 (`open`, `onOpenChange`, `close`는 제외).
 * - 컴포넌트의 `close(result)` 인자 타입으로부터 Promise 반환값(R)을 자동으로 추론합니다.
 *
 * @example
 * const result = await openModal(ExampleModal, { id: '123' });
 */
export function openModal<
  TProps extends object,
  TResult = TProps extends { close?: (result?: infer R) => void } ? R : void,
>(
  Component: ComponentType<TProps>,
  ...[props, options]: [Omit<TProps, keyof ModalComponentProps<TResult>>] extends [Record<string, never>]
    ? [props?: Omit<TProps, keyof ModalComponentProps<TResult>>, options?: OpenModalOptions]
    : keyof Omit<TProps, keyof ModalComponentProps<TResult>> extends never
      ? [props?: Omit<TProps, keyof ModalComponentProps<TResult>>, options?: OpenModalOptions]
      : [props: Omit<TProps, keyof ModalComponentProps<TResult>>, options?: OpenModalOptions]
): Promise<TResult> {
  return openOverlay<TProps, TResult>(Component, props, options?.modalId);
}
