import { auth } from "@/auth";

import { MealPartnerBoard } from "@/features/benefits/meal-partner-board";

import { getHrData, getMealPartnerCredits } from "@/lib/data";

import { canWriteHr } from "@/lib/hr-write";



export default async function CreditoAlimentacaoPage() {

  const [data, mealData, session] = await Promise.all([

    getHrData(),

    getMealPartnerCredits(),

    auth(),

  ]);

  const permissions = session?.user.permissions ?? [];



  return (

    <MealPartnerBoard

      credits={mealData.credits}

      daily={mealData.daily}

      employees={data.employees.map((e) => ({ id: e.id, name: e.name }))}

      canWrite={canWriteHr(permissions)}

    />

  );

}


