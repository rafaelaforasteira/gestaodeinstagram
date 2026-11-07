# Social Studio · Visão Geral

Prévia interativa do dashboard de gestão editorial do Instagram. O checkout contém HTML, CSS e módulos JavaScript nativos.

## Executar

- `node serve.mjs` inicia o servidor local em `127.0.0.1:3021`.
- [Visão Geral sem fonte conectada](http://127.0.0.1:3021/) mostra estados de indisponibilidade.
- [Demonstração](http://127.0.0.1:3021/?demo=1) exibe apenas dados fictícios e capas ilustrativas.
- `node --test analytics.test.mjs` valida escopo de agregação, janelas de comparação e engajamento.
- Com o servidor em execução, rode `npm ci`, `npx playwright install chromium` e `npm run test:layout` para verificar o layout e gerar capturas em `test-results/layout/`.

## Design e dados

O frame ocupa a largura útil com margens fluidas de até 40 px por lado. Em HD, alcance, KPIs e gráfico dividem a primeira linha. A partir de 1600 px, gráfico e tabela recebem mais espaço. A partir de 2300 px, uma grade de 16 colunas posiciona insights, agenda e alertas ao lado da atividade. Em tablet, o gráfico passa para sua própria linha. No celular, os cartões se empilham e a tabela se reorganiza em registros verticais.

A barra lateral é a primeira coluna do shell e alterna entre 72 e 260 px. O dashboard responde à largura da área de trabalho com container queries. A marca fica no topo da barra e os controles de aparência e expansão ficam no rodapé. Entre 701 e 900 px, a barra fica compacta. Até 700 px, os mesmos links viram uma faixa de ícones acima do conteúdo.

`dashboard.css` define os tokens semânticos. `dashboard.mjs` coordena os controles e a renderização. `analytics.mjs` calcula janelas equivalentes e engajamento. `demo-data.mjs` contém as amostras e o calendário de referência. O parâmetro `demo=1` é necessário para exibí-los.

O alcance exibido é a soma dos alcances diários por conta, sem deduplicação de pessoas. A taxa de engajamento usa interações divididas por essa soma. Seguidores são um snapshot da data de referência. A consistência editorial conta publicações confirmadas no mês de referência e a agenda exibe os agendamentos futuros das contas selecionadas. Os demais indicadores seguem a janela escolhida.

## QA e integração

A suíte de layout verifica largura do frame, limites dos cartões, gráfico, tabela, cabeçalho e navegação em 12 resoluções de 375 × 812 a 3840 × 1600. Para zoom de 125%, 150% e 200%, o teste reproduz a redução equivalente da área útil em pixels CSS em vez de alterar o zoom nativo do navegador. As capturas HD, ultra-wide e mobile foram inspecionadas. A suíte também verifica filtros, foco no gráfico, busca, diálogo e rolagem até a agenda.

Os testes da barra verificam os dois estados em cinco resoluções de desktop, o deslocamento de 188 px, a ausência de interseção com os cartões, o rodapé, a marca, a rotação do Chevron, o teclado, a persistência e a navegação compacta no celular.

O rodapé da sidebar agrupa Configurações, o interruptor de tema e a expansão. No desktop, o frame tem altura de viewport descontando as margens e só a coluna do dashboard rola. Em janelas baixas, a navegação central da sidebar também pode rolar para manter a marca e o rodapé acessíveis. No celular, a página volta a rolar no documento.

Em dispositivos com mouse, um indicador visual de 5 px acompanha a rolagem nativa. Ele aparece em 150 ms e inicia o fade de 300 ms após 700 ms de inatividade. Foco e hover não acionam o indicador. A barra nativa fica transparente e continua recebendo interação. Em dispositivos de toque e em cores forçadas, prevalece a aparência nativa. A preferência por movimento reduzido desativa o fade.

O card Meu perfil abre preferências locais, pois esta prévia não tem autenticação. Um nome informado no diálogo fica salvo somente no navegador e sua primeira palavra aparece no card e na saudação. A identificação dos dados fictícios e o link para alternar a demonstração ficam no rodapé da página.

A prévia serve somente arquivos locais. Autenticação, autorização no servidor, banco, API e sincronização do Instagram dependem da futura integração. Qualquer fonte real deve validar sessão e associação ao workspace no servidor antes de retornar métricas ou atividade. Segredos e tokens ficam fora do navegador. A conexão e permissões reais, respostas de sincronização e testes de integração continuam pendentes.

[Especificação mestre](docs/product/spec-master.md)
