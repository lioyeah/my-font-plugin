# OrcaNote 字体与样式自定义插件 (OrcaNote Font & Style Customizer)

本插件旨在为 [OrcaNote](https://orca-studio.com) (虎鲸笔记) 用户提供更丰富的字体和基础视觉样式自定义选项，让你的笔记体验更加个性化。

## ✨ 主要功能

* **自定义字体族**:
    * 可分别为笔记**编辑器**、**用户界面 (UI)** 及**代码区域**独立设置字体。
    * 用户可以在插件设置中输入期望的字体名称字符串 (例如: `"霞鹜文楷 TC", serif`, `"Arial", sans-serif`)。
* **全局基础字体大小控制**:
    * 允许用户调整 `--orca-fontsize-base` CSS 变量，这可以影响到整个应用中大量使用 `rem` 单位的文本元素的缩放。
    * 对输入的像素值提供范围验证 (建议 10px - 18px)，并在超出范围时给出用户提示，同时应用安全的默认值。
    * 支持其他 CSS 单位如 `em`, `%` (但对这些单位暂无范围验证)。
* **全局行高控制**:
    * 允许用户调整 `--orca-lineheight-md` CSS 变量 (该变量被 `html` 根元素使用)，从而广泛影响全局的文本行间距。
    * 用户可以输入标准的行高值 (例如: "1.5", "1.8", "160%")。
* **动态样式应用**:
    * 所有设置均通过 JavaScript 动态修改文档 `:root` 元素上的 CSS 自定义属性来应用。
    * 集成了通过 OrcaNote 的 Valtio 状态订阅机制来实现设置更改后的样式实时更新（如果 OrcaNote 环境支持且 Valtio API 可用）。
* **便捷的设置界面**:
    * 插件的设置项通过 OrcaNote 的 `settingsSchema` API 生成，集成在 OrcaNote 的插件管理界面中。
    * 为所有可配置项提供了清晰的标签和描述说明。

## 🚀 安装插件 (通过 Release 附件)

1.  **访问 Release 页面**: 前往本仓库的 [**Releases 页面**](https://github.com/lioyeah/my-font-plugin/releases)。
2.  **下载最新版本**: 找到最新的 Release 版本 (例如 `v0.1.0` 或更高版本)。
3.  **获取附件**: 在该 Release 的 "Assets" (资源) 部分，下载名为 `my-font-plugin-vX.X.X.zip` 的 ZIP 文件 (例如，如果你插件文件夹是 `my-font-plugin`，那么文件名可能是 `my-font-plugin-v0.1.0.zip`)。
4.  **解压缩**: 解压缩下载的 ZIP 文件，你会得到一个插件文件夹 (例如 `my-font-plugin`)。
5.  **安装到 OrcaNote**: 将这**整个**插件文件夹复制到你的 OrcaNote 插件安装目录中。
    * *提示: 插件目录的具体位置取决于你的操作系统和 OrcaNote 的安装方式。通常在 OrcaNote 的用户数据或配置文件夹下的 `plugins` 子目录中。请查阅 OrcaNote 的官方文档或相关指引以确定准确路径。*
6.  **重启 OrcaNote**: 为了确保 OrcaNote 能正确加载新插件，请重启 OrcaNote 应用。
7.  **启用和配置**: 在 OrcaNote 的插件管理界面找到并启用本插件，然后通过其设置图标进入设置页面进行详细配置。

## 🛠️ 如何配置

启用插件后：
1.  在 OrcaNote 的插件管理列表中找到名为「my-font-plugin」的条目。
2.  在打开的设置面板中，你可以看到所有可配置的选项，包括：
    * 编辑器、UI、代码区的字体族。
    * 全局基础字体大小。
    * 全局行高。
3.  根据你的喜好修改这些值。对于字体族，请输入你系统中已安装的字体名称；对于尺寸和行高，请参考描述中的建议格式和范围。
4.  更改通常会尝试实时生效。如果未立即生效，请尝试禁用再启用插件，或重启 OrcaNote。

## 🌿 分支说明 (Branching Strategy)

本仓库主要使用以下分支：

* **`main`**: 这是主分支，包含了插件的最新稳定和已发布版本的代码。所有 GitHub Releases 版本都将基于此分支的特定提交来创建。建议普通用户直接使用 Releases 页面下载已打包好的插件。
* (未来展望) `develop`: 如果项目进一步发展，可能会引入 `develop` 分支用于日常开发、新功能集成和测试。不稳定或开发中的代码会先合并到这里。
* (未来展望) `feature`: 针对特定新功能的开发，可能会从 `develop` 分支创建特性分支 (例如 `feature/color-customization`)。

对于初次接触本项目的用户，请优先关注 `main` 分支和 [Releases 页面](https://github.com/lioyeah/my-font-plugin/releases)。

## 💡 未来计划 (Roadmap)

* 探索更精细的字体粗细控制。
* 研究在设置中提供预设字体列表或颜色选择的可能性 (可能依赖 OrcaNote API 的支持或自定义 UI)。
* 欢迎提出功能建议！

## 🤝 反馈与贡献 (Feedback & Contributing)

如果你在使用过程中遇到任何问题、有功能建议，或者发现了 Bug，欢迎通过本仓库的 [**Issues**](https://github.com/lioyeah/my-font-plugin/issues) 页面提交。

如果你有兴趣为本项目贡献代码，也欢迎提交 Pull Request。

## 📄 许可证 (License)

本项目采用 [MIT 许可证](LICENSE) 。

---
