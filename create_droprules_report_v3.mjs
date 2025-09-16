import fs from "fs";
import crypto from "crypto";
import fetch from "node-fetch";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

// ----------------------
// Helper: Decrypt the enc file
// ----------------------
function decryptAccountsKeys(encFile, privateKeyFile) {
  const encryptedBase64 = fs.readFileSync(encFile, "utf8");
  const encryptedBuffer = Buffer.from(encryptedBase64, "base64");
  const privateKey = fs.readFileSync(privateKeyFile, "utf8");

  try {
    const decryptedBuffer = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      encryptedBuffer
    );

    return decryptedBuffer.toString("utf8");
  } catch (err) {
    throw new Error(
      `❌ Decryption failed. Ensure accounts_keys.enc was encrypted with your public_key.pem.\n${err.message}`
    );
  }
}

// ----------------------
// Helper: Run GraphQL query
// ----------------------
async function runGraphQL(apiKey, accountId) {
  const query = `
    {
      actor {
        account(id: ${accountId}) {
          nrqlDropRules {
            list {
              rules {
                account { id name }
                action
                createdAt
                description
                id
                name
                nrql
                source
                createdBy
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch("https://api.newrelic.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "API-Key": apiKey,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// ----------------------
// Main logic
// ----------------------
async function main() {
  console.log("🔑 Decrypting accounts_keys.enc...");
  const csvData = decryptAccountsKeys("accounts_keys.enc", "private_key.pem");

  console.log("📖 Parsing decrypted CSV...");
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
  });

  const allRows = [];
  const totalAccounts = records.length;
  let processedAccounts = 0;

  for (const row of records) {
    processedAccounts++;
    const accountId = row.accountNumber || row.AccountID || row.accountId || row.account_id;
    const apiKey = row.apiKey || row.ApiKey || row.APIKey || row.api_key;

    if (!accountId || !apiKey) {
      console.warn("⚠️ Skipping row with missing AccountID or ApiKey.");
      continue;
    }

    console.log(`🚀 Fetching drop rules for account ${processedAccounts} of ${totalAccounts}...`);

    try {
      const data = await runGraphQL(apiKey, accountId);

      const rules = data?.data?.actor?.account?.nrqlDropRules?.list?.rules || [];

      for (const rule of rules) {
        allRows.push({
          account_id: rule.account?.id || "",
          account_name: rule.account?.name || "",
          action: rule.action || "",
          createdAt: rule.createdAt || "",
          description: rule.description || "",
          id: rule.id || "",
          name: rule.name || "",
          nrql: rule.nrql || "",
          source: rule.source || "",
          createdBy: rule.createdBy || "",
        });
      }
    } catch (err) {
      console.error(`❌ Failed to fetch drop rules for account ${processedAccounts}.`);
    }
  }

  if (allRows.length === 0) {
    console.warn("⚠️ No drop rules found for any account.");
  }

  console.log("📝 Writing droprules_report.csv...");
  const csvOutput = stringify(allRows, {
    header: true,
    columns: [
      "account_id",
      "account_name",
      "action",
      "createdAt",
      "description",
      "id",
      "name",
      "nrql",
      "source",
      "createdBy",
    ],
  });

  fs.writeFileSync("droprules_report.csv", csvOutput);
  console.log("✅ Report generated: droprules_report.csv");
}

// ----------------------
// Run script
// ----------------------
main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
