# Secure-webstore

[![Build Status](https://api.travis-ci.org/AKASHAorg/secure-webstore.svg?branch=master)](https://travis-ci.org/AKASHAorg/secure-webstore)

This is a secure, promise-based keyval store that encrypts data stored in IndexedDB.

The symmetric encryption key is derived from the provided passphrase, and then stored in an encrypted
form within the provided store name. The encryption key is only used in memory and never revealed.

The IndexedDB wrapper used internally is [idb-keyval](https://github.com/jakearchibald/idb-keyval/),
while the cryptographic operations are handled by [easy-web-crypto](https://github.com/AkashaProject/easy-web-crypto),
a zero-dependency wrapper around the [Webcrypto API](https://caniuse.com/#search=web%20crypto) available in modern browsers.

Huge thanks to [@Jopie64](https://github.com/Jopie64) for Typescriptifying the source!

## Usage

### Initialize

The init step takes care of key derivation and setting up the encryption/decryption key.

```js
const Store = require('secure-webstore')

const store = new Store('some-store-name', 'super-secure-passphrase')

store.init().then(() => {
  // store is ready
})
```

### set:

```js
store.set('hello', 'world')
```

Since this is IDB-backed, you can store anything structured-clonable (numbers, arrays, objects, dates, blobs etc).

All methods return promises:

```js
store.set('hello', 'world')
  .then(() => console.log('It worked!'))
  .catch(err => console.log('It failed!', err))
```

### get:

```js
// logs: "world"
const val = await store.get('hello')
// console.log(val) -> "world"
```

If there is no 'hello' key, then `val` will be `undefined`.

### keys:

```js
// logs: ["hello", "foo"]
keys().then(keys => console.log(keys))
```

### del:

```js
store.del('hello')
```

### clear:

```js
store.clear()
```

### destroy:

Completely remove a database.

```js
store.destroy()
```

### updatePassphrase:

Update the passphrase that is used for key derivation. The encryption key used for data will not be affected, just the key that protects it.

```js
store.updatePassphrase(oldPass, newPass)
```

### export:

Export all (encrypted) key/vals as one JSON object.

```js
const dump = await store.export()
```

### import:

```js
// using the dump above
store.import(dump)
```

That's it!

## Installing

### Via npm

```sh
npm install --save secure-webstore
```

### Via `<script>`

* The `dist/secure-webstore.js` bundle can be directly used in browsers.
