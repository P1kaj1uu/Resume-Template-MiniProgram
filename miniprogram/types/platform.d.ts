import type { AbortControllerLike, Template } from './resume';

/** WXML dataset values are strings (or numbers for bound numeric values). */
export interface UIEvent<Value = string, Key extends string = string> {
  currentTarget: {
    dataset: Record<string, string | number> & {
      key: Key;
      id: string;
      index: string | number;
      offset: string | number;
      path: string;
      mode: string;
      type: string;
      value: string;
      url: string;
    };
  };
  detail: { value: Value };
}
export type LoadOptions = Record<string, string | undefined>;
export interface PageRuntime {
  opening?: boolean;
  switching?: boolean;
  unloaded?: boolean;
  choosing?: boolean;
  dirty?: boolean;
  activePage?: boolean;
  loadOptions?: LoadOptions;
  timer?: ReturnType<typeof setTimeout>;
  keyboardListener?:
    | ((event: WechatMiniprogram.OnKeyboardHeightChangeListenerResult) => void)
    | null;
  matches?: Template[];
  preparedKey?: string;
  preparingPromise?: Promise<string> | null;
  cancelParsing?: AbortControllerLike;
}
export type PageContext<Data> = PageRuntime & {
  data: Data;
  setData(patch: Partial<Data> & Record<string, unknown>, callback?: () => void): void;
  getTabBar(): { setData(patch: { selected: number }): void } | undefined;
};
/** A type-only view of native Page: registration and lifecycle timing stay native. */
export type PageRegistrar = <Data, Methods>(
  definition: { data: Data } & Methods & ThisType<PageContext<Data> & Methods>,
) => void;
