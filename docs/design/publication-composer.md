# Compositor de publicações

A ação **Nova publicação** da Agenda abre um diálogo compartilhado. No modo Dia, os botões de horário também abrem o diálogo com a data e a hora preenchidas. O escopo da Agenda sugere cliente e conta apenas quando pertencem ao workspace demonstrativo.

1. **Rede social** — somente Instagram demonstrativo é selecionável. Sem `demo=1`, todas as plataformas ficam indisponíveis até existir um adaptador autorizado.
2. **Cliente e conta** — os seletores usam o mesmo escopo da Agenda. Mudar cliente limpa a conta, e a revisão revalida o vínculo. O botão Confirmar e continuar confirma o destino explicitamente.
3. **Formato e categoria** — Feed, Carrossel, Reel e Story reutilizam cores e ícones existentes. Categoria é metadado opcional e independente.
4. **Criação** — arquivos locais, remoção e reordenação, legenda com contador e prévia por mídia. Os limites de tipo, quantidade e tamanho pertencem à demonstração; não são uma matriz de compatibilidade da Meta. A prévia não representa exatamente a interface do Instagram.
5. **Programação** — rascunho local ou agendamento de teste. Mês e ano são selecionados separadamente. A data e a hora são interpretadas em `America/Sao_Paulo`, comparadas ao relógio da demonstração e convertidas em um instante UTC. Horários ambíguos ou inexistentes são rejeitados.
6. **Revisão** — destino, formato, categoria, mídias, legenda e programação são revisados antes da ação. O envio local bloqueia cliques concorrentes e a ocorrência de teste é deduplicada por identificador.

O modal usa Geist, tokens do Social Studio, seis segmentos de progresso, largura adaptativa e uma única região de rolagem. A navegação conserva os campos, restaura foco ao fechar e respeita movimento reduzido. O navegador guarda um rascunho de demonstração por workspace no IndexedDB, incluindo os arquivos, e permite retomada ou descarte. O agendamento de teste existe apenas na sessão da Agenda e na mesma fonte em memória do widget Posts programados; nenhum worker, upload, evento de publicação ou dado de analytics é acionado.

Para produção, habilite apenas as capacidades confirmadas pelo adaptador Meta versionado. Valide sessão, workspace, papel, destino e mídia no servidor antes de cada mutação. Use armazenamento privado, processamento de mídia, idempotência e fila durável. Preserve o rascunho em erros e informe sucesso apenas após confirmação persistida. Publicar agora, biblioteca remota, capas e opções avançadas não estão disponíveis nesta prévia.

Validação local: `npm run test:composer`. Esta página também prepara a seção para o documento mestre remoto.
