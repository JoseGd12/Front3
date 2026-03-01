const API_ORIGIN = process.env.API_ORIGIN || 'http://edwisbarbers.somee.com';
const API_BASE = `${API_ORIGIN.replace(/\/$/, '')}/api`;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const ONLY_ZERO = args.has('--only-zero');

const asNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fetchJson = async (url, init) => {
  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
};

const main = async () => {
  const productos = await fetchJson(`${API_BASE}/Productos`, { method: 'GET' });
  if (!Array.isArray(productos)) {
    throw new Error('Respuesta inesperada: /Productos no devolvió un arreglo');
  }

  let checked = 0;
  let updated = 0;
  let skipped = 0;

  for (const p of productos) {
    checked += 1;

    const id = p?.id;
    const stockVentas = asNumber(p?.stockVentas);
    const stockInsumos = asNumber(p?.stockInsumos);
    const actual = asNumber(p?.stockTotal);
    const expected = stockVentas + stockInsumos;

    const shouldUpdate = ONLY_ZERO ? actual === 0 && expected !== 0 : actual !== expected;
    if (!shouldUpdate) {
      skipped += 1;
      continue;
    }

    const body = {
      id,
      nombre: p?.nombre ?? '',
      descripcion: p?.descripcion ?? '',
      precioVenta: asNumber(p?.precioVenta),
      precioCompra: asNumber(p?.precioCompra),
      stockVentas,
      stockInsumos,
      stockTotal: expected,
      categoriaId: p?.categoriaId ?? null,
      estado: p?.estado ?? true,
      imagenProduc: p?.imagenProduc ?? '',
    };

    if (!id || !body.nombre || body.precioVenta < 0) {
      skipped += 1;
      continue;
    }

    if (DRY_RUN) {
      updated += 1;
      continue;
    }

    await fetchJson(`${API_BASE}/Productos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    updated += 1;
  }

  const labelMode = DRY_RUN ? 'DRY_RUN' : 'APPLY';
  const labelOnly = ONLY_ZERO ? 'ONLY_ZERO' : 'MISMATCH';
  process.stdout.write(
    JSON.stringify({ mode: labelMode, rule: labelOnly, checked, updated, skipped }, null, 2) + '\n'
  );
};

main().catch((e) => {
  process.stderr.write(String(e?.stack || e?.message || e) + '\n');
  process.exitCode = 1;
});
