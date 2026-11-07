# Tokens tipográficos

A [guia Geist](https://docs.google.com/document/d/1q9ySzYvNYcAoEiqcuOkW96SIwdAcrW4hQEAKEd45v70/edit?tab=t.b3tei8fbykf) define a tipografia oficial. `dashboard.css` implementa a escala com `--font-sans`, `--font-mono` e tokens `--text-*` em rem. A saudação usa 32 px no desktop e 27 px no celular. A navegação e o corpo usam 14 px, a tabela usa 13 px e as legendas usam 12 px.

Os WOFF2 variáveis vêm do pacote oficial [geist 1.9.2](https://www.npmjs.com/package/geist/v/1.9.2). O servidor local entrega os arquivos de `fonts/`. A licença acompanha os binários. Geist Sans tem preload. Geist Mono carrega sob demanda. As duas fontes usam `font-display: swap`.
