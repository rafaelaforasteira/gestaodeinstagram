# Especificação mestre · Snapshot de 06/11/2026

[Documento oficial](https://docs.google.com/document/d/1q9ySzYvNYcAoEiqcuOkW96SIwdAcrW4hQEAKEd45v70/edit)

# SOCIAL STUDIO — ESPECIFICAÇÃO MESTRE DO PRODUTO

> Plataforma de planejamento, criação, aprovação, agendamento e publicação no Instagram | Briefing de produto + PRD + Arquitetura + Design System + Contrato para IA

Versão: 1.0 | Data-base: 06/11/2026 | Estado: documentação de planejamento; não representa software implementado, integração autorizada nem publicação efetiva. Nome “Social Studio” é provisório até decisão de branding.

## 0. COMO USAR ESTE DOCUMENTO (REGRA PARA CODEX E CURSOR)

Este arquivo é a fonte central de requisitos do produto. Todo agente que for desenhar, implementar, corrigir ou testar a plataforma deve consultar estas seções ANTES de propor arquitetura ou alterar código. A implementação deve preservar os contratos, a experiência, as permissões, os fluxos e os tokens definidos aqui. As regras de segurança e as capacidades reais da API da Meta prevalecem sobre desejos de interface ainda não confirmados.

Hierarquia de decisão: (1) requisitos explícitos mais recentes da pessoa responsável pelo produto; (2) capacidades documentadas da API oficial e requisitos de segurança; (3) esta especificação; (4) código existente e seu sistema de componentes; (5) sugestões dos agentes. Dúvidas relevantes devem ser documentadas como hipótese, sem invenção.

Não afirmar que algo foi publicado, conectado, testado visualmente, aprovado ou implantado sem evidência operacional correspondente.

Antes de cada tarefa: identificar o módulo, ler contratos correlatos, inspecionar o repositório real, apresentar mudanças planejadas, implementar de modo incremental e executar testes. Nunca instalar dependências ou substituir componentes só por estética.

Este é um novo produto independente do CRM BrainX. Reutilizar princípios e skills de qualidade, mas não herdar identidade visual, métricas ou regras comerciais do CRM por acidente.

## 1. RESUMO EXECUTIVO E VISÃO DO PRODUTO

### 1.1 Problema a resolver

Agências, social medias e equipes de marcas precisam preparar criativos, organizar legendas e hashtags, definir calendários, receber aprovação, publicar nos horários certos, confirmar o resultado e corrigir falhas. Hoje estas etapas ficam dispersas em mensagens, planilhas, pastas, ferramentas de design, Meta Business Suite e automações soltas. Isso provoca retrabalho, perda de contexto, horários inconsistentes, postagens duplicadas e falta de rastreabilidade.

### 1.2 Solução

Construir uma aplicação web de gestão editorial do Instagram com dashboard operacional, calendário interativo, compositor de conteúdo, biblioteca de mídias, conexão OAuth de contas profissionais, sistema persistente de agendamento, processamento de mídias, publicação pela API oficial da Meta, histórico de execução e alertas. O produto deve ser agradável de usar diariamente, tão limpo e previsível quanto uma ferramenta Apple-inspired, mas genuinamente desenhado para a web.

### 1.3 Público e cenários

Operadora individual: prepara Reels, carrosséis, posts e Stories, consulta o calendário e agenda para uma ou várias contas autorizadas.

Agência: opera espaços de trabalho separados por cliente, delega criação e aprovação, monitora erros e mantém histórico de atividades.

Gestor de marca: aprova textos e criativos, acompanha o plano editorial e recebe notificação de publicação sem acesso às credenciais técnicas.

### 1.4 Proposta de valor

Uma única central para PLANEJAR → CRIAR → REVISAR → AGENDAR → PUBLICAR → CONFERIR, com mecanismos de confiabilidade operando de modo invisível. A plataforma deverá oferecer previsibilidade, foco no conteúdo, segurança e sensação de controle. A ordem de valor é: publicação confiável primeiro; experiência editorial excelente em seguida; relatórios e IA como evolução.

### 1.5 Objetivos e indicadores de sucesso

Objetivo O1: usuário autorizado consegue ir de upload a publicação confirmada sem abrir o aplicativo do Instagram no horário do agendamento.

Objetivo O2: nenhuma tarefa é perdida ou publicada duas vezes por falha de concorrência, segundo casos de teste definidos.

Objetivo O3: o operador identifica status, erro, conta, data e responsável de cada conteúdo em até dois cliques.

Métricas futuras: taxa de sucesso de publicação; jobs atrasados; tempo médio da preparação; taxa de falha por categoria; agendamentos reprogramados; conteúdos aprovados no prazo; usuários ativos; tempo da criação ao agendamento.

### 1.6 Fora do escopo do MVP

Não construir editor de vídeo profissional, banco de músicas licenciadas do Instagram sem integração comprovada, scraping de músicas/contas, upload de posts por senha, comentários e mensagens diretas, billing SaaS, IA publicando sem revisão, analytics histórico extensivo ou suporte multiplataforma operacional na V1. O esquema deverá permitir expansão posterior, mas sem custo de produto excessivo agora.

## 2. ESCOPO, VERSÕES E PRIORIZAÇÃO

### 2.1 MVP V1 obrigatório

Autenticação segura, reset de sessão, organização por workspace, permissões mínimas e auditoria.

Conexão de conta profissional do Instagram via fluxo oficial OAuth com verificação de capacidades e status do token.

Upload privado de imagens e vídeos; leitura de metadados; validação técnica; geração de thumbnail quando possível.

Compositor de imagem estática, carrossel, Reel e Story básico — disponibilizar cada opção somente após validar suporte na modalidade de API conectada.

Rascunhos, legendas com hashtags em texto, escolha de conta, prévia, data, hora e fuso, opção ‘publicar agora’ e ‘agendar’.

Calendário mensal/semanal/lista, filtros de conta, formato e status; edição, cancelamento e reagendamento antes do bloqueio de publicação.

Fila persistente com proteção contra duplicidade, retries controlados, reconciliação e monitoramento de falhas.

Histórico e comprovante da publicação: IG Media ID, permalink quando disponível, horários e tentativas.

### 2.2 V2 profissional

Equipe com papéis definidos, fila de aprovação, comentários, marcação de revisão, biblioteca avançada por campanha, templates de legendas, múltiplos workspaces de clientes, notificações de equipe, gestão de bio assistida, links dinâmicos de bio e integrações ClickUp/n8n mais completas.

### 2.3 V3 inteligência e expansão

Analytics oficial onde autorizado (métricas com disponibilidade por formato/permissão), recomendações editoriais, copiloto de legendas, melhores horários baseados em dados válidos, experimentação com recursos oficiais de áudio, publicação multicanal via adaptadores independentes, integrações com design e relatórios.

### 2.4 Critério de prioridade

P0: autenticação, isolamento, upload, agendamento, publicação e feedback confiáveis. P1: prévias, biblioteca, calendário fluido, melhoria de UX, aprovações. P2: analytics, multi-rede, áudio avançado, IA e automações sofisticadas. P0 bloqueia lançamento se não aprovado.

## 3. PRINCÍPIOS DE PRODUTO E REGRAS NÃO NEGOCIÁVEIS

Content-first: o criativo, a legenda, a conta e o horário são sempre os protagonistas; interfaces decorativas não podem competir com a tarefa.

Uma ação principal por contexto: ‘Agendar’ no compositor, ‘Aprovar’ na revisão, ‘Reagendar’ no calendário. Ações destrutivas com confirmação contextual.

Estado claro: nunca representar rascunho como agendado, envio como publicado, agendamento no passado como válido, nem ‘simulação’ como ação real.

Prevenção antes da correção: validar arquivo, permissões, limite, data, versão da API e formato antes de aceitar agendamento.

Compatível com teclado, leitores de tela, alto contraste, modo escuro e redução de movimento/transparência.

Separação por cliente: mídia, contas, acessos, logs e tokens nunca se misturam entre workspaces.

Credenciais nunca aparecem em interface, logs, analytics, URLs públicas ou prompts de desenvolvimento.

Edição livre apenas até o job iniciar processamento; após publicação, respeitar a API oficial e não sugerir ‘editar mídia publicada’ se não houver endpoint permitido.

## 4. PERSONAS, JORNADAS E CASOS DE USO

### 4.1 Personas

ADMIN DA AGÊNCIA: conecta contas, define configurações, visualiza todos os clientes autorizados, gerencia usuários e resolve falhas. SOCIAL MEDIA: cria conteúdos e agenda quando permitido. APROVADOR: examina criativos, comenta e autoriza. LEITOR/CLIENTE: acompanha calendário e resultados do seu workspace sem alterar credenciais.

### 4.2 Jornada A — publicar um Reel

1) Entrar → escolher workspace e conta. 2) Selecionar ‘Nova publicação’ → formato ‘Reel’. 3) Carregar vídeo → validar codec, tamanho, proporção, duração e acessibilidade. 4) Escolher capa, inserir legenda/hashtags, escolher compartilhar no feed quando disponível. 5) Visualizar prévia vertical. 6) Salvar rascunho ou selecionar data/hora futura. 7) Sistema valida token e permissões e confirma o agendamento. 8) Worker prepara mídia e publica pela Meta no horário. 9) Usuário vê status final, ID e link ou recebe alerta acionável.

### 4.3 Jornada B — criar carrossel

Selecionar ‘Carrossel’, enviar arquivos na ordem desejada, reorganizar por drag-and-drop E botões acessíveis ‘mover para cima/baixo’, verificar compatibilidade e limite de itens da versão oficial, inserir legenda única, pré-visualizar, salvar e agendar. A publicação deve tratar itens-filhos e contêiner-pai conforme API, com rastreabilidade de cada elemento.

### 4.4 Jornada C — Stories

Escolher ‘Story’, imagem ou vídeo, visualizar proporção 9:16 e zonas seguras. Não apresentar campo de legenda de feed como se fosse overlay renderizado. Caso haja texto visível, ele faz parte do arquivo produzido ou do compositor local quando implementado. Stickers nativos, música nativa e links nativos dependem de endpoint/feature comprovadamente suportado; caso contrário sinalizar ‘não disponível na publicação automática’.

### 4.5 Jornada D — falha ou expiração da conexão

Se token estiver expirado, acesso for revogado, mídia estiver inválida ou a API retornar erro permanente, pausar envio, registrar código seguro e mensagem compreensível, exibir CTA ‘Reconectar conta’ ou ‘Corrigir mídia’, preservar o rascunho e evitar retries infinitos. Notificar somente quem pode atuar.

### 4.6 Jornada E — aprovação (V2)

Criador envia conteúdo ‘para revisão’; aprovador visualiza alterações, mídia e calendário; comenta, rejeita ou aprova. Cada revisão gera versão imutável para auditoria. Mudança em mídia, legenda ou conta após aprovação invalida a aprovação; publicação exige aprovação da versão atual.

## 5. MAPA DE TELAS E NAVEGAÇÃO

### 5.1 Estrutura do aplicativo

Rotas propostas: /login; /app; /app/calendar; /app/posts; /app/posts/new; /app/posts/[id]; /app/library; /app/accounts; /app/settings; /app/activity; /app/approvals (V2); /app/profile-management (V2); /app/analytics (V3). Rotas protegidas por autenticação + autorização de workspace, sem depender apenas de bloqueio visual.

### 5.2 Visão Geral

Cabeçalho: título ‘Visão geral’, seletor de período e workspace. Linha 1: quatro KPIs operacionais: agendados, publicados, aguardando ação, falhas. Linha 2: agenda de próximas publicações e alertas de conexão. Linha 3: atividade recente e pendências. Os KPIs devem refletir os filtros ativos, fornecer definição em tooltip e nunca usar números fictícios fora do ambiente demo claramente identificado.

### 5.3 Calendário

Cabeçalho: mês/período, hoje, navegação anterior/próximo, modo mês/semana/lista, botão ‘Nova publicação’. Filtros em popover: contas, tipos, status, campanha. Células com miniatura, pequeno ícone de formato, horário e estado. Clique abre drawer de detalhes com ações permitidas. Ao arrastar, exibir horário-alvo, validar conflitos e solicitar confirmação; permitir alternativa teclado.

### 5.4 Compositor — layout prioritário

Desktop ≥1280px: coluna esquerda 60–64% para formulário e mídia; direita 36–40% para preview fixo sem cobrir campos. Entre 768–1279px: colunas ajustáveis ou preview em aba lateral. Mobile <768px: formulário em coluna única, preview acessível em aba ‘Prévia’, barra de ação inferior segura. Etapas: Conta e formato → Mídia → Legenda e opções → Agendamento e validação. Footer sticky com ‘Salvar rascunho’ discreto e CTA principal ‘Agendar’. Nunca perder dados ao navegar acidentalmente.

### 5.5 Biblioteca

Grid responsivo de imagens e vídeos; filtros por tipo, nome, campanha e data; seleção múltipla; detalhe lateral com dimensões, duração, codec, uso anterior e direitos/observações. Upload em lote com progresso real, cancelamento, recuperação de falha e preview de metadados. Escopo de acesso sempre restrito ao workspace.

### 5.6 Contas conectadas

Cards por perfil com avatar, @usuário, tipo profissional, data da última validação, status do token e permissões de publicação. Ações: Conectar, Reconectar, Testar capacidades, Desconectar. Nunca expor token completo ou IDs sensíveis desnecessariamente.

### 5.7 Histórico e detalhes

Uma publicação possui timeline auditável: criada, mídia processada, revisada, agendada, job reivindicado, contêiner criado, mídia pronta, publicação enviada, confirmação recebida. Detalhe mostra horário planejado, horário efetivo, account, IG Media ID, erros redigidos, retry e acesso a suporte.

## 6. FORMATS DE PUBLICAÇÃO E REGRAS DE CONTEÚDO

### 6.1 Imagem estática

Upload de um arquivo compatível com a versão vigente da API. Validar MIME real, extensão, tamanho, dimensões e taxa de compressão. Prévia de crop ajustada à apresentação do Instagram; preservar arquivo original e resultado transformado como assets versionados.

### 6.2 Carrossel

Gerenciar itens numa tabela ordenada; validação por item; impedir item sem mídia; alertar que música e outros efeitos nativos podem não ser suportados. O backend cria contêineres-filhos e contêiner-pai conforme documentação oficial vigente; não reutilizar contêiner expirado.

### 6.3 Reels

Suporte prioritário para vídeo vertical, capa, legenda, preview, agendamento e ‘compartilhar no feed’ quando o parâmetro estiver disponível na modalidade da API. Usar FFprobe para validar vídeo real e FFmpeg para criar derivados quando necessário. Nunca prometer exibição idêntica ao app ou popularização algorítmica.

### 6.4 Stories

V1: Stories simples com imagem/vídeo conforme permissão e modalidade de login. Verificar restrições específicas: a modalidade Facebook Login tem suporte de Stories direcionado a contas Business segundo coleção oficial de referência. Não assumir paridade entre Facebook Login e Instagram Login. No frontend mostrar capacidade por conta.

### 6.5 Legendas, hashtags, menções e acessibilidade

Hashtags e menções textuais fazem parte de caption quando o formato a aceitar. Contador de caracteres configurável segundo limites da API vigentes; rascunho pode conter campos internos de campanha que não serão publicados. Alt text para formatos oficialmente aceitos. Visualização com quebras de linha reais; alerta de truncamento no preview; normalizar Unicode sem remover emojis.

### 6.6 Música nativa, sticker musical e áudios

Estado de produto: EXPERIMENTAL / NÃO GARANTIDO. A existência de músicas no app Instagram não significa acesso programático à biblioteca licenciada. No MVP não incluir busca de músicas nativas nem promessa de adicionar sticker musical aos Stories. Permitir áudio já embutido no vídeo, desde que com licença/consentimento apropriado; registrar origem e direitos. Criar adaptador ‘audioProvider’ somente após prova técnica em sandbox e análise jurídica de direitos. Um Reel publicado com áudio embutido não equivale a Reel com música nativa selecionada na biblioteca.

### 6.7 Biografia e gestão de perfil

A API oficial disponibiliza leitura de alguns dados do perfil, mas não tratar atualização automática da biografia como operação suportada. V2: cadastrar versões de bio, cronograma, aprovação, lembrete com copiar/colar e confirmação manual. Links de uma landing própria da bio podem trocar de destino pelo nosso backend, sem modificar o campo da bio no Instagram. Não implementar login por senha, scraping, navegador disfarçado ou biblioteca privada como padrão do produto.

## 7. DESIGN SYSTEM OFICIAL — APPLE-INSPIRED, NÃO CÓPIA DE APPLE

Objetivo emocional: paz, precisão, confiança, elegância silenciosa, leveza e sensação de controle. O produto deve parecer uma ferramenta editorial premium e funcional, não um dashboard de criptomoedas, um conceito de Dribbble irreal ou uma cópia de macOS. A referência Apple inspira hierarquia, materiais, legibilidade, interação e consistência; o branding é nosso.

### 7.1 Fontes e referências com precedência

Referência principal de skill: https://github.com/klaybloom/apple-web-design-skill — usar no Codex explicitamente em modos audit, plan e implement; material público não oficial da Apple. Referência oficial de princípios: https://developer.apple.com/design/human-interface-guidelines/ ; materiais: https://developer.apple.com/design/human-interface-guidelines/materials . Complemento opcional de avaliação: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill . Ao implementar, comparar recomendações das skills com nossos tokens; a identidade definida nesta seção é a fonte da verdade. Não instalar a skill se já estiver disponível no ambiente.

Separar três camadas: A) Conteúdo: vídeos, imagens, legendas, calendário, dados e formulários — superfícies sólidas. B) Chrome/controle: sidebar, topo, busca, menus, barras de ação e popovers — transparência leve quando ajuda. C) Fundo: superfícies neutras e gradientes discretíssimos, nunca wallpaper chamativo. Liquid Glass só em pequenos controles transitórios; nunca converter cards ou editores inteiros em vidro.

### 7.2 Identidade cromática — modo claro

Tokens hex aprovados como ponto de partida da nossa identidade (não afirmar que são cores oficiais da Apple): --color-canvas: #F6F7F9; --color-surface: #FFFFFF; --color-surface-raised: #FFFFFF; --color-surface-muted: #F0F2F5; --color-border: #E5E8ED; --color-border-strong: #D5DBE3; --color-text-primary: #161A22; --color-text-secondary: #626A76; --color-text-tertiary: #7C8594; --color-accent: #276EF1; --color-accent-hover: #1D5BCE; --color-accent-soft: #EAF2FF; --color-focus: #276EF1; --color-overlay: rgba(18,24,38,.36).

Uso: canvas em toda a aplicação, surface nos cards, muted em áreas de suporte, accent somente para CTA, seleção e navegação ativa. Texto principal em quase preto, não preto absoluto em páginas muito densas. A hierarquia deve funcionar em escala de cinza. Não pintar cada módulo de uma cor; cor é indicador semântico, não decoração.

### 7.3 Identidade cromática — modo escuro

--color-canvas: #0F1218; --color-surface: #181D25; --color-surface-raised: #202630; --color-surface-muted: #242B36; --color-border: #323A47; --color-border-strong: #465063; --color-text-primary: #F5F7FB; --color-text-secondary: #B2BBC9; --color-text-tertiary: #95A1B2; --color-accent: #70A4FF; --color-accent-hover: #92B8FF; --color-accent-soft: #183052; --color-focus: #91BDFF; --color-overlay: rgba(0,0,0,.62). Evitar cinza lavado e azul saturado em blocos grandes.

### 7.4 Cores semânticas e estados

Success: light #16834A / soft #E8F7EF; dark #48C784 / soft #123728. Warning: light #B76C0B / soft #FFF3DD; dark #F3BC62 / soft #443119. Danger: light #C73636 / soft #FDEBED; dark #FF7777 / soft #451F26. Info: light #276EF1 / soft #EAF2FF; dark #70A4FF / soft #183052. Em todos os status, usar ícone + rótulo; nunca depender exclusivamente da cor.

Status visuais: Rascunho = neutro; Em revisão = violeta discreto; Aprovado = azul suave; Agendado = azul; Preparando = amarelo com progresso; Publicando = azul em atividade; Publicado = verde; Atenção = âmbar; Falha = vermelho; Cancelado = cinza. Mapear status do backend para tokens, não usar valores soltos nos componentes.

### 7.5 Tipografia — família e hierarquia

A tipografia oficial é Geist. Consulte a [guia Tipografia — Geist (Padrão Oficial)](https://docs.google.com/document/d/1q9ySzYvNYcAoEiqcuOkW96SIwdAcrW4hQEAKEd45v70/edit?tab=t.b3tei8fbykf), que substitui a orientação anterior.

### 7.6 Espaçamento — escala de 4 px

Tokens: space-0=0; space-1=4; space-2=8; space-3=12; space-4=16; space-5=20; space-6=24; space-8=32; space-10=40; space-12=48; space-16=64; space-20=80. Não criar espaços aleatórios de 7/13/19px sem justificativa. Entre ícone e texto: 8px. Entre label e campo: 6–8px. Entre campos: 16–20px. Entre grupos do formulário: 24–32px. Entre seções de página: 32px. Padding padrão de card: 20–24px desktop, 16px mobile.

### 7.7 Grid, largura e responsividade

Breakpoint de referência: xs <480px; sm 480–767px; md 768–1023px; lg 1024–1279px; xl 1280–1535px; 2xl >=1536px. Container central de conteúdo com max-width 1600px; margem desktop 32px; tablet 24px; mobile 16px. Grid padrão de 12 colunas com gap 20–24px; cards KPI 4 por linha em 1440px, 2 em tablet e 1–2 no mobile conforme legibilidade. Não gerar scroll horizontal global.

Sidebar: largura expandida 248px, compacta 72px, no mobile substituída por drawer acessível; topo do aplicativo 64px de altura. Área de conteúdo com largura flexível, sem sidebar quebrando o editor a 1024px. Barra de ações do compositor fixa apenas enquanto não ocultar formulário nem teclado virtual. Safe areas em mobile.

### 7.8 Raios, contornos, sombras e superfícies

radius-xs 6px; radius-sm 8px; radius-md 12px; radius-lg 16px; radius-xl 20px; radius-pill 9999px. Cards: 16px; inputs: 10px; botões: 10–12px; popovers: 14px; modais: 18–20px; thumbnails: 10–12px. Borda 1px com token border; usar shadow-xs: 0 1px 2px rgba(10,20,35,.04) e shadow-md: 0 8px 28px rgba(10,20,35,.08). Sombra deve sugerir camada, não flutuação dramática.

Superfícies de leitura e cards de mídia sempre opacos. Transparência (quando suportada): background rgba(255,255,255,.78), backdrop-filter blur(14px), borda sutil, somente header flutuante, popover, toolbar contextual. Em redução de transparência, usar surface sólido. Não usar blur de 40px em todo o aplicativo nem gradientes neon.

### 7.9 Botões e controles

Altura primária 40px desktop / 44px touch; pequenos 32px (somente ações secundárias); botões icônicos 40×40px mínimo em desktop e alvo toque 44×44px em mobile. Estilos: primary preenchido accent com texto branco; secondary surface com borda; tertiary sem borda em baixa ênfase; destructive vermelho reservado para confirmação. Estados obrigatórios: default, hover, active/pressed, focus-visible, disabled e loading. Nunca desabilitar ação sem explicar motivo.

Input: altura 42–44px, label persistente acima, placeholder de exemplo nunca usado como único label, helper text quando necessário, erro abaixo com ícone e instrução de correção. Dropdown pesquisável quando houver mais de 8 opções. Segmented controls com até 4 modos curtos; para mais usar tabs ou select. Date/time picker sempre mostra fuso; deve impedir agendamento em horário passado no mesmo fuso.

### 7.10 Ícones

Biblioteca-base: Lucide React, traço 1.75–2px, tamanhos 16/18/20/24px. Navegação: LayoutDashboard, CalendarDays, SquarePen, Images, Send, ClipboardCheck, ChartNoAxesCombined, UsersRound, Settings. Estados: CheckCircle2, AlertTriangle, Clock3, LoaderCircle, XCircle, RotateCcw. Ações: Plus, UploadCloud, Eye, Pencil, Copy, Trash2, ChevronDown, Filter, GripVertical, MoreHorizontal. Escolher um único sistema; ícones não devem misturar famílias, não usar emojis como navegação do produto.

Ícones sempre acompanhados por tooltip ou nome acessível quando não houver label textual. Alinhar em grid 20×20, sem deformações. Marca do Instagram pode aparecer como logotipo de serviço conectado conforme permissões; evitar imitar logo da Apple ou insinuar afiliação.

### 7.11 Motion e microinterações

Tokens: duration-fast 120ms; duration-base 180ms; duration-slow 240ms; easing cubic-bezier(.2,.8,.2,1). Hover deve usar leve mudança de surface/border ou translateY máximo 1px em cards interativos. Popover fade+scale discreto; drawer 220–260ms; skeleton suave sem flash agressivo. Nunca animar texto extenso, KPIs continuamente ou deslocar conteúdo durante carregamento.

prefers-reduced-motion: reduzir a praticamente zero animações não essenciais; preservar feedback de estado. prefers-reduced-transparency ou fallback CSS: controlar blur e renderizar fundo sólido. Transições não podem atrasar atualizações operacionais, criar race condition nem ocultar sucesso/erro.

### 7.12 Densidade e experiência premium

Preferir espaço em branco útil, alinhamento preciso e textos concisos. Estados vazios trazem explicação do que falta e CTA contextual. Skeleton só quando carregar de verdade. Toast temporário para confirmação simples; falha crítica persistente em banner ou linha do item. Modal somente para ações irreversíveis. Drawer para detalhes de publicação, popover para filtros, fullscreen ou página dedicada para editor complexo.

### 7.13 Componentes de design obrigatórios

Criar componentes reutilizáveis: AppShell, SidebarNav, WorkspaceSwitcher, AccountSelector, PageHeader, SectionHeader, MetricCard, StatusBadge, PostCard, PostThumbnail, PostPreview, PublishTimeline, DateTimeField, ContentComposer, MediaUploader, MediaGrid, MediaInspector, HashtagInput, ReorderableCarousel, ApprovalPanel, ConfirmDialog, EmptyState, ErrorState, Skeleton, ActivityFeed, ToastProvider, TokenAlert, CalendarView. Um componente, uma responsabilidade. Variantes padronizadas e estados tipados.

### 7.14 Exemplos concretos de aplicação

Exemplo dashboard: canvas off-white; cabeçalho de página com título à esquerda e botão azul ‘Nova publicação’ à direita; 4 cards brancos, alinhados, texto secundário discreto; cards seguintes com calendário e lista de pendências. Exemplo compositor: parte funcional branca, mídia na coluna central, preview com moldura minimalista e fundo neutro; CTA azul fixo no rodapé, sem gradientes. Exemplo calendário: células claras com linhas muito sutis, thumbnails pequenos, horários tabulares, badges pontuais; tooltip para detalhes.

### 7.15 CSS tokens de referência para implementação

Arquivo sugerido: src/styles/tokens.css com variáveis globais sem valores soltos em componentes: :root { --canvas:#F6F7F9; --surface:#FFF; --surface-muted:#F0F2F5; --border:#E5E8ED; --text:#161A22; --text-muted:#626A76; --accent:#276EF1; --accent-soft:#EAF2FF; --radius-card:16px; --radius-control:10px; --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-6:24px; --space-8:32px; --sidebar-width:248px; --topbar-height:64px; } .dark { --canvas:#0F1218; --surface:#181D25; --surface-muted:#242B36; --border:#323A47; --text:#F5F7FB; --text-muted:#B2BBC9; --accent:#70A4FF; --accent-soft:#183052; }. Integrar tokens semânticos ao Tailwind e shadcn/ui por aliases, não duplicar.

### 7.16 Checklist visual de aceite

Verificar telas em 375, 768, 1024 e 1440px; sem scroll horizontal, sobreposições, cortes de legenda, botões fora de viewport ou preview que distorce mídia.

Validar modo claro e escuro, zoom 200%, teclado completo, screen reader, preferências de movimento/transparência e contraste mínimo.

Comparar screenshots reais de login, dashboard, calendário, editor, biblioteca, detalhes e estados vazios/erro. Prints e testes devem existir antes de declarar visual ‘aprovado’.

Não permitir inconsistências de radius, fontes, sombras, ícones, cores, alturas e labels entre módulos; componente compartilhado deve corrigir inconsistência globalmente.

## 8. MODELO DE ESTADOS E REGRAS DE NEGÓCIO

### 8.1 Estados do conteúdo (post.status)

draft → in_review [V2] → approved [V2] → scheduled → preparing → publishing → published. Caminhos alternativos: scheduled → cancelled; scheduled/preparing → blocked; preparing/publishing → failed; failed → scheduled após correção explícita; uma tentativa incerta deve entrar em reconciling antes de qualquer reenvio. Estados terminais: published, cancelled, archived. Evitar transições arbitrárias pela UI.

### 8.2 Estados separados de processamento

Não confundir post.status editorial com job.status operacional: pending, leased, processing, awaiting_meta, reconciling, succeeded, retryable_failure, permanent_failure, cancelled. Container status da Meta é terceiro domínio: IN_PROGRESS, FINISHED, ERROR, EXPIRED, PUBLISHED ou equivalentes da versão escolhida. Adaptador deve mapear com segurança.

### 8.3 Validação temporal

Usuário escolhe timezone IANA por workspace, default America/Sao_Paulo. Interface mostra hora local; backend armazena scheduled_at UTC + timezone + offset resolvido. DST tratado pela biblioteca oficial de datas; horários inexistentes/ambíguos exigem decisão explícita. Não aceitar agendar no passado; permitir publicar agora. Ao reagendar, invalidar jobs antigos mediante versionamento do post.

### 8.4 Concorrência, edição e bloqueio

Somente estados draft, in_review, approved e scheduled (enquanto worker não adquiriu lease) podem aceitar mudanças de mídia/legenda/horário; editor usa optimistic locking por revision. Se publicação começou, UI exibe bloqueio e ações seguras. Cada job tem chave idempotente composta (post_id, post_revision, action). UNIQUE no banco + transaction, não apenas botão desabilitado.

### 8.5 Notificações

Aviso por falha permanente/conta desconectada/necessidade de aprovação, com debounce e deduplicação por incidente. Usuário escolhe preferências. Não enviar alertas repetidos em cada polling. Mensagens não incluem token, URL assinada ou dados pessoais desnecessários.

## 9. CONTRATOS DE DADOS E ENTIDADES

### 9.1 Modelo relacional

users(id, email, name, created_at); workspaces(id, name, timezone, plan_tier, created_at); workspace_members(id, workspace_id, user_id, role, status); social_accounts(id, workspace_id, platform, provider_account_id, username, account_type, capabilities_json, connection_status, last_verified_at); social_credentials(id, social_account_id, encrypted_token_ref, token_expires_at, scopes_json, key_version); media_assets(id, workspace_id, storage_key, sha256, mime, width, height, duration_ms, size_bytes, audio_codec, video_codec, status, created_by); posts(id, workspace_id, social_account_id, format, caption, share_to_feed, timezone, scheduled_at, published_at, status, revision, created_by, updated_by); post_media(id, post_id, media_asset_id, sort_order, crop_json, alt_text); publication_jobs(id, post_id, post_revision, scheduled_for, lease_owner, lease_until, attempts_count, status, idempotency_key); publication_attempts(id, job_id, started_at, finished_at, step, outcome, safe_error_code, safe_error_message, provider_container_id, provider_media_id, trace_id); activity_logs(id, workspace_id, actor_id, action, target_type, target_id, metadata_safe_json, created_at).

### 9.2 Restrições relacionais e índices

FKs obrigatórias e ON DELETE explícito; UNIQUE(workspace_id, provider_account_id); UNIQUE(post_id, sort_order); UNIQUE(publication_jobs.idempotency_key); índice por publication_jobs(status,scheduled_for); índice por posts(workspace_id,scheduled_at,status); índice por social_accounts(workspace_id,platform); índice de auditoria por workspace_id,created_at. Media SHA256 para detectar duplicatas, sem compartilhar arquivos entre clientes só por hash.

### 9.3 Isolamento e RLS

Políticas Row Level Security: membro autenticado só lê/escreve registros de workspaces dos quais participa e somente ações permitidas pelo papel. Service role existe apenas no backend/worker confiável. Testar IDOR via alteração de workspace_id e IDs de recursos em todas as APIs. Nunca confiar em workspace_id vindo do cliente sem verificar associação do usuário.

### 9.4 Contrato de uma publicação (exemplo de teste)

Fixture, não agendamento real: { platform:'instagram', format:'reel', share_to_feed:true, timezone:'America/Sao_Paulo', scheduled_at:'2026-11-05T21:00:00Z', caption:'Conheça os detalhes da nossa nova coleção ✨\n\n#semijoias #novacolecao', status:'draft', media_asset_id:null, social_account_id:null, published_at:null, provider_media_id:null }. Como 05/11/2026 já passou na data-base do documento, o agendador deve rejeitar esse horário como novo agendamento; mantê-lo apenas como caso histórico de fixture.

### 9.5 Armazenamento de mídia

Bucket privado por padrão. storage_key inclui workspace e UUID seguro, nunca nome do cliente sem sanitização. Upload multipart ou signed upload com escopo curta duração; antivírus/varredura se aplicável, limites de bytes/contagem e verificação de MIME por conteúdo. Assinaturas HTTPS temporárias emitidas no preparo do container para a Meta, com validade suficiente ao download; não usar links expirados nem tornar todo bucket público.

### 9.6 Retenção e exclusão

Política de retenção configurável para originais, derivados e logs; exclusão em cascata controlada, soft delete para rascunhos e auditoria preservada sob base legal definida. Solicitação de exclusão de workspace deve revogar tokens, cancelar jobs, remover mídia conforme política e registrar evento técnico. Evitar manter arquivos gigantes indefinidamente sem quotas.

## 10. ARQUITETURA DE SOFTWARE E ORGANIZAÇÃO DO REPOSITÓRIO

### 10.1 Arquitetura de referência

Frontend Next.js App Router/TypeScript → Backend HTTP server-side (Next.js route handlers ou serviço Node separado) → Supabase PostgreSQL/Auth/Storage → worker de publicações com fila persistida → adaptador Meta Graph API. n8n acoplado por eventos/webhooks autenticados para notificações e integrações não críticas. FFprobe/FFmpeg em worker de mídia. Enviar conteúdo à Meta somente por backend; nunca do browser com token de fornecedor.

### 10.2 Fronteiras entre módulos

auth: sessão, usuários, roles. workspace: tenants e convite. accounts: OAuth/capabilities. media: uploads, transcodificação e metadados. posts: rascunhos e regras editoriais. scheduler: operações temporais e jobs. publishers/instagram: tradução para API Meta. notifications: incidentes e preferências. auditing: eventos imutáveis. integrations/n8n: eventos externos. analytics: futuro read model. Frontend usa DTOs do backend; não conhece tabelas internas da Meta.

### 10.3 Estrutura de pastas sugerida

apps/web/app/(auth)/login; apps/web/app/(app)/dashboard; apps/web/app/(app)/calendar; apps/web/app/(app)/posts; apps/web/app/(app)/library; apps/web/app/(app)/accounts; apps/web/components/{layout,posts,calendar,media,ui}; apps/web/styles/{tokens.css,globals.css}; packages/domain/{post,account,workspace}; packages/database/{migrations,queries}; packages/instagram/{client,auth,capabilities,publisher}; packages/jobs/{scheduler,worker,reconciler}; packages/config; packages/testing; infra/{docker,n8n,deploy}; docs/{adr,api,runbooks,design-system}. Adaptar monorepo à realidade do repositório já existente; não criar estruturas duplicadas.

### 10.4 Stack recomendada e limites

Web: Next.js estável compatível com dependências, TypeScript strict, Tailwind CSS, shadcn/ui como base acessível, Lucide React, React Hook Form + Zod, TanStack Query se trouxer valor ao cache. DB: PostgreSQL Supabase com migrações versionadas. Fila: implementação com PostgreSQL (FOR UPDATE SKIP LOCKED, lease e índice) no MVP; considerar pg-boss ou BullMQ + Redis somente quando o volume justificar. Worker Node em processo separado da web. Observabilidade: logs JSON, métricas, tracing. Testes: Vitest/Jest, Playwright e testes com DB isolado.

### 10.5 Dependências e decisões arquiteturais

Toda biblioteca nova exige justificativa breve e avaliação de manutenção, segurança e compatibilidade. Manter versões travadas via lockfile e atualizações controladas. Encapsular Meta em interface PublishingProvider; não espalhar HTTP Graph por endpoints. Documentar ADRs quando houver trade-off entre Next-only e API separada, provider de fila, storage, ferramentas de vídeo e estratégia de deploy.

## 11. INTEGRAÇÃO OFICIAL COM INSTAGRAM / META

### 11.1 Condições e conta autorizada

Somente contas profissionais autorizadas e capazes de publicar pelos endpoints oficiais. Diferenciar integração ‘Instagram Login’ de ‘Facebook Login’, pois escopos, host, tokens, exigência de Página Facebook, limites e recursos podem variar. Implementar matriz de capacidades recebida por conexão: supportsImage, supportsCarousel, supportsReel, supportsStory, supportsAltText, supportsFeedShare, supportsAudioSelection. O frontend se baseia nessa matriz, não em promessa global.

### 11.2 OAuth seguro

Iniciar login apenas a partir do backend, gerar state único e vinculá-lo à sessão e workspace; validar callback, escopos efetivamente concedidos e conta retornada. Guardar token criptografado em cofre/criptografia application-layer com chave fora do banco; rotacionar/revalidar conforme ciclo documentado. Guardar last_verified_at, expires_at, scopes e account_id. Registros da conta não equivalem a permissões de publicar até teste real. Desconectar exige revogação ou descarte seguro quando suportado.

### 11.3 Parâmetros e processo de publicação

Para Reel na modalidade suportada: POST /{ig-user-id}/media com media_type=REELS, video_url, caption e share_to_feed quando permitido; consultar GET /{container-id}?fields=status_code; ao atingir status FINISHED publicar via POST /{ig-user-id}/media_publish com creation_id. Registrar container_id e media_id; depois consultar media para permalink/status quando a API permitir. Jamais tratar criação do container como publicação realizada.

Para imagem: criar container com image_url e publicar. Para carrossel: criar containers child com is_carousel_item e media_type CAROUSEL no parent conforme versão vigente, aguardar prontidão e publicar parent. Para Stories: usar o fluxo e tipo de mídia oficialmente autorizado para a conexão. Todos os caminhos precisam de testes com conta de desenvolvimento antes de aparecer como ‘funcional’. Métodos e campos exatos devem ser confirmados contra versão pinada; exemplos são contratos de orientação.

### 11.4 Versão e compatibilidade

Definir META_GRAPH_API_VERSION em config, fixar versão revisada e atualizar deliberadamente por ADR; não usar ‘latest’ silenciosamente. Implementar rate limit, backoff, resposta 429/5xx, expiração de container, token inválido, permissões revogadas, mídia indisponível, limite por conta e janelas de manutenção. Retornar mensagens legíveis, sem repassar payload bruto ao usuário.

### 11.5 Matriz de suporte e riscos

Confirmado como eixo de implementação: publicação de imagens, carrosséis e Reels em contas profissionais segundo documentação de content publishing; Stories requerem checagem do tipo de conta e modalidade. Condicional: capas, alt text, marcadores, colaborações, share_to_feed, músicas de biblioteca, sticker musical, menções com tagging nativo. Não suportado como requisito do MVP: atualizar bio automaticamente via API oficial; editar legenda ou substituir mídia de post já publicado se não existir endpoint público adequado. Este documento não autoriza contornar mecanismos de segurança da Meta.

### 11.6 Requisitos de mídia: referência, não constante cega

Usar a documentação versionada como autoridade para tamanho, dimensões, proporções, codec e duração. Referência de Reel encontrada na coleção oficial: MOV/MP4, H.264/HEVC, AAC 48 kHz, proporção vertical 9:16 recomendada, tamanho máximo indicado de 1 GB e duração 3 s a 15 min; confirmar valores atualizados antes de validar no código. O validador deve ler capacidade real, registrar versão e impedir arquivo incompatível antes de publicar.

### 11.7 Fontes de desenvolvimento oficiais

Documentação geral: https://developers.facebook.com/docs/instagram-platform/ ; publicação: https://developers.facebook.com/docs/instagram-platform/content-publishing/ ; coleção oficial Postman: https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api ; gestão de aplicativo: https://developers.facebook.com/apps/ . Links são referências de pesquisa para agentes; verificar data e versão antes de alterar contratos.

## 12. AGENDADOR, FILA E PROCESSAMENTO RESILIENTE

### 12.1 Invariante de confiabilidade

O banco é fonte da verdade. Um evento no n8n nunca é a única cópia do agendamento. Deve existir um único job ativo por revisão de post; nenhuma publicação ocorre sem autorização, sem asset final, com horário inválido ou token incerto. Tentativas externas podem ter resultado ambíguo: não presumir que falhou e repetir imediatamente.

### 12.2 Criação de agendamento

POST /posts/:id/schedule: validar membro e permissão, conta e capability, status draft/approved, media assets prontos, janela temporal futura, timezone e versão editorial. Em transação: incrementar revision quando apropriado, gravar scheduled_at e timezone, gerar job pendente com unique key, registrar audit_log e retornar payload idempotente. Se a mesma requisição chegar duas vezes com Idempotency-Key igual, retornar o mesmo agendamento.

### 12.3 Worker

Polling curto configurável (ex.: 15–30 segundos) ou notificação transacional; aquisição atômica de jobs vencidos via SELECT ... FOR UPDATE SKIP LOCKED; registrar lease_owner/lease_until, heartbeat e tentativa. Mesmo após restart, lease expirado permite retomar. Limites por conta e por workspace impedem tempestades. Worker nunca expõe tokens na fila.

### 12.4 Ciclo do job

1 validar job/revision atual e permissão; 2 confirmar asset e conexão; 3 gerar URL assinada com TTL adequado; 4 criar contêiner Meta; 5 persistir container_id; 6 consultar status com backoff e timeout; 7 enviar media_publish uma única vez com controle de estado; 8 persistir resposta e consultar mídia; 9 marcar published e escrever event log; 10 enfileirar notificação assíncrona. Em fase crítica, salvar cada transição antes de avançar.

### 12.5 Erros e retentativas

Categorias: VALIDATION (requer correção); AUTH (reconectar); PERMISSION (bloqueio até concessão); RATE_LIMIT (respeitar Retry-After e janela); META_TEMPORARY (retry exponencial com jitter); ASSET_UNAVAILABLE (gerar nova URL ou regenerar mídia); PERMANENT (sem retry); AMBIGUOUS_RESULT (reconciliação). Definir max_attempts por etapa e deadline operacional; avisar quando a janela segura de publicação for perdida.

### 12.6 Reconciliação e idempotência

Após timeout no media_publish, não executar segunda publicação até consultar registros de tentativa, container_id e recursos de leitura disponíveis. A API pode não fornecer idempotency-key da publicação: proteger com ledger interno e estado reconciling. Se não for possível estabelecer o resultado, manter como ‘Resultado incerto — intervenção necessária’, jamais publicar duas vezes para ‘garantir’. Também reprocessar webhooks de forma idempotente.

### 12.7 Reagendamento e cancelamento

Agendamento ainda sem lease: transação invalida job anterior, incrementa revision e cria novo job. Se worker já assumiu, bloquear edição até estado resolvido. Cancelar não equivale a deletar conteúdo já publicado. Datas no passado devem ser rejeitadas no momento do pedido, mesmo que o frontend tenha permitido por relógio incorreto.

### 12.8 SLOs e alarmes sugeridos

Metas iniciais de produto, a validar por infraestrutura e capacidade Meta: 99% ou mais das tarefas elegíveis devem iniciar processamento até 60s do horário alvo; mediana de publicação efetiva pode variar devido ao processamento da Meta e não deve ser prometida com precisão rígida. Alertar se jobs pending vencidos >2min, lease preso, erros de auth em série ou sucesso por conta cair. Registrar diferença scheduled_for vs published_at.

## 13. BACKEND: API INTERNA, ERROS E EVENTOS

### 13.1 Endpoints REST principais

GET /api/workspaces; GET/POST /api/accounts; GET /api/accounts/:id/capabilities; POST /api/accounts/:id/disconnect; GET /api/auth/instagram/start; GET /api/auth/instagram/callback; GET/POST /api/media; POST /api/media/upload-init; POST /api/media/upload-complete; GET/POST /api/posts; GET/PATCH/DELETE /api/posts/:id; POST /api/posts/:id/schedule; POST /api/posts/:id/cancel; POST /api/posts/:id/publish-now; GET /api/posts/:id/attempts; GET /api/calendar; GET /api/activity; POST /api/integrations/n8n/webhooks [assinado]. Endpoint do worker separado e protegido por service auth.

### 13.2 Esquema de resposta

Sucesso: { data: <dto>, meta: { requestId, pagination? }}. Erro: { error: { code, message, fieldErrors?, retryable, requestId }}. Os códigos de erro incluem INVALID_SCHEDULE_TIME, ACCOUNT_RECONNECT_REQUIRED, FORMAT_UNSUPPORTED, MEDIA_NOT_READY, MEDIA_INVALID, POST_LOCKED, PERMISSION_DENIED, RATE_LIMITED, META_TEMPORARY, RESULT_UNCERTAIN. Frontend traduz com português brasileiro e oferece CTA contextual.

### 13.3 Contratos tipados

Zod no limite das requisições e validação no domínio. Tipos principais: PostFormat='image'|'carousel'|'reel'|'story'; PostStatus='draft'|'in_review'|'approved'|'scheduled'|'preparing'|'publishing'|'published'|'blocked'|'failed'|'cancelled'; SocialPlatform='instagram' (expansível); WorkspaceRole='owner'|'admin'|'editor'|'approver'|'viewer'. Garantir consistência enum banco/API/front e tests de migração.

### 13.4 Eventos de domínio

post.created; post.updated; post.scheduled; post.cancelled; post.publish_started; post.published; post.publish_failed; account.connected; account.disconnected; account.reconnect_required; approval.requested; approval.accepted [V2]. Eventos saem de outbox no banco para o n8n; payload mínimo com event_id, occurred_at, workspace_id, post_id, action, link interno seguro. Assinar webhook e verificar idempotência no consumidor.

## 14. N8N — PAPEL EXATO E WORKFLOWS

### 14.1 O que o n8n faz

Orquestra alertas e integrações complementares: falha de publicação → notificação para responsável; agendamento aprovado → sincronização opcional com ClickUp; bio assistida → lembrete; resumo semanal → notificação interna; conta desconectada → fluxo de suporte. n8n não é fonte da verdade, não altera acesso no banco diretamente e não recebe credenciais Meta em workflows de terceiros.

### 14.2 Workflow de erro

Outbox.event(post.publish_failed) → webhook n8n autenticado → buscar metadados mínimos autorizados via API interna → determinar destinatário/gravidade → enviar alerta (WhatsApp/email/ClickUp somente se configurados) → registrar delivery_id → evitar repetição por event_id. O link leva diretamente ao detalhe da publicação, não a um arquivo público.

### 14.3 Workflow de aprovação / tarefa

Aprovação V2: post.review_requested → criar/atualizar tarefa ClickUp via chave externa estável → status ClickUp não deve publicar sozinho sem transição de aprovação autenticada no backend → sincronizar comentário/decisão com auditoria. Prevenir loop de webhooks. Falha da integração não pode impedir a publicação aprovada já agendada.

### 14.4 Workflow de bio assistida

bio_change.due → n8n avisa usuário autorizado → sistema mostra texto pronto e botão Copiar → pessoa altera manualmente no Instagram → marca como Aplicado com hora/autor. Se a confirmação não ocorrer, status ‘pendente’; nunca declarar atualização da bio feita automaticamente.

### 14.5 Padrões operacionais n8n

Credencial de integração própria, HTTPS, assinatura HMAC ou token técnico rotacionável, timeout, retry, limite de taxa e dead-letter. Versionar JSON de workflows no repositório com credenciais substituídas por placeholders. Ambiente de staging não envia alertas para clientes reais. Cada fluxo documenta input, output, erros e dono.

## 15. SEGURANÇA, PRIVACIDADE E COMPLIANCE

### 15.1 Modelo de ameaças

Ameaças prioritárias: vazamento de token Instagram, uso cruzado entre clientes, upload malicioso, vazamento de signed URLs, spoofing de webhooks, SSRF em fetch de URL, corrida que duplica post, acesso indevido por ID de post, inserção de scripts em legendas, data exfiltration via logs, XSS em preview e vazamento de PII em ferramentas de IA.

### 15.2 Controles obrigatórios

RBAC + RLS; validação server-side de conta e workspace em toda ação; CSRF/OAuth state, cookies HttpOnly+Secure+SameSite quando aplicável; CORS restritivo; rate limiting; CSP, sanitização de HTML, codificação adequada de captions; storage privado, URL assinada curta, scan de arquivo, MIME sniffing e limites. Segredos em gerenciador de secrets; nunca em .env commitado, localStorage ou resposta da API. Logs com redaction.

### 15.3 Segurança de arquivos

Uploads inicialmente marcados ‘quarantine’; validar tamanho, assinatura real, media metadata, dimensões, limites de pixel e vídeos com codec permitido. FFmpeg em container isolado com CPU/memória/tempo limitados; nomes/path gerados pelo servidor; não executar comandos via shell com dados livres. Evitar SSRF usando apenas storage interno de mídia e hosts controlados.

### 15.4 Proteção de dados

Considerar LGPD: finalidade de processamento, bases legais, informação ao cliente, retenção, revogação do acesso, direitos do titular e registro de incidentes. Não coletar senha do Instagram. Mínimo necessário de dados pessoais de equipe e conta. O design deve indicar claramente conta/workspace ativo para reduzir postagem no cliente errado.

### 15.5 Ambientes

Local: dados falsos, storage mock ou bucket de teste. Staging: contas de homologação autorizadas e conteúdos fictícios; nunca contas de clientes em massa. Produção: domínio e app Meta aprovados, segredos segregados, backup automatizado, monitoramento, logs e mecanismos de rollback. Nunca executar post real em testes automatizados.

## 16. TESTES, QUALIDADE E CRITÉRIOS DE ACEITE

### 16.1 Estratégia de testes

Unit: validators de mídia/data/timezone, máquina de estados, autorização, geração de idempotency key e mapeamento de erros Meta. Integration: queries com PostgreSQL isolado, RLS/RBAC, fila transacional, OAuth mock, storage assinado, publisher com HTTP simulado. Contract: schemas dos DTOs e respostas reais sanitizadas da Meta. E2E: Playwright para jornadas de criação, rascunho, agendamento, calendário, cancelamento, erros e responsividade. Smoke em staging com conta profissional autorizada. Não usar conta de produção em pipeline automatizado.

### 16.2 Matriz obrigatória

Cenário T01: criar rascunho sem mídia → salva apenas como draft, não permite agendar. T02: Reel válido + conta autorizada + horário futuro → scheduled e 1 job. T03: clique duplo no botão Agendar → 1 job. T04: POST idêntico repetido → resultado idempotente. T05: agendar data passada → 422 INVALID_SCHEDULE_TIME. T06: token expirado → blocked e CTA reconexão. T07: arquivo incompatível → feedback técnico simples com possibilidade de substituição. T08: editar horário antes do lease → job antigo cancelado e novo ativo. T09: editar após lease → POST_LOCKED. T10: Meta timeout após media_publish → reconciling, sem segunda publicação automática. T11: reiniciar worker após lease → retomar sem duplicação. T12: conta sem stories → opção desabilitada com explicação. T13: trocar workspace sem autorização → 403, mídia não revelada. T14: teclado e screen reader percorrem editor e calendário. T15: dark mode e zoom 200% não ocultam CTA.

### 16.3 Critérios de aceite em linguagem de negócio

Dado que estou logado e tenho acesso de editor a um workspace com conta capaz de publicar Reels, quando envio um arquivo válido, preencho legenda e seleciono horário futuro, então vejo prévia, confirmação do agendamento e card correspondente no calendário. Dado que o job chegou ao horário, quando a Meta confirma a publicação, então status vira Publicado e há identificador da mídia. Dado que a API retorna falha permanente, então recebo mensagem clara, não há postagem fantasma e os dados ficam disponíveis para correção.

### 16.4 Aceite visual

A avaliação visual é parte do Definition of Done, não uma melhoria opcional. Capturar screenshots reais dos componentes e comparar com referência: tipografia, grid, cor, foco, acessibilidade, diferentes tamanhos, mobile com teclado aberto, erro de upload, loading, vazio, prévia 9:16 e carrossel. Verificar browser Chromium/WebKit/Firefox quando viável. Revisor deve apontar diferenças concretas, não escrever apenas ‘design bonito’.

### 16.5 Segurança e qualidade do código

Executar lint, typecheck, build, testes unit/integration/E2E, verificação de segredos e scanners de dependências. Testes de concorrência de jobs, isolamento RLS e uploads hostis são P0. CI só aprova merge quando checks mandatórios passarem. Mudanças de schema exigem migrações e rollback documentado; nunca apagar dados reais de produção em testes.

## 17. OPERAÇÃO, OBSERVABILIDADE E DEPLOY

### 17.1 Logs e métricas

Cada operação recebe requestId/traceId e publicações recebem postId, jobId e attemptId. Logs JSON com módulo, estado anterior/novo, duração, código de erro seguro e workspace pseudonimizado. Nunca logar token, signed URL completa ou caption confidencial desnecessária. Dashboard técnico: jobs vencidos, lease expirado, sucesso/falha, API latency, quantidade de retries, erros por tipo e uso de armazenamento.

### 17.2 Alertas e runbooks

Runbooks: Reconectar conta; Mídia inválida; Excedido limite de API; Falha temporária Meta; Job atrasado; Resultado incerto; Reverter migração; Rollback de deploy; Exclusão/revogação de workspace. Para cada incidente: sintoma, impacto, verificação, mitigação, passo seguro e responsável. Rotina de manutenção mensal de versão Meta e dependências.

### 17.3 Backups e recuperação

Backups consistentes de banco e configurações; RPO/RTO deverão ser definidos conforme infraestrutura real. Testar restauração fora de produção. Arquivos do Storage e metadados devem manter relação recuperável. Nunca ‘restaurar’ jobs antigos como pendentes sem reconciliar se o horário já passou ou se a publicação ocorreu.

### 17.4 Deploy e ambientes

Ambiente preview por PR quando disponível; staging persistente com dados artificiais; produção segregada. Build da web separado do worker; variáveis META_APP_ID, META_APP_SECRET, META_GRAPH_API_VERSION, DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (somente backend), ENCRYPTION_KEY, N8N_WEBHOOK_SECRET, SENTRY_DSN ou equivalente. Variáveis são nomes de contrato, não valores reais. Health endpoints para web e worker; deploy sem indisponibilizar workers ativos.

## 18. ROADMAP TÉCNICO POR FASES E ENTREGÁVEIS

### Fase 0 — Descoberta técnica

Entregáveis: auditoria do repositório existente; teste de OAuth com conta profissional de homologação; matriz de capacidades real da Meta; escolha fundamentada de stack e fila; design token audit; ADRs críticos; plano de ambiente. Bloqueia promessas de recursos incompatíveis.

### Fase 1 — Fundação

Entregáveis: monorepo ou projeto organizado, autenticação, workspaces, permissões, Postgres migrations/RLS, tokens CSS, componentes base e CI. Aceite: login/logout, troca de workspace segura, layouts responsivos e testes de isolamento passando.

### Fase 2 — Contas e mídia

Entregáveis: OAuth Meta, painel de contas, capabilities, status de conexão, bucket privado, upload, FFprobe, thumbnails, validações, biblioteca básica. Aceite: conectar e desconectar conta de homologação, upload com preview, erro útil para arquivo inválido.

### Fase 3 — Compositor e calendário

Entregáveis: forms tipados de post, seleção de formato, mídia e legenda, preview fiel ao formato, draft, reagendamento, filtros e calendário. Aceite: rascunho completo retorna após reload, no mobile permanece utilizável, post sem mídia não agenda.

### Fase 4 — Scheduler e publicação de Reels (piloto vertical)

Entregáveis: fila PostgreSQL com lease, worker, adaptador Instagram Reels, publisher real em staging, logs e reconciliação. Aceite: Reel de teste publicado uma vez com status comprovado, sem token em log, retry e restart testados.

### Fase 5 — Demais formatos + hardening

Entregáveis: imagem, carrossel e Stories simples somente onde oficialmente suportados; validação por formato; alertas n8n; testes de carga, segurança e UX; monitoramento; runbooks. Aceite: cobertura da matriz oficial por conta, sem promessas de música/stickers não confirmados.

### Fase 6 — Gestão profissional (V2)

Entregáveis: equipe e papéis ampliados, aprovações, comentários, bio assistida, ClickUp, notificações por responsável, templates editoriais. Aceite: nenhuma alteração posterior à aprovação é publicada sem nova autorização.

### Fase 7 — Evolução inteligente (V3)

Entregáveis: analytics oficiais, relatórios, recomendações, IA assistiva, testes de áudio nativo em API, arquitetura multicanal quando existir demanda. Cada integração adicional deve passar por matriz de capacidade, compliance e testes próprios.

## 19. BACKLOG INICIAL — EPICS, HISTÓRIAS E DEPENDÊNCIAS

EPIC E01 Identidade/Acesso: US01 login, US02 workspace, US03 convites (V2), US04 papéis, US05 logs. EPIC E02 Contas: US06 iniciar OAuth, US07 callback seguro, US08 capacidades, US09 reconexão, US10 desconectar. EPIC E03 Mídia: US11 upload resumível, US12 metadados, US13 validação, US14 thumbnail, US15 biblioteca. EPIC E04 Conteúdo: US16 rascunho, US17 editor Reel, US18 editor imagem, US19 carrossel, US20 Story, US21 preview, US22 legenda/hashtags, US23 feed share. EPIC E05 Planejamento: US24 agendar, US25 reagendar, US26 cancelar, US27 calendário, US28 filtros. EPIC E06 Publicação: US29 fila, US30 worker, US31 Meta adapter, US32 confirmação, US33 retry, US34 reconciliação. EPIC E07 Operação: US35 activity, US36 notificações, US37 N8n, US38 health/metrics. EPIC E08 Qualidade: US39 RLS, US40 integração, US41 Playwright, US42 contraste, US43 responsivo, US44 runbooks.

Dependência crítica: E01 → E02/E03 → E04 → E05 → E06; E07 acompanha E06; E08 é transversal e bloqueia merge. Histórias de V2 e V3 não devem desviar a equipe do fluxo vertical de Reel do MVP.

## 20. CONTRATO DE IMPLEMENTAÇÃO PARA CODEX / CURSOR

### 20.1 Instrução-mestre para iniciar cada tarefa

‘Você está implementando a plataforma Social Studio, produto independente do BrainX. Considere o Google Docs de Especificação Mestre como fonte de verdade. Antes de editar, identifique seção do PRD, leia design system e estados, inspecione repositório atual, valide capacidade Meta e segurança, proponha plano curto e arquivos afetados. Use a skill klaybloom/apple-web-design-skill em modo apropriado e revise UI com UI UX Pro Max e Playwright, se disponíveis. Não invente endpoints, segredos, testes aprovados, screenshots ou publicação realizada. Mantenha tokens CSS e componentes compartilhados. Ao final entregue diffs, testes executados, evidências visuais e pendências reais.’

### 20.2 Protocolo obrigatório de trabalho

1 LER PRD: se não tiver conector de Google Docs/Drive, solicitar ao operador export Markdown do documento e manter snapshot versionado em docs/product/spec-master.md com data de sincronização. 2 INSPECIONAR projeto e dependências existentes. 3 PLANEJAR alterações com escopo pequeno. 4 IMPLEMENTAR com types e testes. 5 VALIDAR lint/typecheck/build/testes/UX. 6 DOCUMENTAR o que mudou e quais seções do PRD foram atendidas. 7 NÃO realizar push, merge, deploy, postagem real ou migração destrutiva sem autorização explícita no contexto da execução.

### 20.3 Referências de skill, sem conflitos de autoridade

Skill Apple Web Design: https://github.com/klaybloom/apple-web-design-skill ; Apple HIG: https://developer.apple.com/design/human-interface-guidelines ; skill UI UX Pro Max: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill ; Playwright MCP: https://github.com/microsoft/playwright-mcp . As skills auxiliam decisão e revisão, mas os tokens desta especificação prevalecem quando a diferença for apenas estética. Consultar orientação oficial Apple para princípios e documentação Meta para capacidades; nenhuma dessas fontes autoriza copiar identidade de marca.

### 20.4 Arquivos de documentação que o repositório deve manter

AGENTS.md (regras para agentes); README.md (visão, setup e scripts); docs/product/spec-master.md (snapshot do Docs com data); docs/product/feature-matrix.md; docs/design/tokens.md; docs/design/component-contracts.md; docs/architecture/overview.md; docs/architecture/ADRs/; docs/integrations/meta.md; docs/integrations/n8n.md; docs/security/threat-model.md; docs/runbooks/publication-failures.md; docs/qa/acceptance-matrix.md; CHANGELOG.md. Ao mudar requisito, atualizar doc mestre primeiro ou registrar divergência com pedido de aprovação.

### 20.5 Modelo de entrega de cada agente

Responder com: resumo do objetivo; requisitos do documento atendidos; arquivos alterados; decisões justificadas; matriz de testes (com comandos e resultados); validação visual com URLs/screenshots reais quando possível; riscos/pendências; próximos passos. Distinguir OK verificado de NÃO EXECUTADO e BLOQUEADO. Não ocultar teste falho, dependência crítica nem recurso impossível na API.

### 20.6 Contratos de UX que nenhum prompt pode descumprir

Manter compositores com preview visível/alternável, calendário legível, contraste, estados de erro, feedback de salvamento, navegação por teclado, CTA único por contexto, componentes e tokens da Seção 7. Não substituir fluxo editorial por gráficos chamativos. Não usar gradientes neon, glass em card de conteúdo, elementos 3D desnecessários, ícones de emojis, hover agressivo, cores arbitrárias por seção ou fontes ilegais.

## 21. RISCOS, HIPÓTESES E DECISÕES EM ABERTO

R01 Permissões do app Meta e revisão comercial: validar antes de prometer escalabilidade para clientes. R02 Compatibilidade Stories varia por modalidade/tipo de conta: capability check obrigatório. R03 Música nativa e sticker musical: não garantidos, fora do MVP até POC. R04 Edição automática da bio: não suportada no caminho oficial previsto. R05 Edição de posts já publicados: não assumir. R06 Hospedagem de mídia acessível para Meta: signed URLs com TTL e controle. R07 Resultado ambíguo de publicação: processo de reconciliação obrigatório. R08 Custos de storage/transcodificação e rate limits: medir no piloto. R09 Conformidade LGPD/uso comercial de música: análise antes de disponibilizar. R10 Disponibilidade do Google Docs aos agentes: planejar export/snapshot versionado.

D01 Nome do produto pendente: ‘Social Studio’ é placeholder. D02 Logo e marca final pendentes; não criar logo imitando Apple/Instagram. D03 Fluxo de aprovação V2 confirmado como direção, não como escopo mínimo. D04 Múltiplas redes futuras são intencionalidade arquitetural, mas apenas Instagram deve ter publisher implementado na primeira fase. D05 Paleta proposta poderá ser refinada em protótipo de alta fidelidade, porém alterações precisam atualizar tokens + Docs antes de serem aceitas.

## 22. GLOSSÁRIO OPERACIONAL

Workspace: ambiente isolado de empresa/cliente. Social Account: conta profissional conectada. Draft: rascunho editável sem publicação. Post: intenção editorial de publicar conteúdo. Media Asset: arquivo em storage. Publication Job: execução técnica do agendamento. Provider Container: objeto temporário da API Meta que prepara mídia. Publishing Adapter: camada que traduz nosso domínio para API específica. Capability Matrix: recursos oficialmente disponíveis para determinada conta e modalidade. Lease: bloqueio temporário de processamento de job. Reconciliation: verificação após resultado externo ambíguo. Idempotência: repetição segura sem duplicar efeito. RLS: segurança no nível de linhas do PostgreSQL. PRD: documento de requisitos de produto. Design Token: valor semântico reutilizável de design. CTA: ação principal do contexto.

## 23. FONTES, LASTRO E CONTROLE DE VERSÃO

Meta Content Publishing: https://developers.facebook.com/docs/instagram-platform/content-publishing/ ; coleção oficial Instagram API: https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api ; Meta for Developers: https://developers.facebook.com/ ; Apple HIG: https://developer.apple.com/design/human-interface-guidelines/ ; Apple Materials: https://developer.apple.com/design/human-interface-guidelines/materials ; skill Apple web: https://github.com/klaybloom/apple-web-design-skill ; UI UX Pro Max: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill ; Playwright MCP: https://github.com/microsoft/playwright-mcp . Este documento usa essas fontes como ponto de partida; equipe deve revalidar API, escopos, limites e requisitos na data da implementação.

CHANGELOG do documento — v1.0 (06/11/2026): briefing completo, priorização V1–V3, jornadas, mapa de telas, design system Apple-inspired com tokens de light/dark, contratos de backend/banco, scheduler resiliente, integração Meta, n8n, testes, segurança, rollout, regras para Codex/Cursor e riscos explicitados. Próxima revisão: após primeira POC OAuth + publicação Reel em staging.

FIM DA ESPECIFICAÇÃO MESTRE — O documento é uma referência de produto e desenvolvimento, não comprovação de aplicação existente. Para cada recurso, preservar distinção entre PLANEJADO, IMPLEMENTADO, TESTADO e PUBLICADO.

Direção visual da Visão Geral · 06/11/2026

O redesign da Visão Geral adota cartões brancos, superfícies cinza-claro, navegação ativa grafite e laranja nos destaques, barras e progresso. No desktop, a composição usa frame centralizado, navegação superior em cápsula e rail compacto. A primeira linha reúne alcance, quatro KPIs e gráfico. A segunda reúne consistência editorial, conteúdos em destaque e atividade. Em telas estreitas, os cartões se empilham e as atividades viram uma lista. Esta direção visual prevalece sobre a paleta azul anterior para a Visão Geral e seu shell compartilhado. As regras de negócio, segurança, integração e publicação seguem os contratos existentes.
