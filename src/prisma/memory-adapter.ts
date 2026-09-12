import * as fs from 'fs';
import * as path from 'path';
import { InMemoryStore, createInitialData } from './memory-store';

function reviveDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
      const d = new Date(obj);
      if (!isNaN(d.getTime())) return d;
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(reviveDates);
  }
  if (typeof obj === 'object') {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      res[key] = reviveDates(obj[key]);
    }
    return res;
  }
  return obj;
}

function matchCondition(itemVal: any, condVal: any): boolean {
  if (condVal === undefined) return true;
  if (condVal === null) return itemVal === null;

  if (typeof condVal === 'object' && !(condVal instanceof Date)) {
    if ('in' in condVal && Array.isArray(condVal.in)) {
      return condVal.in.includes(itemVal);
    }
    if ('notIn' in condVal && Array.isArray(condVal.notIn)) {
      return !condVal.notIn.includes(itemVal);
    }
    if ('gt' in condVal) {
      return Number(itemVal) > Number(condVal.gt);
    }
    if ('gte' in condVal) {
      const itemTime = itemVal instanceof Date ? itemVal.getTime() : itemVal;
      const condTime = condVal.gte instanceof Date ? condVal.gte.getTime() : condVal.gte;
      if (itemTime < condTime) return false;
    }
    if ('lte' in condVal) {
      const itemTime = itemVal instanceof Date ? itemVal.getTime() : itemVal;
      const condTime = condVal.lte instanceof Date ? condVal.lte.getTime() : condVal.lte;
      if (itemTime > condTime) return false;
    }
    return true;
  }

  if (itemVal instanceof Date && condVal instanceof Date) {
    return itemVal.getTime() === condVal.getTime();
  }

  return itemVal === condVal;
}

function filterItems(items: any[], where: any = {}): any[] {
  if (!where || Object.keys(where).length === 0) return [...items];

  return items.filter((item) => {
    for (const key of Object.keys(where)) {
      if (key === 'abonosRegistrados') continue;
      if (!matchCondition(item[key], where[key])) {
        return false;
      }
    }
    return true;
  });
}

function sortItems(items: any[], orderBy: any): any[] {
  if (!orderBy) return items;
  const result = [...items];
  const keys = Object.keys(orderBy);
  if (keys.length === 0) return result;

  const key = keys[0];
  const direction = orderBy[key] === 'desc' ? -1 : 1;

  result.sort((a, b) => {
    const valA = a[key];
    const valB = b[key];
    if (valA instanceof Date && valB instanceof Date) {
      return (valA.getTime() - valB.getTime()) * direction;
    }
    if (valA < valB) return -1 * direction;
    if (valA > valB) return 1 * direction;
    return 0;
  });

  return result;
}

export class MemoryTable<T extends { id: string }> {
  constructor(
    private getTable: () => T[],
    private setTable: (items: T[]) => void,
    private enrichItem?: (item: T, include: any, store: InMemoryStore) => any,
    private getStore?: () => InMemoryStore,
    private onPersist?: () => void,
  ) {}

  async findFirst(args: { where?: any; include?: any; orderBy?: any } = {}): Promise<any | null> {
    const list = await this.findMany(args);
    return list.length > 0 ? list[0] : null;
  }

  async findUnique(args: { where?: any; include?: any } = {}): Promise<any | null> {
    return this.findFirst(args);
  }

  async findMany(args: { where?: any; include?: any; orderBy?: any; take?: number } = {}): Promise<any[]> {
    let list = filterItems(this.getTable(), args.where);
    if (args.orderBy) {
      list = sortItems(list, args.orderBy);
    }
    if (args.take && args.take > 0) {
      list = list.slice(0, args.take);
    }
    if (args.include && this.enrichItem && this.getStore) {
      const store = this.getStore();
      list = list.map((item) => this.enrichItem!(item, args.include, store));
    }
    return list;
  }

  async count(args: { where?: any } = {}): Promise<number> {
    const list = filterItems(this.getTable(), args.where);
    return list.length;
  }

  async create(args: { data: any }): Promise<T> {
    const id = args.data.id || Math.random().toString(36).substring(2, 11) + '-' + Date.now();
    const newItem = {
      activo: true,
      ...args.data,
      id,
      createdAt: args.data.createdAt || new Date(),
    } as T;

    const current = this.getTable();
    this.setTable([...current, newItem]);
    this.onPersist?.();
    return newItem;
  }

  async update(args: { where: { id: string }; data: any }): Promise<T> {
    const current = this.getTable();
    const idx = current.findIndex((item) => item.id === args.where.id);
    if (idx === -1) {
      throw new Error(`Registro con id ${args.where.id} no encontrado para actualización`);
    }

    const updated = {
      ...current[idx],
      ...args.data,
    };

    const next = [...current];
    next[idx] = updated;
    this.setTable(next);
    this.onPersist?.();
    return updated;
  }

  async delete(args: { where: { id: string } }): Promise<T> {
    const current = this.getTable();
    const idx = current.findIndex((item) => item.id === args.where.id);
    if (idx === -1) throw new Error('No encontrado');
    const removed = current[idx];
    this.setTable(current.filter((item) => item.id !== args.where.id));
    this.onPersist?.();
    return removed;
  }
}

export class MemoryPrismaClient {
  public store: InMemoryStore;
  private dataFilePath = path.join(process.cwd(), 'data', 'store.json');
  private persistTimer: any = null;

  public tenant: MemoryTable<any>;
  public usuario: MemoryTable<any>;
  public productoCredito: MemoryTable<any>;
  public cliente: MemoryTable<any>;
  public codeudor: MemoryTable<any>;
  public credito: MemoryTable<any>;
  public abono: MemoryTable<any>;
  public movimientoCaja: MemoryTable<any>;
  public cuadreCaja: MemoryTable<any>;
  public ruta: MemoryTable<any>;

  constructor() {
    this.store = this.loadInitialStore();

    const getStore = () => this.store;
    const notifyPersist = () => this.persist();

    this.tenant = new MemoryTable(() => this.store.tenants, (t) => (this.store.tenants = t), undefined, undefined, notifyPersist);
    this.usuario = new MemoryTable(() => this.store.usuarios, (u) => (this.store.usuarios = u), undefined, undefined, notifyPersist);
    this.productoCredito = new MemoryTable(() => this.store.productosCredito, (p) => (this.store.productosCredito = p), undefined, undefined, notifyPersist);
    this.codeudor = new MemoryTable(() => this.store.codeudores, (c) => (this.store.codeudores = c), undefined, undefined, notifyPersist);
    this.abono = new MemoryTable(() => this.store.abonos, (a) => (this.store.abonos = a), undefined, undefined, notifyPersist);
    this.movimientoCaja = new MemoryTable(() => this.store.movimientosCaja, (m) => (this.store.movimientosCaja = m), undefined, undefined, notifyPersist);
    this.cuadreCaja = new MemoryTable(() => this.store.cuadresCaja, (c) => (this.store.cuadresCaja = c), undefined, undefined, notifyPersist);
    this.ruta = new MemoryTable(() => this.store.rutas, (r) => (this.store.rutas = r), undefined, undefined, notifyPersist);

    this.credito = new MemoryTable(
      () => this.store.creditos,
      (cr) => (this.store.creditos = cr),
      (cred, inc, st) => {
        const enriched: any = { ...cred };
        if (inc?.cliente) {
          enriched.cliente = st.clientes.find((c) => c.id === cred.clienteId) || null;
        }
        if (inc?.abonos) {
          enriched.abonos = st.abonos.filter((a) => a.creditoId === cred.id);
        }
        if (inc?.codeudores) {
          enriched.codeudores = st.codeudores.filter((cd) => cd.creditoId === cred.id);
        }
        return enriched;
      },
      getStore,
      notifyPersist,
    );

    this.cliente = new MemoryTable(
      () => this.store.clientes,
      (cl) => (this.store.clientes = cl),
      (client, inc, st) => {
        const enriched: any = { ...client };
        if (inc?.creditos) {
          let creds = st.creditos.filter((cr) => cr.clienteId === client.id);
          if (inc.creditos.where?.estado?.in) {
            creds = creds.filter((cr) => inc.creditos.where.estado.in.includes(cr.estado));
          }
          if (inc.creditos.where?.saldoActual?.gt !== undefined) {
            creds = creds.filter((cr) => Number(cr.saldoActual) > inc.creditos.where.saldoActual.gt);
          }
          if (inc.creditos.orderBy) {
            creds = sortItems(creds, inc.creditos.orderBy);
          }
          if (inc.creditos.take) {
            creds = creds.slice(0, inc.creditos.take);
          }
          enriched.creditos = creds;
        }
        return enriched;
      },
      getStore,
      notifyPersist,
    );
  }

  public persist() {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      try {
        const dir = path.dirname(this.dataFilePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(this.dataFilePath, JSON.stringify(this.store, null, 2), 'utf-8');
      } catch (err) {
        console.error('Error al persistir store a disco:', err);
      }
    }, 50);
  }

  private loadInitialStore(): InMemoryStore {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return reviveDates(parsed);
      }
    } catch (e) {
      console.warn('No fue posible cargar data/store.json, usando datos semilla:', e);
    }
    const initial = createInitialData();
    try {
      const dir = path.dirname(this.dataFilePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.dataFilePath, JSON.stringify(initial, null, 2), 'utf-8');
    } catch {}
    return initial;
  }

  async $connect() {
    return Promise.resolve();
  }

  async $disconnect() {
    return Promise.resolve();
  }

  async $executeRawUnsafe(_query: string) {
    return Promise.resolve(1);
  }

  async $transaction<T>(cb: (tx: any) => Promise<T>): Promise<T> {
    return cb(this);
  }
}
