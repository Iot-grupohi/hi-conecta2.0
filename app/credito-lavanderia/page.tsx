import { auth } from "@/auth";

import { LaundryCreditBoard } from "@/features/benefits/laundry-credit-board";

import { getHrData, getLaundryCredits } from "@/lib/data";

import { canWriteHr } from "@/lib/hr-write";



export default async function CreditoLavanderiaPage() {

  const [data, credits, session] = await Promise.all([

    getHrData(),

    getLaundryCredits(),

    auth(),

  ]);

  const permissions = session?.user.permissions ?? [];



  return (

    <LaundryCreditBoard

      credits={credits}

      employees={data.employees.map((e) => ({ id: e.id, name: e.name }))}

      canWrite={canWriteHr(permissions)}

    />

  );

}


