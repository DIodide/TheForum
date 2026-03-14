/**
 * Google Apps Script — Listserv Email Forwarder for The Forum
 *
 * Setup:
 * 1. Go to https://script.google.com and create a new project
 * 2. Paste this file as Code.gs
 * 3. Set Script Properties (Project Settings > Script Properties):
 *    - PIPELINE_URL: Your FastAPI server URL (e.g. https://your-server.com/pipeline/ingest)
 *    - ADMIN_API_KEY: The same ADMIN_API_KEY from your FastAPI .env
 *    - GMAIL_LABEL: Gmail label to search (e.g. "listserv" or "WHITMANWIRE")
 *                   Or leave empty to use the SEARCH_QUERY property instead
 *    - SEARCH_QUERY: (optional) Custom Gmail search query, e.g. "to:WHITMANWIRE@Princeton.EDU"
 * 4. Run `setup()` once to create the 15-minute trigger
 * 5. Authorize when prompted
 */

const PROPS = PropertiesService.getScriptProperties();

function getConfig() {
  return {
    pipelineUrl: PROPS.getProperty("PIPELINE_URL"),
    apiKey: PROPS.getProperty("ADMIN_API_KEY"),
    gmailLabel: PROPS.getProperty("GMAIL_LABEL") || "",
    searchQuery: PROPS.getProperty("SEARCH_QUERY") || "",
  };
}

/**
 * Main function — called by the time-based trigger every 15 minutes.
 * Finds unread listserv emails, sends them to the pipeline, marks as read.
 */
function pollAndForward() {
  const config = getConfig();
  if (!config.pipelineUrl || !config.apiKey) {
    console.error("PIPELINE_URL and ADMIN_API_KEY must be set in Script Properties");
    return;
  }

  // Build search query
  let query = "is:unread ";
  if (config.gmailLabel) {
    query += "label:" + config.gmailLabel;
  } else if (config.searchQuery) {
    query += config.searchQuery;
  } else {
    console.error("Set either GMAIL_LABEL or SEARCH_QUERY in Script Properties");
    return;
  }

  const threads = GmailApp.search(query, 0, 50);
  if (threads.length === 0) {
    console.log("No unread emails found.");
    return;
  }

  const emails = [];

  for (const thread of threads) {
    const messages = thread.getMessages();
    for (const msg of messages) {
      if (!msg.isUnread()) continue;

      emails.push({
        message_id: msg.getId(),
        subject: msg.getSubject(),
        sender: msg.getFrom(),
        to: msg.getTo(),
        date: msg.getDate().toISOString(),
        body_html: msg.getBody(),
        body_text: msg.getPlainBody(),
      });

      msg.markRead();
    }
  }

  if (emails.length === 0) {
    console.log("No unread messages in matched threads.");
    return;
  }

  console.log("Forwarding " + emails.length + " emails to pipeline...");

  // Send to FastAPI /pipeline/ingest
  const response = UrlFetchApp.fetch(config.pipelineUrl, {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + config.apiKey,
    },
    payload: JSON.stringify({ emails: emails }),
    muteHttpExceptions: true,
  });

  const code = response.getResponseCode();
  const body = response.getContentText();
  console.log("Response " + code + ": " + body);

  if (code !== 200) {
    console.error("Pipeline ingest failed with status " + code);
  }
}

/**
 * Run once to create the time-based trigger (every 15 minutes).
 */
function setup() {
  // Remove existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === "pollAndForward") {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  // Create new trigger
  ScriptApp.newTrigger("pollAndForward")
    .timeBased()
    .everyMinutes(15)
    .create();

  console.log("Trigger created — pollAndForward will run every 15 minutes.");
}

/**
 * Run once to remove all triggers.
 */
function teardown() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    ScriptApp.deleteTrigger(trigger);
  }
  console.log("All triggers removed.");
}
