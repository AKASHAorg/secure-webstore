declare class Store {
    storeName: string;
    private _dbName;
    private _storeName;
    private _dbp?;
    constructor(dbName?: string, storeName?: string);
    _withIDBStore<T>(type: IDBTransactionMode, callback: (store: IDBObjectStore) => T): Promise<T>;
    _init(): Promise<IDBDatabase>;
    _close(): void;
}
declare function get(key: IDBValidKey | IDBKeyRange, store?: Store): Promise<any>;
declare function set(key: IDBValidKey, value: any, store?: Store): Promise<void>;
declare function del(key: IDBValidKey | IDBKeyRange, store?: Store): Promise<void>;
declare function clear(store?: Store): Promise<void>;
declare function keys(store?: Store): Promise<IDBValidKey[]>;
declare function close(store?: Store): void;
export { Store, get, set, del, clear, keys, close };
