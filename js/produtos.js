"use strict";
// Tipos FOB A–F: medidas, fotos e galeria

const catalogProducts = (() => {
const products = {
  A: { reference: "GI4713173", gap: 50, wire: 13, length: 46 },
  B: { reference: "GI3513160", gap: 38, wire: 13, length: 38 },
  C: { reference: "GI2710131", gap: 27, wire: 13, length: 32 },
  D: { reference: "GI2310113", gap: 21, wire: 13, length: 26 },
  E: { reference: "FOB-E", gap: 16, wire: 13, length: 27 },
  F: { reference: "GI1215120", gap: 13, wire: 10, length: 30 },
};

const photos = {
  par: { label: "Par", description: "Par de calços" },
  detalhe: { label: "Detalhe", description: "Vista de perto de um calço" },
  embalagem: { label: "Embalagem", description: "Par de calços com a embalagem" },
};

function photoPath(type, angle = "par") {
  return embeddedPhoto(type.toLowerCase() + "-" + angle + ".webp");
}

function measure(value, unit) {
  return value + "&nbsp;" + unit;
}

function applicationProductMarkup(type) {
  const product = products[type];
  if (!product) return "";

  return '<section class="application-product" aria-label="Buffer FOB ' + type + '">'
    + '<img src="' + photoPath(type) + '" alt="Par de calços FOB ' + type + '" width="1500" height="1500" decoding="async">'
    + '<div><span class="application-product-name">Buffer FOB ' + type + '</span><span class="application-reference">Ref. ' + product.reference + '</span>'
    + '<dl><div><dt>Vão</dt><dd>' + measure(product.gap, "mm") + "</dd></div>"
    + "<div><dt>Diâmetro</dt><dd>" + measure(product.wire, "mm") + "</dd></div>"
    + "<div><dt>Comprimento</dt><dd>" + measure(product.length, "cm") + "</dd></div></dl>"
    + '<a class="product-inline-link" href="#medidas" data-product-gallery="' + type + '">Ver todas as fotos <span aria-hidden="true">↗</span></a>'
    + "</div></section>";
}

function initializeProductGallery(typeCounts, showApplications) {
  const rows = document.getElementById("measure-rows");
  const heading = document.getElementById("gallery-title");
  const reference = document.getElementById("gallery-reference");
  const image = document.getElementById("gallery-photo");
  const enlarge = document.getElementById("gallery-enlarge");
  const thumbs = document.getElementById("gallery-thumbs");
  const apply = document.getElementById("gallery-applications");
  const empty = document.getElementById("gallery-no-applications");
  const status = document.getElementById("gallery-status");
  const allProducts = Object.entries(products);
  let selected = "";

  rows.innerHTML = allProducts.map(([type, product]) =>
    '<tr><th scope="row"><button type="button" class="measure-type" aria-pressed="false" data-product-type="'
    + type + '">FOB ' + type + "</button></th><td>" + measure(product.gap, "mm") + "</td>"
    + "<td>" + measure(product.wire, "mm") + "</td><td>" + measure(product.length, "cm") + "</td></tr>",
  ).join("");

  function setAngle(angle) {
    const path = photoPath(selected, angle);
    const description = photos[angle].description + " FOB " + selected;
    image.src = path;
    image.alt = description;
    enlarge.href = path;
    for (const button of thumbs.querySelectorAll("button")) {
      button.setAttribute("aria-pressed", String(button.dataset.angle === angle));
    }
    status.textContent = description;
  }

  function focusGallery() {
    heading.focus({ preventScroll: true });
    heading.closest(".product-gallery").scrollIntoView({ block: "start" });
  }

  function select(type, { reveal = false } = {}) {
    const product = products[type];
    if (!product) return;

    if (type !== selected) {
      selected = type;
      heading.textContent = "FOB " + type;
      reference.textContent = "Referência GI Imports · " + product.reference;
      const count = typeCounts.get(type) ?? 0;
      apply.hidden = count === 0;
      empty.hidden = count > 0;
      apply.firstChild.textContent = "Ver " + count + (count === 1 ? " aplicação " : " aplicações ");
      for (const button of rows.querySelectorAll("button")) {
        button.setAttribute("aria-pressed", String(button.dataset.productType === type));
      }
      thumbs.innerHTML = Object.entries(photos).map(([angle, info]) =>
        '<button type="button" class="gallery-thumb" data-angle="' + angle + '" aria-pressed="false">'
        + '<img src="' + photoPath(type, angle) + '" alt="" width="1500" height="1500" loading="lazy" decoding="async">'
        + "<span>" + info.label + "</span></button>",
      ).join("");
      setAngle("par");
    }
    if (reveal) focusGallery();
  }

  rows.addEventListener("click", event => {
    const button = event.target.closest("[data-product-type]");
    if (button) select(button.dataset.productType, { reveal: matchMedia("(max-width: 780px)").matches });
  });
  thumbs.addEventListener("click", event => {
    const button = event.target.closest("[data-angle]");
    if (button) setAngle(button.dataset.angle);
  });
  apply.addEventListener("click", () => showApplications(selected));

  select("A");
  return { select };
}

return { products, applicationProductMarkup, initializeProductGallery };
})();
