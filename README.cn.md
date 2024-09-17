# 人工智能终端 shell

> 【[English](./README.md)|中文】
---

由 [Programmable Prompt Engine Language](https://npmjs.org/package/@offline-ai/cli) 编写的人工智能终端 shell。

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/%40offline-ai%2Fai-shell.svg)](https://npmjs.org/package/@offline-ai/ai-shell)
[![Downloads/week](https://img.shields.io/npm/dw/%40offline-ai%2Fai-shell.svg)](https://npmjs.org/package/@offline-ai/ai-shell)

这是一个基于人工智能技术开发的终端Shell，旨在提升用户的命令行操作体验。通过智能提示与分析，帮助用户更高效地执行任务。

[![asciicast](https://asciinema.org/a/676372.svg)](https://asciinema.org/a/676372)

## Install

```bash
npm install -g @offline-ai/ai-shell
# start llama-server first, before starting
#set -ngl 0 if no gpu
./llama-server -t 4 -c 4096 -ngl 33 -m ~/.local/share/ai/brain/phi-3-mini-4k-instruct.Q4_0.gguf

# Start ai shell
aish
```

## 功能特性

* 智能命令提示： 用户可以用自然语言输入终端任务，eg,
  * `解压 download.tar.gz 文件到 dest 目录`
  * `将视频 xxx.mkv 保存为 mp4, 使得文件体积最小，并且缩放到720p`
  * `用 docker 运行 nginx 服务器`
* 命令安全性检查：确保执行的每条命令都是安全的。
* 错误分析与处理：当命令执行失败时，自动分析并报告错误原因。
* 交互式界面：提供直观的终端操作界面，便于用户理解和操作。

## 终端屏幕布局

* 最上面是的输出窗口: 所有的输出显示在这里。最大区域。
* 接下来是占据一行进度显示信息区域: 显示中间过程进度。
* 然后是一行两列的预览命令区域
  * 第一列是执行命令按钮
  * 然后是待执行的命令编辑框
* 最后，最下面的是命令提示输入框，在终端最底部，用户可以直接输入命令，或者输入命令提示，让 AI 给出命令。该区域占据两行，第二行显示自动完成的提示。

## 使用说明

当用户在`input_prompt_edit` 输入,会根据历史输入自动提示，按`tab`键会显示所有匹配的历史记录，继续按 tab 键在各项中切换，回车确定，ESC 键取消。
输入命令要求后，回车提交，AI 会分析输入：

如果输入的是命令，AI 会分析命令，如果用户输入命令是最常用的命令，会直接执行，跳过分析阶段；如果输入的是要求，AI 会给出命令
然后AI和程序(程序是通过 Posix Shell Parser 分析命令的)同时会检查命令，确认命令是否安全，并给出相应的安全提示。
最后，将命令放在预览命令框(preview_command_edit)，等待用户确认(在预览命令框按下回车，或者鼠标点击旁边的执行命令按钮)。

在AI分析时，AI分析进度会显示在中间的`progress_info`进度区域。

当命令执行时如果发生错误，AI会进行错误分析，找出错误原因。

## 常用命令

* `ls`: 列出当前目录下的文件，包括隐藏文件。
* `cd`: 切换目录。
* `clear`: 清屏。
* `cat`: 查看文件内容。
* `pwd`: 显示当前目录。
* `mkdir`: 创建目录。
* `echo`: 打印文本。
* `less`: 查看文件内容，支持上下翻页。
* `man`: 查看命令的帮助文档。
* `more`: 查看文件内容
* `cp`: 复制文件
* `which`: 查找
* `head`: 查看文件头部
* `tail`: 查看文件尾部
* `touch`: 创建文件
* `grep`: 查找文件内容
* `dir`: 列出当前目录下的文件，包括隐藏文件。

当前作为危险的命令如下：

* `rm`: 删除文件。
* `rmdir`: 删除目录。
* `su`: 切换用户。
* `sudo`: 切换超级用户。

当前还不支持：

* `set`: 设置环境变量。
* `export`: 设置环境变量。