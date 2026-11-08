# Tokens tipográficos

A [guia Geist](https://docs.google.com/document/d/1q9ySzYvNYcAoEiqcuOkW96SIwdAcrW4hQEAKEd45v70/edit?tab=t.b3tei8fbykf) define a tipografia oficial. `dashboard.css` implementa a escala com `--font-sans`, `--font-mono` e tokens `--text-*` em rem. A saudação usa 32 px no desktop e 27 px no celular. A navegação e o corpo usam 14 px, a tabela usa 13 px e as legendas usam 12 px.

Os WOFF2 variáveis vêm do pacote oficial [geist 1.9.2](https://www.npmjs.com/package/geist/v/1.9.2). O servidor local entrega os arquivos de `fonts/`. A licença acompanha os binários. Geist Sans tem preload. Geist Mono carrega sob demanda. As duas fontes usam `font-display: swap`.
## Cores por formato de publicação

Use `data-publication-format` para aplicar os tokens `--pastel` e `--accent` definidos em `dashboard.css`. Story usa pêssego (`#FFE5D7` e `#E57B49`), Reel usa rosa (`#FBE2EE` e `#D94C87`), Carrossel usa amarelo (`#FFF0CE` e `#D99C13`) e Feed estático usa azul (`#DDEEFF` e `#3989CA`). Formatos desconhecidos usam a superfície neutra e a cor de texto secundário. Derive a cor do formato, independentemente do status ou do identificador da publicação.
