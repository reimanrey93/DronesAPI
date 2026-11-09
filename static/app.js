const API_URL = "/api/drones";
const statusLabels = {
  available: "Disponible",
  in_mission: "En misión",
  maintenance: "En mantenimiento",
};

const form = document.querySelector("#drone-form");
const list = document.querySelector("#drone-list");
const listMessage = document.querySelector("#list-message");
const formMessage = document.querySelector("#form-message");
const emptyState = document.querySelector("#empty-state");
const submitButton = document.querySelector("#submit-button");
const cancelEditButton = document.querySelector("#cancel-edit");

function showMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("error-message", isError);
}

async function request(path = "", options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Error del servidor (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

function createCell(text, className = "") {
  const cell = document.createElement("td");
  cell.textContent = text || "—";
  if (className) cell.className = className;
  return cell;
}

function renderDrone(drone) {
  const row = document.createElement("tr");
  const identity = createCell("");
  identity.className = "drone-identity";
  const name = document.createElement("strong");
  name.textContent = drone.model;
  const serial = document.createElement("span");
  serial.textContent = drone.serial_number;
  identity.append(name, serial);
  row.append(identity);

  const statusCell = createCell("");
  const badge = document.createElement("span");
  badge.className = `status-badge status-${drone.status}`;
  badge.textContent = statusLabels[drone.status] || drone.status;
  statusCell.append(badge);
  row.append(statusCell);

  const battery = createCell(`${drone.battery_level}%`, "battery-cell");
  const batteryTrack = document.createElement("span");
  batteryTrack.className = "battery-track";
  const batteryFill = document.createElement("span");
  batteryFill.className = `battery-fill${drone.battery_level <= 20 ? " battery-low" : ""}`;
  batteryFill.style.width = `${drone.battery_level}%`;
  batteryTrack.append(batteryFill);
  battery.append(batteryTrack);
  row.append(battery, createCell(drone.location));

  const actions = createCell("");
  actions.className = "actions-cell";
  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "icon-button";
  editButton.textContent = "Editar";
  editButton.setAttribute("aria-label", `Editar ${drone.serial_number}`);
  editButton.addEventListener("click", () => beginEdit(drone));
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "icon-button delete-button";
  deleteButton.textContent = "Eliminar";
  deleteButton.setAttribute("aria-label", `Eliminar ${drone.serial_number}`);
  deleteButton.addEventListener("click", () => deleteDrone(drone));
  actions.append(editButton, deleteButton);
  row.append(actions);
  return row;
}

async function loadDrones() {
  showMessage(listMessage, "");
  const params = new URLSearchParams();
  const search = document.querySelector("#search").value.trim();
  const status = document.querySelector("#status-filter").value;
  if (search) params.set("search", search);
  if (status) params.set("status", status);

  try {
    const drones = await request(`?${params.toString()}`);
    list.replaceChildren(...drones.map(renderDrone));
    document.querySelector("#drone-count").textContent = String(drones.length);
    emptyState.classList.toggle("hidden", drones.length > 0);
  } catch (error) {
    showMessage(listMessage, `No se pudo cargar la flota: ${error.message}`, true);
    list.replaceChildren();
    emptyState.classList.add("hidden");
  }
}

function resetForm() {
  form.reset();
  document.querySelector("#drone-id").value = "";
  document.querySelector("#battery-level").value = "100";
  document.querySelector("#form-title").textContent = "Registrar un drone";
  submitButton.textContent = "Guardar drone";
  cancelEditButton.classList.add("hidden");
  showMessage(formMessage, "");
}

function beginEdit(drone) {
  document.querySelector("#drone-id").value = String(drone.id);
  document.querySelector("#serial-number").value = drone.serial_number;
  document.querySelector("#model").value = drone.model;
  document.querySelector("#status").value = drone.status;
  document.querySelector("#battery-level").value = String(drone.battery_level);
  document.querySelector("#location").value = drone.location || "";
  document.querySelector("#notes").value = drone.notes || "";
  document.querySelector("#form-title").textContent = "Editar drone";
  submitButton.textContent = "Guardar cambios";
  cancelEditButton.classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage(formMessage, "");
  const id = document.querySelector("#drone-id").value;
  const payload = {
    serial_number: document.querySelector("#serial-number").value.trim(),
    model: document.querySelector("#model").value.trim(),
    status: document.querySelector("#status").value,
    battery_level: Number(document.querySelector("#battery-level").value),
    location: document.querySelector("#location").value.trim() || null,
    notes: document.querySelector("#notes").value.trim() || null,
  };
  submitButton.disabled = true;
  try {
    await request(id ? `/${id}` : "", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    resetForm();
    await loadDrones();
  } catch (error) {
    showMessage(formMessage, error.message, true);
  } finally {
    submitButton.disabled = false;
  }
});

async function deleteDrone(drone) {
  if (!window.confirm(`¿Eliminar el drone ${drone.serial_number}?`)) return;
  try {
    await request(`/${drone.id}`, { method: "DELETE" });
    await loadDrones();
  } catch (error) {
    showMessage(listMessage, `No se pudo eliminar: ${error.message}`, true);
  }
}

cancelEditButton.addEventListener("click", resetForm);
document.querySelector("#search").addEventListener("input", () => loadDrones());
document.querySelector("#status-filter").addEventListener("change", () => loadDrones());
loadDrones();
