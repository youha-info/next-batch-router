# next-batch-router
[![NPM](https://img.shields.io/npm/v/next-batch-router?color=red)](https://www.npmjs.com/package/next-batch-router)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/next-batch-router)](https://bundlephobia.com/package/next-batch-router)
[![GitHub license](https://img.shields.io/github/license/youha-info/next-batch-router)](https://github.com/youha-info/next-batch-router/blob/main/LICENSE)

An alternative to `useRouter` hook in `next/router` that batches `push` and `replace` calls.

It allows for multiple `push` without overwriting each other.

## Why do I need it?

With `next/router`, the code below doesn't work.

We expect query string to result in `?a=1&b=2`, but it results in `?a=1` or `?b=2`

```js
const router = useRouter();
const onClick = () => {
    router.push({ query: { ...router.query, a: 1 } });
    router.push({ query: { ...router.query, b: 2 } });
};
```

❌ Results in `?a=1` or `?b=2`

<br/>

By using `useBatchRouter`, calls to `push` are queued and merged together.

```js
const batchRouter = useBatchRouter();
const onClick = () => {
    batchRouter.push({ query: { a: 1 } });
    batchRouter.push({ query: { b: 2 } });
};
```

✅ Results in `?a=1&b=2`

## Installation

```sh
$ yarn add next-batch-router
or
$ npm install next-batch-router
```

## Usage

### 1. BatchRouterProvider

Set up `<BatchRouterProvider/>` at the top of the component tree, preferably inside pages/\_app.js

```js
import { BatchRouterProvider } from "next-batch-router";

const MyApp = ({ Component, pageProps }) => (
    <BatchRouterProvider>
        <Component {...pageProps} />
    </BatchRouterProvider>
);
```

### 2. useBatchRouter

Instead of using `useRouter` from `next/router`, use `useBatchRouter` instead.

```js
import { useBatchRouter } from "next-batch-router";

const Component = () => {
    const batchRouter = useBatchRouter();
    const onClick = () => {
        batchRouter.push({ query: { a: 1 } });
        batchRouter.push({ query: { b: 2 } });
    };

    return (
        <div>
            <button onClick={onClick}>Click me!</button>
        </div>
    );
};
```

### Definition

```js
batchRouter.push(url, as, options);
batchRouter.replace(url, as, options);
```

`url`: { query?: SetQueryAction, hash?: string | null }

-   You cannot put `string`. Only `object` with `query` and `hash` property is allowed.

-   `query` is similar to the original `query` parameter with some differences.

    1. Original `push` completely replaced the query string with the given object, but `batchRouter.push` merges the object by default.
    2. `null` value removes the query parameter from the query string. Calling `batchRouter.push({query: {a: null}})` on `?a=1&b=2` results in `?b=2`.
    3. `undefined` value is ignored. Calling `batchRouter.push({query: {a: undefined}})` on `?a=1&b=2` results in `?a=1&b=2`.
    4. You can put a `function` instead of an `object` as a `query` parameter, similar to `React.useState`. However, the returned object is not merged automatically and must be merged manually within the function. Since merge is not automatically done, the `undefined` value is handled as `null` and is removed from the query string.

-   `hash` is the "hash" part from `?param=foo#hash` url. It's similar to the original `hash` parameter with some differences.
    1. Originally, `hash` was not preserved unless provided in the `router.push` call. `batchRouter.push` preserves the original hash if not supplied.
    2. `null` value removes the hash.
    3. When multiple `push` calls have a `hash` parameter, the last one is applied.
    4. There is a bug in which removing all query parameters doesn't work if there is a hash in the URL. Such as this: `batchRouter.push({ query: ()=>({}), hash:"hash" })`

`as`?: { query?: SetQueryAction, hash?: string | null }

-   Optional. Defines how the browser URL bar will look like. Can be used to set param in router.query but hide it from the URL. Check [next/router documentation](https://nextjs.org/docs/api-reference/next/router#routerpush) for more detail. Similar to `url`.

`options`?: { scroll?: boolean, shallow?: boolean, locale?: string }

-   `scroll`: Scroll to the top of the page after navigation. Defaults to `true`. When multiple `push` and `replace` calls are merged, all must have `scroll: false` to not scroll after navigation.
-   `shallow`: Update the path of the current page without rerunning `getStaticProps`, `getServerSideProps` or `getInitialProps`. Defaults to `false`. When merged, all must have `shallow: true` to do shallow routing.
-   `locale`: Indicates locale of the new page. When merged, the last one will be applied.

## Limitations

`useBatchRouter` is currently not designed to replace `useRouter`. It's to be used together and `useBatchRouter` should be used for changing only the query and hash part of the URL.

## License

This project is licensed under the MIT License.
