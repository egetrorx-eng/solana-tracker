
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: any = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) env[key.trim()] = value.join('=').trim().replace(/^['"]|['"]$/g, '');
});

const key = 'LMKwN29RPgiy5oBJVDqaC9OXeJjBdNgd';
const endpoints = [
    'https://api.nansen.ai/api/v1/queries/result/LMKwN29RPgiy5oBJVDqaC9OXeJjBdNgd'
];
const testTokenAddress = 'MEW1o8sKSrkU94uY4mG2ihVfVT1D5KXMPYb4GWFzVT1D' // Found in previous success response

async function test() {
    for (const url of endpoints) {
        console.log(`Testing: ${url}`);
        const headerOptions = [
            { 'NANSEN-API-KEY': key },
            { 'apiKey': key },
            { 'x-api-key': key },
            { 'Authorization': `Bearer ${key}` }
        ];
        for (const headers of headerOptions) {
            const headerName = Object.keys(headers)[0];
            // Test POST based on docs
            try {
                const res = await fetch(url, {
                    method: 'GET',
                    headers: { ...headers } as any
                });
                console.log(`[POST][${headerName}] Result for ${url}: ${res.status} ${res.statusText}`);
                if (res.ok) {
                    const data = await res.json();
                    console.log(`SUCCESS! Full Response for ${headerName}:`, JSON.stringify(data, null, 2));
                    break;
                } else {
                    const error = await res.text();
                    console.log(`[POST][${headerName}] Error body: ${error}`);
                }
            } catch (e: any) {
                console.log(`[POST] Error: ${e.message}`);
            }
        }
    }
}

test();
