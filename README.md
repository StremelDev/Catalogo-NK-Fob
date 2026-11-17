# Catálogo FOB · Noreika Auto Peças

Catálogo do Buffer Power Cushion FOB (tipos A a F): aplicações por veículo, códigos de mola, fotos e medidas.

## Como abrir

Online: **https://stremeldev.github.io/Catalogo-NK-Fob/**

No computador: dê dois cliques em `index.html`. Funciona offline, sem servidor e sem internet.
Para publicar num site, envie a pasta inteira mantendo a mesma estrutura.

## Estrutura

```
catalogo-fob/
├── index.html                  Página: estrutura e textos
├── css/
│   └── estilo.css              Visual: cores, fontes, layout, versão para celular
├── js/
│   ├── fotos.js                Caminho das fotos dos produtos
│   ├── modelo.js               Regras de busca, filtros e agrupamento
│   ├── produtos.js             Medidas dos tipos A–F e galeria de fotos
│   ├── app.js                  Tela principal: filtros, tabela, paginação, fichas
│   ├── busca-guiada.js         Busca guiada Montadora → Modelo → Ano
│   └── localizador-medida.js   Sugere o tipo FOB pela medida da mola
├── dados/
│   └── aplicacoes.js           Todas as aplicações (aba "Aplicações" da planilha)
├── imagens/
│   ├── logo-noreika.png        Logo e ícone da aba
│   └── produtos/               3 fotos por tipo: par, detalhe, embalagem
└── fontes/
    ├── Inter.woff2             Fonte do site
    └── LICENCA-Inter.txt       Licença da fonte (precisa acompanhar o arquivo)
```

Os scripts são carregados no fim do `index.html` nesta ordem, e a ordem importa:
`fotos.js` → `dados/aplicacoes.js` → `modelo.js` → `produtos.js` → `app.js` → `busca-guiada.js` → `localizador-medida.js`.

## Tarefas comuns

**Adicionar ou corrigir uma aplicação:** edite `dados/aplicacoes.js`. Cada linha é um objeto:

```js
{"line": 38, "type": "A", "code": "ITO0438", "position": "Dianteira", "make": "Toyota", "model": "Corolla",
 "first": 2002, "last": 2008, "engine": "1.6 / 1.8 C/ AR e S/ T.A.", "note": ""},
```

| Campo      | Significado                                                        |
|------------|--------------------------------------------------------------------|
| `line`     | Linha na planilha. Precisa ser única, porque a ficha usa esse número |
| `type`     | Tipo FOB: `A` a `F`                                                |
| `code`     | Código da mola                                                     |
| `position` | `Dianteira` ou `Traseira`                                          |
| `make`     | Montadora                                                          |
| `model`    | Modelo                                                             |
| `first`    | Ano inicial                                                        |
| `last`     | Ano final, ou `null` se estiver em aberto                          |
| `engine`   | Motor / versão. Pode ficar vazio (`""`)                            |
| `note`     | Observação. Textos como "não conferido", "não confirmado", "não consta", "por dedução" ou "planilha traz letra" marcam a linha como **A conferir** |

**Mudar as medidas de um tipo:** edite o bloco `products` no início de `js/produtos.js`.

**Trocar uma foto:** substitua o arquivo em `imagens/produtos/` mantendo o mesmo nome (ex.: `b-par.webp`).

**Mudar cores:** as cores principais ficam no bloco `:root` no início de `css/estilo.css`.
