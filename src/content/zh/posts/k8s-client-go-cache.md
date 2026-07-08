+++
title      = "client-go 缓存客户端解析"
date       = 2025-07-13T14:10:00
tags       = ["kubernetes", "golang"]
series     = []
draft      = false
lastmod    = 2025-07-13T14:10:00
+++

**概要**: `client-go` 内置了一个基于 SharedInformer 的 **读穿透（read-through）、写旁路（write-around）** 缓存层。  `GET` / `LIST` 请求命中内存中的 **Indexer**，任何 **写操作** 则直发 API Server。这可以将控制器的读取延迟降低约 **90 %**，但要避免读到脏数据或掉进性能坑，你必须搞懂 **同步窗口（sync window）**、**深拷贝** 以及 **字段索引（field index）**。

---

## 为什么要用缓存？

| 纯 REST（无缓存）                 | 使用 `DelegatingClient`               |
|----------------------------------|---------------------------------------|
| 每次 `Get/List` → HTTPS → API Server → etcd | 进程内 Map 查询（0 RTT）             |
| 容易触发 QPS / watch 节流        | 读开销近乎 0，API Server 几乎无压力   |
| 集群繁忙时尾延迟 ~100 ms          | 典型延迟 < 1 µs                      |

控制器以“读”为主：比对 **期望** 与 **实际** 状态，只偶尔写入。缓存把这些读取摊平到内存。

---

## 关键组件

{{< mermaid >}}
flowchart LR
  A[Reflector] --> B(DeltaFIFO)
  B --> C[Indexer]
  C -->|Read| D(Cache Client)
  D -->|Write| E(API Server)
{{< /mermaid >}}

1. **Reflector** —— 从 API Server 流式拉取 `ADD / UPDATE / DELETE` 事件  
2. **DeltaFIFO** —— 缓冲事件，保证处理 Goroutine 不阻塞 watch  
3. **Store / Indexer** —— 线程安全 Map，以 `namespace/name` 为键，可加二级索引  
4. **缓存客户端（`DelegatingClient`）**  
   * **读**：`Get`、`List` → Store  
   * **写**：`Create`、`Update`、`Patch`、`Delete` → 直发 REST

---

## 真正的调用链 —— `c.Get(ctx, key, obj)`

```go
func (c *delegatingClient) Get(ctx context.Context,
                               key client.ObjectKey,
                               obj client.Object) error {
    // 1. 先从缓存 deepCopy 数据到 obj
    if err := c.cache.Get(ctx, key, obj); err == nil {
        return nil
    }
    // 2. 缓存未同步时回退到直连 API Server
    return c.client.Get(ctx, key, obj)
}
````

### 同步窗口（Sync Window）

* 启动时缓存 **为空**
* 首次 `LIST+WATCH` 完成后 `HasSynced()` 变为 true
* 期间所有读都会回退到 REST

```go
mgr.GetCache().WaitForCacheSync(ctx)
```

---

## 字段索引 = O(1) 二级查询

想找被某个 Service 选中的所有 Pod？

```go
mgr.GetFieldIndexer().IndexField(
    &corev1.Pod{},       // 资源类型
    ".spec.nodeName",    // 字段路径
    func(obj client.Object) []string {
        pod := obj.(*corev1.Pod)
        return []string{pod.Spec.NodeName}
})
```

之后：

```go
var pods corev1.PodList
_ = r.List(ctx, &pods,
           client.MatchingFields{".spec.nodeName": req.NodeName})
```

无需网络往返，Indexer 维护了反向索引。

---

## 写操作刻意绕过缓存

`Create` / `Patch` **不会** 立即反映到本地缓存。
Informer 会在几毫秒后监听到自己的变更并更新 Store。
👉 把缓存视为**最终一致**，Reconcile 循环务必幂等。

---

## 性能评估

| 操作                 | 直连 REST    | 缓存命中       | 提速          |
| ------------------ | ---------- | ---------- | ----------- |
| 单个 `Get Pod`       | 6.8 ms p95 | 35 µs p95  | **-99.5 %** |
| `List` 1000 个 Pods | 140 ms p95 | 1.7 ms p95 | **-98.8 %** |

环境：3 节点 KIND 集群 · Go 1.22 · client-go 0.30.0

---

## 常见的坑

| 症状      | 可能原因                 | 快速修复                                     |
| ------- | -------------------- | ---------------------------------------- |
| 读到旧数据   | 少了 deep-copy 或比较了指针  | 修改前先 `obj.DeepCopy()`；切勿把指针塞进 Map        |
| 内存飙升    | `LIST` 返回过大，塞满 Store | 为 Informer 加 Label 选择器；缩短 resync 周期      |
| 偶发缓存未命中 | 类型未注册到 Scheme        | 在 `init()` 里 `schemeBuilder.AddToScheme` |

---

## 总结

* **所有** `GET/LIST` 都用缓存；不要混用自定义 REST Client
* 启动时一定等 `HasSynced()`
* 字段索引越早加越好，成本几乎为零
* 记住缓存最终一致，Reconcile 需幂等、可重试

