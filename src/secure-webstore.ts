import * as idb from './store';
import * as crypto from 'easy-web-crypto';

type Dump = Record<string | number, any>;

class Store {
  private store: idb.Store;
  private encMasterKey?: crypto.ProtectedMasterKey;
  private _key?: CryptoKey;

  private get key(): CryptoKey {
    if (!this._key) {
      throw new Error('Master key not initialized')
    }
    return this._key;
  }
  /**
    * Class constructor
    *
    * @param {string} user - The current user
    * @param {string} passphrase - Passphrase from which we derive the key
    */
  constructor (public storeName: string, private passphrase: string) {
    if (!storeName || !passphrase) {
      throw new Error('Store name and passphrase required')
    }
    // init store
    this.store = new idb.Store(storeName, storeName)
  }

  async init () {
    try {
      let encryptedKey: crypto.ProtectedMasterKey | undefined = await idb.get('__key', this.store)
      // generate a new key for the user if no key exists (empty store)
      if (!encryptedKey) {
        encryptedKey = await crypto.genEncryptedMasterKey(this.passphrase)
        // store the new key since it's the first time
        await idb.set('__key', encryptedKey, this.store)
      }
      // decrypt key so we can use it during this session
      this.encMasterKey = encryptedKey
      this._key = await crypto.decryptMasterKey(this.passphrase, this.encMasterKey)
      // close DB connection if the window enters freeze state
      window.addEventListener('freeze', () => {
        this.close()
      })
    } catch (e) {
      throw new Error(e.message)
    }
  }

  async updatePassphrase (oldPass: string, newPass: string) {
    try {
      if (!this.encMasterKey) {
        throw new Error('No password to update set');
      }
      const encryptedKey = await crypto.updatePassphraseKey(oldPass, newPass, this.encMasterKey)
      await idb.set('__key', encryptedKey, this.store)
      this.encMasterKey = encryptedKey
    } catch (e) {
      throw new Error(e.message)
    }
  }

  async set (key: IDBValidKey, val: string | object) {
    val = await crypto.encrypt(this.key, val)
    return idb.set(key, val, this.store)
  }

  async get (key: IDBValidKey | IDBKeyRange) {
    const val = await idb.get(key, this.store)
    if (!val) {
      // undefined data cant/doesn't need to be decrypted
      return val;
    }
    // decrypt data before returning it
    return await crypto.decrypt(this.key, val)
  }

  del (key: IDBValidKey | IDBKeyRange) {
    return idb.del(key, this.store)
  }

  keys (): Promise<IDBValidKey[]> {
    return idb.keys(this.store)
  }

  clear (): Promise<void> {
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
    const dump: Dump = {}
    const keys = await this.keys()
    if (keys) {
      for (const key of keys) {
        if (typeof key !== 'string' && typeof key !== 'number') {
          continue;
        }
        const data = await idb.get(key, this.store)
        dump[key] = data
      }
    }
    return dump
  }

  async import (data: Dump) {
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

const _idb = idb;

export {
  Dump,
  Store,
  _idb
}
