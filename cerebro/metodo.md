# Método — Como o ServiceCycle Trabalha

## Conceito principal
O foco não é o cliente. O foco não é a OS. **O foco é o ATIVO.**

Cada ativo possui: fabricante, modelo, número de série, data de instalação, garantia, proprietário, localização, histórico completo, documentos, fotos, peças, vida útil, revisões, manutenções e trocas realizadas. O ativo acompanha toda a sua vida útil.

## Processo (fluxo do sistema)
1. Venda realizada.
2. ERP cria o equipamento.
3. ServiceCycle recebe os dados via API.
4. Cria automaticamente o ativo.
5. Aplica regras de manutenção.
6. Agenda futuras revisões.
7. Na chegada da data: cria oportunidade e notifica a empresa.
8. Envia WhatsApp ao cliente.
9. Agenda visita.
10. Técnico executa o serviço.
11. Histórico é atualizado.
12. Nova manutenção é automaticamente criada — reinicia o ciclo.

## Módulos
- **Gestão de ativos**: cadastro automático, histórico, fotos, documentos, garantias, peças, número de série, localização.
- **Regras inteligentes**: cada equipamento possui regras configuráveis (ex: filtro → 180 dias; óleo → 500 horas; correia → 24 meses).
- **Agenda automática**: cria automaticamente próximas manutenções, inspeções, revisões e oportunidades comerciais.
- **Ordem de Serviço**: recebimento, checklist, fotos, vídeos, assinatura, conclusão — tudo pelo celular.
- **Portal do cliente**: cliente visualiza histórico, manutenções, garantias, documentos, equipamentos e próximas revisões.
- **IA (fase futura)**: aprende quando determinado equipamento costuma falhar, quando clientes costumam atrasar manutenção, quais peças apresentam maior desgaste e qual modelo possui maior índice de problemas — depois recomenda antecipações.
- **Pós-venda inteligente** (módulo principal): identifica oportunidades, gera orçamento, cria tarefas, envia WhatsApp, envia e-mail, lembra o vendedor, cria follow-up — tudo automaticamente.

## Diferenciais
- **Trabalha inteligência, não só datas.** Exemplo: troca de filtro normalmente seria fixada em 180 dias — mas o sistema pode considerar fabricante, modelo, tipo de equipamento, cidade, ambiente, indústria, poeira, temperatura, horas de uso e histórico do equipamento. No futuro, a IA aprende padrões e ajusta automaticamente os períodos ideais.
- **Não substitui o ERP — fica entre o ERP e o usuário**, agregando uma camada de inteligência sobre dados que já existem (ver arquitetura em `oferta.md`).

## Filosofia do produto
O cliente **NÃO pode sentir que ganhou mais trabalho**. O software deve: aproveitar informações existentes, integrar automaticamente, eliminar preenchimentos, reduzir tarefas administrativas, trabalhar em segundo plano. Quanto mais invisível for, melhor.

## Por que funciona
**[INFERÊNCIA ESTRATÉGICA — validar com usuário]**
- Gera confiança e retenção: cliente final recebe lembrete/visita antes de o equipamento falhar, em vez de precisar ligar reclamando — isso é o mesmo mecanismo que sustenta o discurso de "reduzir downtime não planejado" usado com sucesso pela categoria CMMS internacional (dado de mercado: até 82% das empresas já sofreram parada não planejada, e cada manutenção preventiva perdida aumenta a chance de falha; fonte: upkeep.com/learning/facts-about-downtime, limblecmms.com/learn/cmms/reporting).
- Gera receita sem depender de esforço comercial ativo: como o gatilho de oportunidade nasce do próprio ativo (regra de manutenção vencendo), a empresa para de depender de vendedor lembrar de oferecer — o pós-venda deixa de ser tarefa humana e vira consequência automática do ciclo de vida do ativo.
- Funciona porque ataca a causa, não o sintoma: enquanto Auvo/OSApp otimizam a execução do serviço (uma vez que ele já foi lembrado/agendado), o ServiceCycle ataca a etapa anterior — garantir que o serviço seja lembrado e ofertado no momento certo. É estruturalmente mais difícil de copiar por um concorrente de field service, porque exigiria reconstruir o produto em torno do ativo, não da OS.

## Como isso deve orientar o trabalho
- Sempre que o material explicar "o que o sistema faz", ancorar no ativo como unidade central — não no cliente, não na OS. Isso é o que diferencia estruturalmente o ServiceCycle.
- Reforçar a filosofia de invisibilidade em qualquer peça que descreva o uso do produto no dia a dia — o ganho é automação em segundo plano, não uma tela nova pra preencher.
- Não descrever a camada de IA como já funcionando — é fase futura do roadmap. Tratar como visão de produto, não capacidade atual, até confirmação do usuário.
