/* eslint-env mocha */
/* global chai */

const Store = window.SecureStore.Store

describe('Store', function () {
  context('API', async () => {
    const storeName = 'test-store'
    const passphrase = 'password'
    const newPass = 'new password'
    const data = { foo: 'bar' }

    it('Should fail to initialize if store name or passphrase are not provided', async () => {
      let store
      let err
      try {
        store = new Store()
      } catch (error) {
        err = error
      }
      chai.assert.isUndefined(store)
      chai.assert.equal(err.message, 'Store name and passphrase required', 'Reject if no params are provided')

      try {
        store = new Store(storeName, undefined)
      } catch (error) {
        err = error
      }
      chai.assert.isUndefined(store)
      chai.assert.equal(err.message, 'Store name and passphrase required', 'Reject if no pass')

      try {
        store = new Store(undefined, passphrase)
      } catch (error) {
        err = error
      }
      chai.assert.isUndefined(store)
      chai.assert.equal(err.message, 'Store name and passphrase required', 'Reject if no store')
    })

    it('Should successfully initialize', async () => {
      let err
      let store
      try {
        store = new Store(storeName, passphrase)
        await store.init()
      } catch (error) {
        err = error
      }
      chai.assert.isUndefined(err)
      await store.close()
    })

    it('Should fail to initialize existing store with bad password', async () => {
      let err
      let store
      try {
        store = new Store(storeName, 'foo')
        await store.init()
      } catch (error) {
        err = error
      }
      chai.assert.equal(err.message, 'Wrong passphrase')
      await store.close()
    })

    it('Should successfully set an encrypted key/value pair', async () => {
      const store = new Store(storeName, passphrase)
      await store.init()

      await store.set('one', data)

      const _store = new window.SecureStore._idb.Store(storeName, storeName)
      const encItem = await window.SecureStore._idb.get('one', _store)
      chai.assert.exists(encItem.iv)
      chai.assert.exists(encItem.ciphertext)
      await store.close()
    })

    it('Should successfully get an non-existing key/value pair', async () => {
      const store = new Store(storeName, passphrase)
      await store.init()

      chai.assert.isUndefined(await store.get('baz'))
      await store.close()
    })

    it('Should successfully get an encrypted key/value pair', async () => {
      const store = new Store(storeName, passphrase)
      await store.init()

      const dec = await store.get('one')
      chai.assert.deepEqual(dec, data)
      await store.close()
    })

    it('Should successfully list all keys in the store', async () => {
      const store = new Store(storeName, passphrase)
      await store.init()

      const items = await store.keys() // [ '__key', 'one' ]
      chai.assert.equal(items.length, 2)
      await store.close()
    })

    it('Should successfully call delete on a non-existent key from the store', async () => {
      const store = new Store(storeName, passphrase)
      await store.init()

      await store.del('two')

      const items = await store.keys() // [ '__key', 'one ]
      chai.assert.equal(items.length, 2)
      await store.close()
    })

    it('Should successfully delete a key from the store', async () => {
      const store = new Store(storeName, passphrase)
      await store.init()

      await store.del('one')

      const items = await store.keys() // [ '__key' ]
      chai.assert.equal(items.length, 1)
      await store.close()
    })

    it('Should successfully clear the store', async () => {
      const store = new Store(storeName, passphrase)
      await store.init()

      await store.clear()

      const items = await store.keys() // []
      chai.assert.equal(items.length, 0)
      await store.close()
    })

    it('Should successfully export data', async () => {
      const store = new Store(storeName, passphrase)
      await store.init()

      await store.set('one', data)

      const dump = await store.export()

      const keys = await store.keys()
      keys.forEach(key => {
        chai.assert.exists(Object.keys(dump), key)
      })
      await store.close()
    })

    it('Should fail to import data if none is provided', async () => {
      const store = new Store(storeName, passphrase)
      await store.init()

      let err
      try {
        await store.import()
      } catch (error) {
        err = error
      }
      chai.assert.equal(err.message, 'No data provided')

      try {
        await store.import({})
      } catch (error) {
        err = error
      }
      chai.assert.equal(err.message, 'No data provided')

      try {
        await store.import('foo')
      } catch (error) {
        err = error
      }
      chai.assert.equal(err.message, 'Data must be a valid JSON object')

      await store.close()
    })

    it('Should successfully import data', async () => {
      const store = new Store(storeName, passphrase)
      await store.init()

      const keys = await store.keys()
      const dump = await store.export()

      await store.del('one')

      await store.import(dump)

      chai.assert.deepEqual(keys, await store.keys())

      await store.close()
    })

    it('Should fail to updatePassphrase with wrong (previous) password', async () => {
      const store = new Store(storeName, passphrase)
      await store.init()

      let err
      try {
        await store.updatePassphrase('foo', newPass)
      } catch (error) {
        err = error
      }
      chai.assert.equal(err.message, 'Wrong passphrase')
      await store.close()
    })

    it('Should successfully updatePassphrase with the new password and retrieve saved data', async () => {
      const store = new Store(storeName, passphrase)
      await store.init()

      await store.set('one', data)

      await store.updatePassphrase(passphrase, newPass)

      const dec = await store.get('one')
      chai.assert.deepEqual(dec, data)
      await store.close()
    })

    // This test times out in headless-chrome but works in the browser

    // it('Should successfully delete the store', async () => {
    //   const store = new Store(storeName, newPass)
    //   await store.init()

    //   const before = await window.indexedDB.databases()

    //   let err
    //   try {
    //     const out = await store.destroy()
    //     console.log(out)
    //   } catch (error) {
    //     err = error
    //   }
    //   chai.assert.isUndefined(err)
    //   const after = await window.indexedDB.databases()

    //   chai.assert.equal(after.length, before.length - 1)
    //   await store.close()
    // })
  })
})
