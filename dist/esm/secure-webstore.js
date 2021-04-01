var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as idb from './store';
import * as crypto from 'easy-web-crypto';
const encryptedKeyKey = '__key';
class Store {
    /**
      * Class constructor
      *
      * @param {string} user - The current user
      * @param {string} passphrase - Passphrase from which we derive the key
      */
    constructor(storeName, passphrase) {
        this.storeName = storeName;
        this.passphrase = passphrase;
        if (!storeName || !passphrase) {
            throw new Error('Store name and passphrase required');
        }
        // init store
        this.store = new idb.Store(storeName, storeName);
    }
    get key() {
        if (!this._key) {
            throw new Error('Master key not initialized');
        }
        return this._key;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let encryptedKey = yield idb.get(encryptedKeyKey, this.store);
                // generate a new key for the user if no key exists (empty store)
                if (!encryptedKey) {
                    encryptedKey = yield crypto.genEncryptedMasterKey(this.passphrase);
                    // store the new key since it's the first time
                    yield idb.set(encryptedKeyKey, encryptedKey, this.store);
                }
                // decrypt key so we can use it during this session
                this.encMasterKey = encryptedKey;
                this._key = yield crypto.decryptMasterKey(this.passphrase, this.encMasterKey);
                // close DB connection if the window enters freeze state
                window.addEventListener('freeze', () => {
                    this.close();
                });
            }
            catch (e) {
                throw new Error(e.message);
            }
        });
    }
    updatePassphrase(oldPass, newPass) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.encMasterKey) {
                    throw new Error('No password to update set');
                }
                const encryptedKey = yield crypto.updatePassphraseKey(oldPass, newPass, this.encMasterKey);
                yield idb.set(encryptedKeyKey, encryptedKey, this.store);
                this.encMasterKey = encryptedKey;
            }
            catch (e) {
                throw new Error(e.message);
            }
        });
    }
    set(key, val) {
        return __awaiter(this, void 0, void 0, function* () {
            val = yield crypto.encrypt(this.key, val);
            return idb.set(key, val, this.store);
        });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const val = yield idb.get(key, this.store);
            if (!val) {
                // undefined data cant/doesn't need to be decrypted
                return val;
            }
            // decrypt data before returning it
            return yield crypto.decrypt(this.key, val);
        });
    }
    del(key) {
        return idb.del(key, this.store);
    }
    keys() {
        return __awaiter(this, void 0, void 0, function* () {
            const keys = yield idb.keys(this.store);
            // Users of secure-webstore should not have to be aware of existence of __key.
            return keys.filter(key => key !== encryptedKeyKey);
        });
    }
    clear() {
        return idb.clear(this.store);
    }
    close() {
        return idb.close(this.store);
    }
    destroy() {
        return new Promise((resolve, reject) => {
            this.close();
            const req = window.indexedDB.deleteDatabase(this.storeName);
            req.onsuccess = (e) => {
                resolve(e);
            };
            req.onerror = (e) => {
                reject(e);
            };
        });
    }
    export() {
        return __awaiter(this, void 0, void 0, function* () {
            const dump = {};
            const keys = yield this.keys();
            if (keys) {
                for (const key of keys) {
                    if (typeof key !== 'string' && typeof key !== 'number') {
                        continue;
                    }
                    const data = yield idb.get(key, this.store);
                    dump[key] = data;
                }
            }
            return dump;
        });
    }
    import(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!data || Object.keys(data).length === 0) {
                throw new Error('No data provided');
            }
            if (Object.prototype.toString.call(data) !== '[object Object]') {
                throw new Error('Data must be a valid JSON object');
            }
            for (const key of Object.keys(data)) {
                yield idb.set(key, data[key], this.store);
            }
        });
    }
}
const _idb = idb;
export { Store, _idb };
//# sourceMappingURL=secure-webstore.js.map