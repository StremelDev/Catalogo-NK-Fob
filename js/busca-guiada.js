"use strict";
// Busca guiada: Montadora → Modelo → Ano

(() => {
  const gMake = $("g-make");
  const gModel = $("g-model");
  const gYear = $("g-year");
  const out = $("guide-result");
  const currentYear = new Date().getFullYear();
  const fits = (app, year) => year >= app.first && (app.last === null || year <= app.last);

  function lock(select, placeholder) {
    fillSelect(select, [], placeholder);
    select.disabled = true;
  }

  fillSelect(gMake, makes.map(make => [make, make]), "Selecione a montadora");
  lock(gModel, "Selecione o modelo");
  lock(gYear, "Todos os anos");

  function modelApps() {
    return apps.filter(app => app.make === gMake.value && app.model === gModel.value);
  }

  function card(type, items) {
    const product = products[type];
    const list = items.map(app => {
      const review = app.review ? '<span class="review-tag">A conferir</span>' : "";
      const note = app.note ? " · " + escape(app.note) : "";
      return '<li><div><span class="guide-app-engine">' + escape(app.engine || "Todas as versões") + "</span>"
        + '<span class="cell-meta">' + yearsLabel(app) + note + "</span>" + review + "</div>"
        + '<button class="code-chip" type="button" data-line="' + app.line + '" title="Ver ficha da aplicação">'
        + '<span class="code-value">' + escape(app.code) + "</span>" + icon("arrow-right") + "</button></li>";
    }).join("");
    return '<article class="guide-card"><img src="' + embeddedPhoto(type.toLowerCase() + "-par.webp")
      + '" alt="Par de calços FOB ' + type + '" width="1500" height="1500" decoding="async">'
      + '<div><div class="guide-card-top"><h5>FOB ' + type + "</h5>"
      + '<a class="product-inline-link" href="#medidas" data-guide-gallery="' + type + '">Fotos e medidas</a></div>'
      + '<span class="application-reference">Ref. ' + escape(product.reference) + " · vão " + product.gap
      + " mm · elo " + product.wire + " mm · " + product.length + " cm</span>"
      + '<ul class="guide-apps">' + list + "</ul></div></article>";
  }

  function draw() {
    if (!gMake.value || !gModel.value) {
      out.innerHTML = "";
      return;
    }
    const year = Number(gYear.value) || null;
    const list = modelApps().filter(app => !year || fits(app, year)).sort(compareApplications);
    const title = gMake.value + " " + gModel.value + (year ? " · " + year : "");
    const axles = ["Dianteira", "Traseira"].map(position => {
      const items = list.filter(app => app.position === position);
      const heading = "<h4>" + positionTag(position) + "</h4>";
      if (!items.length) {
        return '<div class="guide-axle">' + heading + '<p class="guide-empty-axle">Sem aplicação '
          + position.toLowerCase() + " cadastrada" + (year ? " para " + year : "") + ".</p></div>";
      }
      const types = unique(items.map(app => app.type)).sort(compare);
      const multi = types.length > 1
        ? '<p class="guide-multi">Depende da versão: ' + types.length + " tipos possíveis. Confira o motor e o código da mola.</p>"
        : "";
      return '<div class="guide-axle">' + heading + multi
        + types.map(type => card(type, items.filter(app => app.type === type))).join("") + "</div>";
    }).join("");
    out.innerHTML = '<div class="guide-summary"><h3>' + escape(title) + "</h3>"
      + '<button class="plain-button" type="button" data-guide-table>Ver na tabela completa ' + icon("arrow-right") + "</button></div>"
      + '<div class="guide-axles">' + axles + "</div>";
  }

  gMake.addEventListener("change", () => {
    const models = unique(apps.filter(app => app.make === gMake.value).map(app => app.model)).sort(compare);
    fillSelect(gModel, models.map(model => [model, model]), "Selecione o modelo");
    gModel.disabled = !gMake.value;
    lock(gYear, "Todos os anos");
    draw();
    if (gMake.value) gModel.focus();
  });

  gModel.addEventListener("change", () => {
    const list = modelApps();
    if (!list.length) {
      lock(gYear, "Todos os anos");
    } else {
      const low = Math.min(...list.map(app => app.first));
      const high = Math.max(...list.map(app => app.last ?? Math.max(currentYear, app.first)));
      const years = [];
      for (let year = high; year >= low; year--) {
        if (list.some(app => fits(app, year))) years.push([year, year]);
      }
      fillSelect(gYear, years, "Todos os anos");
      gYear.disabled = false;
    }
    draw();
  });

  gYear.addEventListener("change", draw);

  out.addEventListener("click", event => {
    const line = event.target.closest("[data-line]");
    if (line) showDetail(byLine.get(line.dataset.line));

    const photo = event.target.closest("[data-guide-gallery]");
    if (photo) {
      event.preventDefault();
      if (location.hash !== "#medidas") history.pushState(null, "", "#medidas");
      gallery.select(photo.dataset.guideGallery, { reveal: true });
    }

    if (event.target.closest("[data-guide-table]")) {
      $("search-form").reset();
      state.code = "";
      controls.make.value = gMake.value;
      updateModelOptions();
      controls.model.value = gModel.value;
      controls.year.value = gYear.value;
      moveToView("applications");
      refresh();
      scrollTo(resultHeading);
    }
  });
})();
