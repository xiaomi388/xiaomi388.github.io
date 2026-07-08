/* Life of a Kernel — timeline script.
   The film follows `s = a.sum()` (parallel sum reduction): the one
   beginner-sized example where every level of the hierarchy has a visible
   job — blocks cooperate in SRAM, __syncthreads() paces the tree, the last
   32 values need no barrier (warp lockstep), and 96 partial sums need a
   second launch because blocks cannot talk to each other.
   All animation is a pure function of the master clock t (seconds). */

export const TOTAL = 100;

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
    id: 0, t0: 0, t1: 8, code: 'py', hl: [],
    title: { en: 'The package', zh: '封装全景' },
    cap: {
      en: 'A GPU package, physically: a die of 24 SMs (simplified — real chips have 80–140), a chip-wide L2 slab in the middle, and HBM memory literally stacked in towers at the edges. Drag to look around.',
      zh: '一块 GPU 封装的真实模样：24 个 SM 组成的 die（简化——真芯片有 80–140 个）、中央贯通的 L2、以及边缘真的以「塔」的形式 3D 堆叠的 HBM 显存。拖拽可以环视。',
    },
  },
  {
    id: 1, t0: 8, t1: 18, code: 'py', hl: [2],
    title: { en: 'One line of PyTorch', zh: '从一行 PyTorch 说起' },
    cap: {
      en: 's = a.sum() on a CUDA tensor dispatches a reduction kernel. Before it can run, the 24 576 floats must already live in HBM — watch the tensor stream in (this is what .to("cuda") / cudaMemcpy did earlier).',
      zh: '对 CUDA tensor 执行 s = a.sum()，背后会 dispatch 一个归约 kernel。但在它跑起来之前，24576 个浮点数必须已经在显存里——看 tensor 流入 HBM（这就是之前 .to("cuda") / cudaMemcpy 做的事）。',
    },
  },
  {
    id: 2, t0: 18, t1: 32, code: 'launch', hl: [2],
    title: { en: 'Blocks = tiles of the array', zh: 'block = 数组的瓦片' },
    cap: {
      en: 'The launch cuts the array itself into 96 tiles of 256 numbers — that is all a block is: one tile of the problem, plus the threads that will chew it. Hardware streams blocks onto whichever SM has a free slot; you never pick the SM. Click any cube to see its blockIdx.x. Real workloads: tens of thousands of tiles.',
      zh: '这次发射把数组本身切成 96 块、每块 256 个数——block 就是这么回事：问题的一块瓦片，外加负责啃它的线程。硬件把 block 流水式分发到有空位的 SM，你永远无法指定哪一个。点击任意方块看它的 blockIdx.x。真实负载是几万块瓦片。',
    },
  },
  {
    id: 3, t0: 32, t1: 44, code: 'cuda', hl: [2, 4],
    title: { en: 'Into shared memory', zh: '装进共享内存' },
    cap: {
      en: "First job of block 31's 256 threads: copy their tile from HBM into __shared__ memory — the SRAM inside this SM. Because lane l reads the adjacent address a[i+l], each warp's 32 loads coalesce into one wide transaction. Flip the toggle to see the scattered alternative. Click a lane to compute its global index i.",
      zh: 'block 31 的 256 个线程的第一件事：把自己那块瓦片从 HBM 拷进 __shared__ 内存——也就是这个 SM 里的 SRAM。因为 lane l 读的是相邻地址 a[i+l]，每个 warp 的 32 次加载被硬件合并成一次宽事务。切换开关看看散乱访问的下场。点击任意 lane 可现场演算它的全局索引 i。',
    },
  },
  {
    id: 4, t0: 44, t1: 56, code: 'cuda', hl: [4],
    title: { en: 'Latency hiding', zh: '延迟隐藏' },
    cap: {
      en: 'Those loads still cost ≈500 cycles each. Warp 2 stalls (grey) while its request physically flies to HBM and back — but the SM never idles: the scheduler keeps issuing the other warps. Parallelism is how GPUs hide memory latency.',
      zh: '这些加载每次仍要约 500 周期。Warp 2 的请求真实地飞往 HBM 再飞回来，期间它停摆（变灰）——但 SM 没有一刻空闲：调度器持续从其他 warp 发射指令。GPU 就是靠并行来「隐藏」内存延迟的。',
    },
  },
  {
    id: 5, t0: 56, t1: 68, code: 'cuda', hl: [8, 9],
    title: { en: 'Tree reduction + barriers', zh: '树归约与屏障' },
    cap: {
      en: 'Now the payoff of __shared__: the tile collapses by halving — 128 adds, then 64, then 32 — never touching HBM again. But round n+1 may only start once every thread finished round n. That is __syncthreads(): the flash sweeping the board. THIS is why these 256 threads must be one block on one SM.',
      zh: '现在轮到 __shared__ 兑现价值：瓦片对半塌缩——128 次加法、然后 64、然后 32——全程不再碰 HBM。但第 n+1 轮必须等所有线程做完第 n 轮才能开始，这就是 __syncthreads()——扫过板面的那道闪光。这正是这 256 个线程必须同属一个 block、同在一个 SM 的原因。',
    },
  },
  {
    id: 6, t0: 68, t1: 78, code: 'cuda', hl: [8],
    title: { en: 'The warp finale', zh: 'warp 终章' },
    cap: {
      en: 'At s = 16 every surviving lane sits inside warp 0 — and the barrier flashes stop. A warp executes in lockstep, so within one warp, synchronization is free (real kernels drop these __syncthreads calls). This is the layer your code never names but the hardware always enforces.',
      zh: '到 s = 16 时，所有幸存的 lane 都落在 warp 0 里——屏障闪光消失了。warp 以锁步执行，所以在一个 warp 内部，同步是免费的（真实 kernel 会把这几次 __syncthreads 去掉）。这就是那个你的代码从不提及、硬件却时刻执行的层级。',
    },
  },
  {
    id: 7, t0: 78, t1: 92, code: 'cuda', hl: [11],
    codeB: 'launch', hlB: [3], tSwitch: 85,
    title: { en: 'Two launches', zh: '为什么要发射两次' },
    cap: {
      en: "Each block emits exactly one number — part[blockIdx.x] — and 96 partial sums land in HBM. Why can't block 0 simply add block 1's result? Because two blocks may never be alive at the same time. That independence is the contract that lets the same code scale to any GPU — so a second launch, <<<1, 96>>>, folds 96 into 1.",
      zh: '每个 block 只吐出一个数——part[blockIdx.x]——96 个部分和落回 HBM。为什么 block 0 不能直接加上 block 1 的结果？因为两个 block 可能根本不同时存活。这份互相独立正是让同一份代码能跑在任何 GPU 上的契约——所以要第二次发射：<<<1, 96>>>，把 96 收成 1。',
    },
  },
  {
    id: 8, t0: 92, t1: TOTAL, code: 'py', hl: [2],
    title: { en: 'Writeback', zh: '写回收场' },
    cap: {
      en: 'One float travels back to Python. One line of PyTorch — one full round trip through the machine, and every level of the hierarchy did a job only it could do: blocks tiled the problem, shared memory pooled it, barriers paced it, warps executed it.',
      zh: '一个浮点数回到 Python。一行 PyTorch——完整穿越了一遍整台机器，而且层级的每一级都干了只有它能干的活：block 切分问题、共享内存汇聚结果、屏障控制节拍、warp 负责执行。',
    },
  },
];

export const chapterAt = (t) => CHAPTERS.find((c) => t < c.t1) ?? CHAPTERS[CHAPTERS.length - 1];

/* active code segment + highlight lines for a chapter at local time t */
export function codeFor(ch, t) {
  if (ch.codeB != null && t >= ch.tSwitch) return { seg: ch.codeB, lines: ch.hlB };
  return { seg: ch.code, lines: ch.hl };
}

/* ---------- the reduction clock ----------
   Rounds 0–2 (s = 128, 64, 32): 4s each — 3.2s of adds + 0.8s barrier.
   Rounds 3–7 (s = 16 … 1): 2s each, no barrier phase (warp lockstep). */
export const REDUCE_T0 = 56;
const ROUNDS = Array.from({ length: 8 }, (_, k) => {
  const slow = k < 3;
  const t0 = slow ? REDUCE_T0 + k * 4 : 68 + (k - 3) * 2;
  return { k, s: 128 >> k, t0, addEnd: t0 + (slow ? 3.2 : 1.7), end: t0 + (slow ? 4 : 2), slow };
});

export function reduceState(t) {
  if (t < REDUCE_T0) return { phase: 'idle', round: -1, s: 256, active: 256, alive: 256, mergeU: 0 };
  for (const r of ROUNDS) {
    if (t < r.end) {
      if (t < r.addEnd) {
        return {
          phase: 'add', round: r.k, s: r.s, active: r.s,
          alive: r.s * 2, mergeU: (t - r.t0) / (r.addEnd - r.t0), slow: r.slow,
        };
      }
      return { phase: 'barrier', round: r.k, s: r.s, active: r.s, alive: r.s, mergeU: 1, slow: r.slow };
    }
  }
  return { phase: 'done', round: 8, s: 0, active: 0, alive: 1, mergeU: 1 };
}

/* ---------- camera keyframes: [t, position, target] ---------- */
export const CAM_KEYS = [
  [0,  [34, 22, 34],      [0, 0, 0]],
  [4,  [2, 26, 46],       [0, 0, 0]],
  [8,  [-32, 16, 32],     [0, 0, 0]],
  [11, [-40, 13, 24],     [-21, 4, 3]],
  [18, [-26, 30, 30],     [0, 6, 0]],
  [20, [0, 32, 42],       [0, 12, 0]],
  [22, [0, 42, 34],       [0, 4, 0]],
  [30, [0, 34, 30],       [0, 4, 0]],
  [32, [-15, 15, 11],     [-8.25, 4, -4.5]],
  [36, [-8.25, 10, 4],    [-8.25, 4, -4.5]],
  [44, [-17, 13, 13],     [-13, 3.5, -3]],
  [52, [-22, 11, 10],     [-15, 3, -3]],
  [56, [-8.25, 10, 5],    [-8.25, 4, -3]],
  [68, [-8.25, 8.8, 3.4], [-8.25, 3.8, -3.2]],
  [78, [-10, 20, 22],     [0, 3, 0]],
  [85, [-4, 16, 24],      [-6, 2.5, -4]],
  [92, [18, 22, 32],      [0, 2, 0]],
  [TOTAL, [34, 22, 34],   [0, 0, 0]],
];

/* ---------- code panel ----------
   Hand-tokenized Monokai spans: [text, kind]. kinds: k(eyword) n(emphasis)
   f(unction) c(omment) plain(default). Comments differ per language. */
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
          en: L(['s = a.', ''], ['sum', 'f'], ['()', ''], ['   # float32[24576] on cuda:0', 'c']),
          zh: L(['s = a.', ''], ['sum', 'f'], ['()', ''], ['   # float32[24576]，在 cuda:0 上', 'c']),
        },
      },
    ],
  },
  {
    id: 'cuda',
    label: { en: '② the reduction kernel it dispatches', zh: '② 它背后 dispatch 的归约 kernel' },
    lines: [
      {
        n: 1,
        toks: {
          en: L(['__global__', 'k'], [' ', ''], ['void', 'k'], [' ', ''], ['sum_kernel', 'f'], ['(', ''], ['float', 'k'], ['* a, ', ''], ['float', 'k'], ['* part, ', ''], ['int', 'k'], [' n) {', '']),
          zh: L(['__global__', 'k'], [' ', ''], ['void', 'k'], [' ', ''], ['sum_kernel', 'f'], ['(', ''], ['float', 'k'], ['* a, ', ''], ['float', 'k'], ['* part, ', ''], ['int', 'k'], [' n) {', '']),
        },
      },
      {
        n: 2,
        toks: {
          en: L(['  ', ''], ['__shared__', 'k'], [' ', ''], ['float', 'k'], [' ', ''], ['tile[256]', 'n'], [';', ''], ['      // the tile, in SRAM', 'c']),
          zh: L(['  ', ''], ['__shared__', 'k'], [' ', ''], ['float', 'k'], [' ', ''], ['tile[256]', 'n'], [';', ''], ['      // 瓦片，放在 SRAM 里', 'c']),
        },
      },
      {
        n: 3,
        toks: {
          en: L(['  ', ''], ['int', 'k'], [' i = ', ''], ['blockIdx.x', 'n'], [' * 256 + ', ''], ['threadIdx.x', 'n'], [';', '']),
          zh: L(['  ', ''], ['int', 'k'], [' i = ', ''], ['blockIdx.x', 'n'], [' * 256 + ', ''], ['threadIdx.x', 'n'], [';', '']),
        },
      },
      {
        n: 4,
        toks: {
          en: L(['  tile[threadIdx.x] = ', ''], ['a[i]', 'n'], [';', ''], ['        // coalesced load', 'c']),
          zh: L(['  tile[threadIdx.x] = ', ''], ['a[i]', 'n'], [';', ''], ['        // 合并加载', 'c']),
        },
      },
      {
        n: 5,
        toks: { en: L(['  ', ''], ['__syncthreads', 'f'], ['();', '']), zh: L(['  ', ''], ['__syncthreads', 'f'], ['();', '']) },
      },
      {
        n: 6,
        toks: {
          en: L(['  ', ''], ['for', 'k'], [' (', ''], ['int', 'k'], [' s = ', ''], ['128', 'n'], ['; s > 0; s /= 2) {', '']),
          zh: L(['  ', ''], ['for', 'k'], [' (', ''], ['int', 'k'], [' s = ', ''], ['128', 'n'], ['; s > 0; s /= 2) {', '']),
        },
      },
      {
        n: 7,
        toks: {
          en: L(['    ', ''], ['if', 'k'], [' (threadIdx.x < ', ''], ['s', 'n'], [')', '']),
          zh: L(['    ', ''], ['if', 'k'], [' (threadIdx.x < ', ''], ['s', 'n'], [')', '']),
        },
      },
      {
        n: 8,
        toks: {
          en: L(['      tile[threadIdx.x] += ', ''], ['tile[threadIdx.x + s]', 'n'], [';', '']),
          zh: L(['      tile[threadIdx.x] += ', ''], ['tile[threadIdx.x + s]', 'n'], [';', '']),
        },
      },
      {
        n: 9,
        toks: {
          en: L(['    ', ''], ['__syncthreads', 'f'], ['();', ''], ['            // barrier, every round', 'c']),
          zh: L(['    ', ''], ['__syncthreads', 'f'], ['();', ''], ['            // 每一轮一个屏障', 'c']),
        },
      },
      { n: 10, toks: { en: L(['  }', '']), zh: L(['  }', '']) } },
      {
        n: 11,
        toks: {
          en: L(['  ', ''], ['if', 'k'], [' (threadIdx.x == 0) ', ''], ['part[blockIdx.x]', 'n'], [' = tile[0];', '']),
          zh: L(['  ', ''], ['if', 'k'], [' (threadIdx.x == 0) ', ''], ['part[blockIdx.x]', 'n'], [' = tile[0];', '']),
        },
      },
      { n: 12, toks: { en: L(['}', '']), zh: L(['}', '']) } },
    ],
  },
  {
    id: 'launch',
    label: { en: '③ launch — twice', zh: '③ 发射——两次' },
    lines: [
      {
        n: 1,
        toks: {
          en: L(['// blocks cannot sum each other → launch twice', 'c']),
          zh: L(['// block 之间不能互相求和 → 发射两次', 'c']),
        },
      },
      {
        n: 2,
        toks: {
          en: L(['sum_kernel', 'f'], ['<<<', 'k'], ['96, 256', 'n'], ['>>>', 'k'], ['(a, part, ', ''], ['24576', 'n'], [');', '']),
          zh: L(['sum_kernel', 'f'], ['<<<', 'k'], ['96, 256', 'n'], ['>>>', 'k'], ['(a, part, ', ''], ['24576', 'n'], [');', '']),
        },
      },
      {
        n: 3,
        toks: {
          en: L(['sum_kernel', 'f'], ['<<<', 'k'], ['1, 96', 'n'], ['>>>', 'k'], ['(part, out, ', ''], ['96', 'n'], [');', '']),
          zh: L(['sum_kernel', 'f'], ['<<<', 'k'], ['1, 96', 'n'], ['>>>', 'k'], ['(part, out, ', ''], ['96', 'n'], [');', '']),
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
    transactions: (co) => co ? '8 transactions — one per warp' : '256 transactions — one per lane',
    accessLabel: 'Access pattern',
    blockNote: (b, sm) => `this tile: blockIdx.x = ${b} → landed on SM ${String(sm).padStart(2, '0')}`,
    laneNote: (b, tid) =>
      `i = blockIdx.x(${b}) × 256 + threadIdx.x(${tid}) = ${b * 256 + tid} · warp = ${tid} ⁄ 32 = ${Math.floor(tid / 32)}`,
    reduceNote: (s, active, barrier) =>
      `s = ${s} · active threads ${active} / 256${barrier ? ' · __syncthreads()' : ''}`,
    finaleNote: (s) => `s = ${s} · all survivors in warp 0 — lockstep, no barrier`,
    partialNote: '96 × part[blockIdx.x] → second launch <<<1, 96>>> → 1',
    dragHint: 'drag to look · click glowing objects',
    legend: [
      ['sm', 'SM (compute unit)'],
      ['hbm', 'HBM — off-chip VRAM'],
      ['l2', 'L2 cache'],
      ['block', 'thread block (one tile)'],
      ['warpActive', 'issuing warp / active'],
      ['sramFill', 'SRAM tile (shared memory)'],
      ['particle', 'data & memory traffic'],
    ],
    webglFail: 'WebGL is unavailable in this browser — the 3D tour cannot run.',
    webglFallback: 'Read the 2D deep-dive instead →',
  },
  zh: {
    play: '▶ 播放', pause: '⏸ 暂停', replay: '↺ 重播',
    speed: '速度', code: '代码', hideCode: '收起', showCode: '代码',
    coalesced: '合并访问', scattered: '散乱访问',
    transactions: (co) => co ? '8 次事务——每 warp 一次' : '256 次事务——每 lane 一次',
    accessLabel: '访问模式',
    blockNote: (b, sm) => `这块瓦片：blockIdx.x = ${b} → 被调度到 SM ${String(sm).padStart(2, '0')}`,
    laneNote: (b, tid) =>
      `i = blockIdx.x(${b}) × 256 + threadIdx.x(${tid}) = ${b * 256 + tid} · warp = ${tid} ⁄ 32 = ${Math.floor(tid / 32)}`,
    reduceNote: (s, active, barrier) =>
      `s = ${s} · 活跃线程 ${active} / 256${barrier ? ' · __syncthreads()' : ''}`,
    finaleNote: (s) => `s = ${s} · 幸存者全在 warp 0——锁步执行，无需屏障`,
    partialNote: '96 × part[blockIdx.x] → 第二次发射 <<<1, 96>>> → 1',
    dragHint: '拖拽环视 · 点击发光物体',
    legend: [
      ['sm', 'SM（计算单元）'],
      ['hbm', 'HBM · 片外显存'],
      ['l2', 'L2 缓存'],
      ['block', '线程块 block（一块瓦片）'],
      ['warpActive', '正在发射的 warp / 活跃'],
      ['sramFill', 'SRAM 瓦片（共享内存）'],
      ['particle', '数据 / 内存流量'],
    ],
    webglFail: '当前浏览器无法使用 WebGL，3D 导览无法运行。',
    webglFallback: '改读 2D 精读版 →',
  },
};

/* ---------- deterministic block schedule ----------
   Wave 1: blocks 0..71 → sm = b % 24, slot = ⌊b/24⌋, staggered departures.
   Slot-0 tenants retire early so wave 2 (blocks 72..95) can land during ch2.
   Everyone else retires in ch7 as their partial sum drops out. */
export function blockSchedule(b) {
  if (b < 72) {
    const sm = b % SM_COUNT;
    const slot = Math.floor(b / SM_COUNT);
    const depart = 22 + (b / 96) * 6;         // leaves the hovering grid
    const land = depart + 1.6;
    const retire = slot === 0 ? 27.5 + (sm / 24) * 2.5 : 78.5 + (b % 24) * 0.14;
    return { sm, slot, depart, land, retire };
  }
  const q = b - 72;
  const sm = q % SM_COUNT;
  const slot = 0;
  const prevRetire = 27.5 + (sm / 24) * 2.5;
  const depart = prevRetire + 0.3;
  const land = depart + 1.4;
  const retire = 79 + (q % 24) * 0.14;
  return { sm, slot, depart, land, retire };
}
