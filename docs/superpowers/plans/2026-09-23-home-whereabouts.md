# 家里放哪儿第一版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 创建一个可运行的 Expo React Native 原型，打通搜索、房间网格、物品录入和保质期状态。

**Architecture:** 单屏 App 状态集中在 App.tsx，使用明确的 TypeScript 类型表达房间、模块和物品层级。第一版先用内存状态验证交互，持久化和通知作为下一阶段接口。

**Tech Stack:** Expo 57、React 19、React Native 0.86、TypeScript。

**Spec:** `docs/superpowers/specs/2026-09-23-home-whereabouts-design.md`

## Global Constraints

- 使用中文界面。
- 房间是第 1 级，模块最多第 3 级。
- 物品保质期为可选能力，默认提醒提前 7 天。
- 删除有内容的位置必须二次确认。

### Task 1: 项目初始化

**Files:** `package.json`, `app.json`, `tsconfig.json`, `README.md`

- [x] 创建 Expo 配置和启动脚本。
- [x] 修复 README 模板冲突并记录运行方式。

### Task 2: 第一版交互原型

**Files:** `App.tsx`

- [x] 创建四页底部导航。
- [x] 创建首页搜索和到期概览。
- [x] 创建房间网格和模块层级入口。
- [x] 创建物品表单、保质期计算和递归删除确认。

### Task 3: 验证

- [ ] 执行 `pnpm typecheck`。
- [ ] 执行 Expo bundle 检查，确保入口可以编译。
