export const SANDBOXES = [
  {
    id: 'kernel-life',
    cat: 'N-020',
    date: '2026-07-08',
    updated: 'July 8, 2026',
    mins: 8,
    tags: ['gpu', 'cuda', 'memory'],
    en: {
      title: 'Life of a kernel, in 3D',
      desc: 'From one line of PyTorch to warps on silicon — a guided 3D tour of a kernel launch.',
      body: 'A scripted 3D tour of what happens when c = a + b runs on a GPU: the CUDA kernel it dispatches, the <<<96, 256>>> grid landing on SMs, threads sliced into warps, a memory request physically flying to HBM while the scheduler hides the latency, and why coalesced access collapses 32 loads into one transaction. Scrub the timeline, drag to look around, click blocks and lanes to map code to hardware.',
    },
    zh: {
      title: '一个 kernel 的一生（3D）',
      desc: '从一行 PyTorch 到硅片上的 warp——kernel 发射全过程的 3D 导览。',
      body: '一部脚本化的 3D 导览：当 c = a + b 在 GPU 上运行时到底发生了什么——它背后 dispatch 的 CUDA kernel、<<<96, 256>>> 的 grid 如何落到各个 SM、线程如何被硬件切成 warp、一次内存请求如何真实地飞到 HBM 再飞回来（而调度器用并行把延迟藏起来）、以及为什么合并访问能把 32 次加载收束成一次事务。可拖动时间轴、环视场景、点击方块和 lane，把代码和硬件一一对应起来。',
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
