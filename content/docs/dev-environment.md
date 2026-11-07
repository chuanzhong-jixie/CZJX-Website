## 要装什么

社团不指定必须使用的工具，但统一推荐下面两个，遇到问题时大家能帮你排查。总共需要 10 到 20 分钟。

## 安装 VS Code

从官网下载安装包（code.visualstudio.com），选稳定版，不要用预览版。

安装时勾选这两项：

- 将「通过 Code 打开」操作添加到文件资源管理器上下文菜单
- 将 Code 注册为受支持的文件类型的编辑器

其余保持默认。安装路径不要含空格和中文。

### 推荐扩展

按 `Ctrl+Shift+X` 打开扩展面板，装以下几个就够用了：

- Chinese (Simplified) Language Pack：界面汉化，可选
- Prettier - Code formatter：格式化，社团项目统一用它
- ESLint：JavaScript 代码检查
- GitLens：在编辑器里看清每行是谁改的

不要一次装一堆扩展。装得越多，启动越慢，冲突也越多。

## 安装 Git

从 git-scm.com 下载对应系统的安装包。Windows 用户一路默认即可，只有一处需要注意：安装向导里的默认分支名选 `main`。

安装完成后，先配置身份信息，这两条命令只需执行一次：

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

邮箱建议用提交到 GitHub 的那个，否则贡献记录不会算在你头上。

## 校验安装

打开终端（Windows 用 PowerShell 或 Git Bash），执行：

```bash
git --version
code --version
```

两条命令都应该输出一个版本号，类似 `git version 2.45.1`。如果提示「不是内部或外部命令」，说明没有加入 PATH，重新安装并勾选相关选项。

然后验证一下凭据配置是否正确：

```bash
git config --global --get user.name
git config --global --get user.email
```

## 拉一个仓库试试

找社团的项目仓库，在本地任意目录执行：

```bash
git clone https://github.com/Foxelf-Studio/CZJX-Website.git
cd CZJX-Website
code .
```

如果仓库能克隆下来，并且在 VS Code 里能看到文件，环境就算配好了。

## 常见问题

**`code .` 提示找不到命令**

Windows 重装 VS Code 时勾选「添加到 PATH」；macOS 在 VS Code 里按 `Ctrl+Shift+P`，执行 `Shell Command: Install 'code' command in PATH`。

**clone 卡住或超时**

先确认网络能访问 GitHub。如果是公司或学校网络限制，可以配置代理：

```bash
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890
```

端口按你实际的代理软件填写。取消代理用 `git config --global --unset http.proxy`。

**提交时提示 author identity unknown**

就是没配置 `user.name` / `user.email`，回到上文「安装 Git」重新执行那两条命令。
