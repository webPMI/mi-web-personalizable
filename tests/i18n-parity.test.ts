import { describe, it, expect } from "vitest";
import commonModule from "../src/lib/i18n/modules/common";
import onboardingModule from "../src/lib/i18n/modules/onboarding";
import adminModule from "../src/lib/i18n/modules/admin";

const modules = {
  common: commonModule,
  onboarding: onboardingModule,
  admin: adminModule,
};

const VALID_PREFIXES = [
  "btn-",
  "err-",
  "error-",
  "success-",
  "loading-",
  "label-",
  "placeholder-",
  "hint-",
  "title-",
  "desc-",
  "step-",
  "lang-",
  "config-",
  "empty-",
  "toggle-",
  "role-",
  "invite-",
  "nav-",
  "status-",
  "badge-",
  "tab-",
  "modal-",
  "domain-",
  "dashboard-",
  "password-",
  "profile-",
  "users-",
];

// Single loose words permitted in common or specific domain contexts according to AGENTS.md
const ALLOWED_LOOSE_KEYS = new Set([
  "yes",
  "no",
  "or",
  "and",
  "save",
  "cancel",
  "loading",
]);

describe("i18n Translation Modules Parity & Rules", () => {
  for (const [namespace, module] of Object.entries(modules)) {
    describe(`Module: ${namespace}`, () => {
      const esKeys = Object.keys(module.es).sort();
      const enKeys = Object.keys(module.en).sort();

      it("should have 100% matching key sets for 'es' and 'en'", () => {
        expect(esKeys).toEqual(enKeys);
      });

      it("should use valid semantic prefixes or allowed loose words for all keys", () => {
        for (const key of esKeys) {
          const isLooseKey = ALLOWED_LOOSE_KEYS.has(key);
          const hasValidPrefix = VALID_PREFIXES.some((prefix) =>
            key.startsWith(prefix)
          );
          expect(
            hasValidPrefix || isLooseKey,
            `Key "${key}" in namespace "${namespace}" does not use a recognized semantic prefix (${VALID_PREFIXES.join(", ")}) or allowed loose word`
          ).toBe(true);
        }
      });

      it("should not contain empty translation values", () => {
        for (const key of esKeys) {
          expect(module.es[key].trim().length).toBeGreaterThan(0);
          expect(module.en[key].trim().length).toBeGreaterThan(0);
        }
      });
    });
  }
});
