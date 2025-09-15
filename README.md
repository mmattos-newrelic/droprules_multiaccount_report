# droprules_multiaccount_report
Use that script to query all the drop rules from all your subaccounts

This code was built using node.js,

You must execute all the project files in the same directory (you can create it wherever you want),

The 'accounts_keys.csv' file must hosts the account numbers and account API keys of all the accounts that you want to collect data,

What do you need? Access to a New Relic account with the "integration management" permission; node.js v20.9.0 npm (local): ├── csv-parser@3.0.0 ├── crypto@1.0.1 ├── esm@3.2.25 ├── fs@0.0.1-security ├── got@14.0.0 ├── graphql-request@6.1.0 ├── json2csv@6.0.0-alpha.2 └── node-fetch@2.7.0 npm (global): ├── corepack@0.20.0 └── npm@11.6.0

After downloading all the *.js files to your local directory and installing all the npm packages above:

1. Use these commands to encrypt the 'accounts_keys.csv' and generate the new 'accounts_keys.enc' file:
1.1. How to generate RSA Key Pair
Run these commands from your project directory
$ openssl genpkey -algorithm RSA -out private_key.pem
$ openssl rsa -in private_key.pem -pubout -out public_key.pem

1.2. Run the crypto.js script from the project directory
$ node crypto.js

2. Run the 

How do you see your data? Go to your destination New Relic account, go to 'Query Builder,' and run this query > select * from Otel_Ingestion. You'll check whether your data was received. You can use this table to create any dashboards you want.

Note: every time you run this script, the data created in the target account will bring information from the last 1 hour. We recommend building a job to run this integration every hour so you can have consistent information in your New Relic database.
