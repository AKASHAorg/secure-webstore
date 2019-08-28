const idb = require('idb-keyval')
const crypto = require('./crypto')

class Store {
  /**
    * Class constructor
    *
    * @param {string} user - The current user
    * @param {string} passphrase - Passphrase from which we derive the key
    * @param {Object} options - Optional onfiguration options
    */
  constructor (storeName, passphrase, options = {}) {
    if (!storeName || !passphrase) {
      throw new Error('You must provide both username and passphrase')
    }
    // init store
    this.store = new idb.Store(storeName, storeName)
    this.passphrase = passphrase
  }

  async init () {
    let encryptedKey = await idb.get('__key', this.store)
    // generate a new key for the user if no key exists (empty store)
    if (!encryptedKey) {
      encryptedKey = await crypto.genEncryptedMasterKey(this.passphrase)
      // store the new key since it's the first time
      await idb.set('__key', encryptedKey, this.store)
    }
    // decrypt key so we can use it during this session
    const decryptedKey = await crypto.decryptMasterKey(this.passphrase, encryptedKey)
    this.key = await crypto.importKey(decryptedKey)
  }

  async set (key, val) {
    // encrypt data before storing it
    val = await crypto.encrypt(this.key, val)
    return idb.set(key, val, this.store)
  }

  async get (key) {
    return new Promise (async (resolve, reject) => {
      let val
      try {
        val = await idb.get(key, this.store)
      } catch (e) {
        reject(e)
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
}

module.exports = {
  Store
}
