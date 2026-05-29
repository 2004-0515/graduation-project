# Thesis Original Diagram Audit

Source thesis file:
- `C:\Users\Administrator\Desktop\我的毕业设计材料\毕业设计终极版\初稿终极版\真终极版压缩包\终极修复版\2203010614张津滔毕业设计定稿.docx`

Extracted media folder:
- [docs/thesis-source-media](D:\graduation-project\docs\thesis-source-media)

This note records what is actually present in the thesis `docx`, before any redraw or PlantUML regeneration.

## Activity diagrams in the thesis

1. `图4.2 创建订单活动图`
   - Image file: [image8.jpeg](D:\graduation-project\docs\thesis-source-media\image8.jpeg)
   - Status: present
   - Visual style: narrow vertical layout, black-and-white, rounded action boxes, decision diamonds, solid start node, double-circle end node, right-side branch exits.

2. `图4.3 心愿单管理活动图`
   - Image file: [image9.jpeg](D:\graduation-project\docs\thesis-source-media\image9.jpeg)
   - Status: present
   - Visual style: same as `图4.2`
   - Business content shown in image: duplicate-purchase check, cooling-period setup, reminder, remove-from-list or add-to-cart outcome.

3. `图4.4 商品审核活动图`
   - Status: missing from the `docx`
   - Evidence: the surrounding thesis text references `如图4.4所示`, but there is no matching embedded image or caption entry after the paragraph.

4. `图4.5 月度预算设置活动图`
   - Image file currently bound to this caption: [image10.jpeg](D:\graduation-project\docs\thesis-source-media\image10.jpeg)
   - Status: caption present, but image content does not match caption
   - Actual image content: price-history / price-alert flow
   - Visible steps in image: `用户查看商品 -> 点击价格历史 -> 查看价格曲线 -> 是否合适 -> 立即购买 / 设置价格提醒 -> 输入目标价格 -> 保存提醒 -> 系统监控价格 -> 是否达标 -> 发送降价通知 -> 用户查看通知 -> 是否购买 -> 跳转商品页`
   - Conclusion: this is not a monthly-budget activity diagram.

5. `图4.6 订单取消活动图`
   - Image file: [image11.jpeg](D:\graduation-project\docs\thesis-source-media\image11.jpeg)
   - Status: present
   - Business gap vs current thesis text/code: the image only shows `可取消/不可取消` and `已支付/未支付` branching. It does not show the admin-review cancellation path described later in the thesis text.

## Sequence diagrams in the thesis

1. `图4.7 创建订单时序图`
   - Image file: [image12.jpeg](D:\graduation-project\docs\thesis-source-media\image12.jpeg)
   - Status: present
   - Participants shown: `用户`, `前端界面`, `订单控制器`, `订单服务`, `数据库`
   - Notation used: activation bars are present; `alt` is used for `使用优惠券`.

2. `图4.8 心愿单管理时序图`
   - Image file: [image13.png](D:\graduation-project\docs\thesis-source-media\image13.png)
   - Status: present
   - Participants shown: `用户`, `前端界面`, `理性消费控制器`, `心愿单服务`, `数据库`
   - Notation used: activation bars are present; `alt` and `opt` are both used.

3. `图4.9 商品审核时序图`
   - Image file: [image14.png](D:\graduation-project\docs\thesis-source-media\image14.png)
   - Status: present
   - Participants shown: `卖家`, `管理员`, `前端界面`, `商品控制器`, `商品服务`, `数据库`
   - Notation used: activation bars are present; `alt` is used for `审核通过/审核拒绝`.

4. `图4.10 月度预算设置时序图`
   - Status: missing from the `docx`
   - Evidence: the thesis body contains the paragraph describing `图4.10`, but the next actual embedded figure is `图4.11 订单取消时序图`.

5. `图4.11 订单取消时序图`
   - Image file: [image15.png](D:\graduation-project\docs\thesis-source-media\image15.png)
   - Status: present
   - Participants shown: `用户`, `前端界面`, `订单控制器`, `订单服务`, `数据库`
   - Business gap vs thesis text/code: the image does not include an `管理员` participant even though the surrounding thesis text describes an admin review branch for some cancellation states.

## What this means

The current disagreement is not only a PlantUML style problem.

There are three separate source issues inside the thesis `docx` itself:

1. `图4.4 商品审核活动图` is missing.
2. `图4.10 月度预算设置时序图` is missing.
3. `图4.5 月度预算设置活动图` is bound to the wrong image; the embedded image is a price-alert flow, not a budget flow.

## Practical implication for the redraw

If the next step is to regenerate diagrams while staying close to the thesis look, the safest rule is:

1. preserve the original thesis visual style from `图4.2`, `图4.3`, `图4.6`, `图4.7`, `图4.8`, `图4.9`, `图4.11`
2. repair the missing or wrong figures using the real code flow, not by copying the wrong thesis image
3. only then decide whether the final deliverable should update PlantUML sources, exported PNGs, or the thesis document itself
