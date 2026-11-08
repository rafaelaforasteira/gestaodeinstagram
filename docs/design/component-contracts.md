# Tipografia dos componentes

## Ajuda contextual dos widgets

Consulte a [guia oficial de ajuda contextual](https://docs.google.com/document/d/1q9ySzYvNYcAoEiqcuOkW96SIwdAcrW4hQEAKEd45v70/edit?tab=t.89m0nghs2990). Registre cada widget informativo em `widget-help.mjs` pelo ID do título. Use um único botão circular no canto superior direito e mantenha os detalhes de pontos, séries e células nos seus próprios controles.

Revise a descrição sempre que mudarem a métrica, a origem, o filtro, o período, o status ou a agregação. Valide texto, foco, Escape, toque, contraste nos dois temas e limites da viewport antes de concluir um widget.

Controles, diálogos, gráficos, tabelas, estados e tooltips herdam Geist Sans. Métricas, valores e datas usam algarismos tabulares. Os elementos `code`, `kbd`, `pre` e `samp` usam Geist Mono. Componentes futuros devem usar os mesmos tokens em vez de declarar outra família.

No gráfico, larguras menores alternam rótulos de data para preservar a legibilidade. Os valores completos continuam acessíveis nos botões das séries. Valide a fonte computada e as quebras de linha em HD e celular ao alterar os tokens.

## Inteligência editorial da Visão Geral

A região inferior usa uma fileira de conteúdos ao lado de Desempenho por formato, com proporção 50/50 no desktop e uma grade de três colunas, adaptada à largura do conteúdo. Atividades, Agenda e Central de atenção são acessíveis por seus atalhos na sidebar. Cada card usa uma capa 4:5 no topo e um painel de métricas 3 × 2 abaixo das informações. A fileira permite navegação horizontal por teclado e toque quando os cards não cabem. Os cards são informativos, com métricas identificadas por ícones e tooltips acessíveis por foco.

Cliente restringe as contas disponíveis, rede/conta restringe os registros e período usa datas de Brasília. O ranking seleciona até três publicações confirmadas com alcance disponível, ordena por alcance decrescente e deduplica por conta e ID externo ou local. O período é a data da publicação e os insights são acumulados. A comparação usa a média aritmética dos conteúdos medidos de cada formato e exibe separadamente o tamanho da amostra. A taxa soma interações e divide pela soma dos alcances dos mesmos conteúdos com denominador positivo, multiplicada por 100. Crescimento usa a diferença entre snapshots completos do fim e do dia anterior ao início. Visitas ao perfil da demonstração são sintéticas e toques em links ficam indisponíveis.

A prévia estática não possui sincronização Meta Insights, cache remoto ou horário de atualização da Meta. Os dados são recalculados em memória a cada aplicação de filtros. Fora da demonstração os cinco widgets exibem indisponibilidade. Loading, erros da API, atualidade e compatibilidade por formato exigem um adaptador autorizado e validado contra a versão da API. Zero observado e dado ausente são estados distintos.

## Agenda

Consulte a [guia oficial da Agenda](https://docs.google.com/document/d/1q9ySzYvNYcAoEiqcuOkW96SIwdAcrW4hQEAKEd45v70/edit?tab=t.c9euvnwy06cd). A rota `#agenda` reutiliza o cabeçalho externo, o botão com contador e o painel global de filtros da Visão Geral. Aplicar um período diferente leva a Agenda à data final escolhida; Dia, Semana, Mês e Lista determinam o intervalo visível, sem recortar suas publicações pelo período de análise. A seleção direta de data foi retirada da barra de navegação; o calendário personalizado continua no filtro. A semana começa na segunda-feira, e horários e datas dos agendamentos são convertidos para `America/Sao_Paulo`.

O calendário e Posts programados usam a mesma fonte demonstrativa. A Agenda inclui registros históricos com horário, enquanto o widget exibe apenas agendamentos ativos. Os cards compartilham cores por formato, miniaturas, redes e indicadores de status. Na grade, a rolagem interna permite acessar as 24 horas, e ocorrências no mesmo horário ficam empilhadas.

Esta prévia não possui compositor persistente, backend de agendamento ou worker. Não simule sucesso em criação, cancelamento ou reagendamento. Ao conectar esses serviços, valide sessão, workspace, papel, estado por destino e horário no servidor, e só confirme uma alteração depois da resposta do backend.


Os dois widgets editoriais selecionam publicações confirmadas pelo mesmo escopo. Uma data única inclui o histórico até a data, e o gráfico compara com o conjunto até a véspera usando os valores acumulados da mesma base. Intervalos de vários dias usam janelas consecutivas de mesma duração. As duas séries usam uma escala comum, com média por publicação medida e contagem de cobertura. Zero observado entra na média. A variação exige média anterior positiva. Hoje é marcado como parcial. As publicações demonstrativas adicionais alimentam os dois widgets editoriais.

Link Bio na Visão Geral usa dois widgets com proporção 40/60 e empilhamento em espaços estreitos. Cliques são eventos válidos com identificador único, contados no intervalo selecionado. A variação compara com a janela anterior de igual duração. O ranking usa os mesmos eventos e mostra até cinco banners. Os três status retratam a situação na data de referência. Publicações em vigor estão no ar, publicações com início futuro estão programadas e banners pausados, arquivados, desativados ou expirados estão inativos. Rascunhos sem programação ficam fora.

As amostras de Link Bio usam vínculos explícitos com contas e clientes do workspace. O checkout ainda não possui armazenamento de banners, ingestão de cliques ou uma fonte de produção para esta seção. Fora da demonstração, os indicadores e o ranking mostram indisponibilidade.
