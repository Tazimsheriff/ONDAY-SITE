import { redirect } from "next/navigation";
import { Card, Flash, btn } from "@/components/ui";
import { redeem } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { isSnackPass, listGoodies, listRedemptions } from "@/lib/db";
import { requestOrigin } from "@/lib/origin";
import { qrDataUrl } from "@/lib/qr";

export const metadata = { title: "Dollars" };

export default async function RedeemPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const user = await requireUser();
  if (user.role !== "user") redirect("/admin");
  const flash = await searchParams;
  const goodies = listGoodies();
  const mine = listRedemptions(user.id).filter((item) => item.status === "claimed" || item.status === "collected");
  const origin = await requestOrigin();
  const snackPasses = await Promise.all(
    mine
      .filter((item) => isSnackPass(item.goodie_name))
      .map(async (item) => ({
        ...item,
        qr: await qrDataUrl(`${origin}/pass/${item.id}`),
      })),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs font-bold uppercase tracking-[0.18em]">Sapien Dollars</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl">Spend them before they&apos;re gone.</h1>
        <p className="border-[1.6px] border-ink bg-sky px-4 py-3 font-display text-4xl font-extrabold shadow-[4px_4px_0_#0a0a0a]">
          S${user.dollars}
        </p>
      </div>
      <div className="mt-4 max-w-xl">
        <Flash error={flash.error} notice={flash.notice} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {goodies.map((goodie) => {
          const free = goodie.cost === 0;
          const passes = snackPasses.filter((item) => item.goodie_id === goodie.id);
          const claimed = free && passes.some((item) => item.status === "claimed" || item.status === "collected");
          const affordable = user.dollars >= goodie.cost;
          const available = goodie.stock > 0 && !claimed;
          return (
            <Card key={goodie.id} color={available ? "#fefcf5" : "#ffc0b6"} className="flex flex-col">
              <p className="text-xs font-bold uppercase tracking-[0.16em]">
                {claimed ? "Already claimed" : available ? `${goodie.stock} left` : "Gone"}
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold leading-none">{goodie.name}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed">{goodie.description}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="font-display text-3xl font-extrabold">{free ? "Free" : `S$${goodie.cost}`}</span>
                {claimed ? (
                  <span className="text-sm font-bold">One per person</span>
                ) : available ? (
                  <form action={redeem} className="flex items-center gap-2">
                    <input type="hidden" name="goodieId" value={goodie.id} />
                    {free ? (
                      <input type="hidden" name="quantity" value="1" />
                    ) : (
                      <input
                        name="quantity"
                        type="number"
                        min={1}
                        max={Math.min(100, goodie.stock)}
                        defaultValue={1}
                        aria-label={`How many ${goodie.name}`}
                        className="field w-16"
                      />
                    )}
                    <button className={btn(affordable ? "ink" : "paper")} type="submit">
                      {affordable ? "Redeem" : "Too pricey"}
                    </button>
                  </form>
                ) : (
                  <span className="text-sm font-bold">Out of stock</span>
                )}
              </div>
              {passes.length ? (
                <div className="mt-4 grid gap-3">
                  {passes.map((pass) => (
                    <div key={pass.id} className="border-[1.6px] border-ink bg-paper p-3 text-center">
                      <img src={pass.qr} alt={`QR for ${user.name}'s ${pass.goodie_name}`} className="mx-auto w-full max-w-[220px]" />
                      <p className="mt-2 text-sm font-bold">
                        {pass.status === "collected" ? "Already bought" : "Show this QR at the snack counter"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      <section className="mt-10">
        <h2 className="font-display text-3xl font-extrabold">Your claims</h2>
        {mine.length ? (
          <ul className="mt-4 divide-y-[1.6px] divide-ink border-[1.6px] border-ink bg-paper shadow-[4px_4px_0_#0a0a0a]">
            {mine.map((item) => {
              const pass = snackPasses.find((entry) => entry.id === item.id);
              return (
                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="font-bold">
                    {item.quantity > 1 ? `${item.quantity}× ${item.goodie_name}` : item.goodie_name}
                    {item.status === "collected" ? " · bought" : ""}
                  </span>
                  {pass ? (
                    <img src={pass.qr} alt="" className="h-16 w-16 border-[1.6px] border-ink" />
                  ) : (
                    <span className="text-sm">S${item.cost * (item.quantity || 1)}</span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm">Nothing redeemed yet.</p>
        )}
      </section>
    </div>
  );
}
