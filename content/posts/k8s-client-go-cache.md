+++
title      = "client-go Cache, Explained"
date       = 2025-07-13T14:10:00
tags       = ["kubernetes", "golang"]
series     = []
draft      = false
lastmod    = 2025-07-13T14:10:00
+++

> **TL;DR** `client-go` ships a _read-through, write-around_ caching layer built on SharedInformers.  A `GET`/`LIST` hits an in-memory `Indexer`; anything that _mutates_ goes straight to the API server.  This cuts the controller read latency by ~90 %, but you need to understand **sync windows**, **deep-copies**, and **field indexes** to avoid stale reads and perf foot-guns.

## Why bother with a cache?

| Without cache (plain REST) | With `DelegatingClient` |
|---------------------------|--------------------------|
| Every `Get/List` → HTTPS → API server → etcd | In-process map lookup (zero RTT) |
| High QPS & watch throttling | Near-zero read cost; server load ≈ 0 |
| 100 ms tail latency on busy clusters | sub-µs typical |

Controllers are _read-heavy_: they reconcile, compare desired vs. actual, and only occasionally write. Caching amortises that read path.

## The moving parts

{{< mermaid >}}
flowchart LR
  A[Reflector] --> B(DeltaFIFO)
  B --> C[Indexer]
  C -->|Read| D(Cache Client)
  D -->|Write| E(API Server)
{{< /mermaid >}}

1. **Reflector** – streams events (`ADD/UPDATE/DELETE`) from the API server.
2. **DeltaFIFO** – buffers events so processing Goroutines never block the watch.
3. **Store / Indexer** – thread-safe map keyed by `namespace/name` **+** optional custom indexes.
4. **Cache client (`DelegatingClient`)** –

   * **Reads**: `Get`, `List` → Store.
   * **Writes**: `Create`, `Update`, `Patch`, `Delete` → REST.

## A real code path — `c.Get(ctx, key, obj)`

```go
func (c *delegatingClient) Get(ctx context.Context, key client.ObjectKey, obj client.Object) error {
    // 1. deepCopy into obj from the Informer cache
    if err := c.cache.Get(ctx, key, obj); err == nil {
        return nil
    }
    // 2. fallback to direct client (rare, e.g. cache miss before sync)
    return c.client.Get(ctx, key, obj)
}
```

### Sync window

* On start-up the cache is **empty**.
* `HasSynced()` becomes true after the first `LIST+WATCH` finishes.
* Until then the client falls back to direct REST calls.

  ```go
  mgr.GetCache().WaitForCacheSync(ctx)
  ```

## Field indexes = O(1) secondary look-ups

Need all `Pods` selected by a `Service` label?

```go
mgr.GetFieldIndexer().IndexField(
    &corev1.Pod{},                 // type
    ".spec.nodeName",              // field path
    func(obj client.Object) []string {
        pod := obj.(*corev1.Pod)
        return []string{pod.Spec.NodeName}
})
```

Now:

```go
var pods corev1.PodList
_ = r.List(ctx, &pods,
           client.MatchingFields{".spec.nodeName": req.NodeName})
```

No server round-trip; the Indexer maintains a reverse map under the hood.

## Writes bypass the cache (on purpose)

A `Create` or `Patch` **does not** immediately appear in your cache.
The informer will observe its own change a few milliseconds later and update the Store.
👉 Always treat the cache as *eventually consistent*; reconcile loops should be idempotent.

## Performance snapshot

| Operation          | Direct REST | Cache hit  | Δ           |
| ------------------ | ----------- | ---------- | ----------- |
| `Get Pod` (single) | 6.8 ms p95  | 35 µs p95  | **-99.5 %** |
| `List Pods - 1 k`  | 140 ms p95  | 1.7 ms p95 | **-98.8 %** |

Tested on a 3-node KIND cluster, Go 1.22, client-go 0.30.0.

## Common pitfalls

| Symptom                 | Likely cause                                | Quick fix                                                          |
| ----------------------- | ------------------------------------------- | ------------------------------------------------------------------ |
| Reads return stale data | Missing deep-copy or comparing pointer refs | `obj.DeepCopy()` before mutating; never cache raw pointers in maps |
| High memory usage       | Large `LIST` results in Store               | Add label selectors to Informer; narrow resync period              |
| Random cache misses     | Forgot to add type to Scheme                | `schemeBuilder.AddToScheme(scheme)` in `init()`                    |


## Take-aways

* Use the cache for **all** GET/LISTs inside controllers—don’t mix in custom REST clients.
* Always wait for `HasSynced()` during startup.
* Add field indexes early; they’re free once built.
* Expect eventual consistency and design reconciles to retry.

