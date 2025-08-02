const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

// The Next.js standalone server.js will be located directly at the root
// of the deployed Cloud Function bundle. We need to point to it correctly.
const nextJsApp = require("../.next/standalone/server"); // Note: no .js extension needed here

const handleRequest = nextJsApp.default || nextJsApp;

exports.nextServer = onRequest({ maxInstances: 10 }, (req, res) => {
  handleRequest(req, res);
});
