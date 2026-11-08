# Rolagem e layout

O App Shell tem altura útil de 100dvh menos as margens e duas colunas no desktop. A sidebar ocupa a primeira coluna e o ContentViewport (.workspace) ocupa a segunda. O documento e a moldura não rolam. Em telas estreitas, a sidebar ocupa a primeira linha e o ContentViewport fica na segunda. A rolagem continua nativa em ambos os casos.

Use scroll-region apenas em regiões com rolagem interna legítima. Na sidebar, somente a navegação pode rolar quando faltar altura. Em Posts programados, só a lista rola. O cabeçalho e o link da agenda ficam fora dela. Tabela e heatmap podem rolar horizontalmente. Popovers e diálogos mantêm rolagem nativa, inclusive nas listas de opções.

O indicador laranja #F47745 tem 1,5 px e trilho transparente. ContentViewport e navegação usam a mesma camada sincronizada para ponteiro fino e cores normais. A medida proporcional é altura visível ao quadrado dividida pela altura total, com mínimo de 24 px. O deslocamento segue a fração percorrida e a zona de arraste tem 12 px. O indicador entra em 160 ms e sai em 280 ms após 650 ms de inatividade. Sem overflow, fica oculto. As demais regiões usam barra nativa fina com a mesma cor. Em ponteiro grosso e cores forçadas, o navegador controla a barra. Reduced motion remove as transições.

O ContentViewport usa degradês de 24 px com a cor da superfície, separados do indicador. Cada borda só mostra o efeito quando há conteúdo além dela. Os degradês não recebem eventos. Posts programados conserva seus degradês independentes e o rodapé em cápsula. A lista é uma exceção visual: mantém rolagem nativa com a barra oculta.

Valide rolagem por teclado e toque, zoom, topo e fim da página, temas claro e escuro e sidebar expandida e recolhida. Confira HD, Full HD, ultrawide e celular, com conteúdo suficiente para ativar as barras internas.
