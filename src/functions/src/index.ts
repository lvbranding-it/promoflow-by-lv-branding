
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as sgMail from "@sendgrid/mail";
import {defineString} from "firebase-functions/params";
import express, {Request, Response} from "express";
import {onRequest} from "firebase-functions/v2/https";

const app = express();

// Health check endpoint for Cloud Run.
// Firebase App Hosting will call this endpoint to ensure the container is healthy.
app.get("/healthz", (_req: Request, res: Response) => {
  res.status(200).send("ok");
});

// Start the server only if not in the Firebase emulator environment.
// The deployed App Hosting environment will need this to listen on the provided port.
if (!process.env.FUNCTIONS_EMULATOR) {
  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`Health check server listening on port ${port}`);
  });
}


// Expose the express app as a Cloud Function for the emulator and deployment.
export const web = onRequest(app);


// Initialize the Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Define the SendGrid API key parameter
const sendgridApiKey = defineString("SENDGRID_API_KEY");

// Define the Cloud Function to send an email upon reward redemption
export const sendRedemptionEmail = onDocumentCreated(
  "customers/{customerId}/redemptions/{redemptionId}",
  async (event) => {
    // Set the SendGrid API key at runtime
    sgMail.setApiKey(sendgridApiKey.value());

    const snap = event.data;
    const customerId = event.params.customerId;

    if (!snap) {
      console.log("No data associated with the event");
      return;
    }

    const redemptionData = snap.data();

    try {
      // 1. Get the customer's details (like their email)
      const customerRef = db.collection("customers").doc(customerId);
      const customerSnap = await customerRef.get();
      const customerData = customerSnap.data();

      if (!customerData || !customerData.email) {
        console.log(`Customer ${customerId} not found or has no email.`);
        return;
      }

      // 2. Prepare the email
      const msg = {
        to: customerData.email,
        from: "orbig.mk@gmail.com", // This must be a verified sender in your SendGrid account
        subject: "Your Reward Has Been Redeemed!",
        html: `
          <p>Hello ${customerData.name || "Customer"},</p>
          <p>Your reward has been successfully redeemed!</p>
          <p>Details:</p>
          <ul>
            <li>Reward: ${redemptionData.campaignName}</li>
            <li>Offer: ${redemptionData.rewardValue}</li>
          </ul>
          <p>Thank you!</p>
        `,
      };

      // 3. Send the email
      await sgMail.send(msg);
      console.log("Redemption email sent successfully.");
    } catch (error) {
      console.error("Error sending redemption email:", error);
    }
  });
