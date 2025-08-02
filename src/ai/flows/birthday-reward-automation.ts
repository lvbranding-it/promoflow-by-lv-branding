
import {defineFlow} from "@genkit-ai/flow";
import {prompt} from "genkit";
import {z} from "zod";
import {generate} from "@genkit-ai/ai";

const BirthdayRewardAutomationInputSchema = z.object({
  customerId: z.string().describe("The unique identifier for the customer."),
  customerData: z.object({
    name: z.string().describe("The name of the customer."),
    birthdate: z.string().describe("The birthdate of the customer (YYYY-MM-DD)."),
    preferences: z.string().describe("Customer preferences (e.g., product categories, past purchases)."),
  }).describe("Customer data including name, birthdate, and preferences."),
  availableRewards: z.array(z.object({
    rewardId: z.string().describe("The unique identifier for the reward."),
    rewardDescription: z.string().describe("A description of the reward."),
    quantityAvailable: z.number().int().describe("The quantity of the reward currently available in inventory."),
  })).describe("A list of available rewards with their descriptions and quantities."),
  campaignHistory: z.string().optional().describe("A summary of previous campaigns and their results."),
});
export type BirthdayRewardAutomationInput = z.infer<typeof BirthdayRewardAutomationInputSchema>;

const BirthdayRewardAutomationOutputSchema = z.object({
  rewardId: z.string().describe("The ID of the reward selected for the customer."),
  rewardDescription: z.string().describe("A description of the selected reward."),
  reasoning: z.string().describe("The LLM reason for choosing the selected reward."),
});
export type BirthdayRewardAutomationOutput = z.infer<typeof BirthdayRewardAutomationOutputSchema>;


const birthdayRewardAutomationPrompt = (input: BirthdayRewardAutomationInput) => prompt`You are an expert marketing assistant specializing in creating personalized birthday rewards for customers. 
  
  Your task is to select the single best reward to offer a customer on their birthday. 
  
  Analyze the following information:
  1.  **Customer Preferences**: ${input.customerData.preferences}
  2.  **Available Rewards & Inventory**: ${JSON.stringify(input.availableRewards)}
  3.  **Past Campaign Performance**: ${input.campaignHistory}
  
  Based on all of this data, choose the one reward that is most likely to delight the customer and be effective for the business. Consider their past purchases and stated interests. Pay attention to inventory levels; do not select a reward with zero quantity unless it is the only option. Also, consider the campaign history to avoid repeating less successful strategies.
  
  Provide your response in the requested JSON format, including the chosen reward's ID, its description, and a brief, compelling reason for your choice.`;

export const birthdayRewardFlow = defineFlow(
  {
    name: "birthdayRewardFlow",
    inputSchema: BirthdayRewardAutomationInputSchema,
    outputSchema: BirthdayRewardAutomationOutputSchema,
  },
  async (input: any) => {
    const llmResponse = await generate({
      prompt: birthdayRewardAutomationPrompt(input),
      model: "googleai/gemini-1.5-flash",
      output: {
        schema: BirthdayRewardAutomationOutputSchema,
      },
    });

    const output = llmResponse.output();
    if (!output) {
      throw new Error("The AI model did not return a valid reward selection.");
    }
    return output;
  }
);
