## 基本原则

社团所有项目都走 Pull Request，不直接往 `main` 推。这条规则对负责人同样适用，目的是让每次改动都有人看过一遍。

## 分支命名

从最新的 `main` 拉分支，命名格式为 `类型/简短描述`，描述用小写英文加连字符。

```bash
git switch main
git pull
git switch -c feat/activity-filter
```

| 类型 | 用途 | 例子 |
| --- | --- | --- |
| feat | 新功能 | feat/doc-search |
| fix | 修 bug | fix/mobile-overflow |
| docs | 只改文档 | docs/update-rules |
| style | 只改样式，不改逻辑 | style/neon-glow |
| chore | 构建、依赖、配置 | chore/bump-deps |

描述控制在 3 个单词以内。分支名不要用中文，不要带日期。

## 提交信息

格式：`类型: 做了什么`，一句话说清改动，不超过 50 个字符。

```bash
git commit -m "feat: 活动列表增加状态筛选"
git commit -m "fix: 修复窄屏下导航换行错位"
```

不要写「更新」「修改」「提交」这类没有信息量的内容。一次提交只做一件事——把「加功能」和「改格式」混在一个提交里，review 会很难受。

## 发起 Pull Request

1. 推送分支：`git push -u origin feat/activity-filter`
2. 在 GitHub 上点 Compare & pull request
3. 标题与提交信息保持一致，描述里写清楚：改了什么、为什么改、怎么验证
4. 指定一位社员做 reviewer
5. 等 CI 通过、review 通过后再合并

合并策略统一用 Squash merge，保持 `main` 的历史一条线。

## 同步与冲突

`main` 有新提交时，先同步再继续干活：

```bash
git switch main
git pull
git switch feat/activity-filter
git rebase main
```

`rebase` 过程中出现冲突，按提示逐个文件解决，标记后执行：

```bash
git add 冲突文件
git rebase --continue
```

想放弃这次 rebase，用 `git rebase --abort` 回到操作前。

> 已经推送并且有人在看的分支，不要 rebase。改用 `git merge main`，否则别人的本地记录会乱。

## 不要做的事

- 不要 `git push --force` 到共享分支。真需要强推自己的分支，用 `--force-with-lease`。
- 不要提交 `node_modules`、构建产物、编辑器配置、密钥文件。项目根目录的 `.gitignore` 已经处理了大部分，新增类型记得补进去。
- 不要把多个不相关的改动塞进同一个 PR。
- 不要在没有说明的情况下直接关闭别人的 PR 或评论。
- 不要在提交信息里写「修复了一些问题」而不说是什么问题。

## 出错了怎么办

已经提交但还没推送，想改最后一次提交：

```bash
git commit --amend
```

已经推送了，用一次新的提交来修正，不要改写历史。真搞坏了本地仓库，重新克隆一份是最快的办法，工作区里的未提交改动会丢失，所以动手前先 `git stash`。
