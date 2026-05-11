# SDE-2/3 Backend Interview Preparation Guide
### Java · Spring Boot · Microservices · Distributed Systems · Observability

> Written for a senior backend engineer with a curious mind who wants to understand the *why* behind every decision, not just memorise answers.

---

# Table of Contents

1. [The Java Memory Model — The Foundation of Everything](#1-the-java-memory-model)
2. [Concurrency Primitives — volatile, Atomic, Locks](#2-concurrency-primitives)
3. [Thread Pools, CompletableFuture, and Async Patterns](#3-thread-pools-and-async)
4. [Virtual Threads and Project Loom (Java 21)](#4-virtual-threads)
5. [Modern Java — Records, Streams, and Sealed Classes](#5-modern-java)
6. [JVM Architecture and Garbage Collection](#6-jvm-and-gc)
7. [Spring Boot Internals — How It Actually Works](#7-spring-boot-internals)
8. [Spring AOP — The Machinery Behind @Transactional](#8-spring-aop)
9. [Transaction Management in Depth](#9-transaction-management)
10. [Spring Security and Authentication Patterns](#10-spring-security)
11. [Microservices — Formalising What You Already Know](#11-microservices)
12. [Distributed Systems Patterns](#12-distributed-systems-patterns)
13. [Kafka and Event-Driven Architecture](#13-kafka)
14. [Database Internals — Indexes, Locking, Isolation](#14-database-internals)
15. [Caching Strategies — Local, Redis, Hybrid](#15-caching)
16. [Schema Migrations and Zero-Downtime Deployments](#16-migrations-and-deployments)
17. [Observability — Logs, Metrics, Traces](#17-observability)
18. [Cloud Concepts at Interview Depth](#18-cloud-concepts)
19. [System Design Vocabulary Quick Reference](#19-system-design-vocabulary)
20. [Interview Answer Templates](#20-interview-answer-templates)

---

# 1. The Java Memory Model

## Why This Exists

Before the Java Memory Model (JMM) was formalised in Java 5 (JSR-133), Java had no reliable guarantees about what one thread could see when another thread wrote a value. Different JVM implementations on different hardware could behave completely differently. Code that worked on a single-core machine would silently fail on multi-core.

The JMM is the formal specification that answers one question: **when is a write by Thread A guaranteed to be visible to Thread B?**

## The Hardware Problem

Modern CPUs don't read from RAM on every variable access. RAM is hundreds of nanoseconds away. L1 cache is about 1 nanosecond. The CPU aggressively caches values locally. When Thread A on Core 1 writes `x = 5`, it writes to Core 1's L1 cache. Thread B on Core 2 may have its own cached copy of `x` still holding the old value. Neither thread is wrong — they're just looking at different caches.

On top of that, the CPU and compiler are allowed to **reorder instructions** for performance. From the perspective of a single thread, reordering is invisible. But from another thread's perspective, it looks like operations happened in a completely different order than you wrote them.

```
Thread A writes:          CPU may actually execute:
x = 1;                    initialized = true;   // reordered!
initialized = true;       x = 1;
```

Thread B sees `initialized = true` but `x` is still 0. This is not a bug in the hardware — it's the hardware working correctly within its allowed optimisations.

## Happens-Before — The JMM's Answer

The JMM defines **happens-before** relationships. If action A happens-before action B, then all effects of A are visible to B. The key happens-before relationships:

- **Program order** — within a single thread, each action happens-before the next
- **Monitor lock** — unlocking a monitor happens-before every subsequent lock of the same monitor
- **Volatile write** — a write to a volatile variable happens-before every subsequent read of that variable
- **Thread start** — `thread.start()` happens-before any action in the started thread
- **Thread join** — all actions in a thread happen-before `thread.join()` returns
- **Transitivity** — if A happens-before B, and B happens-before C, then A happens-before C

These rules are the formal guarantee behind every concurrency primitive. When an interviewer asks "why does double-checked locking need volatile?" the answer is: without volatile there is no happens-before relationship between the write to the reference and a subsequent read by another thread. The JVM is allowed to let another thread see a non-null reference before the object's constructor has finished running.

## Memory Fences

At the hardware level, happens-before relationships are enforced by **memory fences** (also called memory barriers). A fence is a CPU instruction that prevents certain types of reordering across it. When the JVM emits a volatile write, it inserts a StoreStore fence before the write and a StoreLoad fence after. These prevent any prior writes from being reordered after the volatile write, and prevent the volatile write from being reordered with subsequent loads.

You don't need to work with fences directly in Java. But knowing they exist explains why volatile is not free — it prevents CPU optimisations that would otherwise be valid.

---

# 2. Concurrency Primitives

## volatile — Visibility Without Atomicity

`volatile` creates a happens-before edge between a write and all subsequent reads of the same variable. This gives you two guarantees:

**Visibility** — when a thread writes a volatile variable, the value is flushed to main memory. When another thread reads it, it must read from main memory, not its cache.

**Ordering** — the JVM inserts memory fences around volatile accesses, preventing reordering of surrounding instructions.

What `volatile` does NOT give you: **atomicity**. `count++` compiles to three operations: read, add, write. Even on a volatile variable, two threads can both read `count = 5`, both compute 6, and both write 6. You lose one increment.

### When to use volatile

```java
// Good use: single writer, multiple readers
private volatile boolean isRunning = true;

// Good use: publishing an immutable object reference (double-checked locking)
private volatile Config config;

// BAD use: counter incremented by multiple threads
private volatile int count = 0;  // count++ is still not atomic
```

## AtomicInteger, AtomicLong, AtomicReference

The `java.util.concurrent.atomic` package provides lock-free thread-safe operations using CAS (Compare-And-Swap) at the hardware level.

### CAS — Compare-And-Swap

CAS is a single CPU instruction that atomically does:

```
if (memory[address] == expected) {
    memory[address] = newValue;
    return success;
} else {
    return failure;
}
```

The CPU guarantees this is uninterruptible. No other thread can observe the memory between the comparison and the swap.

`AtomicInteger.incrementAndGet()` in pseudocode:

```java
int incrementAndGet() {
    while (true) {
        int current = get();           // read current value
        int next = current + 1;        // compute new value
        if (compareAndSet(current, next)) {  // CAS
            return next;               // success
        }
        // another thread changed it — retry
    }
}
```

If another thread increments between our read and our CAS, the CAS fails and we retry with the new value. This retry loop is called a **spin loop** or **optimistic retry**. Under low contention this is extremely fast — no OS-level blocking, no context switching.

### AtomicReference

`AtomicReference<T>` provides CAS on an object reference. Use it when you need to atomically swap an entire immutable object:

```java
AtomicReference<ServerConfig> configRef = new AtomicReference<>(initialConfig);

// Any thread can atomically replace the config
public void updateConfig(ServerConfig newConfig) {
    configRef.set(newConfig);  // atomic reference store
}

// CAS variant — only update if still the expected value
public boolean tryUpdateConfig(ServerConfig expected, ServerConfig newConfig) {
    return configRef.compareAndSet(expected, newConfig);
}

public ServerConfig getConfig() {
    return configRef.get();  // always see the latest reference
}
```

**volatile vs AtomicReference:**
- `volatile Config config` — if you only need visibility (one writer atomically replaces the reference), volatile is sufficient and cheaper
- `AtomicReference<Config>` — when you need CAS semantics (only update if still the expected value), or when you want the explicit atomic API

### The ABA Problem

CAS has a subtle issue: Thread A reads value `A`. Thread B changes it to `B`, then back to `A`. Thread A's CAS succeeds even though the value was mutated twice. For simple counters this doesn't matter. For more complex structures (like lock-free linked lists) it can cause corruption.

`AtomicStampedReference<T>` solves this by pairing the value with an integer stamp (version counter). CAS must match both value and stamp.

### LongAdder — Better Than AtomicLong Under Contention

`AtomicLong` under high write contention causes many CAS failures and retries — threads spin fighting over the same memory location. `LongAdder` uses a technique called **cell striping**: it maintains an array of counters. Each thread typically updates its own cell. The `sum()` method adds all cells. This reduces contention dramatically under high throughput write scenarios.

Rule of thumb: use `AtomicLong` when reads are as frequent as writes. Use `LongAdder` when writes dominate (counters, rate tracking, metrics).

## synchronized — Intrinsic Locks and the Monitor

Every Java object has a **monitor** (intrinsic lock) baked into its object header. `synchronized(obj)` acquires that monitor. Only one thread can hold it at a time. Others block in the `BLOCKED` state — parked by the JVM, burning zero CPU.

The JVM has layered optimisations for `synchronized`:

**Biased locking** — if only one thread ever uses the lock, the JVM "biases" it to that thread. Subsequent acquisitions by the same thread require no CAS at all, just a field check. The bias is revoked when another thread tries to acquire.

**Thin lock (lightweight lock)** — for uncontended access by multiple threads, uses CAS rather than OS mutex. Fast path.

**Fat lock (heavyweight lock/inflated lock)** — when there is actual contention, inflates to an OS mutex. Thread parks, OS wakes it when lock is released. Expensive but necessary.

Modern `synchronized` is not the bottleneck it once was. For most applications the JVM never inflates to a fat lock. Don't avoid `synchronized` out of fear — avoid it when you have a better-fitting tool.

## ReentrantLock — When synchronized Isn't Enough

`ReentrantLock` provides the same mutual exclusion as `synchronized` but with additional capabilities:

```java
ReentrantLock lock = new ReentrantLock();

// Basic usage — always unlock in finally
lock.lock();
try {
    // critical section
} finally {
    lock.unlock();
}

// Non-blocking acquisition
if (lock.tryLock()) {
    try {
        // got the lock
    } finally {
        lock.unlock();
    }
} else {
    // do something else — didn't get the lock
}

// Timed acquisition
if (lock.tryLock(100, TimeUnit.MILLISECONDS)) {
    // got it within 100ms
}

// Interruptible acquisition
lock.lockInterruptibly();  // throws InterruptedException if thread is interrupted while waiting
```

**Fairness** — `new ReentrantLock(true)` creates a fair lock. Threads are granted access in FIFO order. Prevents starvation but reduces throughput due to queue overhead. Default is non-fair (any waiting thread can acquire).

**Condition variables** — the replacement for `wait()`/`notify()`. One lock can have multiple conditions:

```java
ReentrantLock lock = new ReentrantLock();
Condition notFull  = lock.newCondition();
Condition notEmpty = lock.newCondition();

// Producer
lock.lock();
try {
    while (buffer.isFull()) notFull.await();
    buffer.add(item);
    notEmpty.signal();  // wake one consumer
} finally {
    lock.unlock();
}

// Consumer
lock.lock();
try {
    while (buffer.isEmpty()) notEmpty.await();
    Item item = buffer.remove();
    notFull.signal();  // wake one producer
} finally {
    lock.unlock();
}
```

With `synchronized`, you only have one wait-set per monitor. `notifyAll()` wakes every waiting thread — a **thundering herd**. With `Condition` objects you wake only the threads that can actually proceed.

## ReadWriteLock and StampedLock

`ReentrantReadWriteLock` is for read-heavy data structures: multiple readers can proceed simultaneously, a writer gets exclusive access.

```java
ReadWriteLock rwLock = new ReentrantReadWriteLock();

// Multiple threads can read concurrently
rwLock.readLock().lock();
try { return cache.get(key); }
finally { rwLock.readLock().unlock(); }

// Only one writer at a time, blocks all readers
rwLock.writeLock().lock();
try { cache.put(key, value); }
finally { rwLock.writeLock().unlock(); }
```

`StampedLock` (Java 8) goes further with **optimistic reads**. A thread reads without any lock, gets a stamp, reads the data, then validates the stamp. If a write happened during the read, validation fails and you fall back to a proper read lock. If no write happened — and for read-heavy caches this is almost always — you got your read with zero locking:

```java
StampedLock sl = new StampedLock();

long stamp = sl.tryOptimisticRead();  // no lock acquired
double x = this.x;
double y = this.y;
if (!sl.validate(stamp)) {           // did a write happen?
    stamp = sl.readLock();           // fall back to read lock
    try {
        x = this.x;
        y = this.y;
    } finally {
        sl.unlockRead(stamp);
    }
}
```

---

# 3. Thread Pools and Async

## Why Not New Thread Every Time

Creating a thread is expensive: the OS allocates a stack (default 512KB–1MB), registers it with the kernel scheduler, initialises kernel data structures. At 1000 concurrent requests, that's up to 1GB of stack space plus scheduler overhead. Thread creation time itself is ~100 microseconds.

Thread pools amortise this cost: create threads once at startup, reuse them. The pool maintains a work queue; tasks wait there until a thread is free.

## ThreadPoolExecutor — The Real Engine

All `Executors` factory methods are convenience wrappers around `ThreadPoolExecutor`:

```java
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    10,                          // corePoolSize — always alive, even when idle
    50,                          // maximumPoolSize — absolute cap on threads
    60L, TimeUnit.SECONDS,       // keepAliveTime — extra threads die after this idle time
    new LinkedBlockingQueue<>(1000),  // work queue with capacity 1000
    new ThreadFactory() { ... }, // optional: name your threads for debugging
    new ThreadPoolExecutor.CallerRunsPolicy()  // rejection policy
);
```

**The execution order** (this surprises everyone):
1. If a core thread is free → use it
2. If all core threads busy → add to queue
3. If queue is full → create a new thread (up to max)
4. If at max threads AND queue full → apply rejection policy

Note: extra threads beyond corePoolSize are only created when the queue is **full**. With an unbounded queue, you never go beyond corePoolSize — the queue just grows forever.

**Rejection policies:**
- `AbortPolicy` (default) — throws `RejectedExecutionException`
- `CallerRunsPolicy` — the calling thread runs the task itself (natural back-pressure)
- `DiscardPolicy` — silently drops the task
- `DiscardOldestPolicy` — drops the oldest queued task, tries to submit again

**Production sizing rule of thumb:**
- CPU-bound tasks: `corePoolSize = nCPU + 1`
- I/O-bound tasks: `corePoolSize = nCPU * (1 + waitTime/computeTime)`

For a REST API mostly waiting on DB queries (90% wait, 10% compute): `nCPU * 10`. A 4-core machine can handle ~40 concurrent threads productively.

## CompletableFuture — Async Pipelines

`CompletableFuture` is Java's promise implementation. It represents a value that will be available in the future and provides a fluent API for building async pipelines.

### The Core Patterns

**Pattern 1 — Parallel independent calls:**

```java
// These two DB calls have no dependency on each other
// Run them in parallel to halve the latency

CompletableFuture<User> userFuture = CompletableFuture
    .supplyAsync(() -> userRepository.findById(userId), executor);

CompletableFuture<List<Order>> ordersFuture = CompletableFuture
    .supplyAsync(() -> orderRepository.findByUserId(userId), executor);

// Wait for both, then combine
CompletableFuture<UserProfileResponse> profileFuture = userFuture
    .thenCombine(ordersFuture, (user, orders) -> new UserProfileResponse(user, orders));

UserProfileResponse profile = profileFuture.get(5, TimeUnit.SECONDS);
```

**Pattern 2 — Chaining (thenApply, thenCompose):**

```java
// thenApply — transform the result (like Stream.map)
CompletableFuture<String> name = CompletableFuture
    .supplyAsync(() -> userRepository.findById(userId))
    .thenApply(user -> user.getName());  // runs in same thread as previous stage

// thenApplyAsync — transform in a new thread
    .thenApplyAsync(user -> user.getName(), executor);

// thenCompose — when the next step itself is async (like Stream.flatMap)
// Use when the transformation function returns a CompletableFuture
CompletableFuture<Order> order = CompletableFuture
    .supplyAsync(() -> cartRepository.findById(cartId))
    .thenCompose(cart -> orderService.createOrderAsync(cart));  // returns CF<Order>
```

**Pattern 3 — Wait for all:**

```java
List<CompletableFuture<Void>> futures = products.stream()
    .map(product -> CompletableFuture.runAsync(() -> sendEmail(product), executor))
    .collect(Collectors.toList());

CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
    .get(30, TimeUnit.SECONDS);
```

**Pattern 4 — Error handling:**

```java
CompletableFuture<User> future = CompletableFuture
    .supplyAsync(() -> userRepository.findById(userId))
    .exceptionally(ex -> {
        log.error("Failed to fetch user {}", userId, ex);
        return User.anonymous();  // fallback value
    })
    .whenComplete((user, ex) -> {
        // always runs, whether success or failure
        metrics.recordCall("user_fetch", ex == null);
    });
```

### The Problem with CompletableFuture in Production

CompletableFuture is powerful but has rough edges:

**Error propagation is surprising** — if you forget `exceptionally()`, errors are silently swallowed unless you call `get()`. In fire-and-forget scenarios, exceptions disappear.

**Thread pool selection** — by default `supplyAsync()` uses the common ForkJoinPool. In a web application this is often wrong — you want your own pool. Always pass an explicit `executor`.

**Debugging stack traces are terrible** — async stack traces are fragmented across threads. The stack trace at the exception point doesn't include where the future was created. Virtual threads and structured concurrency (Java 21) improve this significantly.

**No structured lifecycle** — if a parent task is cancelled, child tasks spawned with CompletableFuture continue running. There's no built-in parent-child cancellation relationship.

---

# 4. Virtual Threads (Project Loom, Java 21)

## The Problem They Solve

Traditional Java threads (now called **platform threads**) map 1:1 to OS threads. The OS scheduler manages them. This means:

- Creating 10,000 threads = 10GB of stack space minimum
- Context switching between threads = OS scheduler overhead = microseconds per switch
- Blocking a thread on I/O = that OS thread is doing nothing, but is still paid for

For a typical web service, most time is spent waiting: waiting for the database, waiting for another service, waiting for a cache. A thread making a 10ms database call spends 9.9ms blocked. With 200 threads you can serve ~20,000 requests per second in theory, but most of those threads are just waiting.

The workaround was reactive programming — instead of blocking, register a callback and free the thread. But reactive code with `Mono`, `Flux`, `flatMap`, `subscribe`, `onError` is hard to write, hard to read, and makes debugging significantly harder.

## Virtual Threads — The Abstraction

Virtual threads are lightweight threads managed entirely by the JVM, not the OS. The relationship:

```
OS Thread (carrier thread) — there are a few of these (= nCPU typically)
    └── Virtual Thread 1 (mounted when running)
    └── Virtual Thread 2 (unmounted when blocked)
    └── Virtual Thread 3 (waiting to mount)
    └── ... millions more
```

When a virtual thread **blocks** (calls a blocking I/O operation, acquires a lock, sleeps), the JVM **unmounts** it from the carrier thread. The carrier thread is immediately free to run another virtual thread. When the blocking operation completes, the virtual thread is mounted again on a (possibly different) carrier thread and continues.

From the developer's perspective: you write normal synchronous-looking blocking code. The JVM handles the concurrency automatically.

```java
// Old way — thread pool limits concurrency
ExecutorService pool = Executors.newFixedThreadPool(200);
for (int i = 0; i < 10_000; i++) {
    pool.submit(() -> {
        String result = httpClient.get("https://api.example.com/data");  // blocks
        process(result);
    });
}
// 9,800 tasks waiting for one of 200 threads

// Virtual thread way
ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor();
for (int i = 0; i < 10_000; i++) {
    pool.submit(() -> {
        String result = httpClient.get("https://api.example.com/data");  // unmounts
        process(result);
    });
}
// All 10,000 run "concurrently" — carrier threads are never blocked
```

## What Changes in Practice

**Spring Boot 3.2+ with Java 21** — you can enable virtual threads globally:

```yaml
# application.yml
spring:
  threads:
    virtual:
      enabled: true
```

This switches all Tomcat request handling threads to virtual threads. Your REST API now handles threads-per-request model with the scalability of reactive, without any reactive code.

**When virtual threads shine:**
- High concurrency I/O-bound workloads (REST APIs, database queries, external service calls)
- Any code that uses blocking APIs

**When virtual threads don't help:**
- CPU-bound work — if a thread is always running (not blocking), unmounting doesn't help. You're still limited by CPU cores.
- Code with `synchronized` blocks — `synchronized` pins the virtual thread to its carrier thread (the carrier can't be freed while the virtual thread holds a monitor). Rewrite `synchronized` to `ReentrantLock` for virtual thread compatibility. Java 24 fixes this pinning issue.

## Structured Concurrency (Java 21 Preview)

Structured Concurrency solves the parent-child lifetime problem that CompletableFuture can't. The rule: **subtasks cannot outlive their parent scope**.

```java
Response fetchUserProfile(long userId) throws InterruptedException {
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        
        // Fork two subtasks
        StructuredTaskScope.Subtask<User> userTask =
            scope.fork(() -> userRepository.findById(userId));
        
        StructuredTaskScope.Subtask<List<Order>> ordersTask =
            scope.fork(() -> orderRepository.findByUser(userId));
        
        scope.join();           // wait for both to complete
        scope.throwIfFailed();  // if either failed, throw the exception
        
        // Both completed successfully
        return new Response(userTask.get(), ordersTask.get());
        
    } // scope closes here — any still-running subtask is cancelled
}
```

`ShutdownOnFailure` cancels all remaining subtasks as soon as one fails. `ShutdownOnSuccess` cancels remaining subtasks as soon as one succeeds (useful for "race to first result" patterns like trying multiple mirrors for a download).

**Why this is better than CompletableFuture.allOf:**
- Clean cancellation — failing fast actually cancels the other tasks
- Better stack traces — the JVM understands the task hierarchy
- Cleaner error propagation — one exception surfaces, not wrapped in CompletionException
- No callback hell — reads like synchronous code

---

# 5. Modern Java

## Java Records (Java 16+)

Records are immutable data carriers with zero boilerplate. The compiler generates constructor, getters, `equals`, `hashCode`, and `toString` from the record components.

```java
// Traditional DTO — ~50 lines with boilerplate
public class CreateOrderRequest {
    private final String customerId;
    private final List<OrderItem> items;
    private final String deliveryAddress;
    // constructor, getters, equals, hashCode, toString...
}

// Record — 1 line
public record CreateOrderRequest(
    String customerId,
    List<OrderItem> items,
    String deliveryAddress
) {}
```

**Access pattern:** `request.customerId()` not `request.getCustomerId()`. Records use accessor methods, not JavaBean-style getters.

**Compact constructor** — for validation:

```java
public record Money(BigDecimal amount, String currency) {
    public Money {  // compact constructor — no parameter list
        Objects.requireNonNull(currency);
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Amount cannot be negative");
        }
    }
}
```

**Custom methods** — records can have instance methods and static factory methods:

```java
public record Range(int min, int max) {
    public Range {
        if (min > max) throw new IllegalArgumentException();
    }
    
    public boolean contains(int value) {
        return value >= min && value <= max;
    }
    
    public static Range of(int min, int max) {
        return new Range(min, max);
    }
}
```

**Where to use records:**
- Request/Response DTOs
- Event payloads (Kafka messages)
- Value objects (Money, Coordinate, Range)
- Query results from projections
- Configuration data

**Where NOT to use records:**
- JPA entities — JPA requires a no-arg constructor, mutable fields, and proxy subclassing. Records prohibit all of these.
- Classes needing inheritance — records implicitly extend `java.lang.Record` and are `final`

**Jackson with records** — Jackson 2.12+ handles records natively. No `@JsonProperty` needed if field names match JSON keys.

## Java Streams — The Full Picture

Streams are a declarative API for processing sequences of elements. The key design insight: **streams are lazy pipelines, not data structures**.

### Lazy Evaluation in Depth

```java
List<String> names = employees.stream()
    .filter(e -> e.getDepartment().equals("Engineering"))  // builds filter stage
    .map(Employee::getName)                                 // builds map stage
    .sorted()                                               // builds sort stage
    .limit(10)                                              // builds limit stage
    .collect(Collectors.toList());                          // TRIGGERS EXECUTION
```

Nothing runs until `collect()`. The pipeline is a description of transformations, not the transformations themselves. The JVM can optimise this — for example, `limit(10)` can short-circuit `sorted()` for some implementations.

**Short-circuit operations** — terminals that don't need to process the entire stream:
- `findFirst()`, `findAny()` — stop at first match
- `anyMatch()`, `noneMatch()`, `allMatch()` — stop as soon as result is known
- `limit(n)` combined with other operations

### flatMap — The Misunderstood Operation

`map` transforms each element to exactly one result. `flatMap` transforms each element to zero or more results and flattens them:

```java
// Each order has multiple items. Get all items across all orders.
List<OrderItem> allItems = orders.stream()
    .flatMap(order -> order.getItems().stream())  // Order -> Stream<OrderItem>
    .collect(Collectors.toList());

// Without flatMap you'd get Stream<List<OrderItem>> — nested, not flat
```

### Collectors — The Important Ones

```java
// groupingBy — the one interviewers always ask about
Map<Category, List<Product>> byCategory = products.stream()
    .collect(Collectors.groupingBy(Product::getCategory));

// groupingBy with downstream collector
Map<Category, Long> countByCategory = products.stream()
    .collect(Collectors.groupingBy(Product::getCategory, Collectors.counting()));

Map<Category, Double> avgPriceByCategory = products.stream()
    .collect(Collectors.groupingBy(
        Product::getCategory,
        Collectors.averagingDouble(Product::getPrice)
    ));

// partitioningBy — splits into true/false groups
Map<Boolean, List<Product>> inStockPartition = products.stream()
    .collect(Collectors.partitioningBy(p -> p.getStock() > 0));

// toMap — careful with duplicate keys
Map<String, Product> bySku = products.stream()
    .collect(Collectors.toMap(
        Product::getSku,
        p -> p,
        (existing, replacement) -> existing  // merge function for duplicate keys
    ));

// joining — for strings
String skuList = products.stream()
    .map(Product::getSku)
    .collect(Collectors.joining(", ", "[", "]"));  // [SKU1, SKU2, SKU3]
```

### reduce — Building Custom Aggregations

```java
// Sum prices
BigDecimal total = cart.getItems().stream()
    .map(CartItem::getPrice)
    .reduce(BigDecimal.ZERO, BigDecimal::add);

// Find maximum
Optional<Product> mostExpensive = products.stream()
    .reduce((a, b) -> a.getPrice() > b.getPrice() ? a : b);
```

### Parallel Streams — When to Use, When Not To

```java
long count = hugeList.parallelStream()
    .filter(expensive::computation)
    .count();
```

Parallel streams use the common ForkJoinPool. They help when:
- The data set is large (generally >10,000 elements)
- Each operation is expensive (CPU-bound)
- Order doesn't matter

They hurt when:
- Data set is small — parallel overhead exceeds benefit
- Operations have shared mutable state — race conditions
- Operations require ordering — parallel + ordered = worse than sequential
- In a web application — you're stealing threads from the server's thread pool

**Rule of thumb:** never use `parallelStream()` without benchmarking. Sequential streams are fast enough for most use cases.

## Sealed Classes and Pattern Matching (Java 17+)

Sealed classes restrict which classes can extend them:

```java
public sealed interface Shape permits Circle, Rectangle, Triangle {}

public record Circle(double radius) implements Shape {}
public record Rectangle(double width, double height) implements Shape {}
public record Triangle(double base, double height) implements Shape {}
```

Combined with pattern matching switch:

```java
double area = switch (shape) {
    case Circle c    -> Math.PI * c.radius() * c.radius();
    case Rectangle r -> r.width() * r.height();
    case Triangle t  -> 0.5 * t.base() * t.height();
};
```

The compiler knows the sealed hierarchy is exhaustive — no default case needed. If you add a new shape and forget to handle it, the code doesn't compile. This is algebraic data types in Java.

**Production use case:** modelling discriminated unions — events with different types, API responses that can be success or various error types, state machine states.

---

# 6. JVM Architecture and Garbage Collection

## Memory Regions

**Stack** — per-thread. Contains call frames (local variables, primitive values, object references). Frame pushed on method call, popped on return. No GC involved — purely stack discipline. `StackOverflowError` = stack exhausted (deep recursion).

**Heap** — shared. All objects live here. GC manages it. Divided into generations.

**Metaspace** — off-heap native memory. Class metadata, method bytecode. Replaced PermGen in Java 8. Grows dynamically by default (cap with `-XX:MaxMetaspaceSize`).

**PC Register** — per-thread. Points to current executing instruction.

## Generational Hypothesis

Most objects die young — they're created for a method call and abandoned when it returns. A small minority (caches, connection pools, singletons) live for the process lifetime. GC exploits this by collecting the young generation aggressively and cheaply.

**Eden** — all new objects start here. Fills quickly by design. Minor GC triggered when Eden fills.

**Minor GC (Young GC)** — copying collector. Finds all live objects in Eden + active survivor space. Copies them to the empty survivor space. Eden and old survivor space are then completely empty — their entire memory reclaimed at once without tracing dead objects. This is why Minor GC is fast (milliseconds).

**Survivor spaces S0/S1** — used alternately. After each Minor GC, roles flip. Objects that survive get their age counter incremented. Default tenuring threshold: 15 (`-XX:MaxTenuringThreshold`).

**Promotion** — when an object's age reaches the threshold, it moves to Old Generation. Also happens when Survivor space is too small to hold all surviving objects (premature promotion — sign of undersized Young Gen).

**Old Generation (Tenured)** — long-lived objects. Collected by Major GC (expensive). Mark-sweep-compact.

## Stop-The-World

All GC algorithms require some STW pauses. The JVM needs a **consistent snapshot** of the heap — if application threads kept mutating references during GC, the collector would follow stale or missing references. JVM brings all threads to **safe points** (locations in bytecode where thread state is fully known), then signals them to park.

STW pause length is the primary metric for GC tuning. A 500ms Full GC pause on an API server handling 10,000 RPS = 5,000 requests experiencing high latency or timeout.

## G1 — Default Since Java 9

G1 (Garbage First) divides the heap into equal-sized **regions** (1–32MB each). Each region is dynamically assigned as Eden, Survivor, or Old. G1 maintains a priority queue of regions ranked by garbage density ("garbage first" = collect most garbage first).

Key features:
- **Pause time goal** — `-XX:MaxGCPauseMillis=200`. G1 tries to meet this target.
- **Concurrent marking** — most marking work done concurrently with application
- **Evacuation** — collection done by copying regions, so compaction is automatic
- **No fragmentation** — unlike CMS which swept in-place

G1 is the right choice for most production workloads with heap sizes 4GB–32GB.

## ZGC and Shenandoah — Sub-Millisecond Pauses

Both target STW pauses under 1ms regardless of heap size. They achieve this through **concurrent relocation** — objects are moved while the application is running.

The trick: **load barriers**. The JVM inserts a small piece of code on every object field read. If the object being read has been moved, the barrier transparently redirects to the new address. This adds a small overhead to every field read (~1-2 nanoseconds) in exchange for near-zero STW.

Production context: use ZGC when you have large heaps (>32GB) or extremely tight latency SLAs (financial services, gaming). For most services G1 is sufficient.

## Memory Leaks in Java

A Java memory leak = an unintentional strong reference preventing GC from collecting an object.

**Classic patterns:**

```java
// 1. Static collection that grows without bound
class EventTracker {
    private static final Map<String, Event> events = new HashMap<>();  // never cleared
    
    public static void track(String name, Event event) {
        events.put(name, event);  // grows forever
    }
}

// 2. Non-static inner class capturing outer reference
class OrderService {
    private final List<Order> orders = new ArrayList<>();
    
    public Runnable createProcessor() {
        return new Runnable() {   // anonymous inner class
            @Override
            public void run() {
                // this Runnable holds a reference to OrderService
                // if submitted to a long-lived executor, OrderService can't be GC'd
                orders.forEach(o -> process(o));
            }
        };
    }
}

// Fix: use static inner class or lambda with explicit capture
public Runnable createProcessor() {
    List<Order> snapshot = new ArrayList<>(this.orders);  // explicit copy
    return () -> snapshot.forEach(o -> process(o));
}

// 3. ThreadLocal not cleaned up
private static ThreadLocal<HeavyObject> threadLocal = new ThreadLocal<>();

void processRequest() {
    threadLocal.set(new HeavyObject());
    // process...
    // forgot: threadLocal.remove()
    // The HeavyObject lives as long as the thread (forever in a thread pool)
}

// 4. Listeners never removed
button.addActionListener(this::handleClick);
// Component is "done" but event source holds reference → can't be GC'd
```

**Diagnosing leaks:**
```bash
# Take heap dump
jmap -dump:format=b,file=heap.hprof <pid>

# JVM flag — auto dump on OOM
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/heap.hprof
```

Analyse with Eclipse MAT (Memory Analyzer Tool). The "Dominator Tree" shows which objects are retaining the most heap. The root cause is almost always at the top.

---

# 7. Spring Boot Internals

## How Auto-Configuration Actually Works

Spring Boot's magic comes from a deceptively simple mechanism. When you add a dependency to your project, configuration happens automatically. Here's the chain:

**Step 1: `@SpringBootApplication`** is a composed annotation:

```java
@SpringBootApplication
// is equivalent to:
@Configuration
@EnableAutoConfiguration
@ComponentScan
```

**Step 2: `@EnableAutoConfiguration`** imports `AutoConfigurationImportSelector`.

**Step 3: `AutoConfigurationImportSelector`** reads from a file in every JAR on the classpath:

```
META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
```

This file lists auto-configuration classes. For example, `spring-boot-autoconfigure.jar` contains hundreds of them.

**Step 4:** Each auto-configuration class is annotated with `@ConditionalOn...` conditions:

```java
@AutoConfiguration
@ConditionalOnClass(DataSource.class)           // only if this class is on classpath
@ConditionalOnMissingBean(DataSource.class)     // only if no DataSource bean defined yet
@EnableConfigurationProperties(DataSourceProperties.class)
public class DataSourceAutoConfiguration {
    
    @Bean
    @ConditionalOnMissingBean
    public DataSource dataSource(DataSourceProperties properties) {
        return DataSourceBuilder.create()
            .url(properties.getUrl())
            .username(properties.getUsername())
            .build();
    }
}
```

**Step 5:** If you define your own `DataSource` bean, `@ConditionalOnMissingBean` prevents the auto-configured one from being created. **You always win over auto-configuration.**

### Building a Custom Starter

A custom starter is a JAR your team publishes internally. Any service that adds it as a dependency gets the configuration automatically.

Structure:
```
my-company-starter/
├── src/main/java/
│   └── com/company/starter/
│       ├── MyAutoConfiguration.java
│       └── MyProperties.java
└── src/main/resources/
    └── META-INF/spring/
        └── org.springframework.boot.autoconfigure.AutoConfiguration.imports
```

```java
// The imports file contains:
com.company.starter.MyAutoConfiguration

// The auto-configuration class:
@AutoConfiguration
@ConditionalOnProperty(name = "company.feature.enabled", havingValue = "true")
@EnableConfigurationProperties(MyProperties.class)
public class MyAutoConfiguration {
    
    @Bean
    @ConditionalOnMissingBean
    public MyService myService(MyProperties properties) {
        return new MyService(properties.getApiKey(), properties.getTimeout());
    }
}

// Properties class bound to application.yml
@ConfigurationProperties(prefix = "company.feature")
public class MyProperties {
    private boolean enabled = false;
    private String apiKey;
    private Duration timeout = Duration.ofSeconds(5);
    // getters/setters
}
```

Any service adds the dependency, sets `company.feature.enabled=true` and `company.feature.api-key=xxx` in their `application.yml`, and gets a fully configured `MyService` bean. Use cases: standard logging setup, distributed tracing configuration, common security filters, metrics setup.

## Bean Lifecycle in Full

```
1. BeanDefinitionReader reads @Component, @Bean, XML, etc.
2. BeanDefinition created (metadata, not yet instantiated)
3. BeanFactoryPostProcessor runs — can modify BeanDefinitions
4. Bean instantiated (constructor called)
5. Dependencies injected (setter injection or field injection)
6. BeanPostProcessor.postProcessBeforeInitialization()
7. @PostConstruct method called
8. InitializingBean.afterPropertiesSet() (if implemented)
9. init-method from @Bean(initMethod="...") (if specified)
10. BeanPostProcessor.postProcessAfterInitialization()
    ↑ This is where AOP proxies are created
11. Bean ready to serve requests
...
12. @PreDestroy called on shutdown
13. DisposableBean.destroy() (if implemented)
14. destroy-method from @Bean(destroyMethod="...") (if specified)
```

`@PostConstruct` is the most useful lifecycle hook. It runs after all dependencies are injected, so you can use them:

```java
@Service
public class CacheWarmupService {
    private final ProductRepository repository;
    private Map<String, Product> cache;
    
    @PostConstruct
    public void warmUp() {
        // repository is injected by the time this runs
        cache = repository.findAll().stream()
            .collect(Collectors.toMap(Product::getSku, p -> p));
        log.info("Cache warmed up with {} products", cache.size());
    }
}
```

## Spring Profiles and Dynamic Configuration

```yaml
# application.yml — base config
server:
  port: 8080
spring:
  datasource:
    url: jdbc:h2:mem:testdb  # overridden in production

---
# application-production.yml
spring:
  datasource:
    url: jdbc:mysql://prod-db:3306/myapp
    username: ${DB_USER}  # from environment variable
    password: ${DB_PASS}
```

Activate with: `SPRING_PROFILES_ACTIVE=production` or `--spring.profiles.active=production`.

`@Profile("production")` on a `@Bean` method or `@Component` class — only loaded when that profile is active. Use for environment-specific beans: mock payment service in dev, real one in production.

### Spring Cloud Config — Externalised Configuration

The problem with `application.yml` in the JAR: changing a config value requires rebuilding and redeploying. Spring Cloud Config solves this with a config server that serves configuration from a Git repository.

Services fetch config from the server at startup:

```yaml
# bootstrap.yml (loaded before application.yml)
spring:
  application:
    name: order-service
  cloud:
    config:
      uri: http://config-server:8888
```

The config server serves `order-service.yml` (or environment-specific `order-service-production.yml`) from its Git repo.

**Dynamic refresh** — change a property in Git, push, call `/actuator/refresh` on the service. Beans annotated with `@RefreshScope` are reloaded with new config values. No restart needed.

```java
@RestController
@RefreshScope  // this bean reloads on /actuator/refresh
public class FeatureFlagController {
    
    @Value("${feature.new-checkout-flow.enabled:false}")
    private boolean newCheckoutEnabled;
    
    @GetMapping("/checkout/config")
    public Map<String, Object> getConfig() {
        return Map.of("newCheckoutEnabled", newCheckoutEnabled);
    }
}
```

---

# 8. Spring AOP

## The Problem AOP Solves

Without AOP, cross-cutting concerns pollute every class:

```java
public class OrderService {
    public Order createOrder(OrderRequest request) {
        // logging concern
        log.info("Creating order for user {}", request.getUserId());
        long start = System.currentTimeMillis();
        
        // security concern
        if (!securityContext.hasPermission("CREATE_ORDER")) throw new ForbiddenException();
        
        // transaction concern
        transaction.begin();
        try {
            Order order = doCreateOrder(request);
            transaction.commit();
            
            // logging again
            log.info("Order created in {}ms", System.currentTimeMillis() - start);
            return order;
        } catch (Exception e) {
            transaction.rollback();
            throw e;
        }
    }
}
```

With AOP, the `OrderService` contains only business logic. Logging, security, and transactions are declared separately and woven in.

## How Spring AOP Works Internally — Proxies

When the Spring container creates a bean that has aspects targeting it, it doesn't give you the real bean. It gives you a **proxy** — an object that wraps the real bean and intercepts method calls.

```
Caller → Proxy (intercepts call, runs advice) → Real Bean
```

Two proxy mechanisms:

**JDK Dynamic Proxy** — works when the bean implements at least one interface. Spring creates a proxy that implements the same interface. This is why you inject by interface, not by class, in Spring — that's what you're actually getting.

**CGLIB Proxy** — works for classes without interfaces. CGLIB generates a subclass at runtime that overrides all methods with interception logic. This is why Spring beans cannot be `final` — CGLIB can't subclass a final class.

**The self-invocation gotcha:**

```java
@Service
public class OrderService {
    
    @Transactional
    public void processOrder(Order order) {
        this.sendConfirmation(order);  // WRONG — calls real object, bypasses proxy
    }
    
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendConfirmation(Order order) {
        // This @Transactional is IGNORED when called from processOrder above
    }
}
```

The fix: inject `self` or restructure into two separate beans.

## Writing Aspects

```java
@Aspect
@Component
public class PerformanceAspect {
    
    // Pointcut expression: any method in any class in the service package
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void serviceLayer() {}
    
    // @Around — most powerful: controls whether method runs
    @Around("serviceLayer()")
    public Object measureExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        try {
            Object result = joinPoint.proceed();  // execute the real method
            return result;
        } finally {
            long elapsed = System.currentTimeMillis() - start;
            log.info("{}.{}() executed in {}ms",
                joinPoint.getTarget().getClass().getSimpleName(),
                joinPoint.getSignature().getName(),
                elapsed);
        }
    }
    
    // @Before — runs before the method
    @Before("execution(* com.example.service.OrderService.createOrder(..))")
    public void auditOrderCreation(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        log.info("Creating order with args: {}", Arrays.toString(args));
    }
    
    // @AfterThrowing — runs only on exception
    @AfterThrowing(
        pointcut = "serviceLayer()",
        throwing = "exception"
    )
    public void handleServiceException(JoinPoint joinPoint, Exception exception) {
        log.error("Exception in {}: {}", joinPoint.getSignature(), exception.getMessage());
        metrics.incrementErrorCounter(joinPoint.getSignature().getName());
    }
}
```

**Real production use cases:**
- Execution time logging for all service methods
- Audit logging for sensitive operations
- Rate limiting on controller methods
- Retry logic for flaky external calls
- Caching (`@Cacheable` is AOP under the hood)
- `@Transactional` (also AOP under the hood)

---

# 9. Transaction Management in Depth

## What @Transactional Does

When you annotate a method with `@Transactional`, Spring wraps it in an AOP proxy. The proxy:

1. Checks if a transaction is already active (depends on propagation)
2. Begins a transaction if needed (calls `Connection.setAutoCommit(false)`)
3. Calls your real method
4. Commits on success (`Connection.commit()`)
5. Rolls back on unchecked exception (`Connection.rollback()`)

## Propagation Deep Dive

```java
@Transactional(propagation = Propagation.REQUIRED)  // default
// Join existing transaction if one exists, create new one if not.
// Most common. 99% of your service methods.

@Transactional(propagation = Propagation.REQUIRES_NEW)
// ALWAYS create a new transaction. Suspend the current one.
// Use case: audit logging that must persist even if main transaction rolls back.
// Example: save an "order attempted" audit record before processing payment.
// If payment fails and main transaction rolls back, audit record is already committed.

@Transactional(propagation = Propagation.NESTED)
// Creates a savepoint within the current transaction.
// Can roll back to the savepoint without rolling back the outer transaction.
// Use case: batch processing — roll back one failed item, continue the batch.
// Not all databases support savepoints.

@Transactional(propagation = Propagation.SUPPORTS)
// Join existing transaction if present, run non-transactionally if not.
// Use case: read-only operations that are sometimes called within a transaction
// (for consistency) and sometimes not.

@Transactional(propagation = Propagation.NOT_SUPPORTED)
// Always run without a transaction. Suspend current if one exists.
// Use case: operations that explicitly must not run in a transaction
// (certain bulk inserts that work better without transaction overhead).

@Transactional(propagation = Propagation.NEVER)
// Must NOT be called within a transaction. Throws if one exists.
// Use case: defensive programming — certain operations are dangerous in a transaction.

@Transactional(propagation = Propagation.MANDATORY)
// Must be called within an existing transaction. Throws if no transaction.
// Use case: helper methods that should only be called from other transactional methods.
```

## Isolation Levels

```java
@Transactional(isolation = Isolation.READ_UNCOMMITTED)
// Can read uncommitted changes from other transactions (dirty reads).
// Almost never used in practice. No practical isolation.

@Transactional(isolation = Isolation.READ_COMMITTED)
// Can only read committed data. Default in PostgreSQL, Oracle.
// Non-repeatable reads possible — same row can look different within transaction.
// Good for OLTP. Prevent dirty reads while maximising concurrency.

@Transactional(isolation = Isolation.REPEATABLE_READ)
// All reads within transaction see consistent snapshot. Default in MySQL InnoDB.
// Phantom reads prevented in InnoDB via gap locks.

@Transactional(isolation = Isolation.SERIALIZABLE)
// Full isolation. Transactions execute as if sequential.
// Highest correctness, lowest throughput.
// Use for financial operations where you cannot accept any anomalies.
```

## Rollback Rules

Default: rolls back on `RuntimeException` and `Error`. Does NOT roll back on checked exceptions.

```java
@Transactional(rollbackFor = Exception.class)
// Roll back on ANY exception, including checked ones

@Transactional(noRollbackFor = OptimisticLockingFailureException.class)
// Do NOT roll back on this specific exception
// (handle it yourself with retry logic)
```

## Common Gotchas

**1. Self-invocation** — calling a `@Transactional` method from the same class bypasses the proxy. The transaction annotation is ignored.

**2. private methods** — `@Transactional` on a private method has no effect. AOP can only proxy public methods.

**3. Exception swallowing** — catching an exception inside a `@Transactional` method and not rethrowing it will commit the transaction even if something went wrong.

```java
@Transactional
public void processOrder(Order order) {
    try {
        inventoryService.reserve(order);
        paymentService.charge(order);
    } catch (Exception e) {
        log.error("Failed", e);
        // Transaction will COMMIT here — no exception propagated!
        // This is wrong. Rethrow or call TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()
    }
}
```

**4. Transaction and new thread** — transactions are bound to the current thread via `ThreadLocal`. If you spawn a new thread inside a `@Transactional` method, the new thread is NOT in the same transaction.

---

# 10. Spring Security and Authentication Patterns

## The Security Filter Chain

Spring Security works as a chain of Servlet filters that intercept every request before it reaches your controllers. Each filter has one responsibility.

Key filters in order:
```
SecurityContextPersistenceFilter   → loads SecurityContext from session/token
UsernamePasswordAuthenticationFilter → handles form login
BearerTokenAuthenticationFilter   → handles JWT validation
ExceptionTranslationFilter        → converts auth exceptions to HTTP responses
FilterSecurityInterceptor          → checks if authenticated user has required permissions
```

## JWT — Stateless Authentication

JWT (JSON Web Token) is the standard for stateless API authentication. A token is a signed string encoding: who you are (subject), what you can do (authorities/roles), when it expires. The server needs no session store — the token is self-contained.

```
Header.Payload.Signature
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZXhwIjoxNjQ5MDAwMDAwfQ.abc123
```

**Authentication flow:**
```
1. Client: POST /login {username, password}
2. Server: validates credentials, generates JWT signed with secret key
3. Server: returns JWT to client
4. Client: stores JWT, sends on every request: Authorization: Bearer <token>
5. Server: validates JWT signature, extracts user identity, proceeds
```

**No database lookup on every request** — the server validates the cryptographic signature. If valid, trust the claims in the payload.

**Debugging auth issues** — the answer to that interview question:

When auth works in QA but not in production, check in order:
1. JWT secret key — different between environments?
2. Token expiry — production tokens expiring faster?
3. CORS configuration — different allowed origins?
4. HTTPS vs HTTP — secure cookie flags?
5. Clock skew — server clocks out of sync (JWT validation checks timestamps)?
6. Log the SecurityContext state at the filter level to see where auth fails

---

# 11. Microservices — Formalising What You Know

## What Microservices Actually Are

A microservices architecture is a collection of small, independently deployable services, each owning its data store, communicating over well-defined APIs. The key properties:

**Independent deployability** — you can deploy Order Service without deploying Inventory Service. This requires backward-compatible APIs and loose coupling.

**Data isolation** — each service owns its database. No service reads another service's database directly. All data access goes through the service's API. This is the hardest rule to follow and the most important.

**Single responsibility at service level** — each service maps to a bounded context in the domain (a concept from Domain-Driven Design). Order Service handles everything about orders. Payment Service handles everything about payment.

## Service Communication Patterns

### Synchronous — REST and gRPC

**REST** — HTTP/JSON, human-readable, widely supported. Request-response. The caller blocks until the response arrives.

**gRPC** — HTTP/2, Protocol Buffers (binary), generated client/server code, built-in streaming. Better performance than REST for internal service-to-service calls. The interface is defined in `.proto` files — both sides generated from the same contract.

```protobuf
service InventoryService {
  rpc CheckAvailability (AvailabilityRequest) returns (AvailabilityResponse);
  rpc StreamInventoryUpdates (stream InventoryUpdate) returns (stream InventoryEvent);
}
```

**When to use synchronous:** user-facing requests where the result is needed to form the response. "Is this product in stock?" needs a synchronous answer before showing the buy button.

### Asynchronous — Messaging

Services publish events to a message broker (Kafka, SQS). Other services consume and react. The publisher doesn't wait. The publisher doesn't know who consumes.

**When to use async:** operations that don't need an immediate response. "Order placed" → send confirmation email, update analytics, trigger fulfillment. None of these need to block the order creation response.

## Service Discovery

Services have dynamic IP addresses in containerised environments. You can't hardcode IPs. Service discovery solves this.

**Client-side discovery (Eureka)** — each service registers itself with a registry (Eureka server). Callers query the registry to find instances. The caller does the load balancing. Used by Netflix, Spring Cloud Netflix.

**Server-side discovery (AWS/Kubernetes)** — a load balancer (AWS ALB, k8s Service) handles routing. Services register with the platform. Callers address the load balancer, not individual instances. More common in cloud-native deployments. This is what you have at Country Delight.

## API Gateway

Single entry point for all external traffic. Responsibilities:

- **Authentication/Authorization** — validate JWT before the request reaches any service
- **Rate limiting** — prevent API abuse
- **Routing** — `/api/orders/*` → Order Service, `/api/products/*` → Product Service
- **SSL termination** — HTTPS at the gateway, HTTP internally
- **Request/response transformation** — add headers, modify payloads
- **Observability** — log all requests, emit metrics

Popular choices: AWS API Gateway, Kong, NGINX, Spring Cloud Gateway.

## API Versioning

When you change an API that external clients depend on, you need to version it so old clients don't break.

**URL versioning** (most common):
```
/api/v1/orders    → old contract
/api/v2/orders    → new contract
```
Simple, cacheable, explicit. Clients choose their version.

**Header versioning:**
```
GET /api/orders
Accept: application/vnd.company.v2+json
```
Cleaner URLs but harder to test in browsers and harder to cache.

**Query parameter versioning:**
```
GET /api/orders?version=2
```

**Rules for versioning in production:**
- Never break v1 without a migration window
- Support at least 2 versions concurrently
- Deprecate with sunset headers: `Sunset: Sat, 01 Jan 2025 00:00:00 GMT`
- Use the strangler fig pattern — route some traffic to v2, gradually move all clients, retire v1

---

# 12. Distributed Systems Patterns

## SAGA Pattern

In a monolith, a business operation spanning multiple tables uses a single database transaction — ACID. In microservices, there is no such thing as a cross-service database transaction. Each service has its own database.

The SAGA pattern models a long-running business process as a sequence of local transactions. If one step fails, compensating transactions undo previous steps.

### Choreography-Based SAGA

No central coordinator. Services react to events. Each service knows what to do when it sees a certain event.

```
Order Service        →  publishes "OrderCreated"
  Inventory Service  →  receives "OrderCreated", reserves stock, publishes "StockReserved"
    Payment Service  →  receives "StockReserved", charges card, publishes "PaymentSucceeded"
      Order Service  →  receives "PaymentSucceeded", confirms order, publishes "OrderConfirmed"

On failure:
  Payment Service    →  charge fails, publishes "PaymentFailed"
    Inventory Service→  receives "PaymentFailed", releases stock, publishes "StockReleased"
      Order Service  →  receives "StockReleased", cancels order
```

**Advantages:** loose coupling, no single point of failure, services are independent
**Disadvantages:** hard to track overall saga state, difficult to add new steps, debugging is complex

**This is what your Kafka architecture at Country Delight is.** Name it in interviews.

### Orchestration-Based SAGA

A central orchestrator (saga manager) commands each service what to do next and handles failures.

```java
@Component
public class OrderSagaOrchestrator {
    
    public void execute(Order order) {
        // Step 1
        InventoryReservation reservation = inventoryClient.reserve(order);
        
        try {
            // Step 2
            Payment payment = paymentClient.charge(order);
            
            // Step 3
            order.confirm(reservation, payment);
            orderRepository.save(order);
            
        } catch (PaymentFailedException e) {
            // Compensate step 1
            inventoryClient.release(reservation);
            order.cancel();
            orderRepository.save(order);
        }
    }
}
```

**Advantages:** easier to understand the business flow, saga state is visible in one place
**Disadvantages:** orchestrator becomes a coupling point, can become a bottleneck

## Outbox Pattern — Reliable Event Publishing

The dual-write problem: you need to update the database AND publish a Kafka message. These are two separate operations. Either can fail independently.

```java
// WRONG — these two operations are not atomic
@Transactional
public void createOrder(Order order) {
    orderRepository.save(order);    // succeeds
    kafkaProducer.send(orderEvent); // fails — order saved but event not published
    // or the reverse — event published but DB write fails
}
```

The Outbox pattern solves this by making both operations part of the same database transaction:

```java
@Transactional
public void createOrder(Order order) {
    orderRepository.save(order);
    
    // Write the event to an outbox table IN THE SAME TRANSACTION
    OutboxEvent event = new OutboxEvent(order.getId(), "ORDER_CREATED", serialize(order));
    outboxRepository.save(event);
    
    // Both committed atomically — or both rolled back
}

// A separate process reads the outbox table and publishes to Kafka
@Scheduled(fixedDelay = 1000)
public void publishOutboxEvents() {
    List<OutboxEvent> unpublished = outboxRepository.findByPublishedFalse();
    for (OutboxEvent event : unpublished) {
        kafkaProducer.send(event);
        event.setPublished(true);
        outboxRepository.save(event);
    }
}
```

More robustly: use **Debezium** (Change Data Capture) — it reads the MySQL binary log and publishes changes to Kafka automatically. No polling job needed. Near-real-time. Zero application code for the publishing side.

## Idempotent APIs

An operation is idempotent if performing it multiple times produces the same result as performing it once. `GET` and `PUT` are idempotent by nature. `POST` is not.

**Idempotency Key pattern** for POST requests:

```java
@PostMapping("/payments")
public ResponseEntity<PaymentResponse> processPayment(
        @RequestHeader("Idempotency-Key") String idempotencyKey,
        @RequestBody PaymentRequest request) {
    
    // 1. Check if already processed
    String cacheKey = "idempotency:" + idempotencyKey;
    PaymentResponse cached = redisTemplate.opsForValue().get(cacheKey);
    if (cached != null) {
        return ResponseEntity.ok(cached);  // return same response as first time
    }
    
    // 2. Process the payment
    PaymentResponse response = paymentGateway.charge(request);
    
    // 3. Store result with TTL (24 hours — matches client retry window)
    redisTemplate.opsForValue().set(cacheKey, response, 24, TimeUnit.HOURS);
    
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```

The client generates a UUID for each unique business operation and retries with the same UUID. The server returns the same response. The payment is only charged once.

## Circuit Breaker (Resilience4j)

The problem: Service A calls Service B. Service B is slow or down. Service A's threads pile up waiting. Service A's thread pool exhausts. Service A starts failing. Service C which calls Service A also starts failing. One slow service cascades into a full outage.

A circuit breaker is a state machine that detects this and stops calls to the failing service:

```
CLOSED (normal) → error rate exceeds threshold → OPEN (fast fail)
OPEN → wait half-open time → HALF-OPEN (test one request)
HALF-OPEN → success → CLOSED
HALF-OPEN → failure → OPEN
```

```java
@Service
public class ProductService {
    
    private final CircuitBreaker circuitBreaker = CircuitBreaker.ofDefaults("inventoryService");
    
    public ProductAvailability checkAvailability(String sku) {
        return circuitBreaker.executeSupplier(() -> inventoryClient.checkStock(sku));
    }
}

// With Spring Boot Resilience4j starter:
@CircuitBreaker(name = "inventoryService", fallbackMethod = "fallbackAvailability")
public ProductAvailability checkAvailability(String sku) {
    return inventoryClient.checkStock(sku);
}

// Fallback — called when circuit is open
public ProductAvailability fallbackAvailability(String sku, Exception e) {
    log.warn("Inventory service unavailable, assuming in stock: {}", sku);
    return ProductAvailability.assumeAvailable(sku);  // graceful degradation
}
```

**Configuration:**
```yaml
resilience4j:
  circuitbreaker:
    instances:
      inventoryService:
        slidingWindowSize: 10           # evaluate last 10 calls
        failureRateThreshold: 50        # open if >50% fail
        waitDurationInOpenState: 30s    # wait 30s before trying again
        permittedNumberOfCallsInHalfOpenState: 3
```

**Retry with exponential backoff:**
```yaml
resilience4j:
  retry:
    instances:
      inventoryService:
        maxAttempts: 3
        waitDuration: 500ms
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2  # 500ms, 1s, 2s
```

## Distributed Tracing

The problem: a request spans 5 services. Something is slow. Which one?

**The solution:** every request gets a `traceId`. Every service-to-service call within that request gets a `spanId`. Parent-child relationships between spans are recorded. All spans are reported to a central collector.

```
Request → API Gateway (traceId: abc, spanId: 1)
             → Order Service (traceId: abc, spanId: 2, parentSpan: 1)
                 → Inventory Service (traceId: abc, spanId: 3, parentSpan: 2)
                 → Payment Service (traceId: abc, spanId: 4, parentSpan: 2)
```

**OpenTelemetry** (OTel) is the modern standard. Auto-instrumentation agents inject tracing with zero code changes.

```yaml
# application.yml with Spring Boot 3 + Micrometer Tracing
management:
  tracing:
    sampling:
      probability: 0.1  # trace 10% of requests in production
```

The traceId appears in every log line automatically. Search across all service logs by traceId to reconstruct the full request journey.

**Zipkin** or **Jaeger** are common backends — they receive spans, store them, and provide a UI showing the waterfall diagram.

**Production guidance:** don't trace 100% of requests — storage and overhead. 1-10% is typical. Always trace on error (`sampling.probability = 1.0` for error traces).

---

# 13. Kafka and Event-Driven Architecture

## Why Kafka Exists

Traditional message queues (RabbitMQ, SQS) delete messages after consumption. If a consumer fails, the message is lost or redelivered once. You can't replay history. You can't add a new consumer that needs historical data.

Kafka is a **distributed commit log**. Messages (records) are appended to topics and retained for a configurable period (default 7 days). Consumers track their own position (offset). Adding a new consumer starts from wherever it needs — beginning, end, or specific timestamp.

## Core Concepts

**Topic** — a named, ordered, append-only log. The unit of organisation.

**Partition** — each topic is divided into partitions. A partition is an ordered sequence of records with integer offsets (0, 1, 2...). Partitions are the unit of parallelism.

**Producer** — writes records to a topic. Decides which partition via:
- Default: round-robin
- Key-based: `hash(key) % partitions` — all records with the same key go to the same partition

**Consumer** — reads records from partitions. Tracks its offset.

**Consumer Group** — a group of consumers sharing work. Kafka assigns each partition to exactly one consumer in the group. Add more consumers = more parallelism, up to the number of partitions.

**Offset** — integer position of a record within a partition. Consumer commits offsets to Kafka after processing.

## Ordering Guarantees

Kafka guarantees order within a partition. It does NOT guarantee order across partitions.

For order-per-customer: all order events for the same customer must go to the same partition. Use `customerId` as the partition key:

```java
ProducerRecord<String, OrderEvent> record = new ProducerRecord<>(
    "order-events",
    order.getCustomerId(),  // partition key
    orderEvent
);
kafkaProducer.send(record);
```

Now all events for customer 123 are in the same partition, in insertion order.

## Delivery Semantics

**At-most-once** — commit offset before processing. If consumer crashes during processing, the message is lost. Never delivered again. Good for metrics where losing a few data points is acceptable.

**At-least-once** — commit offset after processing. If consumer crashes after processing but before committing, the message is redelivered. May process twice. Requires idempotent consumers.

**Exactly-once** — Kafka Transactions guarantee this end-to-end. Complex to implement. Use when duplicate processing is absolutely unacceptable (financial transfers). Most systems use at-least-once with idempotent consumers.

## Idempotent Consumers

Since Kafka delivers at-least-once, consumers must handle duplicates:

```java
@KafkaListener(topics = "order-events")
public void handleOrderEvent(OrderEvent event) {
    String dedupKey = "processed:" + event.getEventId();
    
    // Check if already processed
    Boolean alreadyProcessed = redisTemplate.opsForValue()
        .setIfAbsent(dedupKey, "1", Duration.ofDays(1));
    
    if (Boolean.FALSE.equals(alreadyProcessed)) {
        log.warn("Duplicate event {}, skipping", event.getEventId());
        return;
    }
    
    // Process the event
    orderService.process(event);
}
```

Alternative: make the downstream operation idempotent itself. Database upsert (`INSERT ... ON DUPLICATE KEY UPDATE`). The dedup check is implicit in the data model.

## Dead Letter Queue

When a consumer fails to process a message after retries, don't lose it. Send it to a Dead Letter Topic (DLT):

```java
@KafkaListener(topics = "order-events")
@RetryableTopic(
    attempts = "3",
    backoff = @Backoff(delay = 1000, multiplier = 2),
    dltTopicSuffix = ".dlt"
)
public void handleOrderEvent(OrderEvent event) {
    orderService.process(event);
}
```

Spring Kafka auto-creates `order-events.dlt`. Failed messages land there. You can inspect them, fix the bug, and replay.

---

# 14. Database Internals

## B+ Tree Index — The Full Picture

Every InnoDB index is a B+ Tree. The properties that matter:

**Balance** — all leaf nodes are at the same depth. Any lookup takes exactly `log_b(N)` disk reads where `b` is the branching factor (number of keys per node, typically hundreds) and `N` is the number of records. With a branching factor of 500 and 1 billion records: `log_500(1_000_000_000)` ≈ 4 levels = 4 disk reads maximum.

**Data only at leaves** — internal nodes hold only keys for routing. All actual row data (or pointers) are at the leaf level.

**Linked leaves** — leaf nodes form a doubly linked list. For range queries (`WHERE created_at BETWEEN '2024-01-01' AND '2024-01-31'`): binary search to the first matching leaf, walk forward through the linked list until out of range. No tree traversal needed for the range walk.

## Clustered vs Secondary Index in InnoDB

**Clustered index** — the table's physical storage IS the B+ Tree. Row data lives at the leaf of the clustered index. In InnoDB, the primary key is always the clustered index. Lookup by PK = one tree traversal, row is right there.

**Secondary index** — a separate B+ Tree. Leaf nodes contain the indexed column values + the primary key (not the row data). Lookup by secondary index = two traversals: secondary index tree to get PK, then clustered index tree to get row. This second traversal is called a **bookmark lookup** or **row fetch**.

**Covering index** — a secondary index that includes all columns the query needs. No bookmark lookup needed:

```sql
-- Query
SELECT name, email FROM users WHERE department = 'Engineering';

-- Covering index: (department, name, email)
-- The answer is in the index itself — never touches the main table
CREATE INDEX idx_dept_name_email ON users (department, name, email);
```

## The Left-Prefix Rule in Detail

A composite index on `(a, b, c)` can answer queries on:
- `WHERE a = ?` — yes
- `WHERE a = ? AND b = ?` — yes
- `WHERE a = ? AND b = ? AND c = ?` — yes
- `WHERE a = ? AND c = ?` — partial (uses index for `a`, scans for `c`)
- `WHERE b = ?` — no (skips leftmost column)
- `WHERE b = ? AND c = ?` — no

**Index design principle:** put the most selective column first. High cardinality (many distinct values) columns filter more rows per comparison.

```sql
-- Bad: low selectivity first
CREATE INDEX idx_on_status_userid ON orders (status, user_id);
-- status has 5 values — first level of tree has 5 branches
-- user_id has millions of values — good selectivity, but too late

-- Good: high selectivity first
CREATE INDEX idx_on_userid_status ON orders (user_id, status);
-- user_id narrows to one user's orders immediately
```

## EXPLAIN — The Most Important Query Tool

```sql
EXPLAIN SELECT * FROM orders WHERE customer_id = 123 AND status = 'PENDING';

+----+-------+----------------------------+------+----------+-------+
| id | table | key                        | rows | filtered | Extra |
+----+-------+----------------------------+------+----------+-------+
|  1 | orders| idx_customer_status        |    5 |   100.00 |       |
+----+-------+----------------------------+------+----------+-------+
```

`key` — which index was used (`NULL` = full table scan — problem!)
`rows` — estimated rows examined (lower = better)
`Extra` — `Using index` = covering index (excellent), `Using filesort` = sorting in memory (can be expensive), `Using temporary` = temporary table (expensive)

Always run EXPLAIN before adding an index to a slow query.

## Pessimistic vs Optimistic Locking

**Pessimistic locking** — lock the row when you read it. No other transaction can read or write it until you're done.

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT p FROM Product p WHERE p.sku = :sku")
Optional<Product> findBySkuWithLock(@Param("sku") String sku);
```

Generated SQL: `SELECT ... FOR UPDATE`. Database-level row lock. Guaranteed no concurrent modification. Good for: high-contention rows, short transactions, when conflicts are very likely.

**Optimistic locking** — no lock on read. On write, verify nothing changed since you read it.

```java
@Entity
public class Product {
    @Version
    private Long version;  // JPA manages this automatically
}
```

On update, JPA generates: `UPDATE products SET ... , version = version + 1 WHERE id = ? AND version = ?`

If another transaction updated between your read and write, the version won't match. JPA throws `OptimisticLockException`. You catch it and retry.

**Choosing between them:**

| Scenario | Best Choice |
|---|---|
| Low contention, read-heavy | Optimistic — no locking overhead on most reads |
| High contention, write-heavy | Pessimistic — prevent retry storms |
| Short transactions | Either |
| Long transactions | Optimistic — don't hold locks for long periods |
| Can't retry on failure | Pessimistic — guaranteed success or proper error |

**The atomic update alternative** — avoid application-level locking entirely:

```java
@Modifying
@Transactional
@Query("UPDATE Product p SET p.reservedQty = p.reservedQty + :qty " +
       "WHERE p.sku = :sku AND (p.totalQty - p.reservedQty) >= :qty")
int reserveStock(@Param("sku") String sku, @Param("qty") int qty);
// Returns 1 = success, 0 = insufficient stock
// Database row-level atomicity — no application lock needed
```

## MVCC — How Databases Avoid Locking on Reads

Multi-Version Concurrency Control keeps multiple versions of each row. Readers see a consistent snapshot without blocking writers.

**Read Committed:** your snapshot refreshes at the start of each statement. You always see the latest committed data.

**Repeatable Read:** your snapshot is taken at the start of the transaction. All reads within the transaction see the same version of every row, even if others commit changes. This is how you can read the same row twice and see the same value.

Writers create new row versions. Readers read old versions from the undo log. Readers and writers never block each other. This is the mechanism that makes high-concurrency databases fast.

---

# 15. Caching Strategies

## Why Cache

Every cache exists for one reason: the source of truth (database, external API) is slower than needed. Cache is a fast, temporary copy of data.

The tradeoffs: faster reads, stale data risk, more complexity, more memory.

## Cache-Aside (Lazy Loading) — The Default Pattern

```java
public Product getProduct(String sku) {
    // 1. Check cache
    Product cached = cache.get(sku);
    if (cached != null) return cached;
    
    // 2. Cache miss — fetch from DB
    Product product = productRepository.findBySku(sku)
        .orElseThrow(() -> new NotFoundException(sku));
    
    // 3. Populate cache
    cache.put(sku, product, Duration.ofMinutes(10));
    
    return product;
}
```

**Pros:** only caches what's actually requested, resilient to cache failure (just hits DB)
**Cons:** cold start — first request after cache miss (or startup) hits DB, thundering herd if cache expires for a popular item

## Write-Through

On every write, update both cache and DB in the same operation.

```java
public Product updateProduct(String sku, ProductUpdateRequest request) {
    Product product = productRepository.findBySku(sku).orElseThrow();
    product.setPrice(request.getPrice());
    productRepository.save(product);
    
    cache.put(sku, product, Duration.ofMinutes(10));  // update cache
    return product;
}
```

**Pros:** cache always has latest data, no stale reads
**Cons:** write latency includes cache write, caches items that may never be read

## L1 + L2 Hybrid Cache

For high-read scenarios, a two-level cache eliminates even the Redis network call for hot data.

**L1 (local/in-process)** — Caffeine cache, lives in the JVM heap. Sub-millisecond reads. Size-limited. Per-instance — not shared.

**L2 (distributed)** — Redis. Shared across all instances. ~1ms network latency. Consistent.

```java
@Service
public class ProductCacheService {
    
    private final Cache<String, Product> l1Cache = Caffeine.newBuilder()
        .maximumSize(10_000)
        .expireAfterWrite(Duration.ofSeconds(30))  // short TTL — accept slight staleness
        .build();
    
    private final RedisTemplate<String, Product> redisTemplate;
    private final ProductRepository repository;
    
    public Product getProduct(String sku) {
        // Level 1 — local cache
        Product l1Hit = l1Cache.getIfPresent(sku);
        if (l1Hit != null) return l1Hit;
        
        // Level 2 — Redis
        Product l2Hit = redisTemplate.opsForValue().get("product:" + sku);
        if (l2Hit != null) {
            l1Cache.put(sku, l2Hit);  // populate L1
            return l2Hit;
        }
        
        // Source of truth — DB
        Product product = repository.findBySku(sku).orElseThrow();
        redisTemplate.opsForValue().set("product:" + sku, product, Duration.ofMinutes(10));
        l1Cache.put(sku, product);
        return product;
    }
    
    public void invalidateProduct(String sku) {
        // Invalidate L2 first
        redisTemplate.delete("product:" + sku);
        // Invalidate L1 on this instance
        l1Cache.invalidate(sku);
        // Notify other instances to invalidate their L1
        redisTemplate.convertAndSend("cache-invalidation", sku);
    }
}

// Other instances subscribe and invalidate their L1
@Component
public class CacheInvalidationListener {
    private final Cache<String, Product> l1Cache;
    
    @EventListener
    public void onCacheInvalidation(String sku) {
        l1Cache.invalidate(sku);
    }
}
```

## Cache Stampede / Thundering Herd

When a popular cache entry expires, many concurrent requests miss the cache simultaneously and all try to populate it. This spikes DB load.

**Solutions:**

**Probabilistic early expiration** — before the TTL expires, with a probability proportional to how close to expiry, one thread recomputes early. Others still get the cached value.

**Lock-based refresh** — only one thread recomputes. Others wait (or return stale value):

```java
public Product getProductWithLock(String sku) {
    Product cached = cache.get(sku);
    if (cached != null) return cached;
    
    String lockKey = "lock:product:" + sku;
    Boolean acquired = redisTemplate.opsForValue()
        .setIfAbsent(lockKey, "1", Duration.ofSeconds(5));
    
    if (Boolean.TRUE.equals(acquired)) {
        // This thread wins — fetch and populate
        Product product = repository.findBySku(sku).orElseThrow();
        cache.put(sku, product, Duration.ofMinutes(10));
        redisTemplate.delete(lockKey);
        return product;
    } else {
        // Another thread is fetching — wait briefly and retry
        Thread.sleep(100);
        return getProductWithLock(sku);  // recursive retry
    }
}
```

## Redis Data Structures for Production Patterns

Redis is not just a key-value store. Its data structures enable specific patterns:

```java
// Distributed counter (for rate limiting)
Long count = redisTemplate.opsForValue().increment("rate:userId:123");
redisTemplate.expire("rate:userId:123", Duration.ofMinutes(1));

// Leaderboard (sorted set — O(log N) insert, O(log N) rank query)
redisTemplate.opsForZSet().add("leaderboard", "userId:123", score);
Set<ZSetOperations.TypedTuple<String>> top10 = 
    redisTemplate.opsForZSet().reverseRangeWithScores("leaderboard", 0, 9);

// Deduplication set (for idempotency)
Boolean isNew = redisTemplate.opsForSet().add("processed", eventId);

// Pub/Sub for cache invalidation
redisTemplate.convertAndSend("cache-updates", message);

// Atomic check-and-set (NX = only set if not exists)
Boolean set = redisTemplate.opsForValue()
    .setIfAbsent("idempotency:" + key, response, Duration.ofDays(1));
```

---

# 16. Schema Migrations and Zero-Downtime Deployments

## Flyway — Database Migration Management

Flyway tracks which SQL scripts have been run using a `flyway_schema_history` table. Scripts are named with version numbers. Flyway runs new scripts in order on startup.

```
db/migration/
├── V1__create_products_table.sql
├── V2__add_category_column.sql
├── V3__create_orders_table.sql
└── V4__add_product_sku_index.sql
```

```sql
-- V4__add_product_sku_index.sql
CREATE UNIQUE INDEX idx_product_sku ON products (sku);
```

Flyway checksums every script. If a previously-run script is modified, Flyway refuses to start (protecting against accidental changes to production data). Add new versions, never modify existing ones.

## Zero-Downtime Schema Changes — The Expand-Contract Pattern

**Never do this in production:** rename a column in one migration. The old service version references the old name and will fail the moment you deploy the migration.

The correct approach has three phases:

**Phase 1 — Expand**
```sql
-- V5__add_new_column.sql
-- Add new column alongside old column. Both work. No data moved yet.
ALTER TABLE orders ADD COLUMN customer_reference VARCHAR(100);
```
Deploy new service version that writes to both `customer_id` AND `customer_reference`. Reads from old column. Deployed to production — both old and new service versions work.

**Phase 2 — Migrate**
```sql
-- V6__backfill_new_column.sql
-- Copy data from old column to new column for existing rows
UPDATE orders SET customer_reference = CAST(customer_id AS VARCHAR) WHERE customer_reference IS NULL;
```
Run as a background job, not in a single transaction (too slow for large tables). Batch it.

**Phase 3 — Contract**
```sql
-- V7__drop_old_column.sql
-- Remove old column once all service versions use the new one
ALTER TABLE orders DROP COLUMN customer_id;
```
Only safe once NO running service version references the old column. This usually requires multiple deployments.

## Blue-Green Deployment

Two identical production environments. "Blue" is live. "Green" is the new version.

```
Load Balancer → Blue (v1, live)
              → Green (v2, ready)

Switch:
Load Balancer → Green (v2, now live)
              → Blue (v1, standby)
```

Rollback = switch back to Blue. Instant. No data migration needed (both share the same database). The new version is fully tested before receiving traffic.

**DB schema consideration:** when you switch, both Blue (old) and Green (new) must be compatible with the current database schema. The expand phase of your migration must be done before the switch.

## Canary Deployment

Route a small percentage of traffic to the new version. Monitor. Increase gradually.

```
Load Balancer → v1 (95% of traffic)
              → v2 (5% of traffic — canary)
```

Catch issues (errors, latency regressions, business metric drops) with limited blast radius. Automatic canary analysis compares metrics between canary and baseline and can roll back automatically.

**Feature Flags** decouple deployment from release. Deploy the code but hide it behind a flag. Enable for internal users, then 1%, then gradually roll out. The code is in production but not "released". Dark launches — run the new code path in shadow, compare results with old path, without showing to users.

---

# 17. Observability

## The Three Pillars

A service is observable if you can understand its internal state from external outputs without deploying new code. The three outputs are logs, metrics, and traces.

## Structured Logging

Plain text logs are searchable with grep. Structured JSON logs are queryable as data:

```java
// Bad — structured data embedded in a string
log.info("Order {} created for user {} with total {}", orderId, userId, total);
// Searching for total > 1000 requires parsing strings

// Good — structured JSON
log.info("Order created",
    kv("orderId", orderId),
    kv("userId", userId),
    kv("totalAmount", total),
    kv("currency", "INR")
);
// Query: totalAmount > 1000 AND currency = "INR" — trivial in any log platform
```

Logback with Logstash encoder produces JSON:

```xml
<!-- logback-spring.xml -->
<appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LogstashEncoder"/>
</appender>
```

**What to always include in every log line:**
- `traceId` and `spanId` (auto-injected by OTel/Sleuth)
- `userId` or `customerId` (from SecurityContext)
- `requestId`
- Service name and version
- Environment

With these fields, you can: find all logs for a user across all services, reconstruct a distributed trace by traceId, correlate a user complaint to specific error logs.

## Metrics with Micrometer

Micrometer is the metrics facade for JVM applications — like SLF4J for metrics. Write to Micrometer, it exports to any backend (Prometheus, Datadog, CloudWatch).

Spring Boot Actuator auto-configures many metrics. Add the Prometheus dependency:

```xml
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

`GET /actuator/prometheus` now serves all metrics in Prometheus format. Prometheus scrapes this endpoint every 15 seconds.

**Custom business metrics:**

```java
@Service
public class OrderService {
    
    private final MeterRegistry meterRegistry;
    private final Counter ordersCreated;
    private final Timer orderProcessingTime;
    
    public OrderService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.ordersCreated = Counter.builder("orders.created")
            .tag("environment", "production")
            .register(meterRegistry);
        this.orderProcessingTime = Timer.builder("orders.processing.time")
            .register(meterRegistry);
    }
    
    public Order createOrder(OrderRequest request) {
        return orderProcessingTime.record(() -> {
            Order order = doCreateOrder(request);
            ordersCreated.increment();
            return order;
        });
    }
}
```

**The four golden signals (Google SRE):**
1. **Latency** — time to serve a request. Distinguish successful vs failed (failed requests might be fast but that's misleading).
2. **Traffic** — requests per second. Establishes baseline.
3. **Errors** — error rate. `http_server_requests_seconds_count{status="500"}` / total.
4. **Saturation** — how full is the service? Thread pool utilization, connection pool usage, JVM heap.

**Grafana dashboards** visualise Prometheus data. Alert rules fire when:
- P99 latency > 500ms
- Error rate > 1%
- JVM heap > 85%
- Connection pool active connections > 90% of max

## Spring Boot Actuator

`/actuator/health` — liveness and readiness probes for Kubernetes/load balancers. Returns UP/DOWN with component details.

```java
@Component
public class KafkaHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        try {
            kafkaAdmin.listTopics();  // verify connection
            return Health.up().withDetail("status", "connected").build();
        } catch (Exception e) {
            return Health.down().withException(e).build();
        }
    }
}
```

`/actuator/metrics` — all registered metrics
`/actuator/env` — current configuration (sanitised — passwords hidden)
`/actuator/loggers` — change log levels at runtime without restart
`/actuator/threaddump` — current thread states (invaluable for debugging deadlocks)

## Audit Logging

Three approaches, in increasing sophistication:

**Spring Data JPA Auditing** — automatically populates created/modified timestamps and user:

```java
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class AuditConfig {
    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> Optional.ofNullable(SecurityContextHolder.getContext())
            .map(SecurityContext::getAuthentication)
            .map(Authentication::getName);
    }
}

@EntityListeners(AuditingEntityListener.class)
@MappedSuperclass
public abstract class AuditableEntity {
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    @CreatedBy
    private String createdBy;
    
    @LastModifiedBy
    private String lastModifiedBy;
}
```

**Hibernate Envers** — full entity versioning. Every change creates a revision:

```java
@Entity
@Audited  // that's all you need
public class Product {
    // ...
}

// Query audit history
AuditReader reader = AuditReaderFactory.get(entityManager);
List<Number> revisions = reader.getRevisions(Product.class, productId);
Product productAt2023 = reader.find(Product.class, productId, revisionAt2023);
```

**AOP-based audit** — more flexible, works across any layer:

```java
@Aspect
@Component
public class AuditAspect {
    
    @Around("@annotation(Audited)")
    public Object audit(ProceedingJoinPoint pjp) throws Throwable {
        AuditLog log = AuditLog.builder()
            .userId(getCurrentUserId())
            .action(pjp.getSignature().getName())
            .arguments(serialize(pjp.getArgs()))
            .timestamp(Instant.now())
            .build();
        
        try {
            Object result = pjp.proceed();
            log.setStatus("SUCCESS");
            return result;
        } catch (Exception e) {
            log.setStatus("FAILED");
            log.setError(e.getMessage());
            throw e;
        } finally {
            auditLogRepository.save(log);  // use REQUIRES_NEW — always saves
        }
    }
}
```

---

# 18. Cloud Concepts at Interview Depth

## AWS Services — What You Actually Need to Know

**EC2** — virtual machines. You don't configure these directly. Know that your services run on them (or containers on them).

**ECS (Elastic Container Service)** — run Docker containers. You define tasks (container + resource requirements) and services (how many copies, load balancing). Fargate removes even EC2 management.

**EKS (Elastic Kubernetes Service)** — managed Kubernetes. Full k8s API, AWS manages the control plane. Use when you need k8s-specific features (operators, custom resources, advanced scheduling).

**SQS** — managed message queue:
- Standard queue: at-least-once delivery, best-effort ordering
- FIFO queue: exactly-once delivery, strict ordering (lower throughput)
- **Visibility timeout** — when a consumer receives a message, it's hidden for N seconds. If not deleted within N seconds (processing failed), it reappears for another consumer. Set visibility timeout > your max processing time.
- **Dead Letter Queue** — after `maxReceiveCount` failed deliveries, message moves to DLQ. Inspect and replay failed messages.

**Lambda** — serverless functions. Event-triggered (HTTP, S3 event, SQS message, scheduled). Pay per invocation. Zero infrastructure management.
- **Cold start** — first invocation after idle period initialises the JVM and your application code. Can be 1-5 seconds for Java. Subsequent invocations reuse the warm container (milliseconds). Mitigate with: provisioned concurrency (keep containers warm), smaller deployment packages, GraalVM native image (Spring Boot Native).
- Use Lambda for: async processing, event-driven pipelines, scheduled jobs, infrequent operations. Don't use for: latency-sensitive sync APIs, long-running operations (15 min max), high-frequency steady traffic (EC2/containers are cheaper).

**ElastiCache** — managed Redis or Memcached. Your Redis knowledge directly applies. Multi-AZ for HA. Cluster mode for horizontal scaling.

**RDS** — managed relational databases. Automated backups, point-in-time recovery, read replicas for read scaling, Multi-AZ standby for failover.

**S3** — object storage. 11 nines durability. Unlimited capacity. Use for: file uploads, backups, static assets, data lake, deployment artifacts.

**CloudWatch** — AWS's logging and monitoring. Your structured logs ship here. Metrics auto-collected from AWS services. Alarms trigger SNS or Lambda.

## Horizontal vs Vertical Scaling

**Vertical scaling** — bigger machine. More CPU cores, more RAM. Simple, no code changes, no distributed coordination. Hard ceiling (largest EC2 instance). Single point of failure.

**Horizontal scaling** — more machines, identical services, behind a load balancer. Theoretically unlimited. Requires stateless services (state in DB/cache, not in-process).

Microservices are designed for horizontal scaling. Every service is stateless — any instance can handle any request. Adding instances is just incrementing a count in ECS or Kubernetes.

## High Availability Patterns

**Multi-AZ** — deploy instances in multiple availability zones (physically separate data centres within a region). If one AZ loses power or networking, others serve traffic. RDS Multi-AZ: automatic failover to standby in another AZ.

**Auto-scaling** — automatically add/remove instances based on metrics (CPU, request rate, queue depth). Scale out when load increases, scale in when load decreases. Cost-efficient and resilient.

**Health checks + load balancer** — load balancer pings `/actuator/health` on each instance. Unhealthy instances receive no traffic and are replaced. Your service is effectively always running the latest healthy version.

---

# 19. System Design Vocabulary Quick Reference

Terms that come up constantly. Know these cold.

| Term | One-Line Definition |
|---|---|
| **CAP Theorem** | Distributed system can guarantee at most 2 of: Consistency, Availability, Partition Tolerance. Since partitions happen, choose CP or AP. |
| **BASE** | Basically Available, Soft state, Eventually consistent. The AP alternative to ACID. |
| **Eventual Consistency** | Data will be consistent across nodes eventually, not immediately. Your Kafka pipeline. |
| **Strong Consistency** | Every read sees the most recent write. Requires coordination. Slower. |
| **Idempotency** | Same operation performed multiple times = same result as once. |
| **Backpressure** | Downstream signals upstream to slow down when overwhelmed. `CallerRunsPolicy` is backpressure. |
| **Sharding** | Partition data across multiple nodes by a shard key. Horizontal data scaling. |
| **Replication** | Copy data across multiple nodes. Redundancy and read scaling. |
| **Leader Election** | When multiple nodes exist, one is chosen as leader for coordination. Zookeeper, etcd. |
| **Two-Phase Commit** | Distributed transaction protocol. Phase 1: prepare. Phase 2: commit or rollback. Blocking, poor availability. |
| **CQRS** | Command Query Responsibility Segregation. Separate write model (commands) from read model (queries). |
| **Event Sourcing** | Store events, not current state. Current state derived by replaying events. |
| **Bloom Filter** | Probabilistic data structure. Can say "definitely not in set" or "probably in set". Space-efficient. |
| **Consistent Hashing** | Hash ring for distributing data across nodes. Adding/removing a node minimises data movement. |
| **Rate Limiting** | Restrict number of requests per unit time. Sliding window, token bucket, leaky bucket algorithms. |
| **Bulkhead** | Isolate components so failure in one doesn't cascade. Separate thread pools per downstream. |
| **Strangler Fig** | Incrementally replace a legacy system by routing traffic to new implementation piece by piece. |

---

# 20. Interview Answer Templates

These are the direct answers to questions that come up repeatedly. Memorise the structure, personalise with your experience.

---

**"Tell me about yourself"**

> "I'm a backend engineer with 4 years of experience, all at Country Delight — a D2C food delivery platform. I joined as an intern and grew into owning core backend systems. The most significant work I've done is building a real-time offer engine that processes cart-level promotions at checkout — it handles peak traffic with sub-100ms latency using multi-layer Redis caching and event-driven architecture. I've also built an analytics platform processing millions of events daily through a Kafka-ClickHouse pipeline. I'm strongest in distributed systems — concurrency, event-driven design, caching, and making services resilient under load. I'm looking for an opportunity to apply this at larger scale and deeper complexity."

---

**"Tell me about a hard technical problem"**

> "The hardest problem I solved was preventing overselling during flash sales on the offer engine. We had limited promotional offers — say, 100 units at a discount — and thousands of concurrent requests trying to claim them. The naive approach of read-check-write had a race condition. I solved it with an atomic conditional UPDATE at the database level — the WHERE clause checked availability and performed the decrement in one SQL statement, using the database's row-level atomicity rather than application locks. This eliminated both the race condition and the retry storm that optimistic locking would have caused under high concurrency. It resulted in a 10% increase in average order value with no overselling incidents."

---

**"How do you handle consistency in microservices?"**

> "We use event-driven architecture with Kafka as the backbone — this is the Saga choreography pattern. Services publish events on state changes; other services react to those events. We accept eventual consistency in exchange for availability and loose coupling. For idempotency, since Kafka delivers at-least-once, consumers check a Redis dedup key before processing. For operations requiring stronger consistency within a single service boundary, we use database-level locking — either pessimistic locking with SELECT FOR UPDATE or atomic conditional updates for high-contention scenarios. We don't use distributed transactions — the complexity and availability cost isn't worth it for our use case."

---

**"How would you design a system for high availability?"**

> "Three layers: stateless services behind a load balancer for horizontal scaling and automatic failover; Multi-AZ deployment so a single data centre failure doesn't take us down; and circuit breakers with fallbacks so a single service failure doesn't cascade. For the database: read replicas for read scaling, Multi-AZ standby for failover. For caching: Redis cluster so the cache itself isn't a single point of failure. Everything is health-checked — load balancers continuously verify each instance and remove unhealthy ones. Deployments are blue-green or canary, never big-bang, so a bad deployment can be rolled back instantly. The goal is that any single component can fail and the system degrades gracefully rather than going down."

---

**"How do you make a service observable?"**

> "Three things from day one. Structured JSON logging with traceId, userId, and requestId on every line — so you can grep across all services by a single ID. Micrometer metrics exposed via Actuator, scraped by Prometheus, visualised in Grafana — with alerts on P99 latency, error rate, and connection pool saturation. Distributed tracing with OpenTelemetry so you can see a waterfall of any request across all services. Beyond instrumentation: meaningful health endpoints that check actual dependencies (DB, Redis, Kafka), not just "is the process running". And runbooks for every alert — the on-call engineer should know exactly what to do when an alert fires."

---

## Recommended Resources

**Books (worth reading, not just referencing):**
- "Designing Data-Intensive Applications" — Martin Kleppmann. The best distributed systems book ever written. Read chapters on replication, partitioning, transactions, and consistency.
- "Clean Code" — Robert Martin. Foundational. Read once.
- "Java Concurrency in Practice" — Goetz et al. The definitive Java concurrency reference.

**Blogs and articles:**
- [Martin Fowler's website](https://martinfowler.com) — SAGA, CQRS, Event Sourcing, Strangler Fig — all defined here with clarity
- [Netflix Tech Blog](https://netflixtechblog.com) — real production distributed systems problems at scale
- [AWS Architecture Blog](https://aws.amazon.com/blogs/architecture/) — cloud patterns from practitioners
- [High Scalability](http://highscalability.com) — real-world architecture breakdowns of major systems
- [Confluent Blog](https://www.confluent.io/blog/) — Kafka patterns, event-driven architecture

**For Java-specific depth:**
- [Baeldung](https://www.baeldung.com) — the most thorough Spring/Java tutorial site. Particularly good for: CompletableFuture, @Transactional internals, Spring Security, JPA locking.
- JEPs (Java Enhancement Proposals) for Virtual Threads (JEP 444) and Structured Concurrency (JEP 453) — read the motivation sections, they explain the *why* better than any tutorial.

**Topics to study separately with AI assistance:**
- Spring Security OAuth2 / OIDC flow in detail
- Kubernetes operators and custom resources (if k8s is relevant)
- gRPC in Spring Boot — proto files, generated code, interceptors
- Reactive programming with Project Reactor (Mono/Flux) — if WebFlux comes up
- GraalVM Native Image for Spring Boot — eliminates cold start, relevant for Lambda

---

*Last updated for Java 21, Spring Boot 3.2, Resilience4j 2.x*
