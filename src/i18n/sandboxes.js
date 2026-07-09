export const SANDBOXES = [
  {
    id: 'transformer',
    cat: 'N-021',
    date: '2026-07-09',
    updated: 'July 9, 2026',
    mins: 12,
    tags: ['transformers', 'attention', 'neural-nets'],
    en: {
      title: 'A transformer you can dissect',
      desc: 'A live 18k-parameter model in your browser — trace attention, blocks, and generation on real numbers.',
      body: 'A tiny transformer (2 layers, 4 heads, d=32) trained on a toy grammar runs live in your browser — every number you see is a real forward pass. Four stations: watch a sentence become a matrix, follow one attention head end to end (Q·K, mask, softmax, ×V — with a head that genuinely learned to find the subject), see why a block alternates communication (attention) with per-token thinking (MLP), and run the autoregressive loop yourself with a temperature slider.',
    },
    zh: {
      title: '一台可以解剖的 transformer',
      desc: '浏览器里的 1.8 万参数活模型——在真实数字上追踪 attention、block 和生成。',
      body: '一个在玩具语法上训练的微型 transformer（2 层、4 头、d=32）直接在浏览器里运行——你看到的每个数字都来自真实的前向传播。四个分站：看一句话变成矩阵；把一头 attention 从头到尾拆开（Q·K、mask、softmax、×V——其中一个头真的学会了寻找主语）；看懂 block 为什么交替做「token 间交流」（attention）和「逐 token 独想」（MLP）；再亲手转动自回归循环，配真实的温度滑块。',
    },
  },
  {
    id: 'kernel-life',
    cat: 'N-020',
    date: '2026-07-08',
    updated: 'July 9, 2026',
    mins: 10,
    tags: ['gpu', 'cuda', 'memory'],
    en: {
      title: 'Life of a kernel, in 3D',
      desc: 'From s = a.sum() to warps on silicon — why blocks, shared memory, and barriers exist.',
      body: 'A scripted 3D tour of what happens when s = a.sum() runs on a GPU — the one beginner-sized example where every level of the hierarchy earns its keep. The array is tiled into 96 blocks that stream onto SMs; each block coalesces its tile into shared memory; a tree reduction halves it with a visible __syncthreads() barrier every round — until the last 32 values fit in one warp and the barriers vanish. Finally, 96 partial sums need a second launch, because blocks can never talk to each other. Scrub the timeline, drag to look around, click blocks and lanes to map code to hardware.',
    },
    zh: {
      title: '一个 kernel 的一生（3D）',
      desc: '从 s = a.sum() 到硅片上的 warp——block、共享内存和屏障为什么存在。',
      body: '一部脚本化的 3D 导览：当 s = a.sum() 在 GPU 上运行时到底发生了什么——这是层级每一级都能兑现价值的最小例子。数组被切成 96 块瓦片流水落到各个 SM；每个 block 把自己的瓦片合并加载进共享内存；树归约每轮对半塌缩、每轮一道可见的 __syncthreads() 屏障——直到最后 32 个数落进一个 warp，屏障随之消失。最终 96 个部分和还需要第二次发射才能合并，因为 block 之间永远无法互相通信。可拖动时间轴、环视场景、点击方块和 lane，把代码和硬件一一对应起来。',
    },
  },
  {
    id: 'gpu-architecture',
    cat: 'N-019',
    date: '2026-04-11',
    updated: 'April 11, 2026',
    mins: 14,
    tags: ['gpu', 'cuda', 'hardware'],
    en: {
      title: 'Inside a streaming multiprocessor',
      desc: 'A blueprint you can probe: warps, lanes, and the path a value takes through an SM.',
      body: 'A GPU is a collection of streaming multiprocessors (SMs). Each SM runs thousands of threads concurrently by switching between warps — groups of 32 threads that execute in lockstep. Click any component below to explore what it does.',
    },
    zh: {
      title: '走进流式多处理器（SM）',
      desc: '一张可以探查的蓝图：线程束、通道，以及一个数值流经 SM 的路径。',
      body: 'GPU 由若干个流式多处理器（SM）组成。每个 SM 通过在线程束之间切换，同时运行数千个线程——线程束是 32 个以锁步方式执行的线程组。点击下方任意组件了解其功能。',
    },
  },
];
