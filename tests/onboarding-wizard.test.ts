// ============================================
// tests/onboarding-wizard.test.ts — OnboardingWizard steps 1-3
// ============================================
// Prueba el flujo completo del wizard de onboarding:
// - Navegación entre pasos (next/prev)
// - Validación de campos en cada paso
// - Estado de carga y errores
// - Finalización del onboarding
// ============================================
import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================
// Tipos (replicando onboarding.ts)
// ============================================

interface OnboardingData {
    siteName: string;
    domain: string;
    locale: string;
    theme: string;
    layout: string;
    primaryColor: string;
    fontFamily: string;
    completed: boolean;
}

type StepValidator = (data: Partial<OnboardingData>) => Record<string, string>;

interface Step {
    id: number;
    title: string;
    validate: StepValidator;
}

// ============================================
// Implementación del wizard (replicando onboarding.ts)
// ============================================

const STEPS: Step[] = [
    {
        id: 1,
        title: "Información del sitio",
        validate: (data) => {
            const errors: Record<string, string> = {};
            if (!data.siteName || data.siteName.trim().length < 2) {
                errors.siteName = "El nombre del sitio debe tener al menos 2 caracteres";
            }
            if (!data.domain || data.domain.trim().length < 3) {
                errors.domain = "El dominio debe tener al menos 3 caracteres";
            } else if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i.test(data.domain)) {
                errors.domain = "El dominio no es válido";
            }
            if (!data.locale) {
                errors.locale = "Debes seleccionar un idioma";
            }
            return errors;
        },
    },
    {
        id: 2,
        title: "Apariencia",
        validate: (data) => {
            const errors: Record<string, string> = {};
            if (!data.theme) {
                errors.theme = "Debes seleccionar un tema";
            }
            if (!data.layout) {
                errors.layout = "Debes seleccionar un layout";
            }
            if (!data.primaryColor || !/^#[0-9a-fA-F]{6}$/.test(data.primaryColor)) {
                errors.primaryColor = "El color primario debe ser un hex válido (#RRGGBB)";
            }
            if (!data.fontFamily) {
                errors.fontFamily = "Debes seleccionar una tipografía";
            }
            return errors;
        },
    },
    {
        id: 3,
        title: "Confirmación",
        validate: () => ({}), // No validation needed on confirmation step
    },
];

class OnboardingWizard {
    private currentStep: number = 1;
    private data: Partial<OnboardingData> = {};
    private errors: Record<string, string> = {};
    private loading: boolean = false;
    private completed: boolean = false;

    getCurrentStep(): number {
        return this.currentStep;
    }

    getTotalSteps(): number {
        return STEPS.length;
    }

    getStepTitle(): string {
        const step = STEPS.find((s) => s.id === this.currentStep);
        return step?.title || "";
    }

    getData(): Partial<OnboardingData> {
        return { ...this.data };
    }

    getErrors(): Record<string, string> {
        return { ...this.errors };
    }

    isLoading(): boolean {
        return this.loading;
    }

    isCompleted(): boolean {
        return this.completed;
    }

    updateData(updates: Partial<OnboardingData>): void {
        this.data = { ...this.data, ...updates };
    }

    validateCurrentStep(): boolean {
        const step = STEPS.find((s) => s.id === this.currentStep);
        if (!step) return false;
        this.errors = step.validate(this.data);
        return Object.keys(this.errors).length === 0;
    }

    canGoNext(): boolean {
        return this.validateCurrentStep();
    }

    canGoPrev(): boolean {
        return this.currentStep > 1;
    }

    goNext(): boolean {
        if (!this.canGoNext()) return false;
        if (this.currentStep < STEPS.length) {
            this.currentStep++;
            this.errors = {};
            return true;
        }
        return false;
    }

    goPrev(): boolean {
        if (!this.canGoPrev()) return false;
        this.currentStep--;
        this.errors = {};
        return true;
    }

    async finish(): Promise<{ success: boolean; error?: string }> {
        if (this.currentStep !== STEPS.length) {
            return { success: false, error: "Debes completar todos los pasos" };
        }
        this.loading = true;
        try {
            // Simular llamada API
            await new Promise((resolve) => setTimeout(resolve, 100));
            this.completed = true;
            this.data.completed = true;
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message || "Error al finalizar" };
        } finally {
            this.loading = false;
        }
    }

    reset(): void {
        this.currentStep = 1;
        this.data = {};
        this.errors = {};
        this.loading = false;
        this.completed = false;
    }
}

// ============================================
// Tests
// ============================================

describe("OnboardingWizard", () => {
    let wizard: OnboardingWizard;

    beforeEach(() => {
        wizard = new OnboardingWizard();
    });

    describe("Estado inicial", () => {
        it("debe comenzar en el paso 1", () => {
            expect(wizard.getCurrentStep()).toBe(1);
        });

        it("debe tener 3 pasos totales", () => {
            expect(wizard.getTotalSteps()).toBe(3);
        });

        it("debe tener título del paso 1", () => {
            expect(wizard.getStepTitle()).toBe("Información del sitio");
        });

        it("no debe estar completado", () => {
            expect(wizard.isCompleted()).toBe(false);
        });

        it("no debe estar cargando", () => {
            expect(wizard.isLoading()).toBe(false);
        });

        it("debe tener datos vacíos", () => {
            expect(wizard.getData()).toEqual({});
        });

        it("debe tener errores vacíos", () => {
            expect(wizard.getErrors()).toEqual({});
        });
    });

    describe("Navegación entre pasos", () => {
        it("debe poder ir al paso 2 si los datos del paso 1 son válidos", () => {
            wizard.updateData({
                siteName: "Mi Sitio",
                domain: "misitio.com",
                locale: "es",
            });
            expect(wizard.canGoNext()).toBe(true);
            expect(wizard.goNext()).toBe(true);
            expect(wizard.getCurrentStep()).toBe(2);
        });

        it("no debe poder ir al paso 2 si los datos del paso 1 son inválidos", () => {
            wizard.updateData({ siteName: "", domain: "", locale: "" });
            expect(wizard.canGoNext()).toBe(false);
            expect(wizard.goNext()).toBe(false);
            expect(wizard.getCurrentStep()).toBe(1);
        });

        it("debe mostrar errores de validación en paso 1", () => {
            wizard.updateData({ siteName: "", domain: "invalido", locale: "" });
            wizard.validateCurrentStep();
            const errors = wizard.getErrors();
            expect(errors.siteName).toBeDefined();
            expect(errors.locale).toBeDefined();
        });

        it("debe poder volver al paso anterior", () => {
            wizard.updateData({
                siteName: "Test",
                domain: "test.com",
                locale: "es",
            });
            wizard.goNext();
            expect(wizard.getCurrentStep()).toBe(2);
            expect(wizard.canGoPrev()).toBe(true);
            expect(wizard.goPrev()).toBe(true);
            expect(wizard.getCurrentStep()).toBe(1);
        });

        it("no debe poder volver desde el paso 1", () => {
            expect(wizard.canGoPrev()).toBe(false);
            expect(wizard.goPrev()).toBe(false);
            expect(wizard.getCurrentStep()).toBe(1);
        });

        it("debe limpiar errores al navegar", () => {
            wizard.updateData({ siteName: "" });
            wizard.validateCurrentStep();
            expect(Object.keys(wizard.getErrors()).length).toBeGreaterThan(0);

            wizard.updateData({
                siteName: "Test",
                domain: "test.com",
                locale: "es",
            });
            wizard.goNext();
            expect(Object.keys(wizard.getErrors()).length).toBe(0);
        });
    });

    describe("Validación — Paso 1: Información del sitio", () => {
        it("debe validar siteName vacío", () => {
            wizard.updateData({ siteName: "", domain: "test.com", locale: "es" });
            expect(wizard.canGoNext()).toBe(false);
            expect(wizard.getErrors().siteName).toBeDefined();
        });

        it("debe validar siteName demasiado corto", () => {
            wizard.updateData({ siteName: "A", domain: "test.com", locale: "es" });
            expect(wizard.canGoNext()).toBe(false);
        });

        it("debe validar dominio vacío", () => {
            wizard.updateData({ siteName: "Test", domain: "", locale: "es" });
            expect(wizard.canGoNext()).toBe(false);
            expect(wizard.getErrors().domain).toBeDefined();
        });

        it("debe validar formato de dominio", () => {
            wizard.updateData({ siteName: "Test", domain: "not a domain!!!", locale: "es" });
            expect(wizard.canGoNext()).toBe(false);
            expect(wizard.getErrors().domain).toBeDefined();
        });

        it("debe validar locale vacío", () => {
            wizard.updateData({ siteName: "Test", domain: "test.com", locale: "" });
            expect(wizard.canGoNext()).toBe(false);
            expect(wizard.getErrors().locale).toBeDefined();
        });

        it("debe pasar validación con datos correctos", () => {
            wizard.updateData({
                siteName: "Mi Sitio Web",
                domain: "misitio.com",
                locale: "es",
            });
            expect(wizard.canGoNext()).toBe(true);
            expect(Object.keys(wizard.getErrors()).length).toBe(0);
        });
    });

    describe("Validación — Paso 2: Apariencia", () => {
        beforeEach(() => {
            wizard.updateData({
                siteName: "Test",
                domain: "test.com",
                locale: "es",
            });
            wizard.goNext();
        });

        it("debe estar en paso 2", () => {
            expect(wizard.getCurrentStep()).toBe(2);
            expect(wizard.getStepTitle()).toBe("Apariencia");
        });

        it("debe validar theme vacío", () => {
            wizard.updateData({ theme: "", layout: "centered", primaryColor: "#ff0000", fontFamily: "Arial" });
            expect(wizard.canGoNext()).toBe(false);
            expect(wizard.getErrors().theme).toBeDefined();
        });

        it("debe validar layout vacío", () => {
            wizard.updateData({ theme: "default", layout: "", primaryColor: "#ff0000", fontFamily: "Arial" });
            expect(wizard.canGoNext()).toBe(false);
            expect(wizard.getErrors().layout).toBeDefined();
        });

        it("debe validar color primario inválido", () => {
            wizard.updateData({ theme: "default", layout: "centered", primaryColor: "red", fontFamily: "Arial" });
            expect(wizard.canGoNext()).toBe(false);
            expect(wizard.getErrors().primaryColor).toBeDefined();
        });

        it("debe validar color primario sin #", () => {
            wizard.updateData({ theme: "default", layout: "centered", primaryColor: "ff0000", fontFamily: "Arial" });
            expect(wizard.canGoNext()).toBe(false);
            expect(wizard.getErrors().primaryColor).toBeDefined();
        });

        it("debe validar fontFamily vacío", () => {
            wizard.updateData({ theme: "default", layout: "centered", primaryColor: "#ff0000", fontFamily: "" });
            expect(wizard.canGoNext()).toBe(false);
            expect(wizard.getErrors().fontFamily).toBeDefined();
        });

        it("debe pasar validación con datos correctos", () => {
            wizard.updateData({
                theme: "default",
                layout: "centered",
                primaryColor: "#ff6600",
                fontFamily: "Arial, sans-serif",
            });
            expect(wizard.canGoNext()).toBe(true);
            expect(Object.keys(wizard.getErrors()).length).toBe(0);
        });

        it("debe aceptar color con 6 dígitos hex", () => {
            wizard.updateData({
                theme: "dark",
                layout: "full-width",
                primaryColor: "#10b981",
                fontFamily: "Roboto",
            });
            expect(wizard.canGoNext()).toBe(true);
        });
    });

    describe("Validación — Paso 3: Confirmación", () => {
        beforeEach(() => {
            wizard.updateData({
                siteName: "Test",
                domain: "test.com",
                locale: "es",
            });
            wizard.goNext();
            wizard.updateData({
                theme: "default",
                layout: "centered",
                primaryColor: "#ff6600",
                fontFamily: "Arial",
            });
            wizard.goNext();
        });

        it("debe estar en paso 3", () => {
            expect(wizard.getCurrentStep()).toBe(3);
            expect(wizard.getStepTitle()).toBe("Confirmación");
        });

        it("debe poder ir al paso 3 sin validación", () => {
            expect(wizard.canGoNext()).toBe(true);
        });

        it("debe tener todos los datos acumulados", () => {
            const data = wizard.getData();
            expect(data.siteName).toBe("Test");
            expect(data.domain).toBe("test.com");
            expect(data.locale).toBe("es");
            expect(data.theme).toBe("default");
            expect(data.layout).toBe("centered");
            expect(data.primaryColor).toBe("#ff6600");
            expect(data.fontFamily).toBe("Arial");
        });
    });

    describe("Finalización", () => {
        beforeEach(async () => {
            wizard.updateData({
                siteName: "Test",
                domain: "test.com",
                locale: "es",
            });
            wizard.goNext();
            wizard.updateData({
                theme: "default",
                layout: "centered",
                primaryColor: "#ff6600",
                fontFamily: "Arial",
            });
            wizard.goNext();
        });

        it("debe finalizar correctamente", async () => {
            const result = await wizard.finish();
            expect(result.success).toBe(true);
            expect(wizard.isCompleted()).toBe(true);
            expect(wizard.getData().completed).toBe(true);
        });

        it("debe mostrar loading durante la finalización", async () => {
            const finishPromise = wizard.finish();
            expect(wizard.isLoading()).toBe(true);
            await finishPromise;
            expect(wizard.isLoading()).toBe(false);
        });

        it("debe fallar si no está en el último paso", async () => {
            wizard.reset();
            wizard.updateData({
                siteName: "Test",
                domain: "test.com",
                locale: "es",
            });
            const result = await wizard.finish();
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe("Reset", () => {
        it("debe resetear todo el estado", () => {
            wizard.updateData({ siteName: "Test", domain: "test.com", locale: "es" });
            wizard.goNext();
            wizard.reset();

            expect(wizard.getCurrentStep()).toBe(1);
            expect(wizard.getData()).toEqual({});
            expect(wizard.getErrors()).toEqual({});
            expect(wizard.isLoading()).toBe(false);
            expect(wizard.isCompleted()).toBe(false);
        });
    });

    describe("Flujo completo", () => {
        it("debe completar el onboarding de principio a fin", async () => {
            // Paso 1
            expect(wizard.getCurrentStep()).toBe(1);
            wizard.updateData({
                siteName: "Mi Web",
                domain: "miweb.com",
                locale: "es",
            });
            expect(wizard.canGoNext()).toBe(true);
            wizard.goNext();

            // Paso 2
            expect(wizard.getCurrentStep()).toBe(2);
            wizard.updateData({
                theme: "modern",
                layout: "centered",
                primaryColor: "#3b82f6",
                fontFamily: "Inter, sans-serif",
            });
            expect(wizard.canGoNext()).toBe(true);
            wizard.goNext();

            // Paso 3
            expect(wizard.getCurrentStep()).toBe(3);
            const result = await wizard.finish();
            expect(result.success).toBe(true);
            expect(wizard.isCompleted()).toBe(true);
        });

        it("debe poder volver atrás y corregir datos", () => {
            // Paso 1 con datos inválidos
            wizard.updateData({ siteName: "", domain: "", locale: "" });
            expect(wizard.canGoNext()).toBe(false);

            // Corregir datos
            wizard.updateData({
                siteName: "Mi Web",
                domain: "miweb.com",
                locale: "es",
            });
            expect(wizard.canGoNext()).toBe(true);
            wizard.goNext();

            // Paso 2
            expect(wizard.getCurrentStep()).toBe(2);

            // Volver al paso 1
            wizard.goPrev();
            expect(wizard.getCurrentStep()).toBe(1);

            // Los datos persisten
            expect(wizard.getData().siteName).toBe("Mi Web");
        });
    });
});
