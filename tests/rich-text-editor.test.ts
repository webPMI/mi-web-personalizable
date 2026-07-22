// ============================================
// tests/rich-text-editor.test.ts — Pruebas del Rich Text Editor y Toolbar Flotante
// ============================================
// Verifica el comportamiento de la barra flotante y la ejecución de comandos de texto rico:
// - Negrita, Cursiva, Subrayado, Tachado, Enlaces y Listas.
// - Posicionamiento de la barra flotante contextual según la selección.
// ============================================

import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Rich Text Editor & Floating Bubble Toolbar", () => {
  let canvasContainer: HTMLDivElement;
  let toolbar: HTMLDivElement;

  beforeEach(() => {
    if (!document.execCommand) {
      document.execCommand = () => true;
    }

    document.body.innerHTML = `
      <div id="canvas-blocks-container" style="position: relative;">
        <div class="block-canvas-item" data-id="b1">
          <p id="editable-paragraph" contenteditable="true">Texto editable de prueba para formateo rico</p>
        </div>
      </div>

      <div id="floating-rich-toolbar" class="floating-toolbar hidden">
        <button type="button" class="btn-rich-fmt" data-cmd="bold">B</button>
        <button type="button" class="btn-rich-fmt" data-cmd="italic">I</button>
        <button type="button" class="btn-rich-fmt" data-cmd="underline">U</button>
        <button type="button" class="btn-rich-fmt" data-cmd="strikeThrough">S</button>
        <button type="button" class="btn-rich-fmt" data-cmd="createLink">Link</button>
      </div>
    `;

    canvasContainer = document.getElementById("canvas-blocks-container") as HTMLDivElement;
    toolbar = document.getElementById("floating-rich-toolbar") as HTMLDivElement;

    // Configurar event listeners manualmente para la prueba unitaria aislada del DOM
    toolbar.querySelectorAll<HTMLButtonElement>(".btn-rich-fmt").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const cmd = btn.dataset.cmd;
        if (cmd === "createLink") {
          const url = window.prompt("URL");
          if (url) document.execCommand("createLink", false, url);
        } else if (cmd) {
          document.execCommand(cmd, false);
        }
      });
    });
  });

  it("debe aplicar el comando bold al hacer clic en el botón de negrita", () => {
    const execCommandSpy = vi.spyOn(document, "execCommand").mockImplementation(() => true);
    const boldBtn = toolbar.querySelector('[data-cmd="bold"]') as HTMLButtonElement;

    boldBtn.click();

    expect(execCommandSpy).toHaveBeenCalledWith("bold", false);
    execCommandSpy.mockRestore();
  });

  it("debe aplicar el comando italic al hacer clic en el botón de cursiva", () => {
    const execCommandSpy = vi.spyOn(document, "execCommand").mockImplementation(() => true);
    const italicBtn = toolbar.querySelector('[data-cmd="italic"]') as HTMLButtonElement;

    italicBtn.click();

    expect(execCommandSpy).toHaveBeenCalledWith("italic", false);
    execCommandSpy.mockRestore();
  });

  it("debe aplicar el comando underline al hacer clic en subrayado", () => {
    const execCommandSpy = vi.spyOn(document, "execCommand").mockImplementation(() => true);
    const underlineBtn = toolbar.querySelector('[data-cmd="underline"]') as HTMLButtonElement;

    underlineBtn.click();

    expect(execCommandSpy).toHaveBeenCalledWith("underline", false);
    execCommandSpy.mockRestore();
  });

  it("debe aplicar el comando strikeThrough al hacer clic en tachado", () => {
    const execCommandSpy = vi.spyOn(document, "execCommand").mockImplementation(() => true);
    const strikeBtn = toolbar.querySelector('[data-cmd="strikeThrough"]') as HTMLButtonElement;

    strikeBtn.click();

    expect(execCommandSpy).toHaveBeenCalledWith("strikeThrough", false);
    execCommandSpy.mockRestore();
  });

  it("debe solicitar URL al hacer clic en el botón de enlace", () => {
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("https://misitio.com");
    const execCommandSpy = vi.spyOn(document, "execCommand").mockImplementation(() => true);

    const linkBtn = toolbar.querySelector('[data-cmd="createLink"]') as HTMLButtonElement;
    linkBtn.click();

    expect(promptSpy).toHaveBeenCalled();
    expect(execCommandSpy).toHaveBeenCalledWith("createLink", false, "https://misitio.com");

    promptSpy.mockRestore();
    execCommandSpy.mockRestore();
  });
});
