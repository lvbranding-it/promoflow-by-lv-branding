
"use server";

import {defineFlow} from "@genkit-ai/flow";
import {generate} from "@genkit-ai/ai";
import {z} from "zod";
import * as admin from "firebase-admin";

const SocialMediaRewardInputSchema = z.object({
  customerId: z.string(),
  platform: z.string(),
});

const SocialMediaRewardOutputSchema = z.object({
  reward: z.string(),
  reasoning: z.string(),
});

export const socialMediaRewardFlow = defineFlow(
  {
    name: "socialMediaRewardFlow",
    inputSchema: SocialMediaRewardInputSchema,
    outputSchema: SocialMediaRewardOutputSchema,
  },
  async ({customerId, platform}: any) => {
    const db = admin.firestore();

    const customerSnap = await db.collection("customers").doc(customerId).get();
    if (!customerSnap.exists) {
      throw new Error("Customer not found");
    }
    const customer = customerSnap.data();

    const campaignsSnap = await db
      .collection("campaigns")
      .where("active", "==", true)
      .get();
    const campaigns = campaignsSnap.docs.map((doc) => doc.data());

    const prompt = `
      Generate a personalized reward for a customer who shared a campaign on social media.

      INPUT:
      - customerId: ${customerId}
      - platform: ${platform}
    
      CONTEXT:
      - Customer data: ${JSON.stringify(customer)}
      - Active campaigns: ${JSON.stringify(campaigns)}
    
      RULES:
      - Base reward is a 10% discount.
      - If the customer has a total spend over $500, upgrade the reward to 15%.
      - If the customer is sharing on 'twitter' or 'instagram', give an additional $5 voucher.
      - Provide a brief, friendly reasoning for the final reward, mentioning the customer by name.
    
      OUTPUT in JSON format:
      {
        "reward": "The final reward string (e.g., '15% discount + $5 voucher').",
        "reasoning": "Your friendly, personalized reasoning."
      }
    `;

    const llmResponse = await generate({
      prompt: prompt,
      model: "googleai/gemini-1.5-flash-latest",
      output: {
        format: "json",
        schema: SocialMediaRewardOutputSchema,
      },
    });

    const output = llmResponse.output();
    if (!output) {
      throw new Error("The AI model did not return a valid reward selection.");
    }
    return output;
  }
);
