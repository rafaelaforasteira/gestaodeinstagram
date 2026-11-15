# Métricas do Instagram (API de Insights da Meta) usadas na tela Desempenho

Levantamento de 15/11/2026, feito por busca nas páginas oficiais da Meta (o acesso direto a developers.facebook.com estava bloqueado na rede do ambiente). Antes da integração real, confirmar cada nome, `period`, `metric_type` e `breakdown` na versão da API fixada em `META_GRAPH_API_VERSION` (spec-master §11.4).

Legenda de status: **confirmado** (aparece na documentação ou changelog oficial consultado), **a validar** (citado por fontes secundárias ou não encontrado).

## Conta (IG User insights)

| Tela | Métrica da API | Observações | Status |
|---|---|---|---|
| Visualizações | `views` | Substitui `impressions` (descontinuada na v22). Quebras por `follow_type` e `media_product_type` alimentam "Seguidores e não seguidores" e "Por tipo de conteúdo". | confirmado (métrica); quebras a validar |
| Contas alcançadas | `reach` | Pessoas únicas por conta. Não somar como pessoas únicas entre contas. | confirmado |
| Contas com engajamento | `accounts_engaged` | Inclui conteúdo impulsionado. | a validar |
| Interações | `total_interactions` + `likes`, `comments`, `saves`, `shares`, `replies`, `reposts` | `reposts` entrou no changelog de 2026. | a validar (nível conta) |
| Seguidores ganhos/perdidos | `follows_and_unfollows` (`follow_type`) | Só para contas com 100+ seguidores. | a validar |
| Novos seguidores por dia | `follower_count` | Só para contas com 100+ seguidores. | confirmado |
| Toques em links do perfil | `profile_links_taps` | Os antigos `website_clicks`, `email_contacts` e similares foram descontinuados. | a validar |
| Público (idade, gênero, cidade, país) | `follower_demographics`, `reached_audience_demographics`, `engaged_audience_demographics` | 100+ seguidores; uma conta por vez; nunca somar entre contas. | a validar |
| Horários online | `online_followers` | | a validar |

## Publicação (IG Media insights)

| Tela | Métrica da API | Formatos | Status |
|---|---|---|---|
| Alcance | `reach` | todos | confirmado |
| Visualizações | `views` | todos (substitui `impressions`, `plays`, `video_views`) | confirmado |
| Curtidas, comentários, salvamentos, compartilhamentos | `likes`, `comments`, `saved`, `shares` | Posts e Reels | confirmado |
| Interações | `total_interactions` | todos | confirmado |
| Visitas ao perfil | `profile_visits` | Posts e Stories | confirmado |
| Novos seguidores | `follows` | Posts e Reels | a validar |
| Tempo médio assistido | `ig_reels_avg_watch_time` | Reels | confirmado |
| Navegação (avançou, voltou, saiu) | `navigation` (`story_navigation_action_type`) | Stories | confirmado |
| Respostas | `replies` | Stories | a validar |

## Descontinuadas (não exibir)

`impressions`, `plays`, `video_views`, `clips_replays_count`, `ig_reels_aggregated_all_plays_count` e, na conta, `profile_views`, `website_clicks`, `email_contacts`, `phone_call_clicks`, `text_message_clicks`, `get_directions_clicks`.

## Regras da tela

- Stories ficam disponíveis por 24 horas na API: o histórico exige coleta enquanto o Story está no ar.
- Valores da demonstração são fictícios e saem da mesma base da Visão Geral, para os totais coincidirem.
- Métricas a validar aparecem com o selo "A validar" até a confirmação.

Fontes consultadas: [Insights](https://developers.facebook.com/docs/instagram-platform/insights/), [IG Media insights](https://developers.facebook.com/documentation/instagram-platform/reference/instagram-media/insights), [Changelog](https://developers.facebook.com/documentation/instagram-platform/changelog), [Graph API v22](https://developers.facebook.com/docs/graph-api/changelog/version22.0/).
