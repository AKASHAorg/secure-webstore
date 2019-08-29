/* eslint-env mocha */
/* global chai */

const Store = window.SecureStore.Store

describe('Store', function () {
  context('API', async () => {
    const storeName = 'foo'
    const passphrase = 'password'
    const newPass = 'new password'

    it('Should fail to initialize if store name or passphrase are not provided', async () => {
      let s
      let err = { message: '_ERROR_NOT_THROWN_' }
      try {
        s = new Store()
      } catch (error) {
        err = error
      }
      chai.assert.equal(err.message, 'Store name and passphrase required', 'Reject if no params are provided')

      try {
        s = new Store(storeName, undefined)
      } catch (error) {
        err = error
      }
      chai.assert.equal(err.message, 'Store name and passphrase required', 'Reject if no pass')

      try {
        s = new Store(undefined, passphrase)
      } catch (error) {
        err = error
      }
      chai.assert.equal(err.message, 'Store name and passphrase required', 'Reject if no store')
    })

    it('Should successfully initialize', async () => {
      let err = { message: '_ERROR_NOT_THROWN_' }
      try {
        const store = new Store(storeName, passphrase)
        await store.init()
      } catch (error) {
        err = error
      }
      chai.assert.equal(err.message, '_ERROR_NOT_THROWN_')
    })

    it('Should fail to initialize existing store with bad password', async () => {
      let err = { message: '_ERROR_NOT_THROWN_' }
      try {
        const s = new Store(storeName, 'foo')
        await s.init()
      } catch (error) {
        err = error
      }
      chai.assert.equal(err.message, 'Wrong passphrase')
    })

    it('Should successfully set an encrypted key/value pair', async () => {
      const store = new Store(storeName, passphrase)
      await store.init()

      const data = { foo: 'bar' }
      await store.set('one', data)

      const _store = new window.idbKeyval.Store(storeName, storeName)
      const encItem = await window.idbKeyval.get('one', _store)
      chai.assert.exists(encItem.iv)
      chai.assert.exists(encItem.ciphertext)
    })

    it('Should successfully get an non-existing key/value pair', async () => {
      const store = new Store(storeName, passphrase)
      await store.init()

      chai.assert.isUndefined(await store.get('baz'))
    })

    it('Should successfully get an encrypted key/value pair', async () => {
      const store = new Store(storeName, passphrase)
      await store.init()

      const data = { foo: 'bar' }
      const dec = await store.get('one')
      chai.assert.deepEqual(dec, data)
    })

    it('Should fail to updatePassphrase with wrong (previous) password', async () => {
      const store = new Store(storeName, passphrase)
      await store.init()

      let err = { message: '_ERROR_NOT_THROWN_' }
      try {
        await store.updatePassphrase('foo', newPass)
      } catch (error) {
        err = error
      }
      chai.assert.equal(err.message, 'Wrong passphrase')
    })

    it('Should successfully updatePassphrase with the new password and retrieve saved data', async () => {
      const store = new Store(storeName, passphrase)
      await store.init()

      await store.updatePassphrase(passphrase, newPass)

      const data = { foo: 'bar' }
      const dec = await store.get('one')
      chai.assert.deepEqual(dec, data)
    }).timeout(1000)

    it('Should successfully init the same store with the updated passowrd', async () => {
      const store = new Store(storeName, newPass)
      try {
        await store.init()
      } catch (e) {
        console.log(e)
      }
      const data = { foo: 'bar' }
      try {
        const dec = await store.get('one')
        chai.assert.deepEqual(dec, data)
      } catch (e) {
        console.log(e)
      }
    }).timeout(3000)

    it('Should successfully list all keys in the store', async () => {
      const store = new Store(storeName, newPass)
      try {
        await store.init()
      } catch (e) {
        console.log(e)
      }

      const items = await store.keys() // [ '__key', 'one' ]
      chai.assert.equal(items.length, 2)
    })

    it('Should successfully delete a non-existent key from the store', async () => {
      const store = new Store(storeName, newPass)
      try {
        await store.init()
      } catch (e) {
        console.log(e)
      }

      await store.del('two')

      const items = await store.keys() // [ '__key', 'one ]
      chai.assert.equal(items.length, 2)
    })

    it('Should successfully delete a key from the store', async () => {
      const store = new Store(storeName, newPass)
      try {
        await store.init()
      } catch (e) {
        console.log(e)
      }

      await store.del('one')

      const items = await store.keys() // [ '__key' ]
      chai.assert.equal(items.length, 1)
    })

    it('Should successfully clear the store', async () => {
      const store = new Store(storeName, newPass)
      try {
        await store.init()
      } catch (e) {
        console.log(e)
      }

      await store.clear()

      const items = await store.keys() // []
      chai.assert.equal(items.length, 0)
    })
  })
})
