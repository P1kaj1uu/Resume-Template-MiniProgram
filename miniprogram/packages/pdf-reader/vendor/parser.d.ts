import type { AbortControllerLike } from '../../../types/resume';
interface PdfTextItem { str?: string; hasEOL?: boolean }
interface PdfPage { getTextContent(): Promise<{ items: PdfTextItem[] }>; cleanup(): void }
interface PdfDocument { numPages: number; getPage(page: number): Promise<PdfPage> }
export interface PdfTask { promise: Promise<PdfDocument>; destroy(): Promise<void> }
export function getDocument(options: Record<string, unknown>): PdfTask;
export function createAbortController(): AbortControllerLike;
