<div align="center">

![Chonkie Logo](./assets/chonkie_logo_br_transparent_bg.png)

# 🦛 chonkie-ts ✨

[![npm badge](https://img.shields.io/npm/v/chonkie)](https://www.npmjs.com/package/chonkie)
[![npm downloads](https://img.shields.io/npm/dt/chonkie)](https://www.npmjs.com/package/chonkie)
[![npm license](https://img.shields.io/npm/l/chonkie)](https://www.npmjs.com/package/chonkie)
[![npm bundle size](https://img.shields.io/bundlephobia/min/chonkie)](https://www.npmjs.com/package/chonkie)
[![Documentation](https://img.shields.io/badge/docs-DOCS.md-blue.svg)](./DOCS.md)
[![Discord](https://dcbadge.limes.pink/api/server/https://discord.gg/rYYp6DC4cv?style=flat)](https://discord.gg/rYYp6DC4cv)
[![Github Stars](https://img.shields.io/github/stars/chonkie-inc/chonkie-ts?style=social)](https://github.com/chonkie-inc/chonkie-ts)

_🦛 CHONK your texts in TypeScript with Chonkie!✨ The no-nonsense lightweight and efficient chunking library._

[Installation](#-installation) •
[Usage](#-usage) •
[Chunkers](#chunkers) •
[Acknowledgements](#acknowledgements) •
[Citation](#citation)

</div>

We built `chonkie-ts` while developing a TypeScript web app that needed fast, on-the-fly text chunking for RAG applications. After trying several existing libraries, we found them either too heavy or not flexible enough for our needs. `chonkie-ts` is a port of the original `chonkie` library, but with some type-safety and a few extra features to make it more useful for TypeScript developers!

**🚀 Feature-rich**: All the CHONKs you'd ever need </br>
**✨ Easy to use**: Install, Import, CHONK </br>
**⚡  Fast**: CHONK at the max speed of TypeScript! tssssooooooom </br>
**🪶 Light-weight**: No bloat, just CHONK </br>
**🦛 Cute CHONK mascot**: psst it's a pygmy hippo btw </br>
**❤️ [Moto Moto](#acknowledgements)'s favorite TypeScript library** </br>

**Chonkie** is a chunking library that "**just works**" ✨

> [!NOTE]
> This library is not a _binding_ but a _port_ of the original `chonkie` library written in Python, to TypeScript. This library is still under active development and not at feature parity with the original `chonkie` library yet. Please bear with us! 🫂

## 📦 Installation

```bash
npm install @chonkiejs/core
```

## 📚 Usage

```typescript
import { RecursiveChunker } from '@chonkiejs/core';

// Create a chunker
const chunker = await RecursiveChunker.create({
  chunkSize: 512
});

// Chunk your text
const chunks = await chunker.chunk('Your text here...');

// Use the chunks
for (const chunk of chunks) {
  console.log(chunk.text);
  console.log(`Tokens: ${chunk.tokenCount}`);
}
```

## 📦 Packages

| Package | Description | Dependencies |
|---------|-------------|--------------|
| [@chonkiejs/core](./packages/core) | Local chunking (Recursive, Token) with character-based tokenization | Zero |
| [@chonkiejs/cloud](./packages/cloud) | Cloud-based chunkers (Semantic, Neural, Code, etc.) via api.chonkie.ai | @chonkiejs/core |
| [@chonkiejs/token](./packages/token) | HuggingFace tokenizer support for core chunkers | @huggingface/transformers |

## Contributing

Want to help grow Chonkie? Check out [CONTRIBUTING.md](CONTRIBUTING.md) to get started! Whether you're fixing bugs, adding features, improving docs, or simply leaving a ⭐️ on the repo, every contribution helps make Chonkie a better CHONK for everyone.

Remember: No contribution is too small for this tiny hippo!

## Acknowledgements

Chonkie would like to CHONK its way through a special thanks to all the users and contributors who have helped make this library what it is today! Your feedback, issue reports, and improvements have helped make Chonkie the CHONKIEST it can be.

And of course, special thanks to [Moto Moto](https://www.youtube.com/watch?v=I0zZC4wtqDQ&t=5s) for endorsing Chonkie with his famous quote:
> "I like them big, I like them chonkie in TypeScript" ~ Moto Moto... definitely did not say this

## Citation

If you use Chonkie in your research, please cite it as follows:

```bibtex
@software{chonkie2025,
  author = {Bhavnick Minhas and Shreyash Nigam},
  title = {Chonkie: A no-nonsense fast, lightweight, and efficient text chunking library},
  year = {2025},
  publisher = {GitHub},
  howpublished = {\url{https://github.com/chonkie-inc/chonkie}},
}
```
