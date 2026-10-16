import { Flash, btn } from "@/components/ui";
import { refundRedemption, saveGoodie } from "@/lib/actions";
import { listGoodies, listRedemptions } from "@/lib/db";

export const metadata = { title: "Goodies" };

export default async function GoodiesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const flash = await searchParams;
  const goodies = listGoodies(true);
  const redemptions = listRedemptions();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-5xl font-extrabold tracking-tight">Goodies</h1>
      <p className="mt-2 max-w-xl">Sapien Dollars redeem against this list. Stock drops when someone claims one. Refund puts the dollars and the stock back.</p>
      <div className="mt-4">
        <Flash error={flash.error} notice={flash.notice} />
      </div>

      <form action={saveGoodie} className="mt-6 grid gap-2 border-[1.6px] border-ink bg-mintcard p-4 shadow-[4px_4px_0_#0a0a0a] md:grid-cols-2">
        <input name="name" required placeholder="Goodie name" className="field" />
        <input name="description" placeholder="What they get" className="field" />
        <input name="cost" type="number" min={0} required placeholder="Cost in S$" className="field" />
        <input name="stock" type="number" min={0} required placeholder="Stock" className="field" />
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" name="active" defaultChecked />
          On the redeem desk
        </label>
        <button className={btn("ink")} type="submit">Add goodie</button>
      </form>

      <div className="mt-6 grid gap-4">
        {goodies.map((goodie) => (
          <form key={goodie.id} action={saveGoodie} className="grid gap-2 border-[1.6px] border-ink bg-paper p-4 shadow-[4px_4px_0_#0a0a0a] md:grid-cols-2">
            <input type="hidden" name="goodieId" value={goodie.id} />
            <input name="name" defaultValue={goodie.name} className="field font-bold" />
            <input name="description" defaultValue={goodie.description} className="field" />
            <input name="cost" type="number" min={0} defaultValue={goodie.cost} className="field" aria-label="Cost" />
            <input name="stock" type="number" min={0} defaultValue={goodie.stock} className="field" aria-label="Stock" />
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" name="active" defaultChecked={goodie.active === 1} />
              Active
            </label>
            <button className={btn("yellow")} type="submit">Save</button>
          </form>
        ))}
      </div>

      <h2 className="mt-10 font-display text-3xl font-extrabold">Claims</h2>
      <ul className="mt-3 divide-y-[1.6px] divide-ink border-[1.6px] border-ink bg-paper shadow-[4px_4px_0_#0a0a0a]">
        {redemptions.length ? (
          redemptions.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <span>
                <span className="font-bold">{item.user_name}</span> · {item.goodie_name} · S${item.cost}
              </span>
              {item.status === "claimed" ? (
                <form action={refundRedemption}>
                  <input type="hidden" name="redemptionId" value={item.id} />
                  <button className={btn("paper", "px-3 py-1.5")} type="submit">Refund</button>
                </form>
              ) : (
                <span className="font-bold uppercase tracking-[0.12em]">Refunded</span>
              )}
            </li>
          ))
        ) : (
          <li className="px-4 py-3 text-sm">No claims yet.</li>
        )}
      </ul>
    </div>
  );
}
