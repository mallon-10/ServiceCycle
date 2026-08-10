# Oferta — Linha de Produtos ServiceCycle

## Linha de produtos
Plataforma única de gestão do ciclo de vida de ativos, com os módulos descritos em `metodo.md` (gestão de ativos, regras inteligentes, agenda automática, Ordem de Serviço, portal do cliente, IA fase futura, pós-venda inteligente). Não há hoje linha segmentada por plano/pacote de módulos — **não inventar** pacotes até serem definidos.

## Arquitetura e integrações
O ServiceCycle **não pretende substituir o ERP** — fica entre o ERP e o usuário:

```
ERP → API → ServiceCycle → Inteligência → ERP
```

Pode integrar com: Tiny, Omie, Bling, SAP, TOTVS, Senior, Salesforce, Pipedrive, HubSpot, RD Station, e APIs próprias. Quanto menos dados precisarem ser digitados novamente pelo cliente, melhor — esse é o princípio orientador da integração.

**Nenhuma integração está confirmada como já construída** — tratar como roadmap de integrações-alvo até confirmação do usuário.

## Política de preço / Modelo de cobrança
Preferencialmente **não cobrar por usuário**. Dois modelos candidatos, ainda não decididos entre si — **confirmar com o usuário qual foi escolhido antes de usar em material externo**:

1. **Por ativos monitorados**, em faixas:
   - Até 300 ativos
   - Até 1.000 ativos
   - Até 5.000 ativos
   - Acima disso → Enterprise
   (Valores em R$ de cada faixa: **ainda não definidos**.)

2. **Por equipamentos instalados** — quanto mais equipamentos o cliente vende, maior a mensalidade. Esse modelo acompanha naturalmente o crescimento da empresa cliente.

**[INFERÊNCIA ESTRATÉGICA — validar com usuário]** Pesquisa de mercado (2026) mostra que a maioria dos concorrentes diretos e adjacentes (Auvo, OSApp, e os líderes internacionais de CMMS como Fiix) cobra **por usuário/técnico**, não por ativo. Isso torna "cobrança por ativo monitorado" um diferencial de posicionamento real e defensável para o ServiceCycle — vale usar isso explicitamente como argumento de venda ("você não paga mais por colocar mais gente pra vender ou fazer manutenção — só quando a base de ativos cresce de verdade"), não só como detalhe de pricing. Faixa de referência observada no mercado de CMMS por ativo: US$ 2–15/ativo/mês (fonte: mx.opexcg.com/blog/en/cmms-pricing-models) — **não é benchmark direto de mercado brasileiro nem deve virar preço do ServiceCycle sem validação**, é só ordem de grandeza para calibrar a conversa de pricing.

**Risco a monitorar no modelo por ativo** (achado de pesquisa, relevante para desenho comercial): auditorias de descoberta em CMMS costumam revelar 2–3x mais ativos do que o cliente estimava no fechamento do contrato, o que pode gerar atrito comercial se a cobrança escalar sem aviso (fonte: fabrico.io/blog/cmms-software-pricing-guide-2026). Vale considerar, no desenho comercial, alguma forma de contagem/confirmação de ativos na etapa de onboarding — decisão de produto, não algo para afirmar como já resolvido em material de venda.

## Garantia e assistência técnica
**[A PREENCHER — nenhum SLA real foi definido pelo usuário ainda]**

Como referência de mercado para quando isso for definido (não usar em material publicado até o usuário confirmar os números reais do ServiceCycle):
- Padrão de uptime em SaaS B2B operacionalmente crítico gira em 99,9% (~8h de indisponibilidade tolerável por ano).
- SLA costuma ter 4 partes: meta de uptime, tempo de resposta por severidade, compensação por descumprimento (créditos), e exclusões (manutenção programada, força maior).
- Tempo de resposta comum: suporte "8x5" (dia útil, horário comercial) como base, com primeira resposta em 1–4h conforme severidade — 24/7 costuma ser upsell de plano maior/Enterprise.
(fonte: legalsuite.com.br/blog/emp-contrato-saas-clausulas-chave; plain.com/blog/customer-support-slas-b2b-saas-2026)

## Contato oficial
[A PREENCHER — produto ainda não tem site, e-mail comercial nem telefone confirmados]

## Objeções específicas por linha de produto
Ainda não há linha de produto segmentada (ver "Linha de produtos" acima), então não há objeção por linha ainda. Objeção mais provável, por analogia ao que reviews reais levantam contra Auvo/OSApp (falta de profundidade em gestão de ativo, dependência de controle manual apesar do software) é o inverso: cliente pode perguntar "isso não é o que meu ERP/sistema de OS já faz?" — resposta já está estruturada em `posicionamento.md` (argumento de camada, ERP/OS administra o serviço, ServiceCycle administra o ciclo de vida do ativo).

## Como isso deve orientar o trabalho
- Nunca afirmar valor de faixa/plano em R$ até confirmado pelo usuário — usar linguagem que não comprometa número (ex: "modelo por volume de ativos monitorados", sem citar preço).
- Não apresentar as integrações como já disponíveis/testadas sem confirmação — são integrações-alvo da arquitetura.
- Ao descrever cobrança, sempre reforçar que o modelo não penaliza a empresa por ter mais usuários/vendedores usando o sistema — isso responde à filosofia de "não aumentar trabalho, aumentar receita" (ver `metodo.md`).
