import { NextResponse } from "next/server";

import { createRevenueAction } from "@/lib/actions/revenues";

export async function POST(request: Request) {
  const formData = await request.formData();
  const result = await createRevenueAction(formData);

  if (!result.success) {
    return NextResponse.json(result, { status: 422 });
  }

  return NextResponse.json(result);
}
