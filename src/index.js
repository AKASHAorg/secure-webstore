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
    let data
    let err
    try {
      const val = await idb.get(key, this.store)
      // decrypt data before returning it
      data = await crypto.decrypt(this.key, val)
    } catch (e) {
      err = e
    }
    return new Promise((resolve, reject) => {
      if (!data) {
        return resolve(data) // can be undefined
      }
      if (err) {
        return reject(err)
      }
      resolve(data)
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

  async export () {
    const dump = {}
    const keys = await this.keys()
    if (keys) {
      for (const key of keys) {
        const data = await idb.get(key, this.store)
        dump[key] = data
      }
    }
    return dump
  }

  async import (data) {
    if (!data || Object.keys(data).length === 0) {
      throw new Error('No data provided')
    }
    if (Object.prototype.toString.call(data) !== '[object Object]') {
      throw new Error('Data must be a valid JSON object')
    }
    for (const key of Object.keys(data)) {
      await idb.set(key, data[key], this.store)
    }
  }
}

module.exports = {
  Store,
  _idb: idb
}
