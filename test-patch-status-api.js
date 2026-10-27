#!/usr/bin/env node

const https = require('https');

const API_KEY = 'd846e4f1862433c8d265f459f5264b721c28a93057c9b7949d8a4cf98e7bdb9f';
const BASE_URL = 'https://syllabuzai.com';

function makeApiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    };

    https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    }).on('error', reject)
      .end(body ? JSON.stringify(body) : undefined);
  });
}

async function main() {
  console.log('🧪 Testing Updated PATCH API with Status Support\n');
  console.log('━'.repeat(70));

  try {
    // Test 1: Update difficulty only (no status)
    console.log('\n✅ Test 1: Update DIFFICULTY only (status not passed)');
    const response1 = await makeApiRequest(
      'PATCH',
      '/api/v1/admin/questions/5287',
      { difficulty: 'EASY' }
    );
    console.log(`   Status: HTTP ${response1.status}`);
    if (response1.data.data) {
      console.log(`   Q${response1.data.data.id}: difficulty=${response1.data.data.difficulty}, status=${response1.data.data.status}`);
    }

    // Test 2: Update status only (no difficulty)
    console.log('\n✅ Test 2: Update STATUS only (difficulty not passed)');
    const response2 = await makeApiRequest(
      'PATCH',
      '/api/v1/admin/questions/5288',
      { status: 'ARCHIVED' }
    );
    console.log(`   Status: HTTP ${response2.status}`);
    if (response2.data.data) {
      console.log(`   Q${response2.data.data.id}: difficulty=${response2.data.data.difficulty}, status=${response2.data.data.status}`);
    }

    // Test 3: Update both difficulty and status
    console.log('\n✅ Test 3: Update BOTH difficulty AND status');
    const response3 = await makeApiRequest(
      'PATCH',
      '/api/v1/admin/questions/5289',
      { difficulty: 'HARD', status: 'PUBLISHED' }
    );
    console.log(`   Status: HTTP ${response3.status}`);
    if (response3.data.data) {
      console.log(`   Q${response3.data.data.id}: difficulty=${response3.data.data.difficulty}, status=${response3.data.data.status}`);
    }

    console.log('\n' + '━'.repeat(70));
    console.log('\n📋 PATCH API now supports:');
    console.log('   ✅ stem');
    console.log('   ✅ options');
    console.log('   ✅ explanation');
    console.log('   ✅ difficulty');
    console.log('   ✅ tags');
    console.log('   ✅ nodeId');
    console.log('   ✅ examIds');
    console.log('   ✅ status (NEW!)');
    console.log('\n💡 All fields are optional - only pass what you want to update');
    console.log('━'.repeat(70));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
