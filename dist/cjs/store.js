"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.close = exports.keys = exports.clear = exports.del = exports.set = exports.get = exports.Store = void 0;
// Forked from https://github.com/jakearchibald/idb-keyval/commit/ea7d507
// Adds a function for closing the database, ala https://github.com/jakearchibald/idb-keyval/pull/65
var Store = /** @class */ (function () {
    function Store(dbName, storeName) {
        if (dbName === void 0) { dbName = 'keyval-store'; }
        if (storeName === void 0) { storeName = 'keyval'; }
        this.storeName = storeName;
        this._dbName = dbName;
        this._storeName = storeName;
        this._init();
    }
    Store.prototype._withIDBStore = function (type, callback) {
        return __awaiter(this, void 0, void 0, function () {
            var db, ret;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._init()];
                    case 1:
                        db = _a.sent();
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(_this.storeName, type);
                                transaction.oncomplete = function () { return resolve(); };
                                transaction.onabort = transaction.onerror = function () { return reject(transaction.error); };
                                ret = callback(transaction.objectStore(_this.storeName));
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, ret];
                }
            });
        });
    };
    Store.prototype._init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this._dbp) {
                            return [2 /*return*/, this._dbp];
                        }
                        _a = this;
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                var openreq = window.indexedDB.open(_this._dbName, 1);
                                openreq.onerror = function () { return reject(openreq.error); };
                                openreq.onsuccess = function () { return resolve(openreq.result); };
                                // First time setup: create an empty object store
                                openreq.onupgradeneeded = function () {
                                    openreq.result.createObjectStore(_this._storeName);
                                };
                            })];
                    case 1:
                        _a._dbp = _b.sent();
                        this._dbp.onclose = function () {
                            _this._dbp = undefined;
                        };
                        this._dbp.onversionchange = function (e) {
                            var _a;
                            if (e.newVersion === null) { // an attempt is made to delete the db
                                console.log('Got delete request for db');
                                (_a = _this._dbp) === null || _a === void 0 ? void 0 : _a.close(); // force close our connection to the db
                            }
                        };
                        return [2 /*return*/, this._dbp];
                }
            });
        });
    };
    Store.prototype._close = function () {
        var _a;
        (_a = this._dbp) === null || _a === void 0 ? void 0 : _a.close();
    };
    return Store;
}());
exports.Store = Store;
var store;
function getDefaultStore() {
    if (!store) {
        store = new Store();
    }
    return store;
}
function get(key, store) {
    if (store === void 0) { store = getDefaultStore(); }
    return __awaiter(this, void 0, void 0, function () {
        var request;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, store._withIDBStore('readonly', function (store) {
                        return store.get(key);
                    })];
                case 1:
                    request = _a.sent();
                    return [2 /*return*/, request.result];
            }
        });
    });
}
exports.get = get;
function set(key, value, store) {
    if (store === void 0) { store = getDefaultStore(); }
    return store._withIDBStore('readwrite', function (store) {
        store.put(value, key);
    });
}
exports.set = set;
function del(key, store) {
    if (store === void 0) { store = getDefaultStore(); }
    return store._withIDBStore('readwrite', function (store) {
        store.delete(key);
    });
}
exports.del = del;
function clear(store) {
    if (store === void 0) { store = getDefaultStore(); }
    return store._withIDBStore('readwrite', function (store) {
        store.clear();
    });
}
exports.clear = clear;
function keys(store) {
    if (store === void 0) { store = getDefaultStore(); }
    return store._withIDBStore('readonly', function (store) {
        // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
        // And openKeyCursor isn't supported by Safari.
        var keys = [];
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
exports.keys = keys;
function close(store) {
    if (store === void 0) { store = getDefaultStore(); }
    return store._close();
}
exports.close = close;
//# sourceMappingURL=store.js.map