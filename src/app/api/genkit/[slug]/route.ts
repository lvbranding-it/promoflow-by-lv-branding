
import {runFlow} from "@genkit-ai/flow";
import {NextRequest, NextResponse} from "next/server";
import {birthdayRewardFlow} from "@/ai/flows/birthday-reward-automation";

export async function POST(
  req: NextRequest,
  {params}: { params: { slug:string } }
) {
  const flow = params.slug === "birthdayRewardFlow" ? birthdayRewardFlow : null;
  if (!flow) {
    return new NextResponse(null, {status: 404});
  }

  const {input} = await req.json();
  const output = await runFlow(flow, input);
  return NextResponse.json(output);
}
