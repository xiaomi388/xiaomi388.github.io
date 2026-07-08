import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

/* ---------- styles ---------- */
const GPU_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500&display=swap');

.gx * { box-sizing: border-box; }
.gx {
  --bg:#0a0d13; --bg2:#11161f; --bg3:#171f2b; --bg4:#1e2937;
  --line:#26303f; --line2:#33415a;
  --tx:#dde4ef; --txd:#8895a9; --txf:#586577;
  --compute:#3fd9c4; --compute-d:#1d6f66;
  --mem:#f2b24a; --mem-d:#7a5a22;
  --exec:#8d9bff; --exec-d:#3d4585;
  --danger:#f56b6b; --ok:#5fe3a1;
  font-family:'IBM Plex Sans',sans-serif;
  background:
    radial-gradient(900px 500px at 88% -8%, rgba(63,217,196,.07), transparent 60%),
    radial-gradient(700px 500px at 6% 108%, rgba(141,155,255,.07), transparent 60%),
    var(--bg);
  color:var(--tx);
  min-height:100%;
  letter-spacing:.1px;
}
.gx-mono { font-family:'IBM Plex Mono',monospace; }
.gx-disp { font-family:'Chakra Petch',sans-serif; }
.gx-wrap { max-width:1080px; margin:0 auto; padding:26px 22px 56px; }
.gx-head { display:flex; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; gap:14px; margin-bottom:18px; }
.gx-title { font-family:'Chakra Petch',sans-serif; font-weight:700; font-size:25px; letter-spacing:.4px; line-height:1.1; }
.gx-title b { color:var(--compute); }
.gx-sub { color:var(--txd); font-size:12.5px; margin-top:5px; }
.gx-pill { font-family:'IBM Plex Mono',monospace; font-size:10.5px; color:var(--txf); border:1px solid var(--line); border-radius:999px; padding:5px 11px; }
.gx-tabs { display:flex; gap:7px; flex-wrap:wrap; margin-bottom:18px; }
.gx-tab { font-family:'Chakra Petch',sans-serif; font-weight:600; font-size:13px; background:var(--bg2); color:var(--txd); border:1px solid var(--line); border-radius:9px; padding:9px 15px; cursor:pointer; transition:.16s; display:flex; align-items:center; gap:8px; }
.gx-tab:hover { color:var(--tx); border-color:var(--line2); }
.gx-tab.on { color:var(--bg); border-color:transparent; }
.gx-tab .dot { width:7px; height:7px; border-radius:2px; }
.gx-panel { background:var(--bg2); border:1px solid var(--line); border-radius:13px; }
.gx-fade { animation:gxFade .4s ease both; }
@keyframes gxFade { from{opacity:0;transform:translateY(9px);} to{opacity:1;transform:none;} }
.gx-h { font-family:'Chakra Petch',sans-serif; font-weight:600; font-size:13px; color:var(--txd); text-transform:uppercase; letter-spacing:1.4px; }
.gx-crumbs { display:flex; align-items:center; gap:5px; flex-wrap:wrap; margin-bottom:14px; }
.gx-crumb { font-family:'IBM Plex Mono',monospace; font-size:11.5px; cursor:pointer; background:var(--bg3); border:1px solid var(--line); color:var(--txd); padding:5px 10px; border-radius:7px; transition:.14s; }
.gx-crumb:hover { color:var(--tx); border-color:var(--line2); }
.gx-crumb.cur { color:var(--tx); border-color:var(--compute-d); cursor:default; }
.gx-csep { color:var(--txf); font-size:11px; }
.gx-cell { border:1px solid var(--line); border-radius:6px; background:var(--bg3); cursor:pointer; transition:.14s; position:relative; }
.gx-cell:hover { border-color:var(--line2); transform:translateY(-1px); }
.gx-stage { background:var(--bg); border:1px solid var(--line); border-radius:11px; padding:18px; }
.gx-info { background:var(--bg3); border:1px solid var(--line); border-left:3px solid var(--compute); border-radius:9px; padding:13px 15px; font-size:13px; line-height:1.62; color:#c4cdda; }
.gx-info b { color:var(--tx); font-weight:600; }
.gx-info .k { font-family:'IBM Plex Mono',monospace; color:var(--compute); }
.gx-btn { font-family:'IBM Plex Mono',monospace; font-size:12px; cursor:pointer; background:var(--bg3); color:var(--tx); border:1px solid var(--line2); border-radius:8px; padding:8px 13px; transition:.14s; }
.gx-btn:hover:not(:disabled) { border-color:var(--compute-d); color:var(--compute); }
.gx-btn:disabled { opacity:.34; cursor:not-allowed; }
.gx-btn.primary { background:var(--compute); color:#062a26; border-color:transparent; font-weight:600; }
.gx-btn.primary:hover { filter:brightness(1.08); color:#062a26; }
.gx-seg { display:inline-flex; border:1px solid var(--line); border-radius:8px; overflow:hidden; }
.gx-seg button { font-family:'IBM Plex Mono',monospace; font-size:11.5px; background:var(--bg3); color:var(--txd); border:0; padding:7px 12px; cursor:pointer; transition:.14s; }
.gx-seg button:hover { color:var(--tx); }
.gx-seg button.on { background:var(--bg4); color:var(--compute); }
.gx-seg button + button { border-left:1px solid var(--line); }
@keyframes gxPulse { 0%,100%{box-shadow:0 0 0 0 rgba(63,217,196,.0);} 50%{box-shadow:0 0 16px 1px rgba(63,217,196,.4);} }
.gx-live { animation:gxPulse 1.5s ease-in-out infinite; }
.gx-masked { background-image:repeating-linear-gradient(45deg, rgba(255,255,255,.03) 0 5px, transparent 5px 10px); }
@keyframes gxBlink { 0%,100%{opacity:.35;} 50%{opacity:1;} }
.gx-blink { animation:gxBlink 1s ease-in-out infinite; }
.gx-legend { display:flex; gap:14px; flex-wrap:wrap; font-size:11px; color:var(--txd); font-family:'IBM Plex Mono',monospace; }
.gx-legend i { display:inline-block; width:10px; height:10px; border-radius:3px; vertical-align:-1px; margin-right:5px; }
.gx-grid { display:grid; gap:6px; }
.gx-tier { display:flex; align-items:stretch; gap:0; border:1px solid var(--line); border-radius:10px; overflow:hidden; cursor:pointer; transition:.16s; background:var(--bg3); }
.gx-tier:hover { border-color:var(--line2); }
.gx-tier.sel { border-color:var(--mem); }
.gx-tier .swatch { width:6px; flex:none; }
a.gx-link, a.gx-link:visited { color:var(--compute); }
.gx-kv { display:flex; justify-content:space-between; gap:12px; font-size:12px; padding:3px 0; border-bottom:1px dashed var(--line); }
.gx-kv:last-child { border-bottom:0; }
.gx-kv .k { color:var(--txd); }
.gx-kv .v { font-family:'IBM Plex Mono',monospace; color:var(--tx); }
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
    // DieExplorer crumb back button
    backToLevel: "← Back to level info",
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
    kvScope: "Scope",
    kvCapacity: "Capacity",
    kvLatency: "Latency",
    kvBandwidth: "Bandwidth",
    // WarpSimt
    execModeLabel: "Execution Mode",
    modeUniform: "No Divergence (uniform)",
    modeDivergent: "Branch Divergence (divergent)",
    modeCompareHint: "Switch modes to compare total cycle count and warp utilization",
    warpLaneHeading: "1 WARP · 32 LANES",
    ifGroupLabel: "IF group (tid ≤ 15)",
    elseGroupLabel: "ELSE group (tid > 15)",
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
    kvScope: "作用域",
    kvCapacity: "容量",
    kvLatency: "延迟",
    kvBandwidth: "带宽",
    execModeLabel: "执行模式",
    modeUniform: "无分歧 (uniform)",
    modeDivergent: "有分支分歧 (divergent)",
    modeCompareHint: "切换后对比总周期数与 warp 利用率",
    warpLaneHeading: "1 个 WARP · 32 LANE",
    ifGroupLabel: "IF 组 (tid ≤ 15)",
    elseGroupLabel: "ELSE 组 (tid > 15)",
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
function finishedMsg(lang, divergent, cyclesDone, avgUtil) {
  if (lang === 'en') {
    if (divergent) {
      return (
        <React.Fragment>
          <b style={{color:"var(--danger)"}}>The cost of branch divergence:</b> within a single Warp, the IF and ELSE paths cannot execute in parallel — the hardware must run them <b>serially</b>, with the other half of the lanes sitting idle. This run took {cyclesDone} cycles with an average utilization of only <b>{(avgUtil * 100).toFixed(1)}%</b>.<br />
          Optimization: arrange data so all 32 threads in a Warp take the <b>same branch</b> (e.g. sort by key, remap tid assignments).
        </React.Fragment>
      );
    }
    return (
      <React.Fragment>
        <b style={{color:"var(--ok)"}}>No divergence:</b> all 32 lanes execute the same instruction throughout, achieving <b>100%</b> utilization over {cyclesDone} cycles — SIMT at peak efficiency. Switch to "Branch Divergence" to compare.
      </React.Fragment>
    );
  }
  // zh
  if (divergent) {
    return (
      <React.Fragment>
        <b style={{color:"var(--danger)"}}>分支分歧的代价：</b>同一个 Warp 内，IF 与 ELSE 两条路径无法并行——硬件只能<b>先后串行</b>执行，另一半 lane 在旁空等。本次共 {cyclesDone} 周期，平均利用率仅 <b>{(avgUtil * 100).toFixed(1)}%</b>。<br />
        优化方向：让同一 Warp 内的 32 个线程尽量走<b>相同分支</b>（如按数据排序、调整 tid 映射）。
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      <b style={{color:"var(--ok)"}}>无分歧：</b>32 个 lane 始终执行同一条指令，全程利用率 <b>100%</b>，共 {cyclesDone} 周期——这是 SIMT 最高效的状态。切到「有分支分歧」对比一下差距。
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
      <div className="gx-crumbs">
        {nav.map((n, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="gx-csep">›</span>}
            <button
              className={"gx-crumb" + (i === nav.length - 1 ? " cur" : "")}
              onClick={() => i < nav.length - 1 && jump(i)}
            >
              {crumbLabel(n)}
            </button>
          </React.Fragment>
        ))}
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
                style={{ padding: "4px 9px", fontSize: 11 }}
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

function GpuView({ lang, onSM, onPart, active }) {
  const s = STR[lang];
  const VramCol = () => (
    <button
      onClick={() => onPart("vram")}
      className={active === "vram" ? "gx-live" : ""}
      style={{
        width: 46, alignSelf: "stretch", borderRadius: 8, cursor: "pointer",
        border: "1px solid var(--mem-d)",
        background: "repeating-linear-gradient(0deg,var(--bg4) 0 13px,var(--bg3) 13px 26px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <span className="gx-mono" style={{ writingMode: "vertical-rl", fontSize: 11, color: "var(--mem)", letterSpacing: 2 }}>
        VRAM · HBM
      </span>
    </button>
  );
  return (
    <div>
      <div className="gx-h" style={{ marginBottom: 12 }}>{s.gpuDieHeading}</div>
      <div style={{ display: "flex", gap: 10 }}>
        <VramCol />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
          <button
            onClick={() => onPart("l2")}
            className={active === "l2" ? "gx-live" : ""}
            style={{
              height: 38, borderRadius: 8, cursor: "pointer",
              border: "1px dashed var(--mem-d)", background: "var(--bg3)",
              color: "var(--mem)", fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 12, letterSpacing: 1.5,
            }}
          >
            {s.l2Label}
          </button>
          <div className="gx-grid" style={{ gridTemplateColumns: "repeat(6,1fr)" }}>
            {Array.from({ length: SM_COUNT }, (_, i) => (
              <button key={i} className="gx-cell" onClick={() => onSM(i)}
                style={{ padding: "11px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ display: "flex", gap: 2 }}>
                  {[0, 1, 2, 3].map(k => (
                    <span key={k} style={{ width: 7, height: 7, borderRadius: 1, background: "var(--compute-d)" }} />
                  ))}
                </div>
                <span className="gx-mono" style={{ fontSize: 10, color: "var(--txd)" }}>SM {pad(i)}</span>
              </button>
            ))}
          </div>
        </div>
        <VramCol />
      </div>
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
    <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 9, background: "var(--bg3)" }}>
      <button
        onClick={() => onPart("sched")}
        className={active === "sched" ? "gx-live" : ""}
        style={{
          width: "100%", marginBottom: 7, cursor: "pointer", borderRadius: 5,
          border: "1px solid var(--compute-d)", background: "var(--bg4)",
          color: "var(--compute)", fontSize: 10.5, padding: "5px 6px",
          fontFamily: "'IBM Plex Mono',monospace",
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
      <div className="gx-mono" style={{ fontSize: 9.5, color: "var(--txf)", textAlign: "center" }}>
        16 × ALU (FP32/INT32)
      </div>
    </div>
  );
  return (
    <div>
      <div className="gx-h" style={{ marginBottom: 12 }}>{s.smInternalHeading(i)}</div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 340px", border: "1px solid var(--line2)", borderRadius: 11, padding: 11, background: "var(--bg2)" }}>
          <div className="gx-grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 9 }}>
            {[0, 1, 2, 3].map(k => <ProcBlock key={k} idx={k} />)}
          </div>
          <button
            onClick={() => onPart("reg")}
            className={active === "reg" ? "gx-live" : ""}
            style={{
              width: "100%", marginBottom: 8, cursor: "pointer", borderRadius: 7,
              border: "1px solid var(--mem-d)", background: "var(--bg3)",
              color: "var(--mem)", fontSize: 11, padding: "9px",
              fontFamily: "'IBM Plex Mono',monospace",
            }}
          >
            REGISTER FILE · {lang === 'en' ? 'Register File' : '寄存器文件'} (64K × 32-bit{lang === 'en' ? ', per-thread' : '，线程私有'})
          </button>
          <button
            onClick={() => onPart("sram")}
            className={active === "sram" ? "gx-live" : ""}
            style={{
              width: "100%", cursor: "pointer", borderRadius: 7,
              border: "1px solid var(--mem)", background: "var(--bg3)",
              color: "var(--mem)", fontSize: 11, padding: "11px",
              fontFamily: "'IBM Plex Mono',monospace",
            }}
          >
            ◆ SRAM · {lang === 'en' ? 'L1 Cache + Shared Memory (≈ 228 KB, shared across processing blocks)' : 'L1 缓存 + 共享内存 (≈ 228 KB，处理块共用)'}
          </button>
        </div>
        <div style={{ flex: "1 1 220px" }}>
          <div className="gx-h" style={{ marginBottom: 8, fontSize: 11 }}>{s.residentBlocks}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[0, 1, 2].map(b => (
              <button key={b} className="gx-cell" onClick={() => onBlock(b)}
                style={{ padding: "12px 13px", textAlign: "left", borderColor: "var(--exec-d)" }}>
                <div className="gx-mono" style={{ fontSize: 12.5, color: "var(--exec)" }}>Block {b}</div>
                <div style={{ fontSize: 10.5, color: "var(--txd)", marginTop: 3 }}>{s.blockSubline(WARPS_PER_BLK)}</div>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: "var(--txf)", marginTop: 9, lineHeight: 1.5 }}>
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
      <div style={{ fontSize: 11.5, color: "var(--txd)", marginBottom: 13 }}>
        {s.blockSubtext}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {Array.from({ length: WARPS_PER_BLK }, (_, w) => (
          <button key={w} className="gx-cell" onClick={() => onWarp(w)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderColor: "var(--exec-d)" }}>
            <span className="gx-mono" style={{ fontSize: 10.5, color: "var(--exec)", width: 52, flex: "none" }}>Warp {w}</span>
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
      <div style={{ fontSize: 11.5, color: "var(--txd)", marginBottom: 13 }}>
        {s.warpSubtext}
      </div>
      <div className="gx-grid" style={{ gridTemplateColumns: "repeat(8,1fr)" }}>
        {Array.from({ length: 32 }, (_, t) => (
          <button key={t} className="gx-cell" onClick={() => onThread(t)}
            style={{ padding: "13px 4px", textAlign: "center", borderColor: "var(--exec-d)" }}>
            <div className="gx-mono" style={{ fontSize: 10, color: "var(--txd)" }}>T{pad(t)}</div>
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
          <div className="gx-mono" style={{ fontSize: 11, color: "var(--mem)", marginBottom: 7 }}>
            {s.threadRegLabel}
          </div>
          <div className="gx-grid" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
            {regs.map(r => (
              <div key={r.n} style={{
                display: "flex", justifyContent: "space-between",
                background: "var(--bg3)", border: "1px solid var(--mem-d)",
                borderRadius: 5, padding: "5px 9px",
                fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5,
              }}>
                <span style={{ color: "var(--mem)" }}>{r.n}</span>
                <span style={{ color: "var(--txd)" }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: "1 1 190px", display: "flex", flexDirection: "column", gap: 9 }}>
          <div style={{ background: "var(--bg3)", border: "1px solid var(--exec-d)", borderRadius: 8, padding: 12 }}>
            <div className="gx-mono" style={{ fontSize: 10.5, color: "var(--exec)" }}>{s.threadPcLabel}</div>
            <div className="gx-mono" style={{ fontSize: 16, color: "var(--tx)", marginTop: 4 }}>0x004C</div>
            <div style={{ fontSize: 10, color: "var(--txf)", marginTop: 3 }}>{s.threadPcShared}</div>
          </div>
          <div style={{ background: "var(--bg3)", border: "1px solid var(--compute-d)", borderRadius: 8, padding: 12 }}>
            <div className="gx-mono" style={{ fontSize: 10.5, color: "var(--compute)" }}>{s.threadAluLabel}</div>
            <div style={{ fontSize: 11.5, color: "var(--txd)", marginTop: 5, lineHeight: 1.5 }}>{s.threadAluDesc}</div>
          </div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "var(--txf)", marginTop: 11, lineHeight: 1.55 }}>
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
  const timer = useRef(null);

  const latScale = useMemo(() => d3.scaleLog().domain([1, 600]).range([8, 100]), []);

  const runAccess = (target) => {
    clearInterval(timer.current);
    setSel(target); setRunning(true); setDotStage(0);
    let st = 0;
    timer.current = setInterval(() => {
      st += 1;
      if (st > target) { clearInterval(timer.current); setRunning(false); return; }
      setDotStage(st);
    }, 480);
  };
  useEffect(() => () => clearInterval(timer.current), []);

  const ROW = 78;

  const tierScope = (t) => lang === 'en' ? t.scope_en : t.scope_zh;
  const tierCn = (t) => lang === 'en' ? '' : ` · ${t.scope_zh}`;
  const tierDesc = (t) => lang === 'en' ? t.en.d : t.zh.d;

  return (
    <div className="gx-fade">
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 380px", position: "relative" }}>
          <div className="gx-h" style={{ marginBottom: 10 }}>{s.memPyramidHeading}</div>
          <div style={{ position: "relative" }}>
            {dotStage >= 0 && (
              <div style={{
                position: "absolute", left: -13, top: dotStage * ROW + ROW / 2 - 7,
                width: 14, height: 14, borderRadius: "50%", background: "var(--compute)",
                boxShadow: "0 0 12px var(--compute)",
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
                      outline: hit ? "1px solid var(--compute)" : "none",
                      background: reached ? "var(--bg4)" : "var(--bg3)",
                    }}
                  >
                    <div className="swatch" style={{ background: t.chip ? "var(--mem)" : "var(--mem-d)" }} />
                    <div style={{ padding: "9px 12px", flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                        <span className="gx-mono" style={{ fontSize: 13, color: "var(--tx)" }}>{t.name}</span>
                        <span style={{ fontSize: 10.5, color: t.chip ? "var(--compute)" : "var(--danger)", fontFamily: "'IBM Plex Mono',monospace" }}>
                          {t.chip ? s.chipOnChip : s.chipOffChip}
                        </span>
                      </div>
                      <div style={{ fontSize: 10.5, color: "var(--txd)", marginTop: 3 }}>
                        {lang === 'en'
                          ? `${tierScope(t)} · ${t.size}`
                          : `${t.scope_zh} · ${t.size}`}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6 }}>
                        <div style={{ flex: 1, height: 7, background: "var(--bg)", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{
                            width: latScale(t.lat) + "%", height: "100%",
                            background: reached ? "linear-gradient(90deg,var(--compute),var(--mem))" : "var(--mem-d)",
                            borderRadius: 4, transition: ".3s",
                          }} />
                        </div>
                        <span className="gx-mono" style={{ fontSize: 10, color: "var(--mem)", width: 78, textAlign: "right" }}>
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
            <div className="gx-h" style={{ fontSize: 11, marginBottom: 9 }}>{s.accessDemoHeading}</div>
            <div style={{ fontSize: 11.5, color: "var(--txd)", marginBottom: 9, lineHeight: 1.5 }}>{s.accessDemoDesc}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TIERS.map((t, i) => (
                <button key={i} className="gx-btn" disabled={running}
                  style={{ fontSize: 10.5, padding: "6px 9px" }}
                  onClick={() => runAccess(i)}>
                  {s.hitBtn(t.name.split(" ")[0])}
                </button>
              ))}
            </div>
            {dotStage >= 0 && !running && (
              <div style={{ marginTop: 11, padding: "9px 11px", borderRadius: 7, background: "var(--bg3)", border: "1px solid var(--compute-d)" }}>
                <div className="gx-mono" style={{ fontSize: 11.5, color: "var(--compute)" }}>{s.hitResult(TIERS[sel].name)}</div>
                <div style={{ fontSize: 11, color: "var(--txd)", marginTop: 3 }}>
                  {s.latResult(TIERS[sel].lat)}
                  {sel > 0 && s.latRelative(TIERS[sel].lat)}
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
            <div style={{ marginTop: 8, lineHeight: 1.6 }}>{tierDesc(TIERS[sel])}</div>
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
    asm: "SETP.GT    P0, tid, 15",
    en: "Test tid > 15; result written to predicate register P0",
    zh: "判断 tid > 15，结果写入谓词寄存器 P0",
  },
  {
    asm: "@P0  BRA   ELSE",
    en: "Threads where P0 is true branch to ELSE",
    zh: "P0 为真的线程跳转到 ELSE",
  },
  {
    asm: "ADD        R3, R2, 10",
    en: "[IF]   executed by threads where tid ≤ 15",
    zh: "[IF]   tid ≤ 15 的线程执行",
  },
  {
    asm: "BRA        DONE",
    en: "[IF]   skip over the ELSE block",
    zh: "[IF]   跳过 ELSE 段",
  },
  {
    asm: "SUB        R3, R2, 10",
    en: "[ELSE] executed by threads where tid > 15",
    zh: "[ELSE] tid > 15 的线程执行",
  },
  {
    asm: "ST.global  [out], R3",
    en: "All threads write results back to VRAM",
    zh: "全部线程把结果写回显存",
  },
];
const ALL_MASK   = Array.from({ length: 32 }, () => true);
const IF_LANES   = Array.from({ length: 32 }, (_, t) => t <= 15);
const ELSE_LANES = Array.from({ length: 32 }, (_, t) => t > 15);

function buildTrace(divergent, lang) {
  if (!divergent) {
    return [0, 1, 2, 3, 4, 5, 7].map(pc => ({
      pc, mask: ALL_MASK, phase: "all",
      note: pc === 3
        ? (lang === 'en'
            ? "Predicate is uniform → no divergence, Warp stays fully active"
            : "谓词结果一致 → 不发生分歧，warp 保持满载")
        : "",
    }));
  }
  const notes = lang === 'en' ? {
    n3: "Branch evaluated: lanes split into IF / ELSE groups",
    n4: "IF group executing; ELSE group masked (idle) — utilization drops to 50%",
    n5: "Still in IF block; ELSE group continues to wait idle",
    n6: "ELSE group's turn; IF group is now masked — the other half of divergence cost",
    n7: "Branch reconverges; Warp is fully active again",
  } : {
    n3: "分支判定：lane 分裂成 IF / ELSE 两组",
    n4: "IF 组执行，ELSE 组被屏蔽(idle)——利用率掉到 50%",
    n5: "仍在 IF 段，ELSE 组继续空等",
    n6: "轮到 ELSE 组，IF 组被屏蔽——分歧的另一半代价",
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
    <div style={{ flex: 1, background: "var(--bg3)", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", minWidth: 78 }}>
      <div style={{ fontSize: 9.5, color: "var(--txd)", textTransform: "uppercase", letterSpacing: .6 }}>{label}</div>
      <div className="gx-mono" style={{ fontSize: 16, marginTop: 2, color: warn ? "var(--danger)" : "var(--tx)" }}>{val}</div>
    </div>
  );
}

function WarpSimt({ lang }) {
  const s = STR[lang];
  const [divergent, setDivergent] = useState(true);
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(900);
  const timer = useRef(null);
  const trace = useMemo(() => buildTrace(divergent, lang), [divergent, lang]);

  useEffect(() => { stopPlay(); setStep(-1); }, [divergent]);
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

  const laneColor = (t) => {
    if (!started) return divergent ? (IF_LANES[t] ? "var(--compute-d)" : "var(--exec-d)") : "var(--compute-d)";
    return curMask[t] ? "var(--compute)" : "var(--bg4)";
  };

  const instrDesc = (ins) => lang === 'en' ? ins.en : ins.zh;

  const speedOptions = [
    [1400, s.speedSlow],
    [900,  s.speedMed],
    [450,  s.speedFast],
  ];

  return (
    <div className="gx-fade">
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <span className="gx-h" style={{ fontSize: 11 }}>{s.execModeLabel}</span>
        <div className="gx-seg">
          <button className={divergent ? "" : "on"} onClick={() => setDivergent(false)}>{s.modeUniform}</button>
          <button className={divergent ? "on" : ""} onClick={() => setDivergent(true)}>{s.modeDivergent}</button>
        </div>
        <span style={{ fontSize: 11, color: "var(--txf)" }}>{s.modeCompareHint}</span>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px" }}>
          <div className="gx-h" style={{ marginBottom: 9 }}>{s.warpLaneHeading}</div>
          <div className="gx-grid" style={{ gridTemplateColumns: "repeat(8,1fr)" }}>
            {Array.from({ length: 32 }, (_, t) => {
              const masked = started && !curMask[t];
              return (
                <div key={t} className={masked ? "gx-masked" : ""} style={{
                  aspectRatio: "1", borderRadius: 5,
                  border: "1px solid " + (started && curMask[t] ? "var(--compute)" : "var(--line)"),
                  background: laneColor(t),
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  transition: ".18s",
                  boxShadow: started && curMask[t] ? "0 0 11px rgba(63,217,196,.45)" : "none",
                }}>
                  <span className="gx-mono" style={{ fontSize: 9.5, color: started && curMask[t] ? "#06302b" : "var(--txd)" }}>{pad(t)}</span>
                  {masked && <span style={{ fontSize: 8, color: "var(--txf)" }}>idle</span>}
                </div>
              );
            })}
          </div>
          {divergent && !started && (
            <div className="gx-legend" style={{ marginTop: 10 }}>
              <span><i style={{ background: "var(--compute-d)" }} />{s.ifGroupLabel}</span>
              <span><i style={{ background: "var(--exec-d)" }} />{s.elseGroupLabel}</span>
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
          <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 9, padding: 8 }}>
            {PROGRAM.map((ins, pc) => {
              const active = curStep && curStep.pc === pc;
              const phase = active ? curStep.phase : null;
              return (
                <div key={pc} style={{
                  display: "flex", gap: 9, alignItems: "center", padding: "6px 8px", borderRadius: 5,
                  background: active ? "var(--bg4)" : "transparent",
                  borderLeft: "2px solid " + (active ? (phase === "if" ? "var(--compute)" : phase === "else" ? "var(--exec)" : "var(--mem)") : "transparent"),
                }}>
                  <span className="gx-mono" style={{ fontSize: 9.5, color: "var(--txf)", width: 22 }}>I{pc}</span>
                  <span className="gx-mono" style={{ fontSize: 11.5, flex: 1, color: active ? "var(--tx)" : "var(--txd)" }}>{ins.asm}</span>
                  {active && <span className="gx-mono gx-blink" style={{ fontSize: 9, color: "var(--compute)" }}>◀ PC</span>}
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
                <span className="gx-mono" style={{ color: "var(--compute)" }}>
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
        <span className="gx-h" style={{ fontSize: 10 }}>{s.speedLabel}</span>
        <div className="gx-seg">
          {speedOptions.map(([v, l]) => (
            <button key={v} className={speed === v ? "on" : ""} onClick={() => setSpeed(v)}>{l}</button>
          ))}
        </div>
      </div>
      {finished && (
        <div className="gx-info" style={{ marginTop: 13, borderLeftColor: divergent ? "var(--danger)" : "var(--ok)" }}>
          {finishedMsg(lang, divergent, cyclesDone, avgUtil)}
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
        <span style={{ fontSize: 10.5, color: "var(--txf)" }}>{s.glossaryHint}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {GLOSSARY.map((g, i) => (
          <button key={g.t} onClick={() => setOpen(open === i ? null : i)} className="gx-mono"
            style={{
              fontSize: 11.5, cursor: "pointer", padding: "6px 11px", borderRadius: 7,
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
      {/* Scale the px-based sandbox interior to match the site's 112.5%
          root size. `zoom` (not transform: scale) so the scroll area reflows. */}
      <div className="gx-wrap" style={{ zoom: 1.125 }}>
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
              onClick={() => setTab(t.id)}
              style={tab === t.id ? { background: t.color } : {}}>
              <span className="dot" style={{ background: tab === t.id ? "#0a0d13" : t.color }} />
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "var(--txd)", marginBottom: 14, fontFamily: "'IBM Plex Mono',monospace" }}>
          ▸ {meta.sub}
        </div>
        <div className="gx-panel" style={{ padding: 18 }} key={tab}>
          {tab === "die"  && <DieExplorer lang={lang} />}
          {tab === "mem"  && <MemoryPyramid lang={lang} />}
          {tab === "warp" && <WarpSimt lang={lang} />}
        </div>
        <GlossaryBar lang={lang} />
        <div style={{ textAlign: "center", marginTop: 22, fontSize: 10.5, color: "var(--txf)", fontFamily: "'IBM Plex Mono',monospace" }}>
          {s.footer}
        </div>
      </div>
    </div>
  );
}
