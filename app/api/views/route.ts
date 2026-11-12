import { addToCounter, counterJson, readCounter } from "../_lib/counter";

// Page views. The footer POSTs once per browser session and GETs otherwise,
// so reloads don't inflate it. Storage: ../_lib/counter.ts.
export const dynamic = "force-dynamic";

const KEY = "page-views";

export async function GET() {
  return counterJson(await readCounter(KEY));
}

export async function POST(req: Request) {
  return addToCounter(req, KEY, 1);
}
