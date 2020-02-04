<div style="text-align: center;margin: 50px;width: 100%;">
<img src="https://clipsrc.blestudio.com/clip-logo-with-text.png"/>
</div>

# clip-block
#### Clip Blocks is a library for building creative computing interfaces.

## Introduction
Clip Blocks is a fork of LLK's [scratch-blocks](https://github.com/LLK/scratch-blocks) project that provides a design specification and codebase for building creative computing interfaces. Together with the [Scratch Virtual Machine (VM)](https://github.com/LLK/scratch-vm) this codebase allows for the rapid design and development of visual programming interfaces. Unlike [Blockly](https://github.com/google/blockly), Scratch Blocks does not use [code generators](https://developers.google.com/blockly/guides/configure/web/code-generators), but rather leverages the [Scratch Virtual Machine](https://github.com/LLK/scratch-vm) to create highly dynamic, interactive programming environments.

*This project is in active development and should be considered a "developer preview" at this time.*

## Documentation
The "getting started" guide including [FAQ](https://scratch.mit.edu/developers#faq) and [design documentation](https://github.com/LLK/scratch-blocks/wiki/Design) can be found in the [wiki](https://github.com/LLK/scratch-blocks/wiki).

## Development

Cause we changed the method of the build script to support windows platform, you need to follow these steps to initialize your workspace:
```bash
npm i
```

Use npm script `build` to build your source, mind that in windows you may be asked to create junction link for closure-compiler and closure-library before you build:
```bash
npm run build
```

## Donate
Not now.

<div style="text-align: center;width: 100%;">
Copyright &copy; 2019<strong>Clipteam.</strong> All rights reserved.
</div>
