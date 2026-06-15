"use strict";

const STORAGE_KEY = "registroEstudiantes";

const form = document.querySelector("#student-form");
const studentList = document.querySelector("#student-list");
const emptyState = document.querySelector("#empty-state");
const studentCount = document.querySelector("#student-count");
const searchInput = document.querySelector("#search");
const facultyFilter = document.querySelector("#faculty-filter");
const submitButton = document.querySelector("#submit-button");
const cancelButton = document.querySelector("#cancel-button");
const formTitle = document.querySelector("#form-title");
const toast = document.querySelector("#toast");
const confirmModal = document.querySelector("#confirm-modal");
const studentToDelete = document.querySelector("#student-to-delete");
const keepButton = document.querySelector("#keep-button");
const deleteButton = document.querySelector("#delete-button");

const fields = {
  cedula: document.querySelector("#cedula"),
  apellidos: document.querySelector("#apellidos"),
  nombres: document.querySelector("#nombres"),
  direccion: document.querySelector("#direccion"),
  telefono: document.querySelector("#telefono"),
  correo: document.querySelector("#correo"),
  facultad: document.querySelector("#facultad"),
  nivel: document.querySelector("#nivel"),
  paralelo: document.querySelector("#paralelo")
};

const patterns = {
  cedula: /^\d{10}$/,
  nombres: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[\s'-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/,
  direccion: /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ][A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s.,#°/-]{4,99}$/,
  telefono: /^(?:0[2-7]\d{7}|09\d{8})$/,
  correo: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  paralelo: /^[A-Za-z][0-9]?$/
};

let students = loadStudents();
let pendingDeleteId = null;

function loadStudents() {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    const parsedData = storedData ? JSON.parse(storedData) : [];
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.error("No se pudieron leer los registros:", error);
    return [];
  }
}

function saveStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function normalizeText(value) {
  return value.trim().replace(/\s+/g, " ");
}

function getFormData() {
  return {
    id: document.querySelector("#student-id").value || crypto.randomUUID(),
    cedula: fields.cedula.value.trim(),
    apellidos: normalizeText(fields.apellidos.value),
    nombres: normalizeText(fields.nombres.value),
    direccion: normalizeText(fields.direccion.value),
    telefono: fields.telefono.value.trim(),
    correo: fields.correo.value.trim().toLowerCase(),
    facultad: fields.facultad.value,
    nivel: fields.nivel.value,
    paralelo: fields.paralelo.value.trim().toUpperCase()
  };
}

function getError(fieldName, value, currentId = "") {
  const requiredMessages = {
    cedula: "La cédula es obligatoria.",
    apellidos: "Los apellidos son obligatorios.",
    nombres: "Los nombres son obligatorios.",
    direccion: "La dirección es obligatoria.",
    telefono: "El teléfono es obligatorio.",
    correo: "El correo electrónico es obligatorio.",
    facultad: "Seleccione una facultad.",
    nivel: "Seleccione un nivel.",
    paralelo: "El paralelo es obligatorio."
  };

  if (!value) {
    return requiredMessages[fieldName];
  }

  switch (fieldName) {
    case "cedula":
      if (!patterns.cedula.test(value)) {
        return "Ingrese exactamente 10 dígitos.";
      }
      if (students.some((student) => student.cedula === value && student.id !== currentId)) {
        return "Esta cédula ya está registrada.";
      }
      break;
    case "apellidos":
    case "nombres":
      if (value.length < 2 || !patterns.nombres.test(value)) {
        return "Use solo letras y espacios (mínimo 2 caracteres).";
      }
      break;
    case "direccion":
      if (!patterns.direccion.test(value)) {
        return "Ingrese una dirección válida (mínimo 5 caracteres).";
      }
      break;
    case "telefono":
      if (!patterns.telefono.test(value)) {
        return "Ingrese un celular de 10 dígitos o un teléfono fijo válido.";
      }
      break;
    case "correo":
      if (!patterns.correo.test(value)) {
        return "Ingrese un correo electrónico válido.";
      }
      if (students.some((student) => student.correo === value.toLowerCase() && student.id !== currentId)) {
        return "Este correo ya está registrado.";
      }
      break;
    case "paralelo":
      if (!patterns.paralelo.test(value)) {
        return "Use una letra y, opcionalmente, un número (Ej. A o A1).";
      }
      break;
    default:
      break;
  }

  return "";
}

function showFieldError(fieldName, message) {
  const field = fields[fieldName];
  const errorElement = document.querySelector(`#${fieldName}-error`);

  field.classList.toggle("invalid", Boolean(message));
  field.setAttribute("aria-invalid", String(Boolean(message)));
  errorElement.textContent = message;
}

function validateField(fieldName) {
  let value = fields[fieldName].value.trim();
  if (["apellidos", "nombres", "direccion"].includes(fieldName)) {
    value = normalizeText(value);
  }
  if (fieldName === "paralelo") {
    value = value.toUpperCase();
  }

  const currentId = document.querySelector("#student-id").value;
  const error = getError(fieldName, value, currentId);
  showFieldError(fieldName, error);
  return !error;
}

function validateForm() {
  const results = Object.keys(fields).map(validateField);
  const firstInvalidField = Object.keys(fields).find(
    (fieldName, index) => !results[index]
  );

  if (firstInvalidField) {
    fields[firstInvalidField].focus();
    return false;
  }
  return true;
}

function clearErrors() {
  Object.keys(fields).forEach((fieldName) => showFieldError(fieldName, ""));
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

function getInitials(student) {
  const firstName = student.nombres.trim().split(/\s+/)[0] || "";
  const firstLastName = student.apellidos.trim().split(/\s+/)[0] || "";
  return `${firstName.charAt(0)}${firstLastName.charAt(0)}`.toUpperCase();
}

function getAvatarColor(faculty) {
  const colors = {
    "Ciencias Administrativas": "#3768d5",
    "Ciencias de la Salud": "#16805d",
    "Ciencias Sociales": "#9b5fc0",
    "Educación": "#e08b2d",
    "Ingeniería": "#277c9b",
    "Jurisprudencia": "#b24f5b"
  };
  return colors[faculty] || "#2764e7";
}

function renderStudents(filter = "", selectedFaculty = "") {
  const query = filter.trim().toLocaleLowerCase("es");
  const filteredStudents = students.filter((student) => {
    const matchesQuery = [
      student.cedula,
      student.apellidos,
      student.nombres,
      student.correo,
      student.facultad
    ].some((value) => value.toLocaleLowerCase("es").includes(query));
    const matchesFaculty = !selectedFaculty || student.facultad === selectedFaculty;
    return matchesQuery && matchesFaculty;
  });

  studentList.innerHTML = filteredStudents.map((student) => `
    <tr>
      <td>${escapeHtml(student.cedula)}</td>
      <td>
        <div class="student-profile">
          <span class="student-avatar" style="--avatar-color: ${getAvatarColor(student.facultad)}"
            aria-hidden="true">${escapeHtml(getInitials(student))}</span>
          <div>
            <span class="student-name">${escapeHtml(student.apellidos)}, ${escapeHtml(student.nombres)}</span>
            <span class="cell-secondary">${escapeHtml(student.direccion)}</span>
          </div>
        </div>
      </td>
      <td>
        ${escapeHtml(student.correo)}
        <span class="cell-secondary">${escapeHtml(student.telefono)}</span>
      </td>
      <td>${escapeHtml(student.facultad)}</td>
      <td><span class="badge">${escapeHtml(student.nivel)}</span></td>
      <td><span class="badge">${escapeHtml(student.paralelo)}</span></td>
      <td>
        <div class="row-actions">
          <button class="action-button" type="button" data-action="edit"
            data-id="${student.id}" aria-label="Editar a ${escapeHtml(student.nombres)}">
            Editar
          </button>
          <button class="action-button action-button--delete" type="button"
            data-action="delete" data-id="${student.id}"
            aria-label="Eliminar a ${escapeHtml(student.nombres)}">
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  `).join("");

  studentCount.textContent = students.length;
  emptyState.classList.toggle("hidden", filteredStudents.length > 0);

  const emptyTitle = emptyState.querySelector("h3");
  const emptyText = emptyState.querySelector("p");
  if (students.length > 0 && filteredStudents.length === 0) {
    emptyTitle.textContent = "No se encontraron resultados";
    emptyText.textContent = "Prueba con otro término de búsqueda.";
  } else {
    emptyTitle.textContent = "No hay estudiantes registrados";
    emptyText.textContent = "Completa el formulario para agregar el primer registro.";
  }
}

function resetForm() {
  form.reset();
  document.querySelector("#student-id").value = "";
  clearErrors();
  formTitle.textContent = "Nuevo estudiante";
  submitButton.textContent = "Registrar estudiante";
  cancelButton.classList.add("hidden");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2800);
}

function editStudent(id) {
  const student = students.find((item) => item.id === id);
  if (!student) {
    return;
  }

  document.querySelector("#student-id").value = student.id;
  Object.keys(fields).forEach((fieldName) => {
    fields[fieldName].value = student[fieldName];
  });

  clearErrors();
  formTitle.textContent = "Editar estudiante";
  submitButton.textContent = "Guardar cambios";
  cancelButton.classList.remove("hidden");
  document.querySelector(".form-card").scrollIntoView({ behavior: "smooth" });
  fields.cedula.focus({ preventScroll: true });
}

function openDeleteModal(id) {
  const student = students.find((item) => item.id === id);
  if (!student) {
    return;
  }

  pendingDeleteId = id;
  studentToDelete.textContent = `${student.nombres} ${student.apellidos}`;
  confirmModal.classList.remove("hidden");
  deleteButton.focus();
}

function closeDeleteModal() {
  pendingDeleteId = null;
  confirmModal.classList.add("hidden");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validateForm()) {
    return;
  }

  const student = getFormData();
  const existingIndex = students.findIndex((item) => item.id === student.id);

  if (existingIndex >= 0) {
    students[existingIndex] = student;
    showToast("Los datos del estudiante fueron actualizados.");
  } else {
    students.push(student);
    showToast("Estudiante registrado correctamente.");
  }

  saveStudents();
  renderStudents(searchInput.value, facultyFilter.value);
  resetForm();
});

Object.entries(fields).forEach(([fieldName, field]) => {
  field.addEventListener("blur", () => validateField(fieldName));
  field.addEventListener("input", () => {
    if (field.classList.contains("invalid")) {
      validateField(fieldName);
    }
  });
});

fields.cedula.addEventListener("input", () => {
  fields.cedula.value = fields.cedula.value.replace(/\D/g, "");
});

fields.telefono.addEventListener("input", () => {
  fields.telefono.value = fields.telefono.value.replace(/\D/g, "");
});

fields.paralelo.addEventListener("input", () => {
  fields.paralelo.value = fields.paralelo.value.toUpperCase();
});

studentList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  if (button.dataset.action === "edit") {
    editStudent(button.dataset.id);
  } else if (button.dataset.action === "delete") {
    openDeleteModal(button.dataset.id);
  }
});

searchInput.addEventListener("input", () =>
  renderStudents(searchInput.value, facultyFilter.value)
);
facultyFilter.addEventListener("change", () =>
  renderStudents(searchInput.value, facultyFilter.value)
);
cancelButton.addEventListener("click", resetForm);
keepButton.addEventListener("click", closeDeleteModal);

deleteButton.addEventListener("click", () => {
  if (!pendingDeleteId) {
    return;
  }

  const deletedId = pendingDeleteId;
  students = students.filter((student) => student.id !== deletedId);
  saveStudents();
  renderStudents(searchInput.value, facultyFilter.value);
  closeDeleteModal();

  if (document.querySelector("#student-id").value === deletedId) {
    resetForm();
  }
  showToast("Registro eliminado correctamente.");
});

confirmModal.addEventListener("click", (event) => {
  if (event.target === confirmModal) {
    closeDeleteModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !confirmModal.classList.contains("hidden")) {
    closeDeleteModal();
  }
});

renderStudents();
