# PTE 正式账号与支付配置

这套模块用于未来的独立 PTE 商业站。当前情侣站应保持两个商业开关为 `false`，此时注册和计费 API 都不可用，不影响 `zyx` / `zly` 数据。

## 已实现

- Supabase Auth 邮箱注册、邮箱验证、密码登录、重置密码与退出。
- `auth.uid()` 隔离的个人资料、会员和权益表。
- Stripe Checkout 月度/年度订阅、Customer Portal 与签名 Webhook。
- Webhook 事件去重，付费状态由服务端更新，不信任前端会员值。
- 免费版和付费版的题库、模考、AI 评分和教师反馈权益记录。
- 独立 PTE AI 助教，以及按正式账号隔离的 Bug、题目纠错、账号、支付和功能建议工单。

## 沙箱配置

1. 新建独立 Supabase 项目，在 Authentication 开启 Email Provider，配置 Site URL 和 `/pte-account` 回调地址。
2. 在 SQL Editor 依次执行 `database/migrations/pte-commercial-foundation.sql`、`database/migrations/pte-support-tickets.sql`。不要在私人生产库盲目执行。
3. 在 Stripe Test Mode 创建一个产品、一个月付 Recurring Price 和一个年付 Recurring Price。
4. 创建 Webhook Endpoint：`https://<PTE 域名>/api/pte-billing/webhook`。订阅事件至少包含 `checkout.session.completed`、`customer.subscription.created`、`customer.subscription.updated`、`customer.subscription.deleted`。
5. 在 Vercel/Cloudflare Secret 中配置 `.env.local.example` 列出的商业变量。先使用 `sk_test_`、Test Price ID 和 Test Webhook Secret。
6. 确认 SQL、邮件和 Stripe 沙箱验收完成后，再同时将 `NEXT_PUBLIC_PTE_COMMERCIAL_MODE` 与 `PTE_COMMERCIAL_MODE` 改为 `true`。
7. 需要 PTE AI 助教时配置 `GROQ_API_KEY` 或 `CHATANYWHERE_API_KEY`，并同时开启 `NEXT_PUBLIC_PTE_SUPPORT_AI_ENABLED` 与 `PTE_SUPPORT_AI_ENABLED`。服务端开关和密钥都只能在部署平台配置；客户端开关只控制入口显示。
8. 从 Supabase Authentication 复制客服人员的 User ID，由数据库管理员执行 `INSERT INTO public.pte_support_staff (user_id, role) VALUES ('用户 UUID', 'agent');`。不要给普通用户该角色；客服工作台位于 `/pte-support/admin`。

## 上线验收

- 未登录请求计费 API 必须返回 401；伪造 `user_id` 不能获得会员。
- 用户 A 不能读取或修改用户 B 的 profile、membership 和 entitlement。
- 重复 Webhook 只处理一次；错误签名返回 400。
- 用户 A 无法读取用户 B 的客服工单；未登录不能查询或提交工单。
- AI 助教关闭时接口返回 404；商业模式未登录时返回 401；回答必须标明非官方估分边界。
- 支付成功、续费、取消、到期、付款失败和退款撤权都必须在 Stripe 沙箱验收。
- `SUPABASE_SERVICE_ROLE_KEY`、`STRIPE_SECRET_KEY` 和 `STRIPE_WEBHOOK_SECRET` 只存在部署平台 Secret，不能进入浏览器、日志或 Git。

## 尚未自动开启的范围

现有 PTE 计划和练习仓储仍使用私人站 `zyx` / `zly` 模式。迁移到独立站时，还需要将这些仓储的所有权改为 `auth.uid()` 并做跨用户负向测试；不能因为账号和支付页已存在就声称整个平台已商业安全。
