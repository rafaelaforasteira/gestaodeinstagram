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

Consulte a [guia oficial da Agenda](https://docs.google.com/document/d/1q9ySzYvNYcAoEiqcuOkW96SIwdAcrW4hQEAKEd45v70/edit?tab=t.c9euvnwy06cd). A rota `#agenda` mostra **Novo agendamento** e o botão de cliente e contas acima do mini calendário. O primeiro abre o compositor e o segundo reutiliza o painel global de filtros, mostrando apenas cliente e contas do Instagram. O período de análise continua disponível na Visão Geral. Na Agenda, a seleção de data e o modo definem o intervalo visível. A semana começa na segunda-feira, e horários e datas dos agendamentos são convertidos para `America/Sao_Paulo`.

O calendário e Posts programados usam a mesma fonte demonstrativa. A Agenda inclui registros históricos com horário, enquanto o widget exibe apenas agendamentos ativos. Os cards compartilham cores por formato, miniaturas, redes e indicadores de status. Na Agenda, o card usa o pastel do formato na superfície e sua tonalidade intensa na barra lateral. O cliente fica acima do título, que divide a linha com o horário alinhado à direita. Em colunas estreitas, o título pode ser truncado e os metadados podem quebrar na linha inferior. Na grade, a rolagem interna permite acessar as 24 horas, e ocorrências no mesmo horário ficam empilhadas.

No modo Semana, o cabeçalho fixo mantém as mesmas colunas da grade, incluindo BRT. Mostra a abreviação do dia em 11 px acima do número em 27 px. A faixa usa a mistura dos tokens neutros do tema e listras diagonais discretas. Apenas a data atual recebe círculo laranja e `aria-current="date"`; os rótulos são informativos e não representam uma seleção. Em telas estreitas, cabeçalho e eventos rolam juntos na horizontal.

O subtítulo da página exibe data e horário reais em português brasileiro, no fuso da Agenda e com o estilo compartilhado de subtítulo. O relógio atualiza na virada do minuto e ao voltar à aba, independentemente da navegação. O período visível continua no nome acessível do calendário.

O mini calendário e o seletor ficam à esquerda da grade e passam para cima dela em áreas estreitas. O seletor fica abaixo do mini calendário, com a mesma largura externa e quatro segmentos iguais. As setas percorrem meses apenas no mini calendário. Selecionar um dia leva a grade à data escolhida, mantendo o modo ativo. Mudanças de data por filtro ou pela própria Agenda atualizam a seleção auxiliar. Hoje seleciona a data real no fuso da Agenda e abre o modo diário. O segmento só fica ativo quando o modo diário exibe a data atual.

A data atual vem do relógio, a data selecionada orienta a navegação e o período visível deriva do modo e da seleção. A data-base da demonstração fica abaixo da grade e pode orientar a seleção inicial. No mini calendário, o preenchimento laranja indica hoje e o contorno com superfície suave indica outra data selecionada.

Hoje e Semana compartilham a faixa texturizada, a abreviação do dia e o número em destaque. Mês usa a mesma textura na linha de dias da semana e os mesmos indicadores de data nas células, com um estado secundário para a seleção. Lista conserva seus títulos por data.

Os cartões da Agenda reutilizam as miniaturas, os ícones de destino e as tags de formato de Posts programados. A faixa lateral segue a cor do formato. O cliente aparece acima do título e o status tem tratamento semântico próprio. Em espaço amplo, o status ocupa a lateral direita. Em colunas estreitas, passa para a última linha. Destinos com estados divergentes exibem Parcial e podem ser consultados no detalhe.

Cada faixa de horário cresce pela altura real dos cartões em fluxo. A primeira publicação mantém um deslocamento conforme o minuto, e as demais seguem em ordem cronológica com o horário exato visível. A mesma linha da grade define a altura para todos os dias. Mês conserva o acesso aos eventos adicionais pelo contador da célula. O reagendamento por arrastar depende de uma integração futura com alvos temporais explícitos e confirmação.

A Central de atenção da Agenda fica abaixo do seletor e mostra até três pendências abertas. O contador e a coluna Precisa de atenção da Central de atividades usam a mesma lista, filtrada por workspace, cliente e conta, independentemente das datas visíveis. Falhas de publicação têm prioridade sobre desconexões e, dentro do mesmo tipo, os registros mais recentes vêm primeiro. Quando há registros editoriais e de agendamento da mesma publicação, o estado do agendamento prevalece. Abrir detalhes não muda o estado da pendência.

A prévia usa estados de demonstração e identifica dados indisponíveis fora desse modo. Ela não possui serviço de consulta, transição de resolução ou repetição de publicações. Um futuro serviço deve distinguir carregamento, erro e consulta vazia, e retirar uma pendência apenas após confirmar seu novo estado.

Em duas colunas, a grade principal acompanha a altura da lateral quando ela é maior. As barras internas da Agenda ficam ocultas nos dois eixos, inclusive durante a rolagem. O cabeçalho de datas e os horários continuam no mesmo contêiner de rolagem, com acesso por teclado.

Na Central de atenção lateral, falhas de publicação e contas desconectadas recebem fundo vermelho suave derivado da cor semântica de erro e da superfície do tema.

Esta prévia não possui compositor persistente, backend de agendamento ou worker. Não simule sucesso em criação, cancelamento ou reagendamento. Ao conectar esses serviços, valide sessão, workspace, papel, estado por destino e horário no servidor, e só confirme uma alteração depois da resposta do backend.


Os dois widgets editoriais selecionam publicações confirmadas pelo mesmo escopo. Uma data única inclui o histórico até a data, e o gráfico compara com o conjunto até a véspera usando os valores acumulados da mesma base. Intervalos de vários dias usam janelas consecutivas de mesma duração. As duas séries usam uma escala comum, com média por publicação medida e contagem de cobertura. Zero observado entra na média. A variação exige média anterior positiva. Hoje é marcado como parcial. As publicações demonstrativas adicionais alimentam os dois widgets editoriais.

Link Bio na Visão Geral usa dois widgets com proporção 40/60 e empilhamento em espaços estreitos. Cliques são eventos válidos com identificador único, contados no intervalo selecionado. A variação compara com a janela anterior de igual duração. O ranking usa os mesmos eventos e mostra até cinco banners. Os três status retratam a situação na data de referência. Publicações em vigor estão no ar, publicações com início futuro estão programadas e banners pausados, arquivados, desativados ou expirados estão inativos. Rascunhos sem programação ficam fora.

As amostras de Link Bio usam vínculos explícitos com contas e clientes do workspace. O checkout ainda não possui armazenamento de banners, ingestão de cliques ou uma fonte de produção para esta seção. Fora da demonstração, os indicadores e o ranking mostram indisponibilidade.

Na prévia local, o modal da Agenda exibe “Publicação no Instagram” para destinos Instagram e informa que o link está indisponível na demonstração. O fluxo de produção depende da API autenticada de detalhes e da recuperação do permalink no worker, por destino, após a confirmação da publicação.

## Central de atividades

Rota `#activities`; `#attention` abre a mesma página com a coluna de atenção em foco. O item do menu usa o ícone de pulso e mostra um contador laranja com os alertas abertos.

- **Precisa de atenção** reúne falhas de publicação e contas desconectadas do escopo aplicado. Cada alerta informa o que aconteceu, o cliente, a conta, o horário, o que fica impedido e traz uma ação direta (Revisar publicação ou Reconectar conta) mais Resolvido/Reabrir. Abertos e Resolvidos ficam em abas; na demonstração, o estado resolvido é salvo só no navegador. Reconectar conta mostra aviso de recurso em construção até existir a integração. Textos de impacto não inventam o motivo da falha; com dados reais, o motivo vem da API.
- **Histórico de atividades** é uma linha do tempo agrupada por dia, com publicações, agendamentos, falhas, rascunhos e desconexões de conta do período aplicado. Busca por publicação, conta ou cliente, filtro de status e Carregar mais (8 por vez). Cada linha abre o detalhe.
- No celular, as duas colunas viram as abas Atenção e Histórico.
- Avisos por WhatsApp e e-mail aparecem como "Em breve" e dependem da automação de mensagens.

## Gestão de Banners — Link Bio

A rota `#banners` usa os clientes e as contas do workspace demonstrativo. O editor salva dados por workspace no navegador, valida destinos HTTPS e imagens JPEG, PNG e WebP de até 1 MB, com dimensões de 32 a 4096 px. A programação usa o horário de Brasília e o relógio da demonstração. A prévia inclui somente banners no ar e preserva a proporção das imagens.

A lista e a Visão Geral compartilham os banners, a regra de status e os eventos demonstrativos. Cliques respeitam o período global. O arquivamento remove o banner da gestão e da prévia, mantendo o histórico para os relatórios. A reordenação funciona por cliente com os botões Subir e Descer.

A operação de produção depende de armazenamento autenticado, autorização no servidor, página pública de Link Bio e coleta de cliques. O protótipo não publica banners ou registra cliques reais.

O filtro de status usa o mesmo seletor segmentado da Agenda, com quatro opções de largura igual: Ativos, Programados, Inativos e Todos. Todos é a seleção inicial. O status é o único filtro da listagem. O escopo por cliente e workspace continua sendo aplicado na origem dos dados.

A gestão agrupa os banners em um card por cliente, incluindo clientes sem banners. A grade ajusta de uma a quatro colunas conforme a largura disponível. Cada card disponibiliza todos os banners filtrados em uma região rolável, com altura calculada a partir dos dois primeiros. A posição segue a ordem persistida do cliente, mesmo com filtro ativo. Arrastar e os botões Subir e Descer usam a mesma operação de ordenação e respeitam o limite do cliente. Adicionar banner no card pré-seleciona uma conta do cliente; a ação global solicita a seleção. A prévia de cada cliente exibe somente os banners no ar, em ordem.

O seletor ocupa até 500 px, alinhado à esquerda. O grid chega a quatro colunas com largura útil a partir de 1260 px. A visão principal apresenta somente miniatura, posição, nome, início e término em pt-BR. Os botões + e lápis no cabeçalho abrem, respectivamente, a criação contextual e o modal Gerenciar banners. As ações detalhadas, cliques, prévia e ordenação ficam nesse modal, que usa a mesma fonte e persistência demonstrativa.

A criação é contextual pelo botão + do cliente. O cabeçalho da página apresenta somente título e subtítulo. A demonstração do workspace studio inclui seis clientes, com Bela Joias (4 banners), Verde Café (2) e Ateliê Lume (5) para avaliar a distribuição 4+2. Essas fixtures são exclusivas da gestão demonstrativa e preservam o escopo analítico existente. A segunda linha segue as mesmas colunas e larguras da primeira.

As prévias da gestão usam uma composição vertical, com imagem ampla seguida de nome, posição, status, início, término e destino validado. Os botões + e lápis usam o token laranja oficial. A imagem mantém sua proporção original, com limite de altura e object-fit contain. A página pública ainda é uma dependência de produção, portanto o enquadramento público não foi validado. As amostras locais permanecem identificadas como demonstração. Destinos ausentes mostram um estado explícito, sem URL fabricada.

A região de banners de cada cliente usa o indicador compartilhado de rolagem de 1,5 px, com fade durante a atividade e gradientes independentes nas extremidades. O cabeçalho fica fora da região rolável. A altura é recalculada por ResizeObserver, incluindo os dois primeiros banners e o espaçamento. Zero ou um banner ocupam somente a altura necessária. Datas ficam em duas colunas com quebra interna legível. Status e destino compartilham a última linha. A rolagem permite encadeamento com a página principal.

As listas internas de banners mantêm a rolagem com scrollbar nativa e indicador customizado visualmente ocultos. Os gradientes acompanham o conteúdo acima e abaixo. O status usa a mesma classe semântica bio-status, sobre a imagem à direita, com cápsula na superfície do tema. As datas usam flex com gap de 16 px e quebra responsiva. A linha de destino contém Link2 mesmo quando não existe URL configurada.

O editor de banners sugere a última posição disponível do cliente, incluindo banners programados e pausados, excluindo arquivados. O seletor personalizado reutiliza o componente do compositor e permite inserir de 1 até N+1. Ao salvar, os registros seguintes são deslocados e suas demais propriedades são preservadas. A posição inicial de edição corresponde à ordem atual. A persistência local rejeita alterações quando detecta outra versão salva por uma aba. A produção ainda exige transação e controle de concorrência no backend por página Link Bio. O modelo local atual agrupa a ordenação por cliente, pois ainda não existe entidade de página pública.

O modal Novo banner usa identificação informativa do cliente e conta. A criação contextual solicita a escolha prévia quando existe mais de uma conta autorizada. Título público (até 100 caracteres), link HTTPS, início, posição e imagem são obrigatórios. O título também preenche o nome legado. Descrição e CTA legados são preservados na edição. Os calendários personalizados compartilham o estilo do compositor e oferecem navegação mensal, mês e ano pelo seletor personalizado, hora e minuto em formato 24 h. Término é opcional e deve ser posterior ao início. A conversão usa America/Sao_Paulo pela mesma função temporal do compositor.

O upload acessível aceita clique, teclado e arraste, valida formato, tamanho e dimensões e só libera o salvamento após a leitura. Remover imagem aparece somente com mídia. A demonstração mantém limite de 1 MB por imagem e persistência local. Armazenamento de produção, autorização no servidor e transação por página Link Bio permanecem dependências. O teste tests/banner-editor.mjs cobre validações, contexto, upload, datas, criação e responsividade.
