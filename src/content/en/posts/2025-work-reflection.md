+++
title      = "Reflections on Recent Projects"
date       = 2025-09-07T14:10:00
tags       = []
series     = []
draft      = false
lastmod    = 2025-07-13T14:10:00
+++

It has been three years since I joined my current team. Looking back, I see things I wish I had done differently.

## Test Infra

In the early stage of the project, our test infra was far from perfect, but it had one advantage: it was decoupled from the larger team's system. While the larger team's tests were flaky and expensive, often taking 10+ hours to run, our suite finshed under three hours. This gave us a significant boost in development speed.

As the product became more complex, however, the trade-offs became clear. Maintaining our own infra and building tests on top of it consumed more and more of our time. Simulating dependency services and data grew increasingly difficult. Meanwhile, the larger team's infra mutured and benefited from a dedicated team focused solely on its maintenance and evolution.

This created two problems:

- High maintenance cost: We often spent more time maintaining infra than developing features.
- Misleading signals: Because our tests weren't integrated with the larger system, they sometimes gave a false sense of completion. Leaders and PMs would see tests passing and assume the feature was "done", only for issues to appear later in staging, where our fake dependencies fell short. This disrupted release flow and added unnecessary churn.

Looking back, the better approach would have been to use our dedicated test infra only as a development acceleator, not as a validation signal. A feature should only be considered as "verified" once tested in a high-fidelity environment(like staging). Risks from limited test coverage should also be explicitly called out so PMs and leaders can understand the resource gaps and adjust priorities accordingly.

## Tech Debt

It's tempting to defer the long term fix to a later release and use a short term mitigation or workaround for the current release, especifally when deadlines are tight. However, this often creates hidden costs. When customers encounter issues in the current release, we end up spending even more time walking them through the workaround. Additionally, upgrades become more complex. Extra effort is required to remove or untangle the temporary fixes in the next release. In the end, these shortcuts usually cost more time and effort than addressing the issue properly from the start.

## Regular Sync with Upstream/Downstream teams

In the very early stage of my career, I didn't invest enough offort in regularly syncing with upstream and downstream teams. This led to two issues:

1. API design misalignment: Without fully understanding the downstream team's business context, some APIs I designed were not flexible enough. When new features came in, the existing APIs either didn't fit the requirements or became confusing after patches. Similarly, lacking context from upstream teams made it difficult to influence their API design or provide timely feedback, which often forced us to build hacks and workarounds on our side.

2. Wasted effort due to missing updates: Occasionally, a feature that seemed critical to us was actually deprioritized by the downstream team. Since we weren't aware of the latest decisions, we spent significant effort building features that ended up unused.

3. Delayed integration testing: By not syncing regularly, we missed opportunities to run integration tests with other teams. As a result, issues surfaced only after the release was cut, forcing late-stage fixes and increasing delivery risk.

## Documentation / Runbook

Early on, I tended to resist writing documentation or runbooks, often treating them as a lower priority. However, I've learned that the lack of clear documentation actually costs more time in the long run. Without it, teammates/operators repeatedly ping me for clarifications, and I end up answering the same question multiple times. Well-written documentation and runbooks not only save time but also help the team operate more independently and consistently.

## Alignment with the Larger Team

Another challenge has been that our team operated somewhat independently from the larger organization. As a result, the broader team often lacked visability into our priorities and the difficulties we faced. At the same time, we did not pay enough attention to the larger team's horizontal initiatives or fully adopt their shared services.

This detachment created inefficiencies: instead of leveraging common issues, we ended up maintaining many systems on our own. For example, our test infra as mentioned in the previous section. In hindsight, aligning more closely with the larger team's direction and actively engaging in their shared efforts would have reduced duplicated work, improved integration, and given our challenges more visability at the organization level.

## Version Skew / Backward Compatability

Several bugs arose due to version skew because of the incorrect assumption that, after an upgrade, all components would immediately run the same version. In reality, one component might be still in an old version while another expects it to have already upgraded, leading to mismatched behavior and unexpected responses. 

To avoid this, our testing should explicitly cover mixed-version scenarios to ensure backward compatability during rollouts.

