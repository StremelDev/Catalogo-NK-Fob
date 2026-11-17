"use strict";
// Localizador: sugere o tipo FOB pela medida da mola

(() => {
  const form = $("measure-finder");
  const gapInput = $("f-gap");
  const wireInput = $("f-wire");
  const out = $("finder-result");
  const gaps = Object.values(products).map(product => product.gap);
  const minGap = Math.min(...gaps);
  const maxGap = Math.max(...gaps);

  function read(input) {
    const value = parseFloat(input.value.replace(",", "."));
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  function update() {
    const gap = read(gapInput);
    const wire = read(wireInput);
    if (gap === null) {
      out.innerHTML = "";
      return;
    }
    const ranked = Object.entries(products).map(([type, product]) => ({
      type,
      product,
      gapDiff: Math.abs(gap - product.gap),
      wireDiff: wire === null ? 0 : Math.abs(wire - product.wire),
    })).sort((a, b) => (a.gapDiff + a.wireDiff) - (b.gapDiff + b.wireDiff) || a.gapDiff - b.gapDiff);
    const best = ranked[0];

    if (best.gapDiff > 5) {
      out.innerHTML = '<p class="finder-warn">Nenhum tipo tem vão próximo de ' + number.format(gap)
        + " mm. Os tipos do catálogo vão de " + minGap + " a " + maxGap + " mm. Confira a medida.</p>";
      return;
    }

    const diff = best.gapDiff === 0 ? "vão igual ao medido" : "diferença de " + number.format(best.gapDiff) + " mm no vão";
    let markup = '<div class="finder-match"><img src="' + embeddedPhoto(best.type.toLowerCase() + "-par.webp")
      + '" alt="" width="62" height="62"><div><strong>FOB ' + best.type + "</strong>"
      + "<span>Vão " + best.product.gap + " mm · elo " + best.product.wire + " mm · " + diff + "</span></div>"
      + '<button class="plain-button" type="button" data-finder-type="' + best.type + '">Ver fotos</button></div>';

    const second = ranked[1];
    if (second && second.gapDiff - best.gapDiff <= 3 && second.gapDiff <= 5) {
      markup += '<p class="finder-note">Medida entre dois tipos. Compare também com <button type="button" data-finder-type="'
        + second.type + '">FOB ' + second.type + "</button> (vão " + second.product.gap + " mm).</p>";
    }
    if (wire !== null && Math.abs(wire - best.product.wire) > 1.5) {
      markup += '<p class="finder-note">Atenção: o elo do FOB ' + best.type + " é de " + best.product.wire
        + " mm e você informou " + number.format(wire) + " mm.</p>";
    }
    out.innerHTML = markup;
    gallery.select(best.type);
  }

  form.addEventListener("submit", event => event.preventDefault());
  gapInput.addEventListener("input", update);
  wireInput.addEventListener("input", update);
  out.addEventListener("click", event => {
    const button = event.target.closest("[data-finder-type]");
    if (button) gallery.select(button.dataset.finderType, { reveal: true });
  });
})();
