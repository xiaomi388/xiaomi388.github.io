import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

/* ---------- styles ----------
   The sandbox reads the site's design tokens (colors_and_type.css) so it
   follows the blog palette and the light/dark toggle. Only the three
   pedagogical families (compute / memory / execution) get their own hues,
   kept at textbook-print saturation. */
const GPU_CSS = `
.gx * { box-sizing: border-box; }
.gx {
  /* surfaces (site --bg is the page; panels/cells step away from it) */
  --bg2:#ffffff; --bg3:#f1f1f1; --bg4:#e4e4e4;
  --line:var(--border); --line2:var(--border-strong);
  --tx:var(--fg); --txd:var(--fg-2); --txf:var(--fg-3);
  /* pedagogical families */
  --compute:var(--accent); --compute-d:#9fc0e8;
  --mem:#b26a00; --mem-d:#e0c290;
  --exec:#6a4fa3; --exec-d:#c9bce4;
  --danger:#c62828; --ok:#2e7d32;
  font-family:var(--font-body);
  background:var(--bg);
  color:var(--tx);
  min-height:100%;
}
[data-theme='dark'] .gx {
  --bg2:#262626; --bg3:#2e2e2e; --bg4:#3a3a3a;
  --compute-d:#2f4a68;
  --mem:#d99a3d; --mem-d:#6e5426;
  --exec:#a48ad4; --exec-d:#4a3d6e;
  --danger:#ef7070; --ok:#81c784;
}
.gx-mono { font-family:var(--font-mono); }
.gx-wrap { max-width:1080px; margin:0 auto; padding:32px 22px 64px; }
.gx-head { display:flex; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; gap:14px; margin-bottom:20px; }
.gx-title { font-weight:600; font-size:28px; line-height:1.15; color:var(--heading); }
.gx-title b { color:var(--accent); font-weight:600; }
.gx-sub { color:var(--txd); font-size:15px; margin-top:6px; }
.gx-pill { font-family:var(--font-mono); font-size:12px; color:var(--tag-fg); background:var(--tag-bg); border-radius:6px; padding:4px 9px; }
.gx-tabs { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
.gx-tab { font-family:var(--font-body); font-weight:600; font-size:15px; background:var(--bg2); color:var(--txd); border:1px solid var(--line); border-radius:6px; padding:8px 15px; cursor:pointer; transition:.15s; display:flex; align-items:center; gap:8px; }
.gx-tab:hover { color:var(--tx); border-color:var(--line2); }
.gx-tab.on { color:var(--accent); border-color:var(--accent); background:var(--accent-soft); }
.gx-tab .dot { width:8px; height:8px; border-radius:2px; }
.gx-panel { background:var(--bg2); border:1px solid var(--line); border-radius:6px; }
.gx-fade { animation:gxFade .35s ease both; }
@keyframes gxFade { from{opacity:0;transform:translateY(6px);} to{opacity:1;transform:none;} }
.gx-h { font-weight:600; font-size:13px; color:var(--txd); text-transform:uppercase; letter-spacing:1.2px; }
.gx-cell { border:1px solid var(--line); border-radius:5px; background:var(--bg3); cursor:pointer; transition:.14s; position:relative; }
.gx-cell:hover { border-color:var(--accent); }
.gx-stage { background:var(--bg); border:1px solid var(--line); border-radius:6px; padding:18px; }
.gx-info { background:var(--bg3); border:1px solid var(--line); border-left:3px solid var(--compute); border-radius:5px; padding:14px 16px; font-size:16px; line-height:1.7; color:var(--txd); }
.gx-info b { color:var(--tx); font-weight:600; }
.gx-info .k { font-family:var(--font-mono); color:var(--accent); font-size:15px; }
.gx-btn { font-family:var(--font-mono); font-size:13px; cursor:pointer; background:var(--bg2); color:var(--tx); border:1px solid var(--line2); border-radius:5px; padding:8px 13px; transition:.14s; }
.gx-btn:hover:not(:disabled) { border-color:var(--accent); color:var(--accent); }
.gx-btn:disabled { opacity:.4; cursor:not-allowed; }
.gx-btn.primary { background:var(--accent); color:#fff; border-color:transparent; font-weight:600; }
.gx-btn.primary:hover { filter:brightness(1.08); color:#fff; }
.gx-seg { display:inline-flex; border:1px solid var(--line); border-radius:5px; overflow:hidden; }
.gx-seg button { font-family:var(--font-mono); font-size:12.5px; background:var(--bg2); color:var(--txd); border:0; padding:7px 12px; cursor:pointer; transition:.14s; }
.gx-seg button:hover { color:var(--tx); }
.gx-seg button.on { background:var(--accent-soft); color:var(--accent); }
.gx-seg button + button { border-left:1px solid var(--line); }
.gx-live { border-color:var(--accent) !important; background:var(--accent-soft) !important; }
.gx-masked { background-image:repeating-linear-gradient(45deg, rgba(127,127,127,.10) 0 5px, transparent 5px 10px); }
@keyframes gxBlink { 0%,100%{opacity:.35;} 50%{opacity:1;} }
.gx-blink { animation:gxBlink 1s ease-in-out infinite; }
.gx-legend { display:flex; gap:16px; flex-wrap:wrap; font-size:12.5px; color:var(--txd); font-family:var(--font-mono); }
.gx-legend i { display:inline-block; width:10px; height:10px; border-radius:2px; vertical-align:-1px; margin-right:5px; }
.gx-grid { display:grid; gap:6px; }
.gx-tier { display:flex; align-items:stretch; gap:0; border:1px solid var(--line); border-radius:6px; overflow:hidden; cursor:pointer; transition:.16s; background:var(--bg2); }
.gx-tier:hover { border-color:var(--line2); }
.gx-tier.sel { border-color:var(--mem); }
.gx-tier .swatch { width:6px; flex:none; }
a.gx-link, a.gx-link:visited { color:var(--accent); }
.gx-kv { display:flex; justify-content:space-between; gap:12px; font-size:13.5px; padding:4px 0; border-bottom:1px dashed var(--line); }
.gx-kv:last-child { border-bottom:0; }
.gx-kv .k { color:var(--txd); }
.gx-kv .v { font-family:var(--font-mono); color:var(--tx); font-size:12.5px; }
/* hierarchy map (Die Explorer) */
.gx-map { display:flex; align-items:stretch; gap:6px; flex-wrap:wrap; margin-bottom:14px; }
.gx-map .seg { border:1px solid var(--line); border-radius:5px; padding:6px 11px; background:var(--bg2); text-align:left; transition:.14s; }
.gx-map .seg .lv { font-family:var(--font-mono); font-size:12.5px; color:var(--txd); display:block; }
.gx-map .seg .ct { font-size:11px; color:var(--txf); display:block; margin-top:1px; }
.gx-map .seg.visited { cursor:pointer; }
.gx-map .seg.visited:hover { border-color:var(--accent); }
.gx-map .seg.visited .lv { color:var(--tx); }
.gx-map .seg.cur { border-color:var(--accent); background:var(--accent-soft); cursor:default; }
.gx-map .seg.cur .lv { color:var(--accent); }
.gx-map .seg.future { opacity:.55; cursor:default; }
.gx-map .sep { align-self:center; color:var(--txf); font-size:12px; }
/* divergence slider */
.gx-slider { accent-color:var(--accent); width:200px; }
`;

/* ---------- bilingual string tables ---------- */

const STR = {
  en: {
    // GlossaryBar
    glossaryTitle: "Quick Reference · 8 Key Terms",
    glossaryHint: "Click a term to expand",
    // GpuView
    gpuDieHeading: "GPU DIE · TOP VIEW",
    l2Label: "L2 CACHE · CHIP-WIDE SHARED (≈ 50 MB)",
    legendSm: "SM (click to drill in)",
    legendMem: "VRAM / Cache (click to inspect)",
    legendNote: "Real GPUs typically have 80–140 SMs; simplified to 24 here",
    // kernel launch
    launchBtn: "▶ Launch kernel · 96 blocks",
    kQueued: "queued",
    kResident: "resident",
    kDone: "done",
    launchDone: "All 96 blocks retired. The scheduler streams blocks onto whichever SM has a free slot — this is how a GPU load-balances automatically.",
    // SmView
    residentBlocks: "Resident Blocks",
    blockSubline: (warps) => `256 threads · ${warps} warps · click to drill in →`,
    smOccupancyNote: "Blocks are a software concept assigned to an SM by the hardware. How many can reside simultaneously depends on register and shared memory usage (occupancy).",
    // BlockView
    blockHeading: (i, warps) => `Block ${i} · 256 threads → ${warps} Warps`,
    blockSubtext: (
      <React.Fragment>
        Hardware slices the Block into Warps of{' '}
        <span className="gx-mono" style={{color:"var(--exec)"}}>32 threads each</span>.
        Each row = one Warp — click to drill in ↓
      </React.Fragment>
    ),
    // WarpView
    warpHeading: (i) => `Warp ${i} · 32 lanes (SIMT)`,
    warpSubtext: "These 32 threads share a single program counter and execute the same instruction at the same time. Click a lane to inspect an individual thread ↓",
    // ThreadView
    threadHeading: (i) => `Thread ${i} · single-thread context`,
    threadRegLabel: "Private Registers — fastest storage, ≈1 cycle",
    threadPcLabel: "Program Counter PC",
    threadPcShared: "Shared with the other 31 threads in this Warp",
    threadAluLabel: "Execution Unit — ALU lane",
    threadAluDesc: "This thread's arithmetic is handled by its corresponding ALU lane within the Warp.",
    threadSpillTip: "Tip: keeping private data in registers is fastest. If register pressure is too high, the compiler spills to local memory — named 'local' but physically in slow VRAM, a common performance trap.",
    // DieExplorer map + back button
    backToLevel: "← Back to level info",
    mapCounts: { gpu: "×1", sm: "×24", block: "3 resident / SM", warp: "×8 / block", thread: "×32 / warp" },
    mapNames: { gpu: "GPU die", sm: "SM", block: "Block", warp: "Warp", thread: "Thread" },
    // SmView internal labels
    smInternalHeading: (i) => `SM ${pad(i)} · Internal Structure`,
    // MemoryPyramid
    memPyramidHeading: "Memory Hierarchy · Larger and slower toward the bottom",
    chipOnChip: "● On-chip",
    chipOffChip: "○ Off-chip",
    cycleUnit: (lat) => `≈${lat} cycles`,
    logScaleNote: "Latency bars are log-scaled — VRAM is roughly 500× slower than registers",
    accessDemoHeading: "Access Demo",
    accessDemoDesc: "Choose where the data lives and watch the request cascade through each level:",
    hitBtn: (name) => `Hit ${name}`,
    hitResult: (name) => `Hit ${name}`,
    latResult: (lat) => <>Latency ≈ <b style={{color:"var(--mem)"}}>{lat} cycles</b></>,
    latRelative: (lat) => <> · <b style={{color:"var(--danger)"}}>{lat}× </b>slower than registers</>,
    cyclesElapsed: "cycles elapsed",
    kvScope: "Scope",
    kvCapacity: "Capacity",
    kvLatency: "Latency",
    kvBandwidth: "Bandwidth",
    // WarpSimt
    sliderLabel: "Threads taking the IF branch",
    presetUniform: "no divergence",
    presetHalf: "half / half",
    predicted: (c, u) => <>→ this program will take <b>{c} cycles</b> at <b>{u}%</b> average utilization</>,
    warpLaneHeading: "1 WARP · 32 LANES",
    ifGroupLabel: (n) => `IF group (tid < ${n})`,
    elseGroupLabel: (n) => `ELSE group (tid ≥ ${n})`,
    statCycles: "Cycles Done",
    statActiveLanes: "Active Lanes",
    statAvgUtil: "Avg Utilization",
    instrStreamHeading: "Instruction Stream (SIMT)",
    speedLabel: "Speed",
    speedSlow: "Slow",
    speedMed: "Med",
    speedFast: "Fast",
    btnPause: "⏸ Pause",
    btnReplay: "↺ Replay",
    btnPlay: "▶ Play",
    btnStep: "⏭ Step",
    btnReset: "↺ Reset",
    // Main tabs
    tab_die_label: "Die Explorer",
    tab_mem_label: "Memory Pyramid",
    tab_warp_label: "Warp Scheduler",
    tab_die_sub: "GPU → SM → Block → Warp → Thread — drill-down explorer",
    tab_mem_sub: "Registers / SRAM / L2 / VRAM — capacity and latency compared",
    tab_warp_sub: "32 threads stepping in lockstep — visualizing branch divergence cost",
    // Main heading
    mainTitle: (
      <React.Fragment>GPU Architecture <b>Interactive Sandbox</b></React.Fragment>
    ),
    mainSub: "Drill into a GPU — VRAM · SM · Block · Warp · Thread · ALU · Registers · SRAM",
    footer: "Values are illustrative (based on NVIDIA Hopper/Ampere scale) — real chips vary by architecture",
  },
  zh: {
    glossaryTitle: "概念速查 · 8 个关键词",
    glossaryHint: "点词条展开释义",
    gpuDieHeading: "GPU DIE · 整片俯视",
    l2Label: "L2 CACHE · 全芯片共享 (≈ 50 MB)",
    legendSm: "SM(可点击钻取)",
    legendMem: "显存 / 缓存(可点击查看)",
    legendNote: "真实 GPU 通常有 80–140 个 SM，此处简化为 24",
    launchBtn: "▶ 发射 kernel · 96 blocks",
    kQueued: "排队",
    kResident: "驻留",
    kDone: "完成",
    launchDone: "96 个 Block 全部执行完毕。调度器把 Block 源源不断喂给有空位的 SM——GPU 就是这样自动负载均衡的。",
    residentBlocks: "驻留 BLOCK",
    blockSubline: (warps) => `256 线程 · ${warps} warps · 点击钻取 →`,
    smOccupancyNote: "Block 是软件概念，被硬件分配到某个 SM 执行。一个 SM 能驻留几个 Block，取决于寄存器与共享内存的用量(occupancy)。",
    blockHeading: (i, warps) => `Block ${i} · 256 线程 → ${warps} Warp`,
    blockSubtext: (
      <React.Fragment>
        硬件按 <span className="gx-mono" style={{color:"var(--exec)"}}>32 线程 / 组</span> 把 Block 切成 Warp。每行 = 一个 Warp，点击钻取 ↓
      </React.Fragment>
    ),
    warpHeading: (i) => `Warp ${i} · 32 lane (SIMT)`,
    warpSubtext: "这 32 个线程共用一个程序计数器，同一时刻执行同一条指令。点一条 lane 看单个 Thread ↓",
    threadHeading: (i) => `Thread ${i} · 单线程上下文`,
    threadRegLabel: "私有寄存器 (Registers) — 最快的存储，≈1 周期",
    threadPcLabel: "程序计数器 PC",
    threadPcShared: "与同 Warp 的 31 个线程共享",
    threadAluLabel: "执行单元 ALU lane",
    threadAluDesc: "本线程的算术运算由 Warp 内对应的一条 ALU lane 执行。",
    threadSpillTip: "提示:线程私有数据放寄存器最快；寄存器不够会『溢出』到 local memory——名字叫 local，实际位于慢速显存，是常见性能陷阱。",
    backToLevel: "← 返回层级说明",
    mapCounts: { gpu: "×1", sm: "×24", block: "每 SM 驻留 3", warp: "×8 / block", thread: "×32 / warp" },
    mapNames: { gpu: "GPU 芯片", sm: "SM", block: "Block", warp: "Warp", thread: "Thread" },
    smInternalHeading: (i) => `SM ${pad(i)} · 内部结构`,
    memPyramidHeading: "内存层级 · 越往下越大越慢",
    chipOnChip: "● 片上",
    chipOffChip: "○ 片外",
    cycleUnit: (lat) => `≈${lat} 周期`,
    logScaleNote: "延迟条为对数刻度——VRAM 实际比寄存器慢约 500 倍",
    accessDemoHeading: "访问演示",
    accessDemoDesc: "选择数据所在层级，观察请求逐级下探与延迟代价:",
    hitBtn: (name) => `命中 ${name}`,
    hitResult: (name) => `命中 ${name}`,
    latResult: (lat) => <>延迟 ≈ <b style={{color:"var(--mem)"}}>{lat} 周期</b></>,
    latRelative: (lat) => <> · 相当于寄存器的 <b style={{color:"var(--danger)"}}>{lat}×</b></>,
    cyclesElapsed: "已耗周期",
    kvScope: "作用域",
    kvCapacity: "容量",
    kvLatency: "延迟",
    kvBandwidth: "带宽",
    sliderLabel: "走 IF 分支的线程数",
    presetUniform: "无分歧",
    presetHalf: "对半分",
    predicted: (c, u) => <>→ 这段程序将耗时 <b>{c} 周期</b>，平均利用率 <b>{u}%</b></>,
    warpLaneHeading: "1 个 WARP · 32 LANE",
    ifGroupLabel: (n) => `IF 组 (tid < ${n})`,
    elseGroupLabel: (n) => `ELSE 组 (tid ≥ ${n})`,
    statCycles: "已执行周期",
    statActiveLanes: "当前活跃 lane",
    statAvgUtil: "平均利用率",
    instrStreamHeading: "指令流 (SIMT)",
    speedLabel: "速度",
    speedSlow: "慢",
    speedMed: "中",
    speedFast: "快",
    btnPause: "⏸ 暂停",
    btnReplay: "↺ 重新播放",
    btnPlay: "▶ 播放",
    btnStep: "⏭ 单步",
    btnReset: "↺ 复位",
    tab_die_label: "芯片透视",
    tab_mem_label: "内存金字塔",
    tab_warp_label: "Warp 调度",
    tab_die_sub: "GPU → SM → Block → Warp → Thread 逐级钻取",
    tab_mem_sub: "寄存器 / SRAM / L2 / VRAM 的容量与延迟对比",
    tab_warp_sub: "32 线程锁步执行，直观演示分支分歧代价",
    mainTitle: (
      <React.Fragment>GPU 架构<b>交互沙盒</b></React.Fragment>
    ),
    mainSub: "钻进一颗 GPU，看清 VRAM · SM · Block · Warp · Thread · ALU · Registers · SRAM",
    footer: "数值为教学示意（基于 NVIDIA Hopper/Ampere 量级），真实芯片随架构而异",
  },
};

/* level info JSX fragments keyed by lang */
function levelInfo(lang) {
  if (lang === 'en') {
    return {
      gpu: (
        <React.Fragment>
          A <b>GPU die</b> contains dozens to hundreds of{' '}
          <span className="k">SM</span>s, all sharing an L2 cache. The off-chip{' '}
          <span className="k">VRAM</span> (HBM) sits around the perimeter — large capacity but high latency. When a kernel launches, it is split into many Blocks, which the scheduler distributes across idle SMs. Click an SM to drill in ↓
        </React.Fragment>
      ),
      sm: (
        <React.Fragment>
          An <span className="k">SM</span> is divided into 4 processing blocks, each with its own Warp scheduler and a bank of{' '}
          <span className="k">ALU</span>s. They share an on-chip{' '}
          <span className="k">SRAM</span> (L1 + shared memory) and a register file. The panel on the right shows Blocks currently resident on this SM — click one to drill in ↓
        </React.Fragment>
      ),
      block: (
        <React.Fragment>
          A <span className="k">Block</span> is the thread group you define in your kernel (256 threads here). Hardware cuts it into{' '}
          {WARPS_PER_BLK} <span className="k">Warp</span>s of 32 threads each. Click a Warp ↓
        </React.Fragment>
      ),
      warp: (
        <React.Fragment>
          A <span className="k">Warp</span> = exactly 32 threads sharing one program counter, executing the same instruction every cycle (SIMT). This is the hardware's minimum scheduling unit. Click a lane to inspect an individual thread ↓
        </React.Fragment>
      ),
      thread: (
        <React.Fragment>
          A <span className="k">Thread</span> is the finest execution unit: private{' '}
          <span className="k">registers</span> + program counter, running on one lane of a Warp, with one{' '}
          <span className="k">ALU</span> doing its arithmetic.
        </React.Fragment>
      ),
    };
  }
  // zh
  return {
    gpu: (
      <React.Fragment>
        一颗 <b>GPU 芯片</b> 由几十~上百个 <span className="k">SM</span> 组成，它们共享一块 L2 缓存；芯片外围是 <span className="k">VRAM</span>(显存/HBM)——容量大但延迟高。kernel 启动后被拆成大量 Block，调度器把它们分发到空闲的 SM 上。点一个 SM 钻进去 ↓
      </React.Fragment>
    ),
    sm: (
      <React.Fragment>
        <span className="k">SM</span> 内部分为 4 个处理块，每个有独立的 Warp 调度器和一组<span className="k"> ALU</span>；它们共享一块片上 <span className="k">SRAM</span>(L1+共享内存)和寄存器文件。右侧是当前驻留在此 SM 上的 Block——点一个钻进去 ↓
      </React.Fragment>
    ),
    block: (
      <React.Fragment>
        <span className="k">Block</span> 是你在 kernel 里定义的线程分组(此处 256 线程)。硬件把它按 32 个线程一组切成 {WARPS_PER_BLK} 个 <span className="k">Warp</span>。点一个 Warp ↓
      </React.Fragment>
    ),
    warp: (
      <React.Fragment>
        <span className="k">Warp</span> = 固定 32 个线程，共用一个程序计数器，同一时刻执行同一条指令(SIMT)。这是硬件调度的最小单位。点一条 lane 看单个线程 ↓
      </React.Fragment>
    ),
    thread: (
      <React.Fragment>
        <span className="k">Thread</span> 是最细的执行单元:私有 <span className="k">寄存器</span> + 程序计数器，运行在 Warp 的一条 lane 上，由一个 <span className="k">ALU</span> 执行运算。
      </React.Fragment>
    ),
  };
}

/* part info: [title, color, description] */
function partInfo(lang) {
  if (lang === 'en') {
    return {
      vram:  ["VRAM · Global Memory", "var(--mem)", "Off-chip high-capacity memory (HBM3, 80 GB here). Accessible by all SMs — the landing zone for cudaMemcpy. Largest capacity, highest latency (≈400+ cycles); bandwidth (TB/s range) is the performance bottleneck."],
      l2:    ["L2 Cache", "var(--mem)", "Chip-wide on-chip cache (tens of MB). Sits between SMs and VRAM, caching global memory accesses. A hit here avoids the high latency of VRAM."],
      sched: ["Warp Scheduler", "var(--compute)", "One per processing block. Each cycle it selects a ready Warp and issues its next instruction. When a Warp stalls waiting for memory, the scheduler instantly switches to another — this is how GPUs hide latency through parallelism."],
      alu:   ["ALU · Arithmetic Logic Unit", "var(--compute)", "Executes integer/floating-point operations (part of a CUDA Core). Each processing block has a bank of ALUs that handle the 32 lanes of a Warp."],
      reg:   ["Register File", "var(--mem)", "The fastest on-chip storage, partitioned privately per thread. The more registers a thread uses, the fewer Warps can reside on an SM simultaneously — directly limiting occupancy."],
      sram:  ["SRAM · L1 / Shared Memory", "var(--mem)", "High-speed SRAM inside the SM, physically serving as both L1 cache and shared memory in a configurable ratio. Latency is far below VRAM. Threads within the same Block use it to cooperate."],
    };
  }
  // zh
  return {
    vram:  ["VRAM · 显存", "var(--mem)", "芯片外的大容量显存(HBM3,此处 80 GB)。所有 SM 都能访问，是 cudaMemcpy 的落点。容量最大，延迟最高(≈400+ 周期),带宽(TB/s 级)是性能关键。"],
    l2:    ["L2 Cache", "var(--mem)", "全芯片共享的片上缓存(几十 MB)。位于 SM 与显存之间，缓存全局内存访问，命中即可省去访问显存的高延迟。"],
    sched: ["Warp Scheduler · 调度器", "var(--compute)", "每个处理块一个。每周期从就绪的 Warp 中挑一个发射指令。某个 Warp 因等内存停顿时立刻切换到别的 Warp——GPU 就是这样用并行『隐藏延迟』的。"],
    alu:   ["ALU · 算术逻辑单元", "var(--compute)", "执行整数/浮点运算(CUDA Core 的一部分)。一个处理块里有一组 ALU,Warp 内 32 个 lane 的运算被分配到这些单元上。"],
    reg:   ["Register File · 寄存器文件", "var(--mem)", "片上最快的存储,按线程私有切分。寄存器用量越大,一个 SM 能同时容纳的 Warp 越少——直接影响 occupancy(占用率)。"],
    sram:  ["SRAM · L1 / 共享内存", "var(--mem)", "SM 内的高速 SRAM,物理上同时充当 L1 缓存与共享内存(shared memory),比例可配置。延迟远低于显存,同一 Block 的线程靠它协作。"],
  };
}

/* not-started hint in WarpSimt */
function notStartedHint(lang, divergent) {
  if (lang === 'en') {
    return (
      <React.Fragment>
        Click <b>▶ Play</b> or <b>Step</b> to watch the 32 threads execute in lockstep.
        {divergent && <> Watch what happens after the <b>I3 branch</b>.</>}
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      点 <b>▶ 播放</b> 或 <b>单步</b> 观察 32 个线程如何锁步执行。
      {divergent && <> 注意 <b>I3 分支</b> 之后会发生什么。</>}
    </React.Fragment>
  );
}

/* finished summary messages */
function finishedMsg(lang, splitAt, cyclesDone, avgUtil) {
  const divergent = splitAt > 0 && splitAt < 32;
  if (lang === 'en') {
    if (divergent) {
      return (
        <React.Fragment>
          <b style={{color:"var(--danger)"}}>The cost of branch divergence:</b> within a single Warp, the IF group ({splitAt} lanes) and the ELSE group ({32 - splitAt} lanes) cannot execute in parallel — the hardware must run them <b>serially</b>, with the other group's lanes sitting idle. This run took {cyclesDone} cycles with an average utilization of only <b>{(avgUtil * 100).toFixed(1)}%</b>.<br />
          Optimization: arrange data so all 32 threads in a Warp take the <b>same branch</b> (e.g. sort by key, remap tid assignments). Drag the slider and replay to see how the cost varies.
        </React.Fragment>
      );
    }
    return (
      <React.Fragment>
        <b style={{color:"var(--ok)"}}>No divergence:</b> all 32 lanes execute the same instruction throughout, achieving <b>100%</b> utilization over {cyclesDone} cycles — SIMT at peak efficiency. Drag the slider away from the ends to see divergence appear.
      </React.Fragment>
    );
  }
  // zh
  if (divergent) {
    return (
      <React.Fragment>
        <b style={{color:"var(--danger)"}}>分支分歧的代价：</b>同一个 Warp 内，IF 组（{splitAt} 条 lane）与 ELSE 组（{32 - splitAt} 条 lane）无法并行——硬件只能<b>先后串行</b>执行，另一组 lane 在旁空等。本次共 {cyclesDone} 周期，平均利用率仅 <b>{(avgUtil * 100).toFixed(1)}%</b>。<br />
        优化方向：让同一 Warp 内的 32 个线程尽量走<b>相同分支</b>（如按数据排序、调整 tid 映射）。拖动滑块再播放，看看代价如何变化。
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      <b style={{color:"var(--ok)"}}>无分歧：</b>32 个 lane 始终执行同一条指令，全程利用率 <b>100%</b>，共 {cyclesDone} 周期——这是 SIMT 最高效的状态。把滑块拖离两端，就能看到分歧出现。
    </React.Fragment>
  );
}

/* ---------- glossary ---------- */
const GLOSSARY = [
  {
    t: "VRAM", cn: "显存", fam: "mem",
    en: { name: "VRAM", d: "Off-chip high-capacity memory (HBM) — dozens of GB. Shared by all SMs, it is the landing zone for CPU↔GPU transfers. Largest capacity, highest latency." },
    zh: { name: "显存", d: "GPU 芯片外的大容量内存（HBM），容量几十 GB。所有 SM 共享，是 CPU↔GPU 数据传输的落点。容量最大但延迟最高。" },
  },
  {
    t: "SM", cn: "流多处理器", fam: "compute",
    en: { name: "Streaming Multiprocessor", d: "Streaming Multiprocessor — the basic scheduling and execution unit of a GPU. A single chip contains dozens to hundreds. Contains ALUs, a register file, SRAM, and Warp schedulers." },
    zh: { name: "流多处理器", d: "Streaming Multiprocessor。GPU 的基本调度+执行单元，一颗 GPU 含几十~上百个。内含 ALU、寄存器文件、SRAM、Warp 调度器。" },
  },
  {
    t: "Block", cn: "线程块", fam: "exec",
    en: { name: "Thread Block", d: "The thread group you define when launching a kernel. An entire Block is always assigned to one SM, allowing shared-memory communication and __syncthreads() synchronization within it." },
    zh: { name: "线程块", d: "kernel 启动时你定义的线程分组。同一 Block 必定整体跑在同一个 SM 上，可用共享内存通信、__syncthreads() 同步。" },
  },
  {
    t: "Warp", cn: "线程束", fam: "exec",
    en: { name: "Warp", d: "The hardware's true execution granularity: exactly 32 threads sharing one PC, executing the same instruction each cycle (SIMT). The minimum scheduling unit." },
    zh: { name: "线程束", d: "硬件真正的执行粒度:固定 32 个线程，共用一个 PC，同一时刻执行同一条指令(SIMT)。调度的最小单位。" },
  },
  {
    t: "Thread", cn: "线程", fam: "exec",
    en: { name: "Thread", d: "The finest execution unit. Each thread has private registers and a program counter, and runs on one lane of a Warp." },
    zh: { name: "线程", d: "最细的执行单元。每个线程有私有寄存器和程序计数器，运行在 Warp 的一条 lane 上。" },
  },
  {
    t: "ALU", cn: "算术逻辑单元", fam: "compute",
    en: { name: "Arithmetic Logic Unit", d: "The hardware unit executing integer/floating-point operations (part of a CUDA Core). A processing block contains a bank of ALUs that handle each lane's computation within a Warp." },
    zh: { name: "算术逻辑单元", d: "执行整数/浮点运算的硬件单元（CUDA Core 的一部分）。一个处理块里有一组 ALU，承接 Warp 内各 lane 的运算。" },
  },
  {
    t: "Registers", cn: "寄存器", fam: "mem",
    en: { name: "Registers", d: "The fastest on-chip storage, partitioned privately per thread. The more registers a thread consumes, the fewer Warps can co-reside on an SM (affecting occupancy)." },
    zh: { name: "寄存器", d: "片上最快的存储，按线程私有切分。每线程寄存器用得越多，一个 SM 能同时容纳的 Warp 越少（影响 occupancy）。" },
  },
  {
    t: "SRAM", cn: "片上静态内存", fam: "mem",
    en: { name: "On-chip Static RAM", d: "High-speed SRAM inside the SM, physically acting as both L1 cache and shared memory in a configurable ratio. Threads in the same Block use it to cooperate." },
    zh: { name: "片上静态内存", d: "SM 内的高速 SRAM，物理上同时充当 L1 缓存与共享内存(shared memory)，比例可配置。同一 Block 的线程靠它协作。" },
  },
];
const FAM = { mem: "var(--mem)", compute: "var(--compute)", exec: "var(--exec)" };

/* ---------- constants ---------- */
const SM_COUNT = 24;
const ALU_PER_BLK = 16;
const BLK_THREADS = 256;
const WARPS_PER_BLK = BLK_THREADS / 32;
const pad = (n) => String(n).padStart(2, "0");

/* ============ Module 1: Die Explorer ============ */
const LEVELS = ["gpu", "sm", "block", "warp", "thread"];

function DieExplorer({ lang }) {
  const [nav, setNav] = useState([{ type: "gpu" }]);
  const [detail, setDetail] = useState(null);
  const cur = nav[nav.length - 1];
  const push = (node) => { setDetail(null); setNav([...nav, node]); };
  const jump = (i) => { setDetail(null); setNav(nav.slice(0, i + 1)); };

  const crumbLabel = (n) => ({
    gpu: lang === 'en' ? "GPU Die" : "GPU 芯片",
    sm: `SM ${pad(n.i)}`,
    block: `Block ${n.i}`,
    warp: `Warp ${n.i}`,
    thread: `Thread ${n.i}`,
  }[n.type]);

  const LEVEL_INFO = levelInfo(lang);
  const PART_INFO = partInfo(lang);
  const s = STR[lang];

  return (
    <div>
      {/* Hierarchy map: the fixed 5-level scale strip doubles as breadcrumbs.
          Visited levels are clickable; future levels are dimmed. */}
      <div className="gx-map">
        {LEVELS.map((lv, i) => {
          const visited = i < nav.length;
          const isCur = i === nav.length - 1;
          const cls = "seg" + (isCur ? " cur" : visited ? " visited" : " future");
          return (
            <React.Fragment key={lv}>
              {i > 0 && <span className="sep">›</span>}
              <button
                className={cls}
                onClick={() => visited && !isCur && jump(i)}
                style={{ font: "inherit" }}
              >
                <span className="lv">{visited ? crumbLabel(nav[i]) : s.mapNames[lv]}</span>
                <span className="ct">{s.mapCounts[lv]}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
      <div className="gx-stage gx-fade" key={cur.type + (cur.i ?? "")}>
        {cur.type === "gpu"    && <GpuView    lang={lang} onSM={(i) => push({ type: "sm", i })}    onPart={(p) => setDetail(p)} active={detail} />}
        {cur.type === "sm"     && <SmView     lang={lang} i={cur.i} onBlock={(i) => push({ type: "block", i })} onPart={(p) => setDetail(p)} active={detail} />}
        {cur.type === "block"  && <BlockView  lang={lang} i={cur.i} onWarp={(i) => push({ type: "warp", i })} />}
        {cur.type === "warp"   && <WarpView   lang={lang} i={cur.i} onThread={(i) => push({ type: "thread", i })} />}
        {cur.type === "thread" && <ThreadView lang={lang} i={cur.i} />}
      </div>
      <div className="gx-info" style={{ marginTop: 14 }}>
        {detail && PART_INFO[detail] ? (
          <React.Fragment>
            <b style={{ color: PART_INFO[detail][1] }}>{PART_INFO[detail][0]}</b>
            <br />
            {PART_INFO[detail][2]}
            <div style={{ marginTop: 6 }}>
              <button
                className="gx-btn"
                style={{ padding: "4px 9px", fontSize: 12 }}
                onClick={() => setDetail(null)}
              >
                {s.backToLevel}
              </button>
            </div>
          </React.Fragment>
        ) : LEVEL_INFO[cur.type]}
      </div>
    </div>
  );
}

/* kernel-launch simulation constants */
const KERNEL_BLOCKS = 96;
const MAX_RESIDENT = 3;

function GpuView({ lang, onSM, onPart, active }) {
  const s = STR[lang];

  // kernel launch animation: queue → resident (≤3/SM, 2–4 ticks each) → done
  const [kern, setKern] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);

  const launch = () => {
    clearInterval(timer.current);
    setKern({
      queue: KERNEL_BLOCKS,
      perSm: Array.from({ length: SM_COUNT }, () => []),
      done: 0,
      running: true,
    });
    timer.current = setInterval(() => {
      setKern((k) => {
        if (!k || !k.running) return k;
        let { queue, done } = k;
        const perSm = k.perSm.map((arr) => arr.map((t) => t - 1));
        for (const arr of perSm) {
          for (let j = arr.length - 1; j >= 0; j--) {
            if (arr[j] <= 0) { arr.splice(j, 1); done += 1; }
          }
        }
        for (let i = 0; i < SM_COUNT && queue > 0; i++) {
          while (perSm[i].length < MAX_RESIDENT && queue > 0) {
            perSm[i].push(2 + Math.floor(Math.random() * 3));
            queue -= 1;
          }
        }
        const running = queue > 0 || perSm.some((a) => a.length > 0);
        if (!running) clearInterval(timer.current);
        return { queue, perSm, done, running };
      });
    }, 220);
  };
  const resetKern = () => { clearInterval(timer.current); setKern(null); };

  const resident = kern ? kern.perSm.reduce((a, b) => a + b.length, 0) : 0;

  const VramCol = () => (
    <button
      onClick={() => onPart("vram")}
      className={active === "vram" ? "gx-live" : ""}
      style={{
        width: 46, alignSelf: "stretch", borderRadius: 5, cursor: "pointer",
        border: "1px solid var(--mem-d)",
        background: "repeating-linear-gradient(0deg,var(--bg4) 0 13px,var(--bg3) 13px 26px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <span className="gx-mono" style={{ writingMode: "vertical-rl", fontSize: 12, color: "var(--mem)", letterSpacing: 2 }}>
        VRAM · HBM
      </span>
    </button>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <div className="gx-h">{s.gpuDieHeading}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {kern && (
            <span className="gx-mono" style={{ fontSize: 12.5, color: "var(--txd)" }}>
              {s.kQueued} <b style={{ color: "var(--tx)" }}>{kern.queue}</b>
              {" · "}{s.kResident} <b style={{ color: "var(--accent)" }}>{resident}</b>
              {" · "}{s.kDone} <b style={{ color: "var(--ok)" }}>{kern.done}</b>/{KERNEL_BLOCKS}
            </span>
          )}
          {!kern ? (
            <button className="gx-btn primary" onClick={launch}>{s.launchBtn}</button>
          ) : (
            <button className="gx-btn" onClick={resetKern}>{s.btnReset}</button>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <VramCol />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
          <button
            onClick={() => onPart("l2")}
            className={active === "l2" ? "gx-live" : ""}
            style={{
              height: 38, borderRadius: 5, cursor: "pointer",
              border: "1px dashed var(--mem-d)", background: "var(--bg3)",
              color: "var(--mem)", fontFamily: "var(--font-mono)",
              fontSize: 12.5, letterSpacing: 1.5,
            }}
          >
            {s.l2Label}
          </button>
          <div className="gx-grid" style={{ gridTemplateColumns: "repeat(6,1fr)" }}>
            {Array.from({ length: SM_COUNT }, (_, i) => {
              const n = kern ? kern.perSm[i].length : 0;
              return (
                <button key={i} className="gx-cell" onClick={() => onSM(i)}
                  style={{
                    padding: "11px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    background: kern && n > 0 ? "var(--accent-soft)" : undefined,
                    borderColor: kern && n > 0 ? "var(--compute-d)" : undefined,
                  }}>
                  <div style={{ display: "flex", gap: 2 }}>
                    {kern
                      ? [0, 1, 2].map((k) => (
                          <span key={k} style={{
                            width: 8, height: 8, borderRadius: 2,
                            background: k < n ? "var(--accent)" : "transparent",
                            border: "1px solid " + (k < n ? "var(--accent)" : "var(--line2)"),
                            transition: ".15s",
                          }} />
                        ))
                      : [0, 1, 2, 3].map((k) => (
                          <span key={k} style={{ width: 7, height: 7, borderRadius: 1, background: "var(--compute-d)" }} />
                        ))}
                  </div>
                  <span className="gx-mono" style={{ fontSize: 11, color: "var(--txd)" }}>SM {pad(i)}</span>
                </button>
              );
            })}
          </div>
        </div>
        <VramCol />
      </div>
      {kern && !kern.running && (
        <div className="gx-info gx-fade" style={{ marginTop: 12, borderLeftColor: "var(--ok)" }}>
          {s.launchDone}
        </div>
      )}
      <div className="gx-legend" style={{ marginTop: 12 }}>
        <span><i style={{ background: "var(--compute-d)" }} />{s.legendSm}</span>
        <span><i style={{ background: "var(--mem)" }} />{s.legendMem}</span>
        <span style={{ color: "var(--txf)" }}>{s.legendNote}</span>
      </div>
    </div>
  );
}

function SmView({ lang, i, onBlock, onPart, active }) {
  const s = STR[lang];
  const ProcBlock = ({ idx }) => (
    <div style={{ border: "1px solid var(--line)", borderRadius: 5, padding: 9, background: "var(--bg3)" }}>
      <button
        onClick={() => onPart("sched")}
        className={active === "sched" ? "gx-live" : ""}
        style={{
          width: "100%", marginBottom: 7, cursor: "pointer", borderRadius: 4,
          border: "1px solid var(--compute-d)", background: "var(--bg2)",
          color: "var(--accent)", fontSize: 11.5, padding: "5px 6px",
          fontFamily: "var(--font-mono)",
        }}
      >
        Warp Scheduler #{idx}
      </button>
      <div className="gx-grid" style={{ gridTemplateColumns: "repeat(8,1fr)", marginBottom: 7 }}>
        {Array.from({ length: ALU_PER_BLK }, (_, k) => (
          <button key={k} onClick={() => onPart("alu")}
            className={active === "alu" ? "gx-live" : ""}
            style={{ aspectRatio: "1", borderRadius: 3, cursor: "pointer", border: "1px solid var(--compute-d)", background: "var(--bg4)" }}
          />
        ))}
      </div>
      <div className="gx-mono" style={{ fontSize: 10.5, color: "var(--txf)", textAlign: "center" }}>
        16 × ALU (FP32/INT32)
      </div>
    </div>
  );
  return (
    <div>
      <div className="gx-h" style={{ marginBottom: 12 }}>{s.smInternalHeading(i)}</div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 340px", border: "1px solid var(--line2)", borderRadius: 6, padding: 11, background: "var(--bg2)" }}>
          <div className="gx-grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 9 }}>
            {[0, 1, 2, 3].map(k => <ProcBlock key={k} idx={k} />)}
          </div>
          <button
            onClick={() => onPart("reg")}
            className={active === "reg" ? "gx-live" : ""}
            style={{
              width: "100%", marginBottom: 8, cursor: "pointer", borderRadius: 5,
              border: "1px solid var(--mem-d)", background: "var(--bg3)",
              color: "var(--mem)", fontSize: 12, padding: "9px",
              fontFamily: "var(--font-mono)",
            }}
          >
            REGISTER FILE · {lang === 'en' ? 'Register File' : '寄存器文件'} (64K × 32-bit{lang === 'en' ? ', per-thread' : '，线程私有'})
          </button>
          <button
            onClick={() => onPart("sram")}
            className={active === "sram" ? "gx-live" : ""}
            style={{
              width: "100%", cursor: "pointer", borderRadius: 5,
              border: "1px solid var(--mem)", background: "var(--bg3)",
              color: "var(--mem)", fontSize: 12, padding: "11px",
              fontFamily: "var(--font-mono)",
            }}
          >
            ◆ SRAM · {lang === 'en' ? 'L1 Cache + Shared Memory (≈ 228 KB, shared across processing blocks)' : 'L1 缓存 + 共享内存 (≈ 228 KB，处理块共用)'}
          </button>
        </div>
        <div style={{ flex: "1 1 220px" }}>
          <div className="gx-h" style={{ marginBottom: 8, fontSize: 12 }}>{s.residentBlocks}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[0, 1, 2].map(b => (
              <button key={b} className="gx-cell" onClick={() => onBlock(b)}
                style={{ padding: "12px 13px", textAlign: "left", borderColor: "var(--exec-d)" }}>
                <div className="gx-mono" style={{ fontSize: 13.5, color: "var(--exec)" }}>Block {b}</div>
                <div style={{ fontSize: 12, color: "var(--txd)", marginTop: 3 }}>{s.blockSubline(WARPS_PER_BLK)}</div>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--txf)", marginTop: 9, lineHeight: 1.55 }}>
            {s.smOccupancyNote}
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockView({ lang, i, onWarp }) {
  const s = STR[lang];
  return (
    <div>
      <div className="gx-h" style={{ marginBottom: 4 }}>{s.blockHeading(i, WARPS_PER_BLK)}</div>
      <div style={{ fontSize: 13.5, color: "var(--txd)", marginBottom: 13 }}>
        {s.blockSubtext}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {Array.from({ length: WARPS_PER_BLK }, (_, w) => (
          <button key={w} className="gx-cell" onClick={() => onWarp(w)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderColor: "var(--exec-d)" }}>
            <span className="gx-mono" style={{ fontSize: 12, color: "var(--exec)", width: 58, flex: "none" }}>Warp {w}</span>
            <span style={{ display: "flex", gap: 2, flexWrap: "wrap", flex: 1 }}>
              {Array.from({ length: 32 }, (_, t) => (
                <span key={t} style={{ width: 9, height: 9, borderRadius: 2, background: "var(--exec-d)" }} />
              ))}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function WarpView({ lang, i, onThread }) {
  const s = STR[lang];
  return (
    <div>
      <div className="gx-h" style={{ marginBottom: 4 }}>{s.warpHeading(i)}</div>
      <div style={{ fontSize: 13.5, color: "var(--txd)", marginBottom: 13 }}>
        {s.warpSubtext}
      </div>
      <div className="gx-grid" style={{ gridTemplateColumns: "repeat(8,1fr)" }}>
        {Array.from({ length: 32 }, (_, t) => (
          <button key={t} className="gx-cell" onClick={() => onThread(t)}
            style={{ padding: "13px 4px", textAlign: "center", borderColor: "var(--exec-d)" }}>
            <div className="gx-mono" style={{ fontSize: 11, color: "var(--txd)" }}>T{pad(t)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ThreadView({ lang, i }) {
  const s = STR[lang];
  const regs = useMemo(() =>
    Array.from({ length: 16 }, (_, k) => ({
      n: "R" + k,
      v: k === 0 ? "0x0000" : "0x" + ((i * 53 + k * 911) & 0xffff).toString(16).padStart(4, "0"),
    })), [i]);
  return (
    <div>
      <div className="gx-h" style={{ marginBottom: 12 }}>{s.threadHeading(i)}</div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 260px" }}>
          <div className="gx-mono" style={{ fontSize: 12, color: "var(--mem)", marginBottom: 7 }}>
            {s.threadRegLabel}
          </div>
          <div className="gx-grid" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
            {regs.map(r => (
              <div key={r.n} style={{
                display: "flex", justifyContent: "space-between",
                background: "var(--bg3)", border: "1px solid var(--mem-d)",
                borderRadius: 4, padding: "5px 9px",
                fontFamily: "var(--font-mono)", fontSize: 12,
              }}>
                <span style={{ color: "var(--mem)" }}>{r.n}</span>
                <span style={{ color: "var(--txd)" }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: "1 1 190px", display: "flex", flexDirection: "column", gap: 9 }}>
          <div style={{ background: "var(--bg3)", border: "1px solid var(--exec-d)", borderRadius: 5, padding: 12 }}>
            <div className="gx-mono" style={{ fontSize: 12, color: "var(--exec)" }}>{s.threadPcLabel}</div>
            <div className="gx-mono" style={{ fontSize: 17, color: "var(--tx)", marginTop: 4 }}>0x004C</div>
            <div style={{ fontSize: 11.5, color: "var(--txf)", marginTop: 3 }}>{s.threadPcShared}</div>
          </div>
          <div style={{ background: "var(--bg3)", border: "1px solid var(--compute-d)", borderRadius: 5, padding: 12 }}>
            <div className="gx-mono" style={{ fontSize: 12, color: "var(--accent)" }}>{s.threadAluLabel}</div>
            <div style={{ fontSize: 13, color: "var(--txd)", marginTop: 5, lineHeight: 1.55 }}>{s.threadAluDesc}</div>
          </div>
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--txf)", marginTop: 11, lineHeight: 1.6 }}>
        {s.threadSpillTip}
      </div>
    </div>
  );
}

/* ============ Module 2: Memory Pyramid ============ */
const TIERS = [
  {
    name: "Registers", scope_en: "per-thread private", scope_zh: "每线程私有",
    size: "256 KB / SM", lat: 1, bw: "~ extremely high", chip: true,
    en: { d: "The fastest on-chip storage. Each thread privately owns a set of registers, allocated by the compiler. Access is nearly zero-latency, but the total pool is limited — heavy register use reduces how many Warps can reside on an SM simultaneously." },
    zh: { d: "片上最快的存储。每个线程私有一组寄存器，编译器分配。访问几乎零延迟，但总量有限——用得多，SM 上能并行的 Warp 就少。" },
  },
  {
    name: "SRAM (L1/Shared)", scope_en: "per-Block / SM", scope_zh: "每 Block / SM",
    size: "~ 228 KB / SM", lat: 28, bw: "~ 19 TB/s", chip: true,
    en: { d: "High-speed SRAM inside the SM, shared among threads in the same Block. L1 cache and shared memory share the same physical bank in a configurable ratio. Manually caching data here can dramatically cut VRAM traffic." },
    zh: { d: "SM 内的高速 SRAM，同一 Block 的线程共享。物理上 L1 缓存与 shared memory 共用，比例可配。手动用它缓存数据可大幅减少访问显存。" },
  },
  {
    name: "L2 Cache", scope_en: "chip-wide shared", scope_zh: "全 GPU 共享",
    size: "~ 50 MB", lat: 200, bw: "~ 7 TB/s", chip: true,
    en: { d: "Chip-wide on-chip cache. Every SM's global memory access passes through here first; a hit avoids the full VRAM round-trip latency." },
    zh: { d: "全芯片共享的片上缓存。所有 SM 的显存访问都先经过它，命中即可避开访问 VRAM 的高延迟。" },
  },
  {
    name: "VRAM (HBM)", scope_en: "chip-wide shared", scope_zh: "全 GPU 共享",
    size: "40–80 GB", lat: 500, bw: "~ 3 TB/s", chip: false,
    en: { d: "Off-chip high-capacity memory. Largest capacity, highest latency (hundreds of cycles). Kernel inputs and outputs live here; bandwidth is the throughput bottleneck. GPUs hide this latency by switching Warps." },
    zh: { d: "芯片外的大容量显存。容量最大但延迟最高(数百周期)。kernel 的输入输出都在这里，带宽是吞吐瓶颈。GPU 靠切换 Warp 来『隐藏』这段延迟。" },
  },
];

function MemoryPyramid({ lang }) {
  const s = STR[lang];
  const [sel, setSel] = useState(3);
  const [dotStage, setDotStage] = useState(-1);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(null); // animated cycle counter
  const timers = useRef([]);

  const clearAll = () => {
    timers.current.forEach((id) => { clearTimeout(id); clearInterval(id); });
    timers.current = [];
  };
  useEffect(() => clearAll, []);

  const latScale = useMemo(() => d3.scaleLog().domain([1, 600]).range([8, 100]), []);

  /* Descend tier by tier; each stage animates the cycle counter up to that
     tier's latency, with stage duration proportional to the cycles it costs —
     registers flash by, VRAM visibly drags. */
  const runAccess = (target) => {
    clearAll();
    setSel(target); setRunning(true); setCycles(0); setDotStage(0);
    let at = 0;
    for (let k = 0; k <= target; k++) {
      const from = k === 0 ? 0 : TIERS[k - 1].lat;
      const to = TIERS[k].lat;
      const dur = 240 + Math.min(1100, (to - from) * 2.4);
      const stageId = setTimeout(() => {
        setDotStage(k);
        const t0 = performance.now();
        const iv = setInterval(() => {
          const p = Math.min(1, (performance.now() - t0) / dur);
          const e = p * p * (3 - 2 * p); // smoothstep
          setCycles(Math.round(from + (to - from) * e));
          if (p >= 1) clearInterval(iv);
        }, 40);
        timers.current.push(iv);
      }, at);
      timers.current.push(stageId);
      at += dur + 150;
    }
    const endId = setTimeout(() => setRunning(false), at);
    timers.current.push(endId);
  };

  const ROW = 78;

  const tierScope = (t) => lang === 'en' ? t.scope_en : t.scope_zh;
  const tierDesc = (t) => lang === 'en' ? t.en.d : t.zh.d;

  return (
    <div className="gx-fade">
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 380px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
            <div className="gx-h">{s.memPyramidHeading}</div>
            {cycles != null && (
              <span className="gx-mono" style={{ fontSize: 13, color: "var(--txd)", whiteSpace: "nowrap" }}>
                <b className="gx-mono" style={{ fontSize: 22, color: running ? "var(--accent)" : "var(--mem)" }}>{cycles}</b>
                {' '}{s.cyclesElapsed}
              </span>
            )}
          </div>
          <div style={{ position: "relative" }}>
            {dotStage >= 0 && (
              <div style={{
                position: "absolute", left: -13, top: dotStage * ROW + ROW / 2 - 7,
                width: 14, height: 14, borderRadius: "50%", background: "var(--accent)",
                transition: "top .42s cubic-bezier(.5,0,.2,1)", zIndex: 2,
              }} />
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TIERS.map((t, i) => {
                const reached = dotStage >= i;
                const hit = !running && dotStage === sel && sel === i;
                return (
                  <div key={t.name}
                    className={"gx-tier" + (sel === i ? " sel" : "")}
                    onClick={() => setSel(i)}
                    style={{
                      minHeight: ROW - 8,
                      outline: hit ? "1px solid var(--accent)" : "none",
                      background: reached ? "var(--bg4)" : "var(--bg2)",
                    }}
                  >
                    <div className="swatch" style={{ background: t.chip ? "var(--mem)" : "var(--mem-d)" }} />
                    <div style={{ padding: "9px 12px", flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                        <span className="gx-mono" style={{ fontSize: 14, color: "var(--tx)" }}>{t.name}</span>
                        <span style={{ fontSize: 11.5, color: t.chip ? "var(--accent)" : "var(--danger)", fontFamily: "var(--font-mono)" }}>
                          {t.chip ? s.chipOnChip : s.chipOffChip}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--txd)", marginTop: 3 }}>
                        {`${tierScope(t)} · ${t.size}`}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6 }}>
                        <div style={{ flex: 1, height: 7, background: "var(--bg3)", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{
                            width: latScale(t.lat) + "%", height: "100%",
                            background: reached ? "var(--mem)" : "var(--mem-d)",
                            borderRadius: 4, transition: ".3s",
                          }} />
                        </div>
                        <span className="gx-mono" style={{ fontSize: 11, color: "var(--mem)", width: 78, textAlign: "right" }}>
                          {s.cycleUnit(t.lat)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="gx-legend" style={{ marginTop: 10 }}>
            <span style={{ color: "var(--txf)" }}>{s.logScaleNote}</span>
          </div>
        </div>
        <div style={{ flex: "1 1 250px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="gx-panel" style={{ padding: 14 }}>
            <div className="gx-h" style={{ fontSize: 12, marginBottom: 9 }}>{s.accessDemoHeading}</div>
            <div style={{ fontSize: 13, color: "var(--txd)", marginBottom: 9, lineHeight: 1.55 }}>{s.accessDemoDesc}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TIERS.map((t, i) => (
                <button key={i} className="gx-btn" disabled={running}
                  style={{ fontSize: 11.5, padding: "6px 9px" }}
                  onClick={() => runAccess(i)}>
                  {s.hitBtn(t.name.split(" ")[0])}
                </button>
              ))}
            </div>
            {dotStage >= 0 && !running && (
              <div style={{ marginTop: 11, padding: "9px 11px", borderRadius: 5, background: "var(--bg3)", border: "1px solid var(--compute-d)" }}>
                <div className="gx-mono" style={{ fontSize: 12.5, color: "var(--accent)" }}>{s.hitResult(TIERS[sel].name)}</div>
                <div style={{ fontSize: 12.5, color: "var(--txd)", marginTop: 3 }}>
                  {s.latResult(TIERS[sel].lat)}
                  {sel > 0 && s.latRelative(TIERS[sel].lat)}
                </div>
                {/* cost bar: this access vs a register hit, log-scaled like the pyramid */}
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 8 }}>
                  <div style={{ flex: 1, height: 7, background: "var(--bg4)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: latScale(TIERS[sel].lat) + "%", height: "100%", background: "var(--mem)", borderRadius: 4 }} />
                  </div>
                  <span className="gx-mono" style={{ fontSize: 10.5, color: "var(--txf)" }}>reg = {latScale(1).toFixed(0)}%</span>
                </div>
              </div>
            )}
          </div>
          <div className="gx-info" style={{ borderLeftColor: "var(--mem)" }}>
            <b style={{ color: "var(--mem)" }}>{TIERS[sel].name}</b>
            <div style={{ marginTop: 6 }}>
              <div className="gx-kv"><span className="k">{s.kvScope}</span><span className="v">{tierScope(TIERS[sel])}</span></div>
              <div className="gx-kv"><span className="k">{s.kvCapacity}</span><span className="v">{TIERS[sel].size}</span></div>
              <div className="gx-kv"><span className="k">{s.kvLatency}</span><span className="v">≈ {TIERS[sel].lat} {lang === 'en' ? 'cycles' : '周期'}</span></div>
              <div className="gx-kv"><span className="k">{s.kvBandwidth}</span><span className="v">{TIERS[sel].bw}</span></div>
            </div>
            <div style={{ marginTop: 8, lineHeight: 1.65 }}>{tierDesc(TIERS[sel])}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ Module 3: SIMT ============ */
const PROGRAM = [
  {
    asm: "LD.global  R1, [in]",
    en: "All 32 threads load data from VRAM",
    zh: "全部 32 线程从显存加载数据",
  },
  {
    asm: "MUL        R2, R1, R1",
    en: "Each lane computes R1 squared",
    zh: "每条 lane 计算 R1 的平方",
  },
  {
    asm: "SETP.GE    P0, tid, N",
    en: "Test tid ≥ N; result written to predicate register P0",
    zh: "判断 tid ≥ N，结果写入谓词寄存器 P0",
  },
  {
    asm: "@P0  BRA   ELSE",
    en: "Threads where P0 is true branch to ELSE",
    zh: "P0 为真的线程跳转到 ELSE",
  },
  {
    asm: "ADD        R3, R2, 10",
    en: "[IF]   executed by threads where tid < N",
    zh: "[IF]   tid < N 的线程执行",
  },
  {
    asm: "BRA        DONE",
    en: "[IF]   skip over the ELSE block",
    zh: "[IF]   跳过 ELSE 段",
  },
  {
    asm: "SUB        R3, R2, 10",
    en: "[ELSE] executed by threads where tid ≥ N",
    zh: "[ELSE] tid ≥ N 的线程执行",
  },
  {
    asm: "ST.global  [out], R3",
    en: "All threads write results back to VRAM",
    zh: "全部线程把结果写回显存",
  },
];
const ALL_MASK = Array.from({ length: 32 }, () => true);

/* splitAt = number of threads (tid < splitAt) taking the IF branch.
   0 or 32 → uniform: the empty branch's instructions are never issued. */
function buildTrace(splitAt, lang) {
  const IF_LANES = Array.from({ length: 32 }, (_, t) => t < splitAt);
  const ELSE_LANES = IF_LANES.map((b) => !b);
  const uniformNote = lang === 'en'
    ? "Predicate is uniform → no divergence, Warp stays fully active"
    : "谓词结果一致 → 不发生分歧，warp 保持满载";

  if (splitAt >= 32) {
    // everyone takes IF: branch at I3 not taken, ELSE (I6) never issued
    return [0, 1, 2, 3, 4, 5, 7].map((pc) => ({
      pc, mask: ALL_MASK, phase: "all",
      note: pc === 3 ? uniformNote : "",
    }));
  }
  if (splitAt <= 0) {
    // everyone takes ELSE: IF body (I4, I5) never issued
    return [0, 1, 2, 3, 6, 7].map((pc) => ({
      pc, mask: ALL_MASK, phase: "all",
      note: pc === 3 ? uniformNote : "",
    }));
  }
  const nIf = splitAt, nElse = 32 - splitAt;
  const notes = lang === 'en' ? {
    n3: `Branch evaluated: lanes split into IF (${nIf}) / ELSE (${nElse}) groups`,
    n4: `IF group (${nIf} lanes) executing; ${nElse} lanes masked (idle) — utilization ${Math.round(nIf / 32 * 100)}%`,
    n5: `Still in IF block; the ELSE group continues to wait idle`,
    n6: `ELSE group's turn (${nElse} lanes); the IF group is now masked — the other half of divergence cost`,
    n7: "Branch reconverges; Warp is fully active again",
  } : {
    n3: `分支判定：lane 分裂成 IF (${nIf}) / ELSE (${nElse}) 两组`,
    n4: `IF 组（${nIf} 条 lane）执行，${nElse} 条 lane 被屏蔽(idle)——利用率 ${Math.round(nIf / 32 * 100)}%`,
    n5: `仍在 IF 段，ELSE 组继续空等`,
    n6: `轮到 ELSE 组（${nElse} 条 lane），IF 组被屏蔽——分歧的另一半代价`,
    n7: "分支汇合(reconverge)，warp 重新满载",
  };
  return [
    { pc: 0, mask: ALL_MASK,   phase: "all",  note: "" },
    { pc: 1, mask: ALL_MASK,   phase: "all",  note: "" },
    { pc: 2, mask: ALL_MASK,   phase: "all",  note: "" },
    { pc: 3, mask: ALL_MASK,   phase: "all",  note: notes.n3 },
    { pc: 4, mask: IF_LANES,   phase: "if",   note: notes.n4 },
    { pc: 5, mask: IF_LANES,   phase: "if",   note: notes.n5 },
    { pc: 6, mask: ELSE_LANES, phase: "else", note: notes.n6 },
    { pc: 7, mask: ALL_MASK,   phase: "all",  note: notes.n7 },
  ];
}

function Stat({ label, val, warn }) {
  return (
    <div style={{ flex: 1, background: "var(--bg3)", border: "1px solid var(--line)", borderRadius: 5, padding: "8px 10px", minWidth: 78 }}>
      <div style={{ fontSize: 11, color: "var(--txd)", textTransform: "uppercase", letterSpacing: .6 }}>{label}</div>
      <div className="gx-mono" style={{ fontSize: 17, marginTop: 2, color: warn ? "var(--danger)" : "var(--tx)" }}>{val}</div>
    </div>
  );
}

function WarpSimt({ lang }) {
  const s = STR[lang];
  const [splitAt, setSplitAt] = useState(16); // threads taking the IF branch
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(900);
  const timer = useRef(null);
  const trace = useMemo(() => buildTrace(splitAt, lang), [splitAt, lang]);
  const divergent = splitAt > 0 && splitAt < 32;

  useEffect(() => { stopPlay(); setStep(-1); }, [splitAt]);
  useEffect(() => () => clearInterval(timer.current), []);

  function stopPlay() { clearInterval(timer.current); setPlaying(false); }

  const play = () => {
    if (step >= trace.length - 1) setStep(-1);
    setPlaying(true);
    timer.current = setInterval(() => {
      setStep(st => {
        if (st >= trace.length - 1) { clearInterval(timer.current); setPlaying(false); return st; }
        return st + 1;
      });
    }, speed);
  };
  const next = () => { stopPlay(); setStep(st => Math.min(st + 1, trace.length - 1)); };
  const reset = () => { stopPlay(); setStep(-1); };

  const curStep = step >= 0 ? trace[step] : null;
  const curMask = curStep ? curStep.mask : ALL_MASK;
  const started = step >= 0;
  const cyclesDone = step + 1;
  const utilNow = curStep ? curMask.filter(Boolean).length : 0;
  const finished = step === trace.length - 1;

  const avgUtil = useMemo(() => {
    if (step < 0) return null;
    let active = 0;
    for (let i = 0; i <= step; i++) active += trace[i].mask.filter(Boolean).length;
    return active / ((step + 1) * 32);
  }, [step, trace]);

  // whole-run prediction shown live next to the slider
  const predicted = useMemo(() => {
    const total = trace.reduce((a, st) => a + st.mask.filter(Boolean).length, 0);
    return { cycles: trace.length, util: (total / (trace.length * 32) * 100).toFixed(1) };
  }, [trace]);

  const inIfGroup = (t) => t < splitAt;
  const laneColor = (t) => {
    if (!started) return divergent ? (inIfGroup(t) ? "var(--compute-d)" : "var(--exec-d)") : "var(--compute-d)";
    return curMask[t] ? "var(--accent)" : "var(--bg4)";
  };

  const instrDesc = (ins) => lang === 'en' ? ins.en : ins.zh;

  const speedOptions = [
    [1400, s.speedSlow],
    [900,  s.speedMed],
    [450,  s.speedFast],
  ];

  return (
    <div className="gx-fade">
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
        <span className="gx-h" style={{ fontSize: 12 }}>{s.sliderLabel}</span>
        <input
          type="range" min={0} max={32} value={splitAt}
          className="gx-slider"
          onChange={(e) => setSplitAt(Number(e.target.value))}
        />
        <span className="gx-mono" style={{ fontSize: 14, color: "var(--accent)", width: 56 }}>
          {splitAt} / 32
        </span>
        <div className="gx-seg">
          <button className={splitAt === 32 ? "on" : ""} onClick={() => setSplitAt(32)}>{s.presetUniform}</button>
          <button className={splitAt === 16 ? "on" : ""} onClick={() => setSplitAt(16)}>{s.presetHalf}</button>
        </div>
      </div>
      <div style={{ fontSize: 13.5, color: "var(--txd)", marginBottom: 14 }}>
        {s.predicted(predicted.cycles, predicted.util)}
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px" }}>
          <div className="gx-h" style={{ marginBottom: 9 }}>{s.warpLaneHeading}</div>
          <div className="gx-grid" style={{ gridTemplateColumns: "repeat(8,1fr)" }}>
            {Array.from({ length: 32 }, (_, t) => {
              const masked = started && !curMask[t];
              return (
                <div key={t} className={masked ? "gx-masked" : ""} style={{
                  aspectRatio: "1", borderRadius: 4,
                  border: "1px solid " + (started && curMask[t] ? "var(--accent)" : "var(--line)"),
                  background: laneColor(t),
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  transition: ".18s",
                }}>
                  <span className="gx-mono" style={{ fontSize: 10.5, color: started && curMask[t] ? "#fff" : "var(--txd)" }}>{pad(t)}</span>
                  {masked && <span style={{ fontSize: 9, color: "var(--txf)" }}>idle</span>}
                </div>
              );
            })}
          </div>
          {divergent && !started && (
            <div className="gx-legend" style={{ marginTop: 10 }}>
              <span><i style={{ background: "var(--compute-d)" }} />{s.ifGroupLabel(splitAt)}</span>
              <span><i style={{ background: "var(--exec-d)" }} />{s.elseGroupLabel(splitAt)}</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 13 }}>
            <Stat label={s.statCycles}     val={started ? cyclesDone : "—"} />
            <Stat label={s.statActiveLanes} val={started ? utilNow + " / 32" : "—"} warn={started && utilNow < 32} />
            <Stat label={s.statAvgUtil}    val={avgUtil != null ? (avgUtil * 100).toFixed(1) + "%" : "—"} warn={avgUtil != null && avgUtil < 0.999} />
          </div>
        </div>
        <div style={{ flex: "1 1 300px" }}>
          <div className="gx-h" style={{ marginBottom: 9 }}>{s.instrStreamHeading}</div>
          <div style={{ background: "var(--bg3)", border: "1px solid var(--line)", borderRadius: 6, padding: 8 }}>
            {PROGRAM.map((ins, pc) => {
              const active = curStep && curStep.pc === pc;
              const phase = active ? curStep.phase : null;
              const skipped = !trace.some((st) => st.pc === pc);
              return (
                <div key={pc} style={{
                  display: "flex", gap: 9, alignItems: "center", padding: "6px 8px", borderRadius: 4,
                  background: active ? "var(--bg4)" : "transparent",
                  opacity: skipped ? 0.4 : 1,
                  borderLeft: "2px solid " + (active ? (phase === "if" ? "var(--accent)" : phase === "else" ? "var(--exec)" : "var(--mem)") : "transparent"),
                }}>
                  <span className="gx-mono" style={{ fontSize: 10.5, color: "var(--txf)", width: 22 }}>I{pc}</span>
                  <span className="gx-mono" style={{ fontSize: 12.5, flex: 1, whiteSpace: "pre", color: active ? "var(--tx)" : "var(--txd)", textDecoration: skipped ? "line-through" : "none" }}>{ins.asm}</span>
                  {active && <span className="gx-mono gx-blink" style={{ fontSize: 10, color: "var(--accent)" }}>◀ PC</span>}
                </div>
              );
            })}
          </div>
          <div className="gx-info" style={{
            marginTop: 11,
            borderLeftColor: curStep && curStep.phase === "else" ? "var(--exec)" : curStep && curStep.phase === "if" ? "var(--compute)" : "var(--mem)",
          }}>
            {!started ? (
              notStartedHint(lang, divergent)
            ) : (
              <React.Fragment>
                <span className="gx-mono" style={{ color: "var(--accent)", fontSize: 14 }}>
                  I{curStep.pc} · {PROGRAM[curStep.pc].asm.split(/\s+/)[0]}
                </span>
                <br />
                {instrDesc(PROGRAM[curStep.pc])}
                {curStep.note && (
                  <React.Fragment>
                    <br />
                    <b style={{ color: curStep.phase === "if" || curStep.phase === "else" ? "var(--danger)" : "var(--tx)" }}>
                      → {curStep.note}
                    </b>
                  </React.Fragment>
                )}
              </React.Fragment>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
        <button className="gx-btn primary" onClick={playing ? stopPlay : play}>
          {playing ? s.btnPause : finished ? s.btnReplay : s.btnPlay}
        </button>
        <button className="gx-btn" onClick={next} disabled={playing || finished}>{s.btnStep}</button>
        <button className="gx-btn" onClick={reset} disabled={step < 0}>{s.btnReset}</button>
        <span style={{ flex: 1 }} />
        <span className="gx-h" style={{ fontSize: 11 }}>{s.speedLabel}</span>
        <div className="gx-seg">
          {speedOptions.map(([v, l]) => (
            <button key={v} className={speed === v ? "on" : ""} onClick={() => setSpeed(v)}>{l}</button>
          ))}
        </div>
      </div>
      {finished && (
        <div className="gx-info" style={{ marginTop: 13, borderLeftColor: divergent ? "var(--danger)" : "var(--ok)" }}>
          {finishedMsg(lang, splitAt, cyclesDone, avgUtil)}
        </div>
      )}
    </div>
  );
}

/* ============ Glossary ============ */
function GlossaryBar({ lang }) {
  const s = STR[lang];
  const [open, setOpen] = useState(null);
  return (
    <div className="gx-panel" style={{ padding: 13, marginTop: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span className="gx-h">{s.glossaryTitle}</span>
        <span style={{ fontSize: 12, color: "var(--txf)" }}>{s.glossaryHint}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {GLOSSARY.map((g, i) => (
          <button key={g.t} onClick={() => setOpen(open === i ? null : i)} className="gx-mono"
            style={{
              fontSize: 12.5, cursor: "pointer", padding: "6px 11px", borderRadius: 5,
              background: open === i ? "var(--bg4)" : "var(--bg3)",
              border: "1px solid " + (open === i ? FAM[g.fam] : "var(--line)"),
              color: open === i ? FAM[g.fam] : "var(--txd)", transition: ".14s",
            }}>
            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, background: FAM[g.fam], marginRight: 6, verticalAlign: 0 }} />
            {g.t}
          </button>
        ))}
      </div>
      {open != null && (
        <div className="gx-info gx-fade" style={{ marginTop: 11, borderLeftColor: FAM[GLOSSARY[open].fam] }}>
          <b style={{ color: FAM[GLOSSARY[open].fam] }}>{GLOSSARY[open].t}</b>
          <span style={{ color: "var(--txd)" }}> · {lang === 'en' ? GLOSSARY[open].en.name : GLOSSARY[open].cn}</span>
          <div style={{ marginTop: 5, lineHeight: 1.65 }}>
            {lang === 'en' ? GLOSSARY[open].en.d : GLOSSARY[open].zh.d}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ Main GPU component ============ */
export default function GpuSandbox({ lang = 'en' }) {
  const s = STR[lang];
  const GPU_TABS = [
    { id: "die",  label: s.tab_die_label,  color: "var(--compute)", sub: s.tab_die_sub },
    { id: "mem",  label: s.tab_mem_label,  color: "var(--mem)",     sub: s.tab_mem_sub },
    { id: "warp", label: s.tab_warp_label, color: "var(--exec)",    sub: s.tab_warp_sub },
  ];

  const [tab, setTab] = useState("die");
  const meta = GPU_TABS.find(t => t.id === tab);

  return (
    <div className="gx" style={{ height: "100%", overflowY: "auto" }}>
      <style>{GPU_CSS}</style>
      <div className="gx-wrap">
        <div className="gx-head">
          <div>
            <div className="gx-title">{s.mainTitle}</div>
            <div className="gx-sub">{s.mainSub}</div>
          </div>
          <div className="gx-pill">CUDA · SIMT MODEL</div>
        </div>
        <div className="gx-tabs">
          {GPU_TABS.map(t => (
            <button key={t.id} className={"gx-tab" + (tab === t.id ? " on" : "")}
              onClick={() => setTab(t.id)}>
              <span className="dot" style={{ background: t.color }} />
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 13.5, color: "var(--txd)", marginBottom: 14, fontFamily: "var(--font-mono)" }}>
          ▸ {meta.sub}
        </div>
        <div className="gx-panel" style={{ padding: 18 }} key={tab}>
          {tab === "die"  && <DieExplorer lang={lang} />}
          {tab === "mem"  && <MemoryPyramid lang={lang} />}
          {tab === "warp" && <WarpSimt lang={lang} />}
        </div>
        <GlossaryBar lang={lang} />
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "var(--txf)", fontFamily: "var(--font-mono)" }}>
          {s.footer}
        </div>
      </div>
    </div>
  );
}
