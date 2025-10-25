import fs from 'fs';
import path from 'path';

export class Storage {
  private readonly BASE_STORAGE_PATH = path.join(__dirname, 'storage');
  private storagePath: string;
  private storage: Record<string, any> = {};
  private defaults: Record<string, any>;
  
  constructor(name: string, defaults: Record<string, any> = {}) {
    this.storagePath = path.join(this.BASE_STORAGE_PATH, `${name}.b64`);
    this.defaults = defaults;
    this.ensureStorageExists();
    this.load();
    this.updateDefaults(this.defaults);
  }

  private ensureStorageExists() {
    if (!fs.existsSync(this.BASE_STORAGE_PATH)) {
      fs.mkdirSync(this.BASE_STORAGE_PATH, { recursive: true });
    }
    if (!fs.existsSync(this.storagePath)) {
      fs.writeFileSync(this.storagePath, '', 'utf-8');
    }
  }

  private updateDefaults(defaults: Record<string, any>, override: boolean = false): void {
    const storage = this.getAll<Record<string, any>>();

    for (const [key, value] of Object.entries(defaults)) {
      const keys = this.parseKey(key);
      let current = storage;

      for (const k of keys.slice(0, -1)) {
        if (!(k in current)) {
          current[k] = {};
        }
        current = current[k];
      }

      if (!(keys[keys.length - 1] in current) || override) {
        current[keys[keys.length - 1]] = value;
      }
    }

    this.save();
  }

  private encode(contents: string): string {
    return Buffer.from(contents).toString('base64');
  }

  private decode(contents: string): string {
    return Buffer.from(contents, 'base64').toString('utf-8');
  }
  
  private load(): void {
    this.ensureStorageExists();

    const contents = fs.readFileSync(this.storagePath, 'utf-8');
    if (!contents) {
      this.storage = {};
    } else {
      try {
        this.storage = JSON.parse(this.decode(contents));
      } catch {
        this.storage = {};
      }
    }
  }

  private save(): void {
    const contents = this.encode(JSON.stringify(this.storage));
    fs.writeFileSync(this.storagePath, contents, 'utf-8');
  }

  private parseKey(key: string): string[] {
    return key ? key.split('.') : [];
  }

  public contains(key: string): boolean {
    this.ensureStorageExists();
    this.load();
    return this.get(key) !== undefined;
  }

  public getAll<t>(): t {
    this.ensureStorageExists();
    this.load();
    return this.storage as t;
  }

  public get<t>(key: string): t | any {
    if (!key) {
      return null;
    }

    this.ensureStorageExists();
    this.load();
    const keys = this.parseKey(key);
    let current = this.storage;

    for (const k of keys) {
      if (!(k in current)) {
        return undefined;
      }
      current = current[k];
    }

    return current;
  }

  public setAll(data: Record<string, any>): Record<string, any> {
    this.ensureStorageExists();
    this.storage = data;
    this.save();
    return this.storage;
  }

  public set(key: string, value: any): any {
    this.ensureStorageExists();
    this.load();

    const keys = this.parseKey(key);
    let current = this.storage;

    for (const k of keys.slice(0, -1)) {
      current = current[k] ??= {};
    }
    current[keys[keys.length - 1]] = value;
    this.save();
    return this.get(key);
  }

  public delete(key: string): any {
    this.ensureStorageExists();
    this.load();

    const keys = this.parseKey(key);
    let current = this.storage;

    for (const k of keys.slice(0, -1)) {
      if (!(k in current)) {
        return undefined;
      }
      current = current[k];
    }

    if (keys[keys.length - 1] in current) {
      delete current[keys[keys.length - 1]];
    }
    this.save();
    return this.get(key);
  }

  public format(): void {
    this.setAll(this.defaults);
  }
}
