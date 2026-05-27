#Code Review - Comentários Inseridos

#_classes/modules/eco.js: 135-139
🐛 Bug identificado: função money.set sobrescrita incorretamente 
Em eco.js, linhas 165 e 169, o método money.set é declarado duas vezes. A segunda declaração sobrescreve silenciosamente a primeira, e sua implementação está errada — em vez de persistir o valor em players.money, ela grava em players.points. Impacto do bug:
Qualquer chamada a money.set(user_id, valor) nunca atualiza o saldo em dinheiro do jogador — ela modifica os pontos. Isso pode causar corrupção silenciosa de dados econômicos, já que nenhum erro é lançado.
📌 Correção sugerida:
Remover a segunda declaração inteiramente. A primeira já cobre o comportamento esperado com as tratativas de parseInt e Math.round. 

#classes/packages/api.js: 95
🔍 CodeSmell identificado: Nome de variável confuso e vazamento de escopo
Em api.js, linha 95, a variável `xii` é utilizada como índice de loop sem ser declarada com `let` ou `var`. Impacto do code smell:
O nome `xii` não possui semântica clara com o propósito de iterar propriedades do objeto e seu uso sem palavra-chave causa vazamento no escopo global.
📌 Correção sugerida:
Renomear a variável para `i` ou `index` e adicionar a declaração `let`.


#_classes/api.js: 8-42
⚠️ Falha de arquitetura identificada: God Object (Objeto Deus) centralizador
Em api.js, o objeto global `API` centraliza utilitários diversos, consultas de banco de dados, lógica de negócios, componentes de layout do Discord e estado global. Impacto do problema:
Isso viola o Princípio da Responsabilidade Única (SRP), gera acoplamento extremo em todo o projeto, impede a criação de testes unitários isolados e torna a manutenção e escalabilidade extremamente complexas.
📌 Correção sugerida:
Decompor o objeto `API` em módulos menores e especializados, tais como `dateUtils`, `formattingUtils`, `discordUIHelper` e `economyService`.

#_classes/api.js: 209-217
🐛 Bug / Vulnerabilidade de arquitetura identificada: SQL Injection por concatenação direta de parâmetro de coluna
Em api.js, na função `API.setCompanieInfo`, o parâmetro `string` (que representa a coluna da tabela) é concatenado diretamente na query SQL (`UPDATE companies SET ${string} = $3...`). Impacto da vulnerabilidade:
Se qualquer entrada de usuário for repassada direta ou indiretamente para esta função, ela permitirá a execução de comandos SQL arbitrários, resultando em potencial vazamento, alteração ou corrupção de dados.
📌 Correção sugerida:
Validar o nome da coluna contra uma lista permitida (whitelist) antes de executar a query, ou utilizar um mapeamento objeto-relacional (ORM).

#_classes/modules/events.js: 47-51
🔍 CodeSmell identificado: Variáveis com nomes genéricos e confusos (inv, inv2, inv3, inv4)
Em events.js, linhas 47 a 51, as variáveis `inv`, `inv2`, `inv3` e `inv4` são declaradas para armazenar emojis de preenchimento invisíveis para a formatação da pista de corrida. Impacto do code smell:
Nomes genéricos e codificados por números sequenciais reduzem a legibilidade do código e tornam confuso o propósito de cada emoji no traçado.
📌 Correção sugerida:
Renomear as variáveis para termos descritivos de acordo com sua função na pista (ex: `spacerOrange`, `spacerRed`, `spacerPurple`, `spacerTrack`).


#_classes/modules/events.js: 80-97, 220-237
🔍 CodeSmell identificado: Estrutura switch duplicada
Em events.js, a lógica para mapear o cavalo vencedor para seu respectivo emoji, cor e nome está duplicada nos dois blocos switch. Impacto do code smell:
Viola o princípio DRY (Don't Repeat Yourself), dificultando a manutenção. Alterações na lógica de cores ou cavalos exigirão atualizações paralelas em múltiplos lugares.
📌 Correção sugerida:
Refatorar a tradução de vencedor em uma função auxiliar ou objeto de mapeamento centralizado.

#_classes/modules/events.js: 116-120
⚠️ Falha de arquitetura identificada: Falta de separação de camadas no envio de alertas
Em events.js, na função `events.alert`, a lógica de negócios e agendamento de eventos manipula diretamente objetos de apresentação visual do Discord (`MessageEmbed`) e entrega de mensagens (`API.client.channels...`). Impacto do problema:
Alto acoplamento com o framework do Discord, impedindo testes isolados da lógica de eventos e impossibilitando o reaproveitamento do código em outras interfaces.
📌 Correção sugerida:
Delegar o envio de notificações para um serviço abstrato de alertas/notificações e isolar a criação de visualização do Discord.

#_classes/modules/events.js: 124, 282-285
🔍 CodeSmell identificado: Bloco catch vazio
Em events.js, nas linhas 124 e 282-285, exceções e rejeições de Promise são descartadas silenciosamente no bloco `catch`. Impacto do code smell:
Erros na busca de canais ou exclusão de mensagens são ignorados silenciosamente, dificultando o rastreamento, diagnóstico e correção de falhas em produção.
📌 Correção sugerida:
Adicionar tratamento adequado, logar o erro no console ou emitir um evento (ex: `console.error(err)` ou `API.client.emit('error', err)`).

#_classes/modules/events.js: 258
🔍 CodeSmell identificado: Mutação de objeto compartilhado por cópia de referência direta
Em events.js, linha 258, o código executa `let globalevents2 = globalevents` e então altera suas propriedades diretamente com `delete`. Impacto do code smell:
Em JavaScript, objetos são copiados por referência. Deletar uma propriedade de `globalevents2` modifica diretamente o cache global compartilhado original `globalevents`, podendo causar erros colaterais em outras partes do sistema.
📌 Correção sugerida:
Clonar o objeto antes de realizar qualquer exclusão de propriedade (ex: `let globalevents2 = { ...globalevents }`).

#_classes/modules/events.js: 271
🔍 CodeSmell identificado: Temporizador estático com setInterval
Em events.js, o intervalo de eventos `intervalEvents` é calculado apenas uma vez ao carregar o bot e repassado para o `setInterval`. Impacto do code smell:
O intervalo entre eventos torna-se estático e imutável durante toda a execução do bot, frustrando o objetivo original de possuir um agendamento dinâmico e aleatório de eventos.
📌 Correção sugerida:
Utilizar um padrão de `setTimeout` recursivo que calcula uma nova duração aleatória a cada execução do evento.

#commands/_owner/seetables.js: 25, 31
🐛 Bug / Vulnerabilidade identificada: SQL Injection direto por interpolação de parâmetro vindo do input do usuário (`selectedtable`)
Em seetables.js, linhas 25 e 31, o parâmetro fornecido pelo usuário é interpolado diretamente na query SQL (`SELECT EXISTS... AND tablename = '${selectedtable}'`). Impacto da vulnerabilidade:
Permite a execução de comandos SQL arbitrários se caracteres maliciosos forem fornecidos, possibilitando a leitura não autorizada ou destruição de tabelas do banco de dados.
📌 Correção sugerida:
Substituir a interpolação por queries parametrizadas fornecidas pela biblioteca pg do PostgreSQL (ex: `DatabaseManager.query('SELECT EXISTS(...) WHERE tablename = $1', [selectedtable])`).


#commands/companies/2opencompany.js: 67-76
🔍 CodeSmell identificado: Nomes de variáveis genéricos, crípticos ou com numeração sequencial (r1, r2, r3, r4, c1, playerobj, playerobj2)
Em 2opencompany.js, as constantes de custos contratuais recebem nomes crípticos (`r1`, `r2`, `r3`, `r4`, `c1`) e as instâncias de tabelas do banco recebem nomes numéricos sequenciais (`playerobj`, `playerobj2`). Impacto do code smell:
Prejudica gravemente a legibilidade e a semântica do código, forçando quem lê a deduzir o que cada número financeiro ou entidade representa pelo contexto geral.
📌 Correção sugerida:
Renomear as variáveis para termos autoexplicativos como `contractCommitment`, `contractCompensation`, `crystalCost`, `playerMachines` e `playerData`.

#commands/companies/2opencompany.js: 155-161
⚠️ Falha de arquitetura identificada: Consulta ao banco ineficiente e falta de encapsulamento de dados (SELECT *)
Em 2opencompany.js, linhas 155 a 161, a query `SELECT * FROM companies;` é disparada para carregar todas as empresas cadastradas no banco de dados na memória do Node.js, apenas para realizar uma busca sequencial por nome duplicado em Javascript. Impacto da falha:
Falta de separação de responsabilidades (executando SQL cru diretamente na apresentação) combinada com péssima performance de consulta. À medida que o banco crescer, essa operação causará lentidão extrema, desperdício de rede e potencial estouro de memória no servidor.
📌 Correção sugerida:
Delegar a filtragem para o banco de dados usando cláusula WHERE (ex: `SELECT 1 FROM companies WHERE LOWER(name) = LOWER($1) LIMIT 1;`), encapsulando a chamada numa camada de repositório.

#commands/social/ranking.js: 6, 145-147
🔍 CodeSmell identificado: Variáveis com nomes genéricos e confusos (vare, var1, var2)
Em ranking.js, a configuração das categorias de ranking é nomeada como `vare` e as fatias de botões do painel são chamadas de `var1` e `var2`. Impacto do code smell:
Nomes sem significado dificultam a compreensão das regras de negócio do ranking e o funcionamento da paginação de componentes visuais do Discord.
📌 Correção sugerida:
Renomear `vare` para `rankingConfig` ou `rankingCategories`, e `var1` e `var2` para `startIndex` e `endIndex`.

#commands/social/ranking.js: 81-100
⚠️ Falha de arquitetura identificada: Caching e agendamento de jobs implementados diretamente na camada de comando
Em ranking.js, um temporizador (`setInterval`) e a lista local de ranking em memória são declarados no escopo do arquivo do comando. Impacto da falha:
Fortíssimo acoplamento de infraestrutura no manipulador de comandos. Se o comando for carregado mais de uma vez ou reiniciado pelo bot, múltiplos loops paralelos e concorrentes consultarão o banco de dados desnecessariamente, gerando vazamento de conexões e processamento redundante.
📌 Correção sugerida:
Abstrair a lógica de caching e o loop periódico de atualização para um serviço centralizado (ex: `RankingService` ou `CacheManager`).


#commands/others/help.js: 57-58
🔍 CodeSmell identificado: Variáveis de fatiamento com nomes genéricos (var1, var2)
Em help.js, linhas 57 e 58, as variáveis para delimitar fatias do array de botões são nomeadas como `var1` e `var2`. Impacto do code smell:
Prejudica a clareza conceitual de paginação visual.
📌 Correção sugerida:
Renomear para `startIndex` e `endIndex`.

#commands/jobs/landplot.js: 15, 312, 361
🔍 CodeSmell identificado: Nome de variáveis abreviados, numéricos ou mistos (pobj, pobj2, rend)
Em landplot.js, os dados do jogador/máquinas e o histórico de rendimentos da empresa usam nomes abreviados de forma confusa. Impacto do code smell:
Reduz a legibilidade do código e oculta a semântica dos tipos de dados envolvidos.
📌 Correção sugerida:
Renomear para `playerData`, `machineData` e `revenue` (ou `income`).


#commands/jobs/landplot.js: 250
🔍 CodeSmell identificado: Variável 'reacted' inicializada/atribuída fora de seu escopo original de declaração
Em landplot.js, na linha 250, a variável `reacted = true` é atribuída no collector, mas sua declaração com `let` está presente apenas no bloco da ramificação `if (!hasTerrain...)`. Impacto do code smell:
Na ramificação `else`, a variável `reacted` não existe no escopo, fazendo com que sua atribuição gere vazamento para o escopo global ou lance um erro.
📌 Correção sugerida:
Declarar a variável `reacted` no topo do escopo da função principal `execute`.

#commands/jobs/startprocess.js: 22, 31
🔍 CodeSmell identificado: Sufixos de tipo de dados e nomes genéricos (processjson, defaultjson)
Em startprocess.js, linhas 22 e 31, os dados de processamento são atribuídos a variáveis que usam o sufixo 'json'. Impacto do code smell:
Inserir o tipo primitivo da variável em seu nome reduz a expressividade de negócios e cria problemas de manutenção se o tipo de dados mudar.
📌 Correção sugerida:
Renomear para `processConfig` e `defaultProcessState`.


#commands/jobs/startprocess.js: 180
🐛 Bug / CodeSmell identificado: Condição de loop inválida 'processjson.in.length+processjson.in.length' gerando loop infinito
Em startprocess.js, linha 180, a expressão `processjson.in.length+processjson.in.length` é utilizada como condição de parada do loop. Impacto do bug:
Se o array contiver elementos, a soma de suas extensões resultará em um número positivo fixo, que é avaliado como verdadeiro em Javascript. Isso causa um loop infinito travando a thread principal do bot e o uso de `i` sem palavra-chave declarativa vaza a variável para o escopo global.
📌 Correção sugerida:
Alterar a condição para algo delimitado como `i <= processjson.in.length + 1` e declarar o índice com `let`.

#commands/jobs/process.js: 54, 55
🐛 Bug / ReferenceError identificado: Variáveis 'member' e 'jobs' usadas sem definição
Em process.js, linhas 54 e 55, o código tenta executar `waiting.remove(member.id)` e `jobs.process.remove(member.id)` no bloco de falha de durabilidade. Impacto do bug:
As variáveis `member` e `jobs` não estão declaradas ou importadas neste arquivo, lançando uma exceção de `ReferenceError` e travando a execução do comando caso as ferramentas fiquem sem recursos.
📌 Correção sugerida:
Substituir `member` por `interaction.user` e importar/declarar corretamente o handler `jobs`.

#commands/jobs/process.js: 64, 94, 165, 175
🔍 CodeSmell identificado: Variáveis de loop 'i', 'iil' e 'x' inicializadas sem declaração (let/const/var) e typo redundante
Em process.js, as variáveis de iteração são usadas sem declaração e a linha 165 contém o caractere '1' solto após a abertura do bloco. Impacto do code smell:
Poluição de escopo global e presença de instruções órfãs redundantes que prejudicam a legibilidade.
📌 Correção sugerida:
Declarar as variáveis de loop com `let` e remover o caractere '1' extra.


#commands/jobs/process.js: 327
🐛 Bug identificado: Acesso à propriedade inexistente 'oldproc.xpbase'
Em process.js, linha 327, o código tenta obter `oldproc.xpbase` para executar a entrega de exp. Impacto do bug:
O objeto de processo criado em `startprocess.js` armazena a propriedade com o nome `xp`, fazendo com que `oldproc.xpbase` seja avaliado como `undefined`, concedendo XP nulo ou incorreto ao jogador.
📌 Correção sugerida:
Alterar o acesso para a propriedade correta de acordo com o esquema (`oldproc.xp`).

#commands/jobs/bgetrod.js: 15, 30, 48, 67
🔍 CodeSmell identificado: Abreviações crípticas, idioma misto e numeração sequencial de variáveis (pobj2, pobj3, disp, pobjcheck)
Em bgetrod.js, o código utiliza abreviações de tabelas de forma genérica e mistura português/inglês nos termos de controle (`disp`). Impacto do code smell:
Reduz drasticamente a legibilidade e manutenibilidade do arquivo.
📌 Correção sugerida:
Substituir por nomes claros e em um único idioma como `playerMachines`, `playerDataToCheck`, `availableRods`.


#commands/jobs/bgetrod.js: 114
🐛 Bug / Conflito de escopo identificado: Shadowing de variável causador de bug lógico em listener
Em bgetrod.js, a variável `pobj2` é declarada no escopo principal do comando para receber a tabela `machines`. No callback `collect`, outra variável local também nomeada `pobj2` é criada para ler a tabela `players`. Impacto do bug:
No listener `end`, o código tenta ler `pobj2.rod`. Como a declaração interna do callback não é visível no listener, o código usa a variável do escopo externo (`machines`), onde o campo `rod` não existe (`undefined`). Isso faz com que a mensagem final exiba sempre o texto padrão "comprar uma", ignorando se o jogador já possuía uma vara.
📌 Correção sugerida:
Remover o sombreamento utilizando nomes distintos e autoexplicativos para cada objeto (ex: `playerMachines` e `playerData`).

#commands/jobs/bfish.js: 53-54, 256, 262
🔍 CodeSmell identificado: Nomes de variáveis confusos e com semânticas invertidas (body, header, cclist, ccmap)
Em bfish.js, o retorno das camadas da pescaria é chamado de `body` e `header` (conceito de layout invertido) e as fatias/textos de peixes usam abreviações como `cclist` e `ccmap`. Impacto do code smell:
Cria confusão mental durante a leitura do fluxo lógico da pescaria de peixes.
📌 Correção sugerida:
Renomear para `waterLayers`, `fishingState`, `collectedFishList` e `collectedFishString` respectivamente.

#commands/games/flip.js: 152
🔍 CodeSmell identificado: Abreviação críptica de variável (rd)
Em flip.js, linha 152, a rolagem de números aleatórios é salva na constante `rd`. Impacto do code smell:
Dificulta o entendimento imediato sobre a geração do resultado da moeda.
📌 Correção sugerida:
Renomear para `randomRoll` ou `coinFlipResult`.

#commands/companies/3sectors.js: 40
🐛 Bug / CodeSmell identificado: Chamada incorreta `sector.tipo+toString()` concatenando com a função global `toString()`
Em 3sectors.js, na linha 40, o código tenta chamar a função `toString()` omitindo o caractere de ponto `.` após `sector.tipo`. Impacto do bug:
Isso faz com que o interpretador chame a função global `toString()` (que retorna "[object global]" ou similar no Node.js) e a concatene com o número de `sector.tipo`, gerando IDs de botão corrompidos como "1[object global]".
📌 Correção sugerida:
Substituir por `sector.tipo.toString()`.

#commands/companies/3sectors.js: 53-54
🔍 CodeSmell identificado: Variáveis de fatiamento com nomes genéricos (var1, var2)
Em 3sectors.js, fatias de array de botões recebem os nomes de `var1` e `var2`. Impacto do code smell:
Falta de clareza semântica sobre os limites da partição visual.
📌 Correção sugerida:
Renomear para `startIndex` e `endIndex`.

#commands/machines/mine.js: 10-11
⚠️ Falha de arquitetura identificada: Acoplamento excessivo e falta de camadas de abstração
Em mine.js, o método `execute` de um único comando concentra lógica de apresentação (Discord Embeds, botões), lógica de negócios complexa (simulação física de desgaste de peças, refrigeração, pressão e geração de minérios) e acesso/gravação direta no banco de dados — tudo em ~430 linhas. Impacto do problema:
Viola o Princípio da Responsabilidade Única (SRP), torna o código impossível de testar unitariamente e impede o reaproveitamento da lógica de simulação da máquina em outros contextos (ex: processos automáticos, eventos).
📌 Correção sugerida:
Extrair a lógica física de simulação para um serviço dedicado (ex: `MachineSimulationService`) e a lógica de manutenção para um `MaintenanceService`, mantendo no comando apenas a orquestração da UI do Discord.


#commands/machines/mine.js: 76, 150
🔍 CodeSmell identificado: Verificação de null duplicada para `slots`
Em mine.js, a expressão `slots == null ? [] : slots` é repetida nas linhas 76 e 150, violando o princípio DRY. Impacto do code smell:
Código duplicado aumenta o risco de inconsistências ao alterar a lógica de inicialização de slots.
📌 Correção sugerida:
Extrair para uma função utilitária (ex: `getSlots(playerData)`) ou resolver na camada de dados com valor padrão.

#commands/machines/mine.js: 78-82, 159-163
🔍 CodeSmell identificado: Números mágicos para tipos de efeito de chips (typeeffect == 3, 4, 7)
Em mine.js, os valores numéricos `3`, `4` e `7` são usados para identificar tipos de chips sem constantes nomeadas. Impacto do code smell:
Torna impossível entender o significado de cada tipo sem consultar a documentação ou tabela de produtos externa, e dificulta manutenção ao adicionar novos tipos.
📌 Correção sugerida:
Criar constantes descritivas no topo do arquivo ou em um módulo centralizado (ex: `CHIP_TYPE_SPEED = 4`, `CHIP_TYPE_DURABILITY = 3`, `CHIP_TYPE_AUTO_SELL = 7`).


#commands/machines/mine.js: 134-143
🐛 Bug / Exploit de Lógica identificado: Reparo gratuito automático ao atingir zero
Em mine.js, quando a durabilidade, pressão ou refrigeração da máquina atingem 0, o sistema redefine os valores para o máximo (ou metade, no caso da pressão) gratuitamente. Impacto do bug:
Isso contorna toda a mecânica de manutenção e reparo do jogo, permitindo mineração infinita sem custos. O jogador nunca precisa gastar recursos com reparos.
📌 Correção sugerida:
Substituir o reparo automático por uma parada forçada de mineração com notificação ao jogador, ou cobrar o custo de reparo automaticamente do saldo.


#commands/machines/mine.js: 290
🔍 CodeSmell identificado: Linha excessivamente longa (~280 caracteres) com operações ternárias aninhadas
Em mine.js, a linha 290 constrói o campo do embed com múltiplas operações ternárias, capitalização manual de string e um `.map()` identity (`chipicon => chipicon`) que não transforma nada. Impacto do code smell:
A linha é extremamente difícil de ler e manter, e o `.map()` identity é uma operação redundante.
📌 Correção sugerida:
Quebrar em variáveis intermediárias (ex: `capitalizedName`, `chipsLabel`) e substituir o `.map()` identity por `.join()` direto.


#commands/machines/mine.js: 329-357
🐛 Bug identificado: Retorno de `checkMaintenance` ignorado, com múltiplas condições de parada sobrescrevendo-se
Em mine.js, a função `checkMaintenance` retorna `{ isStopping, stoppingMessage }`, mas nenhuma das 4 chamadas (linhas 354-357) captura esse retorno. A função funciona apenas por mutação de closure. Impacto do bug:
Se múltiplas condições de manutenção forem críticas simultaneamente (ex: durabilidade E pressão baixas), apenas a última sobrescreve `stoppingMessage`, perdendo informações de diagnóstico relevantes para o jogador.
📌 Correção sugerida:
Coletar todas as condições de parada em um array e exibi-las ao jogador, ou usar `return` imediato ao primeiro encontro para evitar sobrescrita silenciosa.

#commands/machines/mine.js: 391
🐛 Bug identificado: Referência potencialmente nula em `embedinteraction`
Em mine.js, a variável `embedinteraction` (declarada sem valor na linha 94) só é atribuída no ramo `else` da linha 307 (quando `interaction.replied` é `false`). Na linha 391, `.createMessageComponentCollector()` é chamado sobre esta variável. Impacto do bug:
Se na primeira invocação de `edit()` a condição `interaction.replied` for `true`, `embedinteraction` permanece `undefined`, lançando um `TypeError: Cannot read properties of undefined` e travando a mineração sem limpar o estado do jogador.
📌 Correção sugerida:
Garantir que `embedinteraction` seja sempre atribuída, independentemente do ramo de execução, ou armazenar o resultado de `editReply` quando `interaction.replied` é `true`.