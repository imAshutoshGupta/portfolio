import { addToCounter, counterJson, readCounter } from "../_lib/counter";

// Global count of Semi pokes (hero + footer). Storage: ../_lib/counter.ts.
export const dynamic = "force-dynamic";

const KEY = "semi-pokes";
const MAX_PER_REQUEST = 20; // matches footer.pokes.perVisitor in content.ts

export async function GET() {
  return counterJson(await readCounter(KEY));
}

export async function POST(req: Request) {
  let n = 1;
  try {
    const body = (await req.json()) as { n?: unknown };
    n = Math.floor(Number(body.n));
  } catch {
    // no body: count one poke
  }
  if (!Number.isFinite(n) || n < 1) n = 1;
  return addToCounter(req, KEY, Math.min(n, MAX_PER_REQUEST));
}
