<h1 align="center"> Svelte Infinite Board </h1>

[![npm](https://img.shields.io/npm/v/svelte-infinite-board)](https://www.npmjs.com/package/svelte-infinite-board)
[![license](https://img.shields.io/npm/l/svelte-infinite-board)](https://www.npmjs.com/package/svelte-infinite-board)

<b> In development</b>

### Features

- smooth pan & zoom
- full mobile support
- lightweight
- customization

### New in 0.0.4
- board binding
- events now trigger even when pan disabled
- screenToBoard & boardToScreen convert functions

### Roadmap

- [ ] Documentation
- [ ] Board borders

### Install

```bash
npm i svelte-infinite-board
```

### Example

```sveltehtml
<script>
  import { Board } from 'svelte-infinite-board';
</script>

<section style="width: 100vw; height: 100dvh">
  <Board
    scaleBounds={{min: 0.5, max: 2}}
      bgScopes={[
        {
          scale: 1,
          size: 128,
          bg: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_28_64)"><rect width="32" height="32" fill="black"/><rect width="16" height="16" rx="3" fill="#121212"/><rect x="16" y="16" width="16" height="16" rx="3" fill="#121212"/></g><defs><clipPath id="clip0_28_64"><rect width="32" height="32" fill="white"/></clipPath></defs></svg>`
        }
      ]}>
  </Board>
</section>
```
