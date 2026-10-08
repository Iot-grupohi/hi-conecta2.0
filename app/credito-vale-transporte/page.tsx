import { auth } from "@/auth";

import { TransportCreditBoard } from "@/features/benefits/transport-credit-board";

import { getHrData, getTransportCredits } from "@/lib/data";

import { canWriteHr } from "@/lib/hr-write";



export default async function CreditoValeTransportePage() {

  const [data, credits, session] = await Promise.all([

    getHrData(),

    getTransportCredits(),

    auth(),

  ]);

  const permissions = session?.user.permissions ?? [];



  return (

    <TransportCreditBoard

      credits={credits}

      employees={data.employees.map((e) => ({ id: e.id, name: e.name }))}

      canWrite={canWriteHr(permissions)}

    />

  );

}


