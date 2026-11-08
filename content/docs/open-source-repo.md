一个合格的仓库就四样：`README.md`、`LICENSE`、`.gitignore`、代码。别的都是以后再说。

### 如果你不懂，纯萌新，往下滑找到第5条内容

---

## 1. 描述怎么写

描述就是跟别人说你是干嘛的。尽量简短

要写两处：GitHub 设置里的 **Description** 和 **README 第一句话**。前者一句话，后者可以展开说。

规则：

1. 第一句就说清能干什么，不要「这是一个……」开头的铺垫。
2. 尽量简短。
3. README 第一句和它保持一致。

***你让ai帮你搞定，人工校验一下差不多了***

---

## 2. README 要包含什么

Readme就是跟别人说你这是干嘛的，有什么功能，怎么用，界面长什么样。

| 内容 | 写清楚什么 |
| ------- | -------------------------------- |
| 你这是什么项目 | 游戏还是应用？安卓还是windows？能干什么？带几张实机截图。 |
| 怎么安装 | 你这是便携版还是安装包？ |
| 怎么用 | 写清你做的程序有什么功能或特色，附带一个新手教程。 |
| 许可证 | 用的什么许可证 |

***README建议人工写，可以适当AI辅助***

---

## 3. 常用许可证的意思

| 许可证 | 意思 |
| -------------- | -------------------------------- |
| **MIT** | 随便用、可商用、可改、改完可以闭源，只要保留版权声明；作者不担责 |
| **Apache-2.0** | 和 MIT 差不多，多了明确的专利授权；改过文件要说明改了什么 |
| **GPL-3.0** | 用了我的代码，你的项目也必须开源、同样用 GPL |
| **不加** | 默认「保留所有权利」——代码公开 ≠ 别人能用 |

课程作业、个人项目：可选 **MIT**。在 GitHub 新建仓库时别忘记选。

---

## 4. 一点常识

- **`.gitignore` 要在写第一行代码之前加**，把 `.env`、`node_modules/`、`dist/` 排除掉。文件一旦提交过，再补忽略是没用的。
- **密钥提交上去，删文件没用**，历史里还留着。第一件事是去服务商后台作废并换新的，然后才清历史。
- **锁文件要提交**（`package-lock.json`、`poetry.lock`、`go.sum` 等），否则同一份代码今天能跑、下周就跑不起来。
- **别直接 push `main`**，一个改动一次提交，提交信息写「修了什么」而不是 `update` / `aaa`。
- **LICENSE 不能靠组织模板继承**，每个仓库都得自己放一份。

最小仓库长这样：

```text
my-project/
├── README.md
├── LICENSE
├── .gitignore
└── src/
```

***不懂常识没关系，让ai帮你管住仓库***

---

## 5. 让ai控制你的Github / Gitee

### Github 操作

1. 注册登录Github
2. 进入 [Github Tokens](https://github.com/settings/tokens)
3. 按图示操作生成token (classic)

![在 Token 页面选择 Generate new token (classic)](content/docs/assets/open-source-repo/step-1.png)

4. 按图示操作填写信息

![填写 token 名称、有效期与权限](content/docs/assets/open-source-repo/step-2.png)

5. 生成

![点击生成](content/docs/assets/open-source-repo/step-3.png)

6. 复制token密钥

![复制生成出来的 token](content/docs/assets/open-source-repo/step-4.png)

7. token发送给ai agent，让它帮你管理你的项目的仓库，帮你上传代码、README、描述、许可证等等。

### Gitee 操作

1. 注册登录Gitee
2. 进入 [Gitee私人令牌](https://gitee.com/profile/personal_access_tokens/new)
3. 创建

![创建私人令牌](content/docs/assets/open-source-repo/step-5.png)

4. 复制token密钥

![复制生成出来的 token](content/docs/assets/open-source-repo/step-6.png)

5. token发送给ai agent，让它帮你管理你的项目的仓库，帮你上传代码、README、描述、许可证等等。
