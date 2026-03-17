# TODO — Próximas Implementações

> Checklist de exemplos a implementar. Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para o passo a passo.
> Ao iniciar uma implementação, abra um branch `feat/<slug>` e um PR ao concluir.

---

## Design Patterns — Criacionais

- [ ] **Factory Method** `feat/factory-method`
  - Interface `INotification`, implementações `EmailNotification`, `SmsNotification`, `PushNotification`
  - `NotificationFactory` com método `Create(type)`
  - Demo: cria e envia os 3 tipos, mostrando o factory em ação

- [ ] **Abstract Factory** `feat/abstract-factory`
  - Famílias de UI: `WindowsFactory` e `MacFactory`
  - Produtos: `Button`, `Checkbox` com variantes por SO
  - Demo: renderiza UI completa sem conhecer a família concreta

- [ ] **Prototype** `feat/prototype`
  - `Document` com método `Clone()` (deep vs shallow copy)
  - Demo: clona documento, modifica clone, mostra que original não foi afetado

---

## Design Patterns — Estruturais

- [ ] **Decorator** `feat/decorator`
  - `Coffee` base com decorators: `Milk`, `Sugar`, `WhippedCream`
  - Demo: monta combinações, mostra composição dinâmica e cálculo de preço

- [ ] **Adapter** `feat/adapter`
  - `LegacyPaymentService` (interface antiga) adaptado para `IPaymentGateway` (nova)
  - Demo: usa o adapter transparentemente sem alterar código cliente

- [ ] **Facade** `feat/facade`
  - Subsistema complexo de `HomeTheater` (Amplifier, DVDPlayer, Projector, Lights)
  - `HomeTheaterFacade` com métodos simples `WatchMovie()`, `EndMovie()`
  - Demo: mostra a diferença entre chamar tudo manualmente vs via facade

---

## Design Patterns — Comportamentais

- [ ] **Observer** `feat/observer`
  - `EventBus` / `Subject` com lista de `IObserver`
  - Observadores: `EmailAlert`, `SmsAlert`, `DashboardLogger`
  - Demo: publica evento, todos os observers são notificados em tempo real

- [ ] **Strategy** `feat/strategy`
  - `ShippingCalculator` com estratégias: `StandardShipping`, `ExpressShipping`, `FreeShipping`
  - Demo: troca de estratégia em runtime, mesmo contexto, comportamento diferente

- [ ] **Command** `feat/command`
  - Editor de texto com comandos `TypeCommand`, `DeleteCommand`, `BoldCommand`
  - Histórico com `Undo()` e `Redo()`
  - Demo: executa comandos e demonstra desfazer/refazer

- [ ] **Chain of Responsibility** `feat/chain-of-responsibility`
  - Pipeline de validação: `AuthenticationHandler` → `AuthorizationHandler` → `RateLimitHandler`
  - Demo: requisição passa pela chain, para no primeiro que rejeita

- [ ] **Iterator** `feat/iterator`
  - `TreeNode` com `InOrderIterator`, `PreOrderIterator`, `PostOrderIterator`
  - Demo: percorre a mesma árvore com os 3 iteradores, mostrando ordens diferentes

---

## Algoritmos de Ordenação

> Todos devem ter visualização de gráfico de barras como o Bubble Sort.

- [ ] **Selection Sort** `feat/selection-sort`
  - Complexidade: O(n²) — sempre, independente da entrada
  - Destaque: mínimo de trocas comparado ao Bubble Sort

- [ ] **Insertion Sort** `feat/insertion-sort`
  - Complexidade: O(n) melhor caso, O(n²) pior caso
  - Destaque: eficiente para arrays quase ordenados

- [ ] **Merge Sort** `feat/merge-sort`
  - Complexidade: O(n log n) em todos os casos
  - Visualização: mostrar a divisão recursiva e o merge

- [ ] **Quick Sort** `feat/quick-sort`
  - Complexidade: O(n log n) médio, O(n²) pior caso
  - Visualização: pivot destacado, partições coloridas

---

## Algoritmos de Busca

- [ ] **Binary Search** `feat/binary-search`
  - Array ordenado com busca em O(log n)
  - Visualização: barra de progresso mostrando a divisão do espaço de busca

- [ ] **Linear Search** `feat/linear-search`
  - Comparação direta com Binary Search: O(n) vs O(log n)
  - Visualização: varredura sequencial elemento a elemento

---

## Estruturas de Dados

- [ ] **Stack** `feat/stack`
  - Implementação com array, operações: `Push`, `Pop`, `Peek`
  - Demo: simula call stack de uma função recursiva (ex: fatorial)

- [ ] **Queue** `feat/queue`
  - Implementação FIFO, operações: `Enqueue`, `Dequeue`
  - Demo: simula fila de impressão de documentos

- [ ] **Linked List** `feat/linked-list`
  - `SinglyLinkedList` com `Add`, `Remove`, `Find`, travessia
  - Demo: inserções e remoções, mostrando os ponteiros sendo atualizados

- [ ] **Binary Search Tree** `feat/binary-search-tree`
  - Operações: `Insert`, `Search`, `InOrder`, `PreOrder`
  - Visualização: renderizar a árvore como diagrama de nós

---

## Clean Code & Princípios

- [ ] **DRY** `feat/dry` *(Don't Repeat Yourself)*
  - Antes: código duplicado em 3 lugares
  - Depois: extração para método/classe reutilizável

- [ ] **KISS** `feat/kiss` *(Keep It Simple, Stupid)*
  - Antes: solução super-engenheirada para problema simples
  - Depois: solução direta e legível

- [ ] **YAGNI** `feat/yagni` *(You Aren't Gonna Need It)*
  - Demonstra como over-engineering gera débito técnico desnecessário

- [ ] **Code Smells** `feat/code-smells`
  - Long Method, God Class, Feature Envy, Primitive Obsession
  - Antes/depois com refatoração aplicada

---

## Concorrência

- [ ] **Producer-Consumer** `feat/producer-consumer`
  - `Channel<T>` do .NET para comunicação assíncrona
  - Demo: producer gera itens, consumers processam em paralelo, mostra throughput

- [ ] **Semaphore** `feat/semaphore`
  - Controle de acesso concorrente a recurso limitado
  - Demo: 10 tasks competindo por 3 slots, fila de espera visível

---

## Infra / Melhorias Técnicas

- [ ] Filtro global de exceções no backend com resposta padronizada
- [ ] Testes de integração para os endpoints SSE
- [ ] Modo dark/light com preferência persistida em localStorage
- [ ] Skeleton loading nas páginas de pattern
- [ ] Página de erro 404 customizada
- [ ] Busca/filtro por categoria no dashboard
