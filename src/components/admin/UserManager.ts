// ============================================
// UserManager.ts — Lógica JS de Gestión de Usuarios
// ============================================
// Se encarga de cargar, mostrar y gestionar los
// miembros del sitio (invitar, cambiar roles,
// activar/desactivar, eliminar).
// ============================================

import { auth } from "../../lib/firebase";
import { getDocument, setDocument, updateDocument, deleteDocument, listDocuments } from "../../lib/firebase/firestore";
import { Timestamp } from "firebase/firestore";

// ============================================
// Interfaces
// ============================================

interface SiteMember {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: "admin" | "editor" | "viewer";
  invitedBy: string;
  invitedAt: Timestamp;
  isActive: boolean;
}

// ============================================
// Estado global
// ============================================

let allMembers: SiteMember[] = [];
let currentOwnerId = "";
let currentUserUid = "";
const PAGE_SIZE = 10;
let currentPage = 1;

// ============================================
// Inicialización
// ============================================

/**
 * Obtiene el usuario autenticado desde la fuente más confiable disponible.
 * Prioriza window.__currentUser (expuesto por AdminLayout) sobre auth.currentUser,
 * ya que en navegación SPA auth.currentUser puede ser null temporalmente.
 */
function getCurrentUser(): any {
  // Primero intentar desde la variable global expuesta por AdminLayout
  const globalUser = (window as any).__currentUser;
  if (globalUser) return globalUser;

  // Fallback a auth.currentUser
  return auth.currentUser;
}

/**
 * Inicializa el gestor de usuarios.
 * Se suscribe al evento "admin:ready" disparado por AdminLayout.
 * También detecta si ya hay sesión activa (navegación SPA).
 */
export function initUserManager(): void {
  // Obtener el siteDomain desde el AdminLayout
  const adminApp = document.getElementById("admin-app");
  const siteDomain = adminApp?.dataset.siteDomain;

  if (siteDomain) {
    // Navegación SPA o carga directa: intentar cargar inmediatamente
    const user = getCurrentUser();
    if (user) {
      setupUserManager(siteDomain, user);
      return;
    }
    // Si no hay usuario aún, esperar con polling
    waitForAuthAndLoad(siteDomain);
    return;
  }

  // Primera carga: suscribirse al evento de AdminLayout
  window.addEventListener("admin:ready", ((event: CustomEvent) => {
    const { siteDomain: sd } = event.detail;
    if (sd) {
      const user = getCurrentUser();
      if (user) {
        setupUserManager(sd, user);
      } else {
        waitForAuthAndLoad(sd);
      }
    }
  }) as EventListener);
}

/**
 * Espera a que el usuario esté disponible y luego carga los miembros.
 * Hasta 20 intentos (10 segundos) para dar tiempo a que Firebase Auth restaure la sesión.
 */
async function waitForAuthAndLoad(siteDomain: string): Promise<void> {
  const loadingEl = document.getElementById("users-loading");

  for (let i = 0; i < 20; i++) {
    const user = getCurrentUser();
    if (user) {
      // Pasar el usuario directamente para evitar race conditions
      await setupUserManager(siteDomain, user);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Timeout: mostrar error
  if (loadingEl) {
    loadingEl.textContent = "Error: No se pudo verificar la sesión. Recarga la página.";
  }
}

/**
 * Configura el gestor de usuarios para un sitio.
 * Recibe el usuario autenticado para evitar race conditions con auth.currentUser.
 */
async function setupUserManager(siteDomain: string, user: any): Promise<void> {
  const loadingEl = document.getElementById("users-loading");
  if (!loadingEl) return;

  // Verificar si el usuario actual es admin
  let isAdmin = false;
  try {
    const loadUserRole = (window as any).__loadUserRole;
    if (loadUserRole) {
      const role = await loadUserRole(siteDomain);
      isAdmin = role === "admin";
    }
  } catch { /* ignore */ }

  // Mostrar/ocultar elementos que requieren permisos de admin
  const inviteSection = document.getElementById("btn-invite-user");
  const inviteForm = document.getElementById("invite-form-container");
  if (inviteSection) inviteSection.classList.toggle("hidden", !isAdmin);
  if (inviteForm) inviteForm.classList.add("hidden");

  // Cargar miembros (pasar el usuario para evitar auth.currentUser)
  await loadMembers(siteDomain, user);

  // Ocultar loading
  loadingEl.classList.add("hidden");

  // Configurar búsqueda en vivo
  setupSearchFilter();

  // Configurar botón de refrescar
  setupRefreshButton(siteDomain);

  // Configurar handlers de UI (solo si es admin)
  if (isAdmin) {
    setupInviteUI();
    setupInviteSend(siteDomain);
    setupInviteCancel();
  }
}


// ============================================
// Carga de miembros
// ============================================

async function loadMembers(siteDomain: string, currentUser?: any): Promise<void> {
  const tableBody = document.getElementById("users-table-body");
  const emptyEl = document.getElementById("users-empty");
  const tableContainer = document.getElementById("users-table-container");
  const loadingEl = document.getElementById("users-loading");

  if (!tableBody) return;

  // Usar el usuario pasado como parámetro, o fallback a auth.currentUser
  const user = currentUser || auth.currentUser;
  if (!user) return;


  try {
    const result = await listDocuments<SiteMember>(`sites/${siteDomain}/members`);

    const adminApp = document.getElementById("admin-app");
    let siteData: any = null;
    try {
      if (adminApp?.dataset.siteData) {
        siteData = JSON.parse(adminApp.dataset.siteData);
        currentOwnerId = siteData.ownerId || "";
      }
    } catch { /* ignore */ }

    currentUserUid = user.uid;

    if (result.success && result.data && result.data.length > 0) {
      allMembers = result.data;
      currentPage = 1;
      renderCurrentPage();
      if (tableContainer) tableContainer.classList.remove("hidden");
      if (emptyEl) emptyEl.classList.add("hidden");
    } else {
      // Migración legacy desde roles
      if (siteData && siteData.roles && typeof siteData.roles === "object") {
        const legacyRoles = siteData.roles;
        const migratedMembers: SiteMember[] = [];

        for (const [uid, role] of Object.entries(legacyRoles)) {
          let displayName = uid;
          let email = "";
          let photoURL = "";
          try {
            const userResult = await getDocument<any>("users", uid);
            if (userResult.success && userResult.data) {
              displayName = userResult.data.displayName || uid;
              email = userResult.data.email || "";
              photoURL = userResult.data.photoURL || "";
            }
          } catch { /* ignore */ }

          const memberDoc: SiteMember = {
            uid,
            email,
            displayName,
            photoURL,
            role: (role as "admin" | "editor" | "viewer") || "viewer",
            invitedBy: currentOwnerId || uid,
            invitedAt: Timestamp.now(),
            isActive: true,
          };

          try {
            await setDocument(`sites/${siteDomain}/members`, uid, memberDoc);
          } catch { /* ignore */ }

          migratedMembers.push(memberDoc);
        }

        if (migratedMembers.length > 0) {
          allMembers = migratedMembers;
          currentPage = 1;
          renderCurrentPage();
          if (tableContainer) tableContainer.classList.remove("hidden");
          if (emptyEl) emptyEl.classList.add("hidden");
          return;
        }
      }

      allMembers = [];
      if (tableContainer) tableContainer.classList.add("hidden");
      if (emptyEl) emptyEl.classList.remove("hidden");
    }
  } catch (err) {
    console.error("Error loading members:", err);
    showUsersFeedback("error", "Error al cargar los miembros.");
    if (tableContainer) tableContainer.classList.add("hidden");
    if (emptyEl) emptyEl.classList.remove("hidden");
  } finally {
    if (loadingEl) loadingEl.classList.add("hidden");
  }
}

// ============================================
// Paginación
// ============================================

function renderCurrentPage(): void {
  const tableBody = document.getElementById("users-table-body");
  if (!tableBody) return;

  const totalPages = Math.max(1, Math.ceil(allMembers.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageMembers = allMembers.slice(start, start + PAGE_SIZE);

  // Renderizar filas de la página actual
  tableBody.innerHTML = pageMembers.map((member) => {
    const isOwner = member.uid === currentOwnerId;
    const isSelf = member.uid === currentUserUid;
    const isOwnerOrSelf = isOwner || isSelf;

    const roleOptions = ["admin", "editor", "viewer"].map((role) =>
      `<option value="${role}" ${member.role === role ? "selected" : ""} ${isOwner ? "disabled" : ""}>${getRoleLabel(role)}</option>`
    ).join("");

    const statusLabel = member.isActive ? "Activo" : "Inactivo";
    const statusClass = member.isActive ? "active" : "inactive";

    const avatarHtml = member.photoURL
      ? `<img src="${escapeHtml(member.photoURL)}" alt="" loading="lazy" />`
      : getInitials(member.displayName || member.email);

    return `
      <tr data-member-uid="${escapeHtml(member.uid)}">
        <td data-label="Usuario">
          <div class="user-cell">
            <div class="user-avatar">${avatarHtml}</div>
            <div>
              <strong>${escapeHtml(member.displayName || member.email.split("@")[0])}</strong>
              ${isOwner ? '<span class="badge badge-owner">Propietario</span>' : ""}
              ${isSelf && !isOwner ? '<span class="badge badge-self">Tú</span>' : ""}
            </div>
          </div>
        </td>
        <td data-label="Email">${escapeHtml(member.email)}</td>
        <td data-label="Rol">
          <select class="role-select" data-uid="${escapeHtml(member.uid)}" ${isOwner ? "disabled" : ""}>
            ${roleOptions}
          </select>
        </td>
        <td data-label="Estado">
          <button class="toggle-btn ${statusClass}" data-uid="${escapeHtml(member.uid)}" data-active="${member.isActive}" ${isOwner ? "disabled" : ""}>
            ${statusLabel}
          </button>
        </td>
        <td data-label="Acciones">
          ${!isOwnerOrSelf ? `<button class="btn-remove-member" data-uid="${escapeHtml(member.uid)}" data-name="${escapeHtml(member.displayName || member.email)}">Eliminar</button>` : ""}
        </td>
      </tr>
    `;
  }).join("");

  // Renderizar paginación
  renderPagination(totalPages);

  // Actualizar contador
  updateMembersCount(allMembers.length);

  // Configurar handlers
  setupTableEventHandlers();
}

function renderPagination(totalPages: number): void {
  const paginationEl = document.getElementById("users-pagination");
  if (!paginationEl) return;

  if (totalPages <= 1) {
    paginationEl.classList.add("hidden");
    return;
  }

  paginationEl.classList.remove("hidden");

  let html = "";

  // Botón anterior
  html += `<button class="page-btn" data-page="${currentPage - 1}" ${currentPage <= 1 ? "disabled" : ""}>&laquo; Anterior</button>`;

  // Páginas
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    html += `<button class="page-btn" data-page="1">1</button>`;
    if (startPage > 2) html += `<span class="page-dots">...</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn ${i === currentPage ? "page-active" : ""}" data-page="${i}">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span class="page-dots">...</span>`;
    html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
  }

  // Botón siguiente
  html += `<button class="page-btn" data-page="${currentPage + 1}" ${currentPage >= totalPages ? "disabled" : ""}>Siguiente &raquo;</button>`;

  paginationEl.innerHTML = html;

  // Eventos de paginación
  paginationEl.querySelectorAll(".page-btn:not(:disabled)").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = parseInt((btn as HTMLButtonElement).dataset.page || "1", 10);
      if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderCurrentPage();
        // Scroll suave al inicio de la tabla
        document.getElementById("users-table-container")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

// ============================================
// Event Handlers de la tabla
// ============================================

function setupTableEventHandlers(): void {
  // Cambio de rol
  document.querySelectorAll(".role-select").forEach((select) => {
    select.addEventListener("change", async (e) => {
      const target = e.target as HTMLSelectElement;
      const uid = target.dataset.uid;
      const newRole = target.value;
      if (!uid) return;

      const memberName = getMemberName(uid);
      if (!confirm(`¿Estás seguro de cambiar el rol de ${memberName}?`)) {
        const currentMember = getMemberData(uid);
        if (currentMember) target.value = currentMember.role;
        return;
      }

      const adminApp = document.getElementById("admin-app");
      const siteDomain = adminApp?.dataset.siteDomain;
      if (!siteDomain) return;

      const result = await updateDocument(`sites/${siteDomain}/members`, uid, { role: newRole });
      if (result.success) {
        showUsersFeedback("success", "Rol actualizado correctamente.");
        // Actualizar en allMembers
        const member = allMembers.find(m => m.uid === uid);
        if (member) member.role = newRole as "admin" | "editor" | "viewer";
      } else {
        showUsersFeedback("error", "Error al actualizar el rol.");
        const currentMember = getMemberData(uid);
        if (currentMember) target.value = currentMember.role;
      }
    });
  });

  // Toggle activo/inactivo
  document.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const uid = target.dataset.uid;
      const isActive = target.dataset.active === "true";

      if (!uid) return;

      const adminApp = document.getElementById("admin-app");
      const siteDomain = adminApp?.dataset.siteDomain;
      if (!siteDomain) return;

      const newActive = !isActive;
      const result = await updateDocument(`sites/${siteDomain}/members`, uid, { isActive: newActive });

      if (result.success) {
        target.dataset.active = String(newActive);
        target.textContent = newActive ? "Activo" : "Inactivo";
        target.className = `toggle-btn ${newActive ? "active" : "inactive"}`;
        showUsersFeedback("success", `Miembro ${newActive ? "activado" : "desactivado"} correctamente.`);
        // Actualizar en allMembers
        const member = allMembers.find(m => m.uid === uid);
        if (member) member.isActive = newActive;
      } else {
        showUsersFeedback("error", "Error al actualizar el estado.");
      }
    });
  });

  // Eliminar miembro
  document.querySelectorAll(".btn-remove-member").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const uid = target.dataset.uid;
      const name = target.dataset.name || "";

      if (!uid) return;
      if (!confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) return;

      const adminApp = document.getElementById("admin-app");
      const siteDomain = adminApp?.dataset.siteDomain;
      if (!siteDomain) return;

      const result = await deleteDocument(`sites/${siteDomain}/members`, uid);

      if (result.success) {
        // Eliminar de allMembers
        allMembers = allMembers.filter(m => m.uid !== uid);
        // Re-renderizar página actual
        renderCurrentPage();
        showUsersFeedback("success", "Miembro eliminado correctamente.");

        // Verificar si ya no hay miembros
        if (allMembers.length === 0) {
          const tableContainer = document.getElementById("users-table-container");
          const emptyEl = document.getElementById("users-empty");
          if (tableContainer) tableContainer.classList.add("hidden");
          if (emptyEl) emptyEl.classList.remove("hidden");
        }
      } else {
        showUsersFeedback("error", "Error al eliminar el miembro.");
      }
    });
  });
}

// ============================================
// Invitación
// ============================================

function setupInviteUI(): void {
  const btnInvite = document.getElementById("btn-invite-user");
  const formContainer = document.getElementById("invite-form-container");

  btnInvite?.addEventListener("click", () => {
    if (formContainer) {
      formContainer.classList.toggle("hidden");
      const emailInput = document.getElementById("invite-email") as HTMLInputElement;
      if (!formContainer.classList.contains("hidden")) {
        setTimeout(() => emailInput?.focus(), 100);
      }
    }
  });
}

function setupInviteSend(siteDomain: string): void {
  const btnSend = document.getElementById("btn-invite-send");
  if (!btnSend) return;

  btnSend.addEventListener("click", async () => {
    const emailInput = document.getElementById("invite-email") as HTMLInputElement;
    const roleSelect = document.getElementById("invite-role") as HTMLSelectElement;
    const feedbackEl = document.getElementById("invite-feedback");
    const emailErrorEl = document.getElementById("invite-email-error");

    const email = emailInput?.value.trim() || "";
    const role = roleSelect?.value || "editor";

    if (!email) {
      if (emailErrorEl) emailErrorEl.classList.remove("hidden");
      return;
    }
    if (emailErrorEl) emailErrorEl.classList.add("hidden");

    // Validar que no sea miembro ya existente
    const alreadyMember = allMembers.some(m => m.email.toLowerCase() === email.toLowerCase());
    if (alreadyMember) {
      if (feedbackEl) {
        feedbackEl.className = "alert alert-error";
        feedbackEl.textContent = "Este usuario ya es miembro del sitio.";
        feedbackEl.classList.remove("hidden");
      }
      return;
    }

    btnSend.setAttribute("disabled", "true");
    btnSend.textContent = "Enviando...";

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showUsersFeedback("error", "No autenticado.");
        return;
      }

      const memberData: SiteMember = {
        uid: email,
        email: email,
        displayName: email.split("@")[0],
        role: role as "admin" | "editor" | "viewer",
        invitedBy: currentUser.uid,
        invitedAt: Timestamp.now(),
        isActive: true,
      };

      const result = await setDocument(`sites/${siteDomain}/members`, email, memberData);

      if (result.success) {
        if (feedbackEl) {
          feedbackEl.className = "alert alert-success";
          feedbackEl.textContent = "Invitación enviada correctamente.";
          feedbackEl.classList.remove("hidden");
        }

        await loadMembers(siteDomain, auth.currentUser || undefined);

        emailInput.value = "";
        roleSelect.value = "editor";
        const formContainer = document.getElementById("invite-form-container");
        if (formContainer) formContainer.classList.add("hidden");

        setTimeout(() => {
          if (feedbackEl) feedbackEl.classList.add("hidden");
        }, 3000);
      } else {
        if (feedbackEl) {
          feedbackEl.className = "alert alert-error";
          feedbackEl.textContent = "Error al invitar al miembro.";
          feedbackEl.classList.remove("hidden");
        }
      }
    } catch {
      if (feedbackEl) {
        feedbackEl.className = "alert alert-error";
        feedbackEl.textContent = "Error al invitar al miembro.";
        feedbackEl.classList.remove("hidden");
      }
    } finally {
      btnSend.removeAttribute("disabled");
      btnSend.textContent = "Enviar invitación";
    }
  });
}

function setupInviteCancel(): void {
  const btnCancel = document.getElementById("btn-invite-cancel");
  const formContainer = document.getElementById("invite-form-container");

  btnCancel?.addEventListener("click", () => {
    if (formContainer) formContainer.classList.add("hidden");
    const emailInput = document.getElementById("invite-email") as HTMLInputElement;
    const feedbackEl = document.getElementById("invite-feedback");
    const emailErrorEl = document.getElementById("invite-email-error");
    if (emailInput) emailInput.value = "";
    if (feedbackEl) feedbackEl.classList.add("hidden");
    if (emailErrorEl) emailErrorEl.classList.add("hidden");
  });
}

// ============================================
// Búsqueda en vivo
// ============================================

function setupSearchFilter(): void {
  const searchInput = document.getElementById("users-search") as HTMLInputElement;
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    filterMembersTable(query);
  });
}

function filterMembersTable(query: string): void {
  const tableBody = document.getElementById("users-table-body");
  if (!tableBody) return;

  if (!query) {
    currentPage = 1;
    renderCurrentPage();
    return;
  }

  const filtered = allMembers.filter((member) => {
    const name = (member.displayName || "").toLowerCase();
    const email = member.email.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  // Mostrar solo los filtrados (sin paginación)
  tableBody.innerHTML = filtered.map((member) => {
    const isOwner = member.uid === currentOwnerId;
    const isSelf = member.uid === currentUserUid;
    const isOwnerOrSelf = isOwner || isSelf;

    const roleOptions = ["admin", "editor", "viewer"].map((role) =>
      `<option value="${role}" ${member.role === role ? "selected" : ""} ${isOwner ? "disabled" : ""}>${getRoleLabel(role)}</option>`
    ).join("");

    const statusLabel = member.isActive ? "Activo" : "Inactivo";
    const statusClass = member.isActive ? "active" : "inactive";

    const avatarHtml = member.photoURL
      ? `<img src="${escapeHtml(member.photoURL)}" alt="" loading="lazy" />`
      : getInitials(member.displayName || member.email);

    return `
      <tr data-member-uid="${escapeHtml(member.uid)}">
        <td data-label="Usuario">
          <div class="user-cell">
            <div class="user-avatar">${avatarHtml}</div>
            <div>
              <strong>${escapeHtml(member.displayName || member.email.split("@")[0])}</strong>
              ${isOwner ? '<span class="badge badge-owner">Propietario</span>' : ""}
              ${isSelf && !isOwner ? '<span class="badge badge-self">Tú</span>' : ""}
            </div>
          </div>
        </td>
        <td data-label="Email">${escapeHtml(member.email)}</td>
        <td data-label="Rol">
          <select class="role-select" data-uid="${escapeHtml(member.uid)}" ${isOwner ? "disabled" : ""}>
            ${roleOptions}
          </select>
        </td>
        <td data-label="Estado">
          <button class="toggle-btn ${statusClass}" data-uid="${escapeHtml(member.uid)}" data-active="${member.isActive}" ${isOwner ? "disabled" : ""}>
            ${statusLabel}
          </button>
        </td>
        <td data-label="Acciones">
          ${!isOwnerOrSelf ? `<button class="btn-remove-member" data-uid="${escapeHtml(member.uid)}" data-name="${escapeHtml(member.displayName || member.email)}">Eliminar</button>` : ""}
        </td>
      </tr>
    `;
  }).join("");

  // Ocultar paginación durante búsqueda
  const paginationEl = document.getElementById("users-pagination");
  if (paginationEl) paginationEl.classList.add("hidden");

  updateMembersCount(filtered.length);
  setupTableEventHandlers();
}

function updateMembersCount(count: number): void {
  const countEl = document.getElementById("users-count");
  const countValueEl = document.getElementById("users-count-value");
  if (countEl && countValueEl) {
    countValueEl.textContent = String(count);
    countEl.classList.remove("hidden");
  }
}

// ============================================
// Botón de refrescar
// ============================================

function setupRefreshButton(siteDomain: string): void {
  const refreshBtn = document.getElementById("btn-refresh-users");
  if (!refreshBtn) return;

  refreshBtn.addEventListener("click", async () => {
    refreshBtn.setAttribute("disabled", "true");
    const originalText = refreshBtn.textContent;
    refreshBtn.textContent = "↻ ...";

    // Mostrar loading
    const loadingEl = document.getElementById("users-loading");
    if (loadingEl) loadingEl.classList.remove("hidden");

    // Limpiar búsqueda
    const searchInput = document.getElementById("users-search") as HTMLInputElement;
    if (searchInput) searchInput.value = "";

    // Recargar miembros
    await loadMembers(siteDomain, auth.currentUser || undefined);

    // Restaurar botón
    refreshBtn.textContent = originalText;
    refreshBtn.removeAttribute("disabled");
  });
}

// ============================================
// Helpers
// ============================================

function showUsersFeedback(type: "success" | "error", message: string): void {
  const feedbackEl = document.getElementById("users-feedback");
  if (!feedbackEl) return;

  feedbackEl.className = `alert alert-${type}`;
  feedbackEl.textContent = message;
  feedbackEl.classList.remove("hidden");

  setTimeout(() => {
    feedbackEl.classList.add("hidden");
  }, 4000);
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: "Admin",
    editor: "Editor",
    viewer: "Viewer",
  };
  return labels[role] || role;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function getMemberName(uid: string): string {
  const member = allMembers.find(m => m.uid === uid);
  return member?.displayName || member?.email || uid;
}

function getMemberData(uid: string): SiteMember | null {
  return allMembers.find(m => m.uid === uid) || null;
}
