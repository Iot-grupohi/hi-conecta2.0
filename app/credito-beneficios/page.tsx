import { auth } from "@/auth";

import { BenefitCreditBoard } from "@/features/benefits/benefit-credit-board";

import { getBenefitCredits, getHrData } from "@/lib/data";

import { canWriteHr } from "@/lib/hr-write";



export default async function CreditoBeneficiosPage() {

  const [data, credits, session] = await Promise.all([

    getHrData(),

    getBenefitCredits(),

    auth(),

  ]);

  const permissions = session?.user.permissions ?? [];



  return (

    <BenefitCreditBoard

      credits={credits}

      employees={data.employees.map((e) => ({ id: e.id, name: e.name }))}

      canWrite={canWriteHr(permissions)}

    />

  );

}


