const idb = require('./store')
const crypto = require('easy-web-crypto')

class Store {
  /**
    * Class constructor
    *
    * @param {string} user - The current user
    * @param {string} passphrase - Passphrase from which we derive the key
    */
  constructor (storeName, passphrase) {
    if (!storeName || !passphrase) {
      throw new Error('Store name and passphrase required')
    }
    // init store
    this.storeName = storeName
    this.store = new idb.Store(storeName, storeName)
    this.passphrase = passphrase
  }

  async init () {
    try {
      let encryptedKey = await idb.get('__key', this.store)
      // generate a new key for the user if no key exists (empty store)
      if (!encryptedKey) {
        encryptedKey = await crypto.genEncryptedMasterKey(this.passphrase)
        // store the new key since it's the first time
        await idb.set('__key', encryptedKey, this.store)
      }
      // decrypt key so we can use it during this session
      this.encMasterKey = encryptedKey
      this.key = await crypto.decryptMasterKey(this.passphrase, this.encMasterKey)
      // close DB connection if the window enters freeze state
      window.addEventListener('freeze', () => {
        this.close()
      })
    } catch (e) {
      throw new Error(e.message)
    }
  }

  async updatePassphrase (oldPass, newPass) {
    try {
      const encryptedKey = await crypto.updatePassphraseKey(oldPass, newPass, this.encMasterKey)
      await idb.set('__key', encryptedKey, this.store)
      this.encMasterKey = encryptedKey
    } catch (e) {
      throw new Error(e.message)
    }
  }

  async set (key, val) {
    val = await crypto.encrypt(this.key, val)
    return idb.set(key, val, this.store)
  }

  async get (key) {
    return new Promise(async (resolve, reject) => {
      let val
      try {
        val = await idb.get(key, this.store)
      } catch (e) {
        reject(e)
      }
      if (!val) {
        return resolve(val) // undefined
      }
      // decrypt data before returning it
      resolve(await crypto.decrypt(this.key, val))
    })
  }

  del (key) {
    return idb.del(key, this.store)
  }

  keys () {
    return idb.keys(this.store)
  }

  clear () {
    return idb.clear(this.store)
  }

  close () {
    return idb.close(this.store)
  }

  destroy () {
    return new Promise((resolve, reject) => {
      this.close()
      const req = window.indexedDB.deleteDatabase(this.storeName)
      req.onsuccess = (e) => {
        resolve(e)
      }
      req.onerror = (e) => {
        reject(e)
      }
    })
  }
}

module.exports = {
  Store,
  _idb: idb
}
