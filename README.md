<div align="center">

![Chonkie Logo](./assets/chonkie_logo_br_transparent_bg.png)

# 🦛 chonkie-ts ✨

<!-- Add badges here (also add links for the badges to the npm page) -->
![npm badge](https://img.shields.io/npm/v/chonkie)
![npm downloads](https://img.shields.io/npm/dt/chonkie)
![npm license](https://img.shields.io/npm/l/chonkie)
![npm bundle size](https://img.shields.io/bundlephobia/min/chonkie)
![Github Stars](https://img.shields.io/github/stars/chonkie-inc/chonkie-ts?style=social)
<!-- Add the discord badge here, stars -->

_🦛 CHONK your texts in TS with Chonkie!✨The no-nonsense lightweight and efficient chunking library._

</div>

## 📦 Installation

Simply install Chonkie using npm:

```bash
npm install chonkie
```

Chonkie believes in having minimum default dependencies, and maximum flexibility, and so we have a lot of optional dependencies that you can opt out of if you don't need them. You can get the minimal install by running:

```bash
npm install chonkie --no-optional
```

Learn more about the optional dependencies in the [DOCS.md](./DOCS.md) file.

## 📚 Usage

Chonkie is a simple and easy to use library for chunking text. It is designed to be used in any project that needs to chunk text, and is a great way to get started with text chunking.

```ts
import { TokenChunker } from 'chonkie';

async function main() {
  const chunker = await TokenChunker.create();
  
  const chunks = await chunker.chunk('Woah! Chonkie is such a great ts library!');

  for (const chunk of chunks) {
    console.log(chunk.text);
    console.log(chunk.token_count);
  }
}

main();
```

## Chunkers 

`chonkie-ts` is currently a work in progress and does not have feature parity with the original `chonkie` library yet. Here's an overview of the chunkers that are currently implemented:

| Name | Description |
|------|-------------|
| `TokenChunker` | Splits text into fixed-size token chunks |
| `SentenceChunker` | Splits text into chunks based on sentences.  |
| `RecursiveChunker` (⚠️ Experimental) | Splits text hierarchically using customizable rules to create semantically meaningful chunks. |



## Acknowledgements

Chonkie would like to CHONK its way through a special thanks to all the users and contributors who have helped make this library what it is today! Your feedback, issue reports, and improvements have helped make Chonkie the CHONKIEST it can be.

And of course, special thanks to [Moto Moto](https://www.youtube.com/watch?v=I0zZC4wtqDQ&t=5s) for endorsing Chonkie with his famous quote:
> "I like them big, I like them chonkie in TypeScript" ~ Moto Moto... definitly did not say this


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
