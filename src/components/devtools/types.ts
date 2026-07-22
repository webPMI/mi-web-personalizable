// ============================================
// DevTools - Tipos compartidos
// ============================================

export interface DevToolsModule {
  id: string;
  label: string;
  render(): string;
  init(container: HTMLElement): void;
  onOpen?(): void;
}
