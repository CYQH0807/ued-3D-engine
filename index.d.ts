export function setupCounter(element: HTMLButtonElement): void;

import { AxiosRequestConfig } from 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    loading?: boolean;
    // [自定义属性声明]
  }
}
