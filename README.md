# AI Terminal Shell

> 【English|[中文](./README.cn.md)】
---

The AI Terminal Shell is written in [Programmable Prompt Engine Language](https://npmjs.org/package/@offline-ai/cli).

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/%40offline-ai%2Fai-shell.svg)](https://npmjs.org/package/@offline-ai/ai-shell)
[![Downloads/week](https://img.shields.io/npm/dw/%40offline-ai%2Fai-shell.svg)](https://npmjs.org/package/@offline-ai/ai-shell)


[![asciicast](https://asciinema.org/a/676375.svg)](https://asciinema.org/a/676375)

# Quick Start

# Install

```bash
npm install -g @offline-ai/ai-shell
# start llama-server first, before starting
#set -ngl 0 if no gpu
./llama-server -t 4 -c 4096 -ngl 33 -m ~/.local/share/ai/brain/phi-3-mini-4k-instruct.Q4_0.gguf

# Start ai shell
aish
```

This terminal shell is developed using artificial intelligence technology to enhance the user's command-line experience. With intelligent suggestions and analysis, it helps users execute tasks more efficiently.

# Features

- **Intelligent Command Suggestions**: Users can input terminal tasks in natural language, for example:
  - `Unpack download.tar.gz into the dest directory`
  - `Convert video.avi to video.mp4 and resize to 720p`
  - `Speed up the video 2x using ffmpeg and Remove audio track`
  - `Start nginx server in Docker, mount current dir`
- **Command Safety Checks**: Ensures that every command executed is safe.
- **Error Analysis and Handling**: Automatically analyzes and reports reasons when a command fails.
- **Interactive Interface**: Provides an intuitive terminal operation interface, making it easier for users to understand and operate.

# Terminal Screen Layout

- **Top Output Window**: All outputs are displayed here. This is the largest area.
- **Progress Display Area**: Occupies one line to show intermediate process progress.
- **Preview Command Area (One Line, Two Columns)**:
  - **First Column**: Execute command button
  - **Second Column**: Command editing box for commands about to be executed
- **Bottom Input Prompt Box**: Located at the bottom of the terminal, users can directly input commands or command prompts for AI suggestions. This area occupies two lines, with the second line displaying auto-completed suggestions.

# Usage Instructions

When users input in the `input_prompt_edit`, it will automatically suggest based on historical inputs. Pressing the `tab` key shows all matching historical records; continue pressing `tab` to switch between them, press Enter to confirm, and ESC to cancel. After submitting a command request, the AI will analyze the input:

- If the input is a command, the AI will analyze it. For commonly used commands, it will execute directly, skipping the analysis phase.
- If the input is a request, the AI will provide a command.
- Both the AI and the program (which uses the Posix Shell Parser to analyze commands) check the command to ensure safety and provide corresponding safety tips.
- Finally, the command is placed in the preview command box (`preview_command_edit`) for user confirmation (press Enter in the preview command box or click the execute command button).

During AI analysis, the progress is displayed in the middle `progress_info` area.

If errors occur during command execution, the AI performs error analysis to identify the cause.

# Common Commands

The common commands to skip check.

- `ls`: List files in the current directory, including hidden files.
- `cd`: Change directory.
- `clear`: Clear the screen.
- `cat`: View file content.
- `pwd`: Show the current directory.
- `mkdir`: Create a directory.
- `echo`: Print text.
- `less`: View file content with support for scrolling up and down.
- `man`: View command help documentation.
- `more`: View file content.
- `cp`: Copy files.
- `which`: Find commands.
- `head`: View the beginning of a file.
- `tail`: View the end of a file.
- `touch`: Create a file.
- `grep`: Search file content.

Commands currently considered dangerous:

- `rm`: Delete files.
- `rmdir`: Delete directories.
- `su`: Switch users.
- `sudo`: Switch to superuser.

Currently unsupported:

- `set`: Set environment variables.
- `export`: Set environment variables.

<!-- toc -->
* [AI Terminal Shell](#ai-terminal-shell)
* [Quick Start](#quick-start)
* [Install](#install)
* [start llama-server first, before starting](#start-llama-server-first-before-starting)
* [Start ai shell](#start-ai-shell)
* [Features](#features)
* [Terminal Screen Layout](#terminal-screen-layout)
* [Usage Instructions](#usage-instructions)
* [Common Commands](#common-commands)
* [Commands](#commands)
<!-- tocstop -->

# Commands

<!-- commands -->
* [`aish [FILE] [DATA]`](#aish-file-data)

## `aish [FILE] [DATA]`

💻 Run ai-agent script file.

```
USAGE
  $ aish  [FILE] [DATA] [--json] [-c <value>] [--banner] [-u <value>] [--apiKey <value>] [-s
    <value>...] [-l trace|debug|verbose|info|warn|error|fatal|silence] [--histories <value>] [-n] [-k] [-t <value> -i]
    [--no-chats] [--no-inputs ] [-m] [-f <value>] [-d <value>] [-D <value>...] [-a <value>] [-b <value>] [-p <value>...]
    [-L <value>] [-A <value>] [-e true|false|line] [-e <value>] [--consoleClear]

ARGUMENTS
  FILE  the script file path, or the json data when `-f` switch is set
  DATA  the json data which will be passed to the ai-agent script

FLAGS
  -A, --aiPreferredLanguage=<value>    the ISO 639-1 code for the AI preferred language to translate the user input
                                       automatically, eg, en, etc.
  -D, --data=<value>...                the data which will be passed to the ai-agent script: key1=value1 key2=value2
  -L, --userPreferredLanguage=<value>  the ISO 639-1 code for the user preferred language to translate the AI result
                                       automatically, eg, en, zh, ja, ko, etc.
  -a, --arguments=<value>              the json data which will be passed to the ai-agent script
  -b, --brainDir=<value>               the brains(LLM) directory
  -c, --config=<value>                 the config file
  -d, --dataFile=<value>               the data file which will be passed to the ai-agent script
  -e, --streamEcho=<option>            [default: true] stream echo mode, defaults to true
                                       <options: true|false|line>
  -e, --streamEchoChars=<value>        stream echo max characters limit, defaults to no limit
  -f, --script=<value>                 the ai-agent script file name or id
  -i, --[no-]interactive               interactive mode
  -k, --backupChat                     whether to backup chat history before start, defaults to false
  -l, --logLevel=<option>              the log level
                                       <options: trace|debug|verbose|info|warn|error|fatal|silence>
  -m, --[no-]stream                    stream mode, defaults to true
  -n, --[no-]newChat                   whether to start a new chat history, defaults to false in interactive mode, true
                                       in non-interactive
  -p, --promptDirs=<value>...          the prompts template directory
  -s, --agentDirs=<value>...           the search paths for ai-agent script file
  -t, --inputs=<value>                 the input histories folder for interactive mode to record
  -u, --api=<value>                    the api URL
      --apiKey=<value>                 the api key (optional)
      --[no-]banner                    show banner
      --[no-]consoleClear              Whether console clear after stream echo output, default to true
      --histories=<value>              the chat histories folder to record
      --no-chats                       disable chat histories, defaults to false
      --no-inputs                      disable input histories, defaults to false

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  💻 Run ai-agent script file.

  Execute ai-agent script file and return result. with `-i` to interactive.

EXAMPLES
  $ aish  -f ./script.yaml "{content: 'hello world'}" -l info
  ┌────────────────────
  │[info]:Start Script: ...
```
<!-- commandsstop -->
