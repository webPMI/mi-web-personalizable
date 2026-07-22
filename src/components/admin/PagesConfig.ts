// ============================================
// PagesConfig.ts — Lógica cliente para la lista de páginas
// ============================================
// Maneja el listado y la eliminación de páginas personalizadas.
// Redirige a /admin/pages/editor para crear o editar.
// Soporta la arquitectura de Subcolecciones (sites/{domain}/pages)
// ============================================

import { updateDocument } from "../../lib/firebase/firestore";
import { getCurrentUser } from "../../lib/firebase/auth";
import { listSitePages, deletePageSubcollection, checkUserSite } from "../../lib/site";
import type { SiteData, CustomPage } from "../../lib/site";
import { sanitizeText } from "../../lib/sanitizer";
import { getEffectiveDomain } from "../../lib/domain-check";
import { canDeletePage } from "../../lib/permissions";
import { MemoryCache } from "../../lib/cache";

let siteDomain: string | null = null;
let siteData: SiteData | null = null;
let currentPagesList: CustomPage[] = [];
let deletingPageId: string | null = null;

export function initPagesConfig() {
  const adminApp = document.getElementById("admin-app");
  if (!adminApp) return;

  const trySetup = async () => {
    let domain = adminApp.dataset.siteDomain || getEffectiveDomain();
    const rawSiteData = adminApp.dataset.siteData;

    // Si aún no tenemos el dominio del sitio, intentar resolverlo desde la sesión actual
    if (!domain) {
      const user = getCurrentUser();
      if (user) {
        const resolvedDomain = await checkUserSite(user.uid);
        if (resolvedDomain) domain = resolvedDomain;
      }
    }

    if (domain) {
      siteDomain = domain;
      if (rawSiteData) {
        try {
          siteData = JSON.parse(rawSiteData) as SiteData;
        } catch {
          // Continuar con siteData nulo
        }
      }
      await setupUI();
    } else {
      // Intentar una re-evaluación rápida en caso de retraso de inicialización de Auth
      setTimeout(async () => {
        const container = document.getElementById("pages-list-container");
        if (container && container.innerHTML.includes("Cargando páginas...")) {
          const user = getCurrentUser();
          if (user) {
            const fallbackDomain = await checkUserSite(user.uid);
            if (fallbackDomain) {
              siteDomain = fallbackDomain;
              await setupUI();
            }
          }
        }
      }, 500);
    }
  };

  // 1. Ejecutar de inmediato
  trySetup();

  // 2. Escuchar el evento admin:ready
  window.addEventListener("admin:ready", async (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.siteDomain) {
      siteDomain = detail.siteDomain;
      if (detail.siteData) siteData = detail.siteData as SiteData;
      await setupUI();
    }
  });

  // 3. Escuchar navegación del cliente (Astro SPA y cambios de historia)
  document.addEventListener("astro:page-load", trySetup);
  window.addEventListener("popstate", trySetup);
}

async function setupUI() {
  if (!siteDomain) return;

  const deleteModal = document.getElementById("delete-modal");
  const btnCloseDelete = document.getElementById("btn-close-delete");
  const btnCancelDelete = document.getElementById("btn-cancel-delete");
  const btnConfirmDelete = document.getElementById("btn-confirm-delete");

  // Obtener páginas desde subcolección + fallback legacy
  currentPagesList = await listSitePages(siteDomain);

  // Renderizar la lista
  renderPagesList(currentPagesList);

  const closeDeleteModal = () => {
    deleteModal?.classList.add("hidden");
    deletingPageId = null;
  };

  btnCloseDelete?.addEventListener("click", closeDeleteModal);
  btnCancelDelete?.addEventListener("click", closeDeleteModal);


  // Confirmar eliminación
  if (btnConfirmDelete) {
    btnConfirmDelete.onclick = async () => {
      if (deletingPageId) {
        await handleDeletePage(deletingPageId);
        closeDeleteModal();
      }
    };
  }
}

function renderPagesList(pages: CustomPage[]) {
  const container = document.getElementById("pages-list-container");
  if (!container) return;

  if (!pages || pages.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 2rem 1rem;">
        <p class="text-muted" id="empty-pages-msg">No has creado ninguna página aún.</p>
      </div>
    `;
    return;
  }

  const currentUser = getCurrentUser();
  const allowDelete = canDeletePage({
    userId: currentUser?.uid,
    siteOwnerId: siteData?.ownerId,
    siteRoles: siteData?.roles,
  });

  const rowsHtml = pages
    .map((page) => {
      const isPublished = page.published !== false && page.status !== "draft";
      const statusBadge = isPublished
        ? `<span class="badge badge-success" style="background: #10b981; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">Publicada</span>`
        : `<span class="badge badge-warning" style="background: #f59e0b; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">Borrador</span>`;

      const navBadge = page.showInNav
        ? `<span class="badge badge-info" style="background: #3b82f6; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">En menú</span>`
        : "";

      const updatedDate = page.updatedAt || page.createdAt
        ? new Date(page.updatedAt || page.createdAt!).toLocaleDateString()
        : "-";

      const deleteButtonHtml = allowDelete
        ? `<button type="button" class="btn btn-sm btn-danger btn-delete-page" data-id="${page.id}" title="Eliminar" style="background: #ef4444; color: #fff; border: none; border-radius: 4px; padding: 0.25rem 0.5rem; cursor: pointer;">🗑️</button>`
        : `<button type="button" class="btn btn-sm btn-secondary" disabled title="Solo administradores pueden eliminar páginas" style="opacity: 0.5; cursor: not-allowed;">🔒</button>`;

      return `
        <tr style="border-bottom: 1px solid var(--border-color, #e5e7eb);">
          <td style="padding: 0.75rem 0.5rem;">
            <strong>${sanitizeText(page.title)}</strong>
            <br />
            <small class="text-muted" style="color: #6b7280;">/${sanitizeText(page.slug)}</small>
          </td>
          <td style="padding: 0.75rem 0.5rem;">
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              ${statusBadge}
              ${navBadge}
            </div>
          </td>
          <td style="padding: 0.75rem 0.5rem; font-size: 0.875rem;">${updatedDate}</td>
          <td style="padding: 0.75rem 0.5rem; text-align: right;">
            <a href="/${sanitizeText(page.slug)}" target="_blank" class="btn btn-sm btn-secondary" title="Ver vista previa" style="margin-right: 0.25rem;">
              👁️
            </a>
            <a href="/admin/pages/editor?id=${encodeURIComponent(page.id)}" class="btn btn-sm btn-secondary btn-edit-page" title="Editar" style="margin-right: 0.25rem;">
              ✏️
            </a>
            ${deleteButtonHtml}
          </td>
        </tr>
      `;
    })
    .join("");

  container.innerHTML = `
    <table class="table" style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 2px solid var(--border-color, #e5e7eb); text-align: left;">
          <th style="padding: 0.75rem 0.5rem;">Página</th>
          <th style="padding: 0.75rem 0.5rem;">Estado</th>
          <th style="padding: 0.75rem 0.5rem;">Última mod.</th>
          <th style="padding: 0.75rem 0.5rem; text-align: right;">Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;

  // Asignar evento a los botones de eliminar
  container.querySelectorAll(".btn-delete-page").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pageId = (btn as HTMLElement).dataset.id;
      if (pageId) openDeleteModal(pageId);
    });
  });
}

function openDeleteModal(pageId: string) {
  const page = currentPagesList.find((p) => p.id === pageId);
  if (!page) return;

  deletingPageId = pageId;

  const titleSpan = document.getElementById("delete-page-title");
  const deleteModal = document.getElementById("delete-modal");

  if (titleSpan) titleSpan.textContent = page.title;
  deleteModal?.classList.remove("hidden");
}

async function handleDeletePage(pageId: string) {
  if (!siteDomain) return;

  const pageToDelete = currentPagesList.find((p) => p.id === pageId);
  if (!pageToDelete) return;

  try {
    // 1. Eliminar de la subcolección
    await deletePageSubcollection(siteDomain, pageId);

    // 2. Limpiar del navLinks si existiera
    if (siteData) {
      const pageHref = `/${pageToDelete.slug}`;
      const updatedNavLinks = (siteData.navLinks || []).filter((l) => l.href !== pageHref);
      const updatedLegacyPages = (siteData.pages || []).filter((p) => p.id !== pageId);

      await updateDocument("sites", siteDomain, {
        pages: updatedLegacyPages,
        navLinks: updatedNavLinks,
      });

      siteData.pages = updatedLegacyPages;
      siteData.navLinks = updatedNavLinks;

      const adminApp = document.getElementById("admin-app");
      if (adminApp) adminApp.dataset.siteData = JSON.stringify(siteData);
    }

    // 3. Invalidar caché en memoria para refrescar vista pública y lista
    MemoryCache.invalidate(`pages-list:${siteDomain}`);
    MemoryCache.invalidate(`page:${siteDomain}:${pageToDelete.slug}`);
    MemoryCache.invalidate(`site:${siteDomain}`);

    // 4. Volver a cargar lista de páginas
    currentPagesList = await listSitePages(siteDomain);
    renderPagesList(currentPagesList);
  } catch (err) {
    console.error("Error al eliminar la página:", err);
  }
}
