export const SANDBOXES = [
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
