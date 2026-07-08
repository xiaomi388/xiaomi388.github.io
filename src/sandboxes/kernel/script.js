/* Life of a Kernel — timeline script.
   Everything the film needs as plain data: chapter ranges, camera keyframes,
   captions (en/zh), the code panel, and the deterministic block schedule.
   All animation is a pure function of the master clock t (seconds). */

export const TOTAL = 75;

export const GRID_BLOCKS = 96;   // <<<96, 256>>>
export const BLOCK_THREADS = 256;
export const SM_COUNT = 24;      // 6 × 4
export const SLOTS_PER_SM = 3;
export const WARP_ROWS = 8;      // 256 threads = 8 warps shown on the board
export const FOCUS_SM = 7;       // the SM the camera dives into
export const FOCUS_BLOCK = 31;   // default selected block (SM 7 slot 1 — stays resident)
export const FOCUS_TID = 140;    // default selected thread (warp 4, lane 12)

/* ---------- chapters ---------- */
export const CHAPTERS = [
  {
    id: 0, t0: 0, t1: 8, code: 'py', hl: null,
    title: { en: 'The package', zh: '封装全景' },
    cap: {
      en: 'A GPU package, physically: a die of 24 SMs (simplified — real chips have 80–140), a chip-wide L2 slab in the middle, and HBM memory literally stacked in towers at the edges. Drag to look around.',
      zh: '一块 GPU 封装的真实模样：24 个 SM 组成的 die（简化——真芯片有 80–140 个）、中央贯通的 L2、以及边缘真的以「塔」的形式 3D 堆叠的 HBM 显存。拖拽可以环视。',
    },
  },
  {
    id: 1, t0: 8, t1: 18, code: 'py', hl: 2,
    title: { en: 'One line of PyTorch', zh: '从一行 PyTorch 说起' },
    cap: {
      en: 'c = a + b on CUDA tensors dispatches a CUDA kernel. Before it runs, the data must already live in HBM — watch the tensors stream in (this is what cudaMemcpy / .to("cuda") did earlier).',
      zh: '对 CUDA tensor 执行 c = a + b，背后会 dispatch 一个 CUDA kernel。但在它跑起来之前，数据必须已经在显存里——看 tensor 流入 HBM（这就是之前 .to("cuda") / cudaMemcpy 做的事）。',
    },
  },
  {
    id: 2, t0: 18, t1: 32, code: 'launch', hl: 2,
    title: { en: '<<<96, 256>>>', zh: '软件坐标系落地' },
    cap: {
      en: 'The launch config is a software coordinate system: 96 blocks × 256 threads. Hardware streams blocks onto whichever SM has a free slot (3 here) — you never choose which SM. Click any cube to see its blockIdx.x. Real workloads launch tens of thousands of blocks — millions of threads.',
      zh: '启动配置是一套「软件坐标系」：96 个 block × 每个 256 线程。硬件把 block 流水式分发到有空位的 SM（此处每个驻留 3 个）——你永远无法指定哪个 SM。点击任意方块可以看它的 blockIdx.x。真实负载会发射几万个 block、百万级线程。',
    },
  },
  {
    id: 3, t0: 32, t1: 44, code: 'cuda', hl: 3,
    title: { en: 'Thread → warp → lane', zh: '钻进 SM' },
    cap: {
      en: 'Inside SM 07, block 31 unfolds: 256 threads that hardware slices into 8 warps of 32 lanes. Note: “warp” appears nowhere in your code — it is purely a hardware construct. Each cycle the scheduler picks one warp and issues its next instruction. Click a lane to compute its global index i.',
      zh: '钻进 SM 07，block 31 展开成 256 个线程——硬件把它们切成 8 个 warp、每个 32 条 lane。注意：「warp」在你的代码里根本不存在，它纯粹是硬件概念。每个周期调度器挑一个 warp 发射下一条指令。点击任意 lane，现场演算它的全局索引 i。',
    },
  },
  {
    id: 4, t0: 44, t1: 58, code: 'cuda', hl: 4,
    title: { en: 'Latency hiding', zh: '延迟隐藏' },
    cap: {
      en: 'Warp 2 executes a[i] — a load that misses L2 and travels all the way to HBM: ≈500 cycles. Watch the request physically fly there and back. The warp stalls (grey), but the SM never idles: the scheduler keeps issuing from the other warps. Parallelism is how GPUs hide memory latency.',
      zh: 'Warp 2 执行 a[i]——这次加载 L2 未命中，要一路飞到 HBM：约 500 周期。看请求真实地飞一个来回。这个 warp 停摆（变灰），但 SM 没有一刻空闲：调度器持续从其他 warp 发射指令。GPU 就是靠并行来「隐藏」内存延迟的。',
    },
  },
  {
    id: 5, t0: 58, t1: 68, code: 'cuda', hl: 4,
    title: { en: 'Memory coalescing', zh: '内存合并' },
    cap: {
      en: 'Because i is built from threadIdx.x, adjacent lanes read adjacent addresses of a[i] — hardware coalesces all 32 loads into one wide transaction. Flip the toggle to see the scattered-access alternative: 32 separate transactions for the same data.',
      zh: '因为 i 由 threadIdx.x 算出，相邻 lane 读的是 a[i] 的相邻地址——硬件把 32 次加载合并成一次宽事务。切换开关看看散乱访问的下场：同样的数据要 32 次独立事务。',
    },
  },
  {
    id: 6, t0: 68, t1: TOTAL, code: 'py', hl: 2,
    title: { en: 'Writeback', zh: '写回收场' },
    cap: {
      en: 'c[i] stores stream back into HBM, blocks retire, and control returns to the Python line that started it all. One line of PyTorch — one round trip through the whole machine.',
      zh: 'c[i] 的写入流回 HBM，block 陆续退场，控制权回到最初那行 Python。一行 PyTorch——完整穿越了一遍整台机器。',
    },
  },
];

export const chapterAt = (t) => CHAPTERS.find((c) => t < c.t1) ?? CHAPTERS[CHAPTERS.length - 1];

/* ---------- camera keyframes: [t, position, target] ---------- */
export const CAM_KEYS = [
  [0,  [34, 22, 34],    [0, 0, 0]],
  [4,  [2, 26, 46],     [0, 0, 0]],
  [8,  [-32, 16, 32],   [0, 0, 0]],
  [11, [-40, 13, 24],   [-21, 4, 3]],
  [18, [-26, 30, 30],   [0, 6, 0]],
  [22, [0, 42, 34],     [0, 4, 0]],
  [30, [0, 34, 30],     [0, 4, 0]],
  [32, [-15, 15, 11],   [-8.25, 4, -4.5]],
  [36, [-8.25, 10, 4],  [-8.25, 4.5, -4.5]],
  [44, [-17, 13, 13],   [-13, 3.5, -3]],
  [52, [-22, 11, 10],   [-15, 3, -3]],
  [58, [-7, 12, 17],    [-14, 3.5, -3]],
  [68, [18, 22, 32],    [0, 2, 0]],
  [TOTAL, [34, 22, 34], [0, 0, 0]],
];

/* ---------- code panel ----------
   Hand-tokenized Monokai spans: [text, kind]. kinds: k(eyword) n(umber)
   f(unction) c(omment) plain(default). Comments come in en/zh variants. */
const L = (...toks) => toks;

export const CODE_SEGMENTS = [
  {
    id: 'py',
    label: { en: '① PyTorch', zh: '① PyTorch' },
    lines: [
      {
        n: 1,
        toks: { en: L(['# what you wrote', 'c']), zh: L(['# 你写下的', 'c']) },
      },
      {
        n: 2,
        toks: {
          en: L(['c = a + b', ''], ['   # float32[24576] on cuda:0', 'c']),
          zh: L(['c = a + b', ''], ['   # float32[24576]，在 cuda:0 上', 'c']),
        },
      },
    ],
  },
  {
    id: 'cuda',
    label: { en: '② the CUDA kernel it dispatches', zh: '② 它背后 dispatch 的 CUDA kernel' },
    lines: [
      {
        n: 1,
        toks: {
          en: L(['__global__', 'k'], [' ', ''], ['void', 'k'], [' ', ''], ['add_kernel', 'f'], ['(', ''], ['float', 'k'], ['* a, ', ''], ['float', 'k'], ['* b,', '']),
          zh: L(['__global__', 'k'], [' ', ''], ['void', 'k'], [' ', ''], ['add_kernel', 'f'], ['(', ''], ['float', 'k'], ['* a, ', ''], ['float', 'k'], ['* b,', '']),
        },
      },
      {
        n: 2,
        toks: {
          en: L(['                           ', ''], ['float', 'k'], ['* c, ', ''], ['int', 'k'], [' n) {', '']),
          zh: L(['                           ', ''], ['float', 'k'], ['* c, ', ''], ['int', 'k'], [' n) {', '']),
        },
      },
      {
        n: 3,
        toks: {
          en: L(['  ', ''], ['int', 'k'], [' i = ', ''], ['blockIdx.x', 'n'], [' * ', ''], ['blockDim.x', 'n'], [' + ', ''], ['threadIdx.x', 'n'], [';', '']),
          zh: L(['  ', ''], ['int', 'k'], [' i = ', ''], ['blockIdx.x', 'n'], [' * ', ''], ['blockDim.x', 'n'], [' + ', ''], ['threadIdx.x', 'n'], [';', '']),
        },
      },
      {
        n: 4,
        toks: {
          en: L(['  ', ''], ['if', 'k'], [' (i < n) c[i] = ', ''], ['a[i]', 'n'], [' + ', ''], ['b[i]', 'n'], [';', '']),
          zh: L(['  ', ''], ['if', 'k'], [' (i < n) c[i] = ', ''], ['a[i]', 'n'], [' + ', ''], ['b[i]', 'n'], [';', '']),
        },
      },
      { n: 5, toks: { en: L(['}', '']), zh: L(['}', '']) } },
    ],
  },
  {
    id: 'launch',
    label: { en: '③ launch: the software coordinate system', zh: '③ 启动：软件坐标系' },
    lines: [
      {
        n: 1,
        toks: {
          en: L(['// 96 blocks × 256 threads = 24576', 'c']),
          zh: L(['// 96 个 block × 256 线程 = 24576', 'c']),
        },
      },
      {
        n: 2,
        toks: {
          en: L(['add_kernel', 'f'], ['<<<', 'k'], ['96, 256', 'n'], ['>>>', 'k'], ['(a, b, c, ', ''], ['24576', 'n'], [');', '']),
          zh: L(['add_kernel', 'f'], ['<<<', 'k'], ['96, 256', 'n'], ['>>>', 'k'], ['(a, b, c, ', ''], ['24576', 'n'], [');', '']),
        },
      },
    ],
  },
];

/* ---------- UI strings ---------- */
export const UI_STR = {
  en: {
    play: '▶ Play', pause: '⏸ Pause', replay: '↺ Replay',
    speed: 'Speed', code: 'Code', hideCode: 'hide', showCode: 'code',
    coalesced: 'coalesced', scattered: 'scattered',
    transactions: (n) => `${n} transaction${n > 1 ? 's' : ''} to HBM`,
    accessLabel: 'Access pattern',
    blockNote: (b, sm) => `this cube: blockIdx.x = ${b} → landed on SM ${String(sm).padStart(2, '0')}`,
    laneNote: (b, tid) =>
      `i = blockIdx.x(${b}) × 256 + threadIdx.x(${tid}) = ${b * 256 + tid} · warp = ${tid} ⁄ 32 = ${Math.floor(tid / 32)}`,
    dragHint: 'drag to look · click glowing objects',
    webglFail: 'WebGL is unavailable in this browser — the 3D tour cannot run.',
    webglFallback: 'Read the 2D deep-dive instead →',
  },
  zh: {
    play: '▶ 播放', pause: '⏸ 暂停', replay: '↺ 重播',
    speed: '速度', code: '代码', hideCode: '收起', showCode: '代码',
    coalesced: '合并访问', scattered: '散乱访问',
    transactions: (n) => `${n} 次 HBM 事务`,
    accessLabel: '访问模式',
    blockNote: (b, sm) => `这个方块：blockIdx.x = ${b} → 被调度到 SM ${String(sm).padStart(2, '0')}`,
    laneNote: (b, tid) =>
      `i = blockIdx.x(${b}) × 256 + threadIdx.x(${tid}) = ${b * 256 + tid} · warp = ${tid} ⁄ 32 = ${Math.floor(tid / 32)}`,
    dragHint: '拖拽环视 · 点击发光物体',
    webglFail: '当前浏览器无法使用 WebGL，3D 导览无法运行。',
    webglFallback: '改读 2D 精读版 →',
  },
};

/* ---------- deterministic block schedule ----------
   Wave 1: blocks 0..71 → sm = b % 24, slot = ⌊b/24⌋, staggered departures.
   Wave 2: blocks 72..95 land on slot 0 after the wave-1 tenant retires. */
export function blockSchedule(b) {
  if (b < 72) {
    const sm = b % SM_COUNT;
    const slot = Math.floor(b / SM_COUNT);
    const depart = 22 + (b / 96) * 6;         // leaves the hovering grid
    const land = depart + 1.6;
    // slot-0 tenants retire early to make room for wave 2
    const retire = slot === 0 ? 27.5 + (sm / 24) * 2.5 : 69 + (b % 24) * 0.15;
    return { sm, slot, depart, land, retire };
  }
  const q = b - 72;
  const sm = q % SM_COUNT;
  const slot = 0;
  const prevRetire = 27.5 + (sm / 24) * 2.5;
  const depart = prevRetire + 0.3;
  const land = depart + 1.4;
  const retire = 69 + (q % 24) * 0.15 + 0.08;
  return { sm, slot, depart, land, retire };
}
