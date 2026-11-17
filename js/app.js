"use strict";
// Tela principal: filtros, tabela, paginação e fichas

const data = catalogData;
const { applicationProductMarkup, initializeProductGallery, products } = catalogProducts;
const {
  compare, compareApplications, filterApplications, groupCodes, indexed, noteOnList, parseQuery, yearsLabel,
} = catalogModel;

const apps = data.map(indexed);
const byLine = new Map(apps.map(app => [String(app.line), app]));
const allCodes = groupCodes(apps);
const makes = unique(apps.map(app => app.make)).sort(compare);
const typeCounts = new Map(Object.keys(products).map(type => [type, 0]));
for (const app of apps) {
  typeCounts.set(app.type, (typeCounts.get(app.type) ?? 0) + 1);
}
const pageSize = 12;
const state = { view: "applications", page: 1, code: "" };

const $ = id => document.getElementById(id);
const controls = Object.fromEntries(["make", "model", "year", "position", "type", "sort", "query"].map(id => [id, $(id)]));
const viewLinks = [...document.querySelectorAll("[data-view]")];
const results = $("results-table");
const details = $("details");
const about = $("about");
const resultHeading = $("results-title");
const number = new Intl.NumberFormat("pt-BR");

const views = {
  applications: {
    heading: "Aplicações",
    sort: [["vehicle", "Veículo (A–Z)"], ["newest", "Ano mais recente"], ["type", "Tipo FOB"], ["code", "Código de mola"]],
    columns: [
      ["vehicle", "Veículo"], ["years", "Ano-modelo"], ["engine", "Motor / versão"],
      ["position", "Posição"], ["type", "Buffer"], ["code", "Código de mola"], ["action", "Ficha"],
    ],
  },
  codes: {
    heading: "Códigos de mola",
    sort: [["code", "Código (A–Z)"], ["type", "Tipo FOB"], ["coverage", "Mais aplicações"]],
    columns: [
      ["reference", "Código de mola"], ["buffer", "Buffer"], ["axle", "Posição"],
      ["make", "Montadoras"], ["linked", "Aplicações"], ["action", "Consultar"],
    ],
  },
};

function unique(values) {
  return [...new Set(values)];
}

function escape(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[character]));
}

function icon(name) {
  return '<span class="icon icon-' + name + '" aria-hidden="true"></span>';
}

function fillSelect(select, values, placeholder) {
  const first = placeholder ? [new Option(placeholder, "")] : [];
  const options = values.map(([value, label]) => new Option(label, value));
  select.replaceChildren(...first, ...options);
}

function updateModelOptions() {
  const previous = controls.model.value;
  const models = unique(apps.filter(app => !controls.make.value || app.make === controls.make.value)
    .map(app => app.model)).sort(compare);
  fillSelect(controls.model, models.map(model => [model, model]), "Todos os modelos");
  if (models.includes(previous)) controls.model.value = previous;
}

function filterValues() {
  return {
    make: controls.make.value,
    model: controls.model.value,
    year: controls.year.value,
    position: controls.position.value,
    type: controls.type.value,
    code: state.code,
    query: parseQuery(controls.query.value),
  };
}

function positionTag(position) {
  const style = position === "Traseira" ? " rear" : "";
  return '<span class="position-tag' + style + '">' + escape(position) + "</span>";
}

function fobTag(type) {
  return '<span class="fob-tag">FOB ' + escape(type) + "</span>";
}

function fobThumb(type) {
  return '<span class="fob-cell-inner"><img class="fob-thumb" src="' + embeddedPhoto(type.toLowerCase() + "-par.webp")
    + '" alt="" width="40" height="40" decoding="async">' + fobTag(type) + "</span>";
}

function yearMarkup(app) {
  const meta = app.last === null ? '<span class="cell-meta">Ano final em aberto</span>' : "";
  return '<span class="years-value">' + yearsLabel(app) + "</span>" + meta;
}

function rowButton(attribute, value, label, direction) {
  return '<button class="row-button" type="button" ' + attribute + '="' + escape(value)
    + '" aria-label="' + escape(label) + '" title="' + escape(label) + '">' + icon(direction) + "</button>";
}

function applicationRow(app) {
  const review = app.review ? '<span class="review-tag">A conferir</span>' : "";
  const note = noteOnList(app.note);
  const noteMarkup = note && !app.review ? '<span class="cell-meta note-context">' + escape(note) + "</span>" : "";
  const codeMarkup = '<span class="code-value">' + escape(app.code) + "</span>";
  const label = "Ver ficha de " + app.make + " " + app.model + ", " + app.code + ", " + app.position.toLowerCase();
  return '<tr><td class="vehicle-cell"><span class="vehicle-make">' + escape(app.make)
    + '</span><strong class="vehicle-model">' + escape(app.model) + "</strong>" + review + "</td>"
    + '<td class="years-cell" data-label="Ano-modelo">' + yearMarkup(app) + "</td>"
    + '<td class="engine-cell" data-label="Motor / versão">' + escape(app.engine || "—") + noteMarkup + "</td>"
    + '<td class="position-cell" data-label="Posição">' + positionTag(app.position) + "</td>"
    + '<td class="fob-cell" data-label="Buffer">' + fobThumb(app.type) + "</td>"
    + '<td class="code-cell" data-label="Código de mola">' + codeMarkup + "</td>"
    + '<td class="action-cell">' + rowButton("data-line", app.line, label, "arrow-up-right") + "</td></tr>";
}

function codeRow(group) {
  const brands = unique(group.applications.map(app => app.make)).sort(compare).map(escape).join(", ");
  const count = group.applications.length;
  const label = "Ver aplicações da mola " + group.code;
  return '<tr><td class="code-cell"><strong class="code-value">' + escape(group.code) + "</strong></td>"
    + '<td class="fob-cell" data-label="Buffer">' + fobThumb(group.type) + "</td>"
    + '<td class="position-cell" data-label="Posição">' + positionTag(group.position) + "</td>"
    + '<td class="makes-cell" data-label="Montadoras">' + brands + "</td>"
    + '<td class="total-cell" data-label="Aplicações">' + number.format(count) + "</td>"
    + '<td class="action-cell">' + rowButton("data-code", group.code, label, "arrow-right") + "</td></tr>";
}

function renderTable(rows, isCodes) {
  const columns = views[state.view].columns;
  const cols = columns.map(([className]) => '<col class="' + className + '-col">').join("");
  const headings = columns.map(([className, label]) => '<th scope="col">'
    + (className === "action" ? '<span class="sr-only">' + label + "</span>" : label) + "</th>").join("");
  const body = rows.map(isCodes ? codeRow : applicationRow).join("");
  results.innerHTML = '<table class="catalog-table' + (isCodes ? ' code-table' : '') + '" aria-labelledby="results-title">'
    + "<colgroup>" + cols + "</colgroup><thead><tr>" + headings + "</tr></thead><tbody>" + body + "</tbody></table>";
}

function renderEmpty() {
  results.innerHTML = '<div class="empty-state"><div class="empty-icon">' + icon("search") + "</div>"
    + "<h3>Nenhum resultado para esta busca</h3><p>Tente outro código, nome de veículo ou combinação de filtros.</p>"
    + '<button class="plain-button" type="button" data-reset>Limpar filtros</button></div>';
}

function sortedRows(filtered) {
  const sort = controls.sort.value;
  if (state.view === "codes") {
    const groups = groupCodes(filtered);
    if (sort === "coverage") return groups.sort((a, b) => b.applications.length - a.applications.length || compare(a.code, b.code));
    if (sort === "type") return groups.sort((a, b) => compare(a.type, b.type) || compare(a.code, b.code));
    return groups.sort((a, b) => compare(a.code, b.code));
  }
  if (sort === "newest") return filtered.sort((a, b) => (b.last ?? b.first) - (a.last ?? a.first) || compareApplications(a, b));
  if (sort === "type") return filtered.sort((a, b) => compare(a.type, b.type) || compareApplications(a, b));
  if (sort === "code") return filtered.sort((a, b) => compare(a.code, b.code) || compareApplications(a, b));
  return filtered.sort(compareApplications);
}

function render() {
  const isCodes = state.view === "codes";
  const filtered = filterApplications(apps, filterValues());
  const rows = sortedRows(filtered);
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  state.page = Math.min(state.page, pages);
  const start = (state.page - 1) * pageSize;
  const formatted = number.format(total);
  const noun = isCodes ? (total === 1 ? "código" : "códigos") : (total === 1 ? "aplicação" : "aplicações");

  $("result-count").innerHTML = '<span aria-hidden="true">' + formatted + '</span><span class="sr-only">'
    + formatted + " " + noun + " na busca</span>";
  $("clear-query").hidden = !controls.query.value;

  const matchContext = $("filter-context");
  matchContext.hidden = !state.code;
  matchContext.innerHTML = state.code
    ? 'Código selecionado <strong>' + escape(state.code) + '</strong> <button class="plain-button" type="button" data-clear-code>Remover</button>'
    : "";

  $("pagination").hidden = total === 0;
  if (total === 0) {
    renderEmpty();
    return;
  }

  renderTable(rows.slice(start, start + pageSize), isCodes);
  $("page-range").textContent = "Exibindo " + number.format(start + 1) + "–"
    + number.format(Math.min(start + pageSize, total)) + " de " + formatted;
  $("page-label").textContent = state.page + " / " + pages;
  $("prev-page").disabled = state.page === 1;
  $("next-page").disabled = state.page === pages;
}

function refresh() {
  state.page = 1;
  render();
}

function clearFilters({ focus = false } = {}) {
  $("search-form").reset();
  updateModelOptions();
  state.code = "";
  refresh();
  if (focus) controls.query.focus({ preventScroll: true });
}

function scrollTo(element) {
  element.scrollIntoView({ block: "start" });
}

function setView(view) {
  if (view === state.view) return;
  state.view = view;
  if (view === "codes") state.code = "";
  resultHeading.textContent = views[view].heading;
  fillSelect(controls.sort, views[view].sort, "");
  for (const link of viewLinks.filter(link => link.closest("nav"))) {
    if (link.dataset.view === view) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  refresh();
}

function viewFromHash() {
  if (location.hash === "#codigos") return "codes";
  if (location.hash === "#aplicacoes" || !location.hash) return "applications";
  return null;
}

function moveToView(view) {
  const hash = view === "codes" ? "#codigos" : "#aplicacoes";
  if (location.hash !== hash) history.pushState(null, "", hash);
  setView(view);
  scrollTo($("consulta"));
}

function showDetail(app) {
  const noteHeading = app.review ? "A conferir · Observação da planilha" : "Observação da planilha";
  const note = app.note
    ? '<div class="detail-note' + (app.review ? " review" : "") + '"><h3>' + noteHeading
      + "</h3><p>" + escape(app.note) + "</p></div>"
    : "";
  $("detail-content").innerHTML = '<div class="detail-title-bar"><div><span class="vehicle-make">' + escape(app.make)
    + '</span><h2 id="detail-title">' + escape(app.model) + "</h2></div>" + fobTag(app.type) + "</div>"
    + '<dl class="details-grid"><div><dt>Ano-modelo</dt><dd>' + yearMarkup(app) + "</dd></div>"
    + "<div><dt>Posição</dt><dd>" + positionTag(app.position) + "</dd></div>"
    + '<div class="wide"><dt>Motor / versão</dt><dd>' + escape(app.engine || "Sem informação na planilha") + "</dd></div>"
    + '<div class="wide"><dt>Código da mola</dt><dd><strong class="code-value">' + escape(app.code) + "</strong></dd></div></dl>"
    + note + applicationProductMarkup(app.type)
    + '<div class="detail-footer"><span>Fonte · Aba Aplicações, linha ' + app.line + "</span>"
    + '<button class="plain-button" type="button" data-copy-code="' + escape(app.code) + '">Copiar código</button></div>'
    + '<span class="sr-only" role="status" id="copy-status"></span>';
  details.showModal();
}

async function copyCode(button) {
  const message = $("copy-status");
  try {
    await navigator.clipboard.writeText(button.dataset.copyCode);
    button.textContent = "Copiado";
    message.textContent = "Código copiado.";
  } catch {
    const selection = window.getSelection();
    selection.selectAllChildren(details.querySelector(".code-value"));
    button.textContent = "Código selecionado";
    message.textContent = "Código selecionado para copiar.";
  }
}

fillSelect(controls.make, makes.map(make => [make, make]), "Todas as marcas");
updateModelOptions();
const minYear = Math.min(...apps.map(app => app.first));
const maxYear = Math.max(new Date().getFullYear(), ...apps.map(app => app.last ?? app.first));
const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
fillSelect(controls.year, years.map(year => [year, year]), "Todos os anos");
const availableTypes = [...typeCounts.entries()].filter(([, count]) => count > 0).map(([type]) => [type, "FOB " + type]);
fillSelect(controls.type, availableTypes, "Todos os tipos");
fillSelect(controls.sort, views.applications.sort, "");

const gallery = initializeProductGallery(typeCounts, type => {
  $("search-form").reset();
  updateModelOptions();
  state.code = "";
  controls.type.value = type;
  moveToView("applications");
  refresh();
  controls.type.focus({ preventScroll: true });
});

$("coverage").innerHTML = "<span><strong>" + number.format(makes.length) + "</strong> montadoras</span>"
  + "<span><strong>" + number.format(allCodes.length) + "</strong> códigos de mola</span>";

for (const link of viewLinks) {
  link.addEventListener("click", event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    moveToView(link.dataset.view);
  });
}
function syncCatalogView() {
  const view = viewFromHash();
  if (view) setView(view);
}
window.addEventListener("hashchange", syncCatalogView);
window.addEventListener("popstate", syncCatalogView);

$("about-footer").addEventListener("click", () => about.showModal());
for (const dialog of [about, details]) {
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) {
      dialog.close();
    }
  });
}

$("search-form").addEventListener("submit", event => {
  event.preventDefault();
  refresh();
});
controls.query.addEventListener("input", () => {
  state.code = "";
  refresh();
});
controls.make.addEventListener("change", updateModelOptions);
for (const select of Object.values(controls).filter(control => control.tagName === "SELECT")) {
  select.addEventListener("change", refresh);
}

$("reset-filters").addEventListener("click", () => clearFilters({ focus: true }));
$("clear-query").addEventListener("click", () => {
  controls.query.value = "";
  state.code = "";
  refresh();
  controls.query.focus();
});
$("filter-context").addEventListener("click", event => {
  if (!event.target.closest("[data-clear-code]")) return;
  state.code = "";
  refresh();
  controls.query.focus();
});

results.addEventListener("click", event => {
  const action = event.target.closest("button");
  if (!action) return;
  if (action.hasAttribute("data-reset")) clearFilters({ focus: true });
  if (action.dataset.line) showDetail(byLine.get(action.dataset.line));
  if (action.dataset.code) {
    state.code = action.dataset.code;
    moveToView("applications");
    $("filter-context").querySelector("[data-clear-code]").focus({ preventScroll: true });
  }
});

details.addEventListener("click", event => {
  const button = event.target.closest("[data-copy-code]");
  if (button) copyCode(button);

  const productLink = event.target.closest("[data-product-gallery]");
  if (productLink) {
    event.preventDefault();
    details.close();
    if (location.hash !== "#medidas") history.pushState(null, "", "#medidas");
    gallery.select(productLink.dataset.productGallery, { reveal: true });
  }
});

$("prev-page").addEventListener("click", () => changePage(-1));
$("next-page").addEventListener("click", () => changePage(1));

function changePage(offset) {
  state.page += offset;
  render();
  resultHeading.tabIndex = -1;
  resultHeading.focus({ preventScroll: true });
  scrollTo(resultHeading);
}

syncCatalogView();
render();
if (location.hash === "#codigos" || location.hash === "#aplicacoes") scrollTo($("consulta"));
