// ============================================
// AdminDashboard.ts — Lógica JS del Dashboard
// ============================================
// Se encarga de cargar y mostrar la información
// del sitio en la vista de Dashboard.
//
// Uso desde AdminLayout:
//   El layout dispara el evento "admin:ready" cuando
//   la autenticación y los datos del sitio están listos.
//   Este módulo se suscribe a ese evento.
// ============================================

import { getDocument } from "../../lib/firebase/firestore";

/**
 * Inicializa el Dashboard.
 * Se suscribe al evento "admin:ready" disparado por AdminLayout.
 */
export function initDashboard(): void {
  // Si ya estamos en estado authenticated (el evento ya se disparó),
  // intentar cargar igualmente
  const adminApp = document.getElementById("admin-app");
  if (adminApp?.dataset.siteDomain) {
    loadSiteInfo(adminApp.dataset.siteDomain);
    return;
  }

  // Suscribirse al evento de AdminLayout
  window.addEventListener("admin:ready", ((event: CustomEvent) => {
    const { siteDomain } = event.detail;
    if (siteDomain) {
      loadSiteInfo(siteDomain);
    }
  }) as EventListener);
}

/**
 * Carga la información del sitio desde Firestore y la muestra en el DOM.
 */
async function loadSiteInfo(siteDomain: string): Promise<void> {
  const siteInfoContent = document.getElementById("site-info-content");
  if (!siteInfoContent) return;

  try {
    const result = await getDocument("sites", siteDomain);
    if (result.success && result.data) {
      const site = result.data as any;
      const statusText = site.status === "active" ? "Activo" : "Pendiente";
      const registeredDate = site.registeredAt
        ? new Date(site.registeredAt).toLocaleDateString()
        : "—";
      siteInfoContent.innerHTML = `
        <p><strong>Dominio:</strong> ${site.domain || siteDomain}</p>
        <p><strong>Estado:</strong> <span class="badge">${statusText}</span></p>
        <p><strong>Fecha de registro:</strong> ${registeredDate}</p>
        ${site.ownerUsername ? `<p><strong>Propietario:</strong> ${site.ownerUsername}</p>` : ""}
      `;
    } else {
      siteInfoContent.innerHTML = `<p class="text-muted">No se pudo cargar la información del sitio.</p>`;
    }
  } catch {
    siteInfoContent.innerHTML = `<p class="alert alert-error">Error al cargar la información del sitio.</p>`;
  }
}
