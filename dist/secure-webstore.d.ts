import * as idb from './store';
declare type Dump = Record<string | number, any>;
declare class Store {
    storeName: string;
    private passphrase;
    private store;
    private encMasterKey?;
    private _key?;
    private get key();
    /**
      * Class constructor
      *
      * @param {string} user - The current user
      * @param {string} passphrase - Passphrase from which we derive the key
      */
    constructor(storeName: string, passphrase: string);
    init(): Promise<void>;
    updatePassphrase(oldPass: string, newPass: string): Promise<void>;
    set(key: IDBValidKey, val: string | object): Promise<void>;
    get(key: IDBValidKey | IDBKeyRange): Promise<any>;
    del(key: IDBValidKey | IDBKeyRange): Promise<void>;
    keys(): Promise<IDBValidKey[]>;
    clear(): Promise<void>;
    close(): void;
    destroy(): Promise<unknown>;
    export(): Promise<Record<string | number, any>>;
    import(data: Dump): Promise<void>;
}
declare const _idb: typeof idb;
export { Dump, Store, _idb };
