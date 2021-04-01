var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Forked from https://github.com/jakearchibald/idb-keyval/commit/ea7d507
// Adds a function for closing the database, ala https://github.com/jakearchibald/idb-keyval/pull/65
class Store {
    constructor(dbName = 'keyval-store', storeName = 'keyval') {
        this.storeName = storeName;
        this._dbName = dbName;
        this._storeName = storeName;
        this._init();
    }
    _withIDBStore(type, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this._init();
            let ret;
            yield new Promise((resolve, reject) => {
                const transaction = db.transaction(this.storeName, type);
                transaction.oncomplete = () => resolve();
                transaction.onabort = transaction.onerror = () => reject(transaction.error);
                ret = callback(transaction.objectStore(this.storeName));
            });
            return ret;
        });
    }
    _init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._dbp) {
                return this._dbp;
            }
            this._dbp = yield new Promise((resolve, reject) => {
                const openreq = window.indexedDB.open(this._dbName, 1);
                openreq.onerror = () => reject(openreq.error);
                openreq.onsuccess = () => resolve(openreq.result);
                // First time setup: create an empty object store
                openreq.onupgradeneeded = () => {
                    openreq.result.createObjectStore(this._storeName);
                };
            });
            this._dbp.onclose = () => {
                this._dbp = undefined;
            };
            this._dbp.onversionchange = (e) => {
                var _a;
                if (e.newVersion === null) { // an attempt is made to delete the db
                    console.log('Got delete request for db');
                    (_a = this._dbp) === null || _a === void 0 ? void 0 : _a.close(); // force close our connection to the db
                }
            };
            return this._dbp;
        });
    }
    _close() {
        var _a;
        (_a = this._dbp) === null || _a === void 0 ? void 0 : _a.close();
    }
}
let store;
function getDefaultStore() {
    if (!store) {
        store = new Store();
    }
    return store;
}
function get(key, store = getDefaultStore()) {
    return __awaiter(this, void 0, void 0, function* () {
        const request = yield store._withIDBStore('readonly', store => store.get(key));
        return request.result;
    });
}
function set(key, value, store = getDefaultStore()) {
    return store._withIDBStore('readwrite', store => {
        store.put(value, key);
    });
}
function del(key, store = getDefaultStore()) {
    return store._withIDBStore('readwrite', store => {
        store.delete(key);
    });
}
function clear(store = getDefaultStore()) {
    return store._withIDBStore('readwrite', store => {
        store.clear();
    });
}
function keys(store = getDefaultStore()) {
    return store._withIDBStore('readonly', store => {
        // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
        // And openKeyCursor isn't supported by Safari.
        const keys = [];
        (store.openKeyCursor || store.openCursor).call(store).onsuccess = function () {
            if (!this.result) {
                return;
            }
            keys.push(this.result.key);
            this.result.continue();
        };
        return keys;
    });
}
function close(store = getDefaultStore()) {
    return store._close();
}
export { Store, get, set, del, clear, keys, close };
//# sourceMappingURL=store.js.map