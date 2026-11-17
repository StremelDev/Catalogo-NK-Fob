"use strict";
// Regras de busca, filtros e agrupamento das aplicações

const catalogModel = (() => {
const collator = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });
const compare = collator.compare;
const compareApplications = (a, b) =>
  compare(a.make, b.make) || compare(a.model, b.model) || a.first - b.first || a.line - b.line;

function normalized(value) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function codeKey(value) {
  return normalized(value).replaceAll(" ", "");
}

function reviewNeeded(note) {
  return /não (?:conferid[oa]|confirmad[oa]|consta)|por dedução|planilha traz letra/i.test(note);
}

function noteOnList(note) {
  return note
    .replace(/^(?:Cofap|Authomix|Aliperti \(Fama\)|Cindumel)(?:;\s*|$)/i, "")
    .replace(/^./, character => character.toUpperCase());
}

function indexed(app) {
  const aliases = app.note.match(/\b[A-Z0-9]+(?:[-.][A-Z0-9]+)*\b/g) ?? [];
  return {
    ...app,
    searchText: " " + normalized([
      app.make, app.model, app.engine, app.position, "FOB " + app.type, app.code, app.note,
    ].join(" ")) + " ",
    codes: [app.code, ...aliases.filter(alias => /[A-Z]/.test(alias) && /\d/.test(alias))].map(codeKey),
    review: reviewNeeded(app.note),
  };
}

function parseQuery(value) {
  const years = [];
  const types = [];
  const positions = [];
  const withTypeRemoved = value.replace(/\bfob\s*[-–]?\s*([a-f])\b/gi, (_, type) => {
    types.push(type.toUpperCase());
    return " ";
  });
  const terms = (withTypeRemoved.match(/[\p{L}\p{N}]+(?:[.\-][\p{L}\p{N}]+)*/gu) ?? [])
    .map(normalized)
    .filter(term => {
      if (/^(?:19|20)\d{2}$/.test(term)) {
        years.push(Number(term));
        return false;
      }
      if (term === "dianteira" || term === "traseira") {
        positions.push(term);
        return false;
      }
      return true;
    });
  return { terms, types, positions, years };
}

function matchingYear(app, year) {
  return year >= app.first && (app.last === null || year <= app.last);
}

function matchesQuery(app, query) {
  return query.types.every(type => app.type === type)
    && query.years.every(year => matchingYear(app, year))
    && query.positions.every(position => app.position.toLowerCase() === position)
    && query.terms.every(term => {
      const wholeWord = term.length < 3 || /^\d{1,3}$/.test(term) || /^\d \d+$/.test(term);
      if (wholeWord) return app.searchText.includes(" " + term + " ");
      return app.searchText.includes(term)
        || app.codes.some(code => code.includes(term.replaceAll(" ", "")));
    });
}

function filterApplications(apps, filters) {
  const { make, model, year, position, type, code, query } = filters;
  return apps.filter(app =>
    (!make || app.make === make)
    && (!model || app.model === model)
    && (!year || matchingYear(app, Number(year)))
    && (!position || app.position === position)
    && (!type || app.type === type)
    && (!code || app.code === code)
    && matchesQuery(app, query),
  );
}

function groupCodes(apps) {
  const groups = new Map();
  for (const app of apps) {
    const key = [app.type, app.position, app.code].join("|");
    if (!groups.has(key)) {
      groups.set(key, { key, code: app.code, type: app.type, position: app.position, applications: [] });
    }
    groups.get(key).applications.push(app);
  }
  return [...groups.values()];
}

function yearsLabel(app) {
  if (app.last === null) return "Desde " + app.first;
  if (app.first === app.last) return String(app.first);
  return app.first + " a " + app.last;
}

return { compare, compareApplications, noteOnList, indexed, parseQuery, filterApplications, groupCodes, yearsLabel };
})();
