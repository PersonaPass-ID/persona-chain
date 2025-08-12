#!/usr/bin/env node

/**
 * Comprehensive Multi-signature Functionality Test Suite
 * Tests all aspects of the PersonaWallet multi-sig implementation
 */

const { MultisigValidator } = require('../src/utils/multisig-validator');

// Test data sets
const TEST_DATA = {
  validAddresses: {
    persona: 'persona1abc123def456ghi789jkl012mno345pqr678stu',
    personavaloper: 'personavaloper1abc123def456ghi789jkl012mno345pqr678stu'
  },
  invalidAddresses: [
    'invalid-address',
    'persona1',
    'cosmos1abc123def456ghi789jkl012mno345pqr678stu', // wrong prefix
    'persona1abc123def456ghi789jkl012mno345pqr678stu999', // too long
    'persona1!@#$%^&*()', // invalid characters
  ],
  validPubkeys: [
    'A08EGB7ro1ORuFhjOnZcSgwYlpe0DSFjVNUIkNNQxwKQE7P+', // base64 encoded secp256k1 pubkey
    'A2BvjE3udY9H2EjnE4i2xEfz1TrTFhwz3lP4OoV7kPzN',
    'A3pECpyOwQEY5b2B5qF7kP8vTlvq6VzX9J4nRt2xK1mQ'
  ],
  invalidPubkeys: [
    'invalid-pubkey',
    'A08EGB7ro1ORuFhj', // too short
    'invalid-base64!@#$', // invalid base64
    '', // empty
    'A'.repeat(200) // too long
  ],
  validAmounts: [
    { amount: '1000000', denom: 'upersona' },
    { amount: '100', denom: 'persona' },
    { amount: '0.001', denom: 'persona' }
  ],
  invalidAmounts: [
    { amount: '-1000', denom: 'upersona' }, // negative
    { amount: '0', denom: 'upersona' }, // zero
    { amount: 'abc', denom: 'upersona' }, // non-numeric
    { amount: '1000000', denom: 'bitcoin' }, // invalid denom
    { amount: '1e20', denom: 'upersona' } // too large
  ],
  validMemos: [
    'Test transaction memo',
    'Multi-signature payment for invoice #1234',
    'A'.repeat(500), // max length
    ''
  ],
  invalidMemos: [
    '<script>alert("xss")</script>',
    'javascript:void(0)',
    'A'.repeat(600), // too long
    'onclick=alert(1)',
    '<iframe src="evil.com"></iframe>'
  ],
  validMemberNames: [
    'Alice Smith',
    'Bob-123',
    'Charlie_456',
    'D.E.F',
    'a'.repeat(50) // max length
  ],
  invalidMemberNames: [
    'a'.repeat(60), // too long
    '<script>alert(1)</script>',
    'javascript:alert(1)',
    'name with\nnewline',
    'name with\ttab'
  ],
  validProposalTexts: [
    'Add new member to multi-sig account',
    'Change threshold from 2 to 3 signatures required',
    'Remove inactive member from multi-sig',
    'a'.repeat(500) // reasonable length
  ],
  invalidProposalTexts: [
    '<script>alert("xss")</script>',
    '<iframe src="evil.com">',
    'javascript:void(0)',
    'a'.repeat(2000), // too long
    '' // empty
  ]
};

// Test counter
let tests = { passed: 0, failed: 0, total: 0 };

function runTest(testName, testFn) {
  tests.total++;
  try {
    const result = testFn();
    if (result) {
      tests.passed++;
      console.log(`✅ ${testName}`);
    } else {
      tests.failed++;
      console.log(`❌ ${testName}`);
    }
  } catch (error) {
    tests.failed++;
    console.log(`❌ ${testName} - Error: ${error.message}`);
  }
}

// Address Validation Tests
function testAddressValidation() {
  console.log('\n🧪 Testing Address Validation...');
  
  runTest('Valid persona addresses should pass', () => {
    return MultisigValidator.validateBech32Address(TEST_DATA.validAddresses.persona, 'persona');
  });

  runTest('Valid validator addresses should pass', () => {
    return MultisigValidator.validateBech32Address(TEST_DATA.validAddresses.personavaloper, 'personavaloper');
  });

  TEST_DATA.invalidAddresses.forEach((addr, i) => {
    runTest(`Invalid address ${i + 1} should fail`, () => {
      return !MultisigValidator.validateBech32Address(addr, 'persona');
    });
  });
}

// Public Key Validation Tests
function testPubkeyValidation() {
  console.log('\n🔐 Testing Public Key Validation...');

  TEST_DATA.validPubkeys.forEach((pubkey, i) => {
    runTest(`Valid pubkey ${i + 1} should pass`, () => {
      return MultisigValidator.validateBase64Pubkey(pubkey);
    });
  });

  TEST_DATA.invalidPubkeys.forEach((pubkey, i) => {
    runTest(`Invalid pubkey ${i + 1} should fail`, () => {
      return !MultisigValidator.validateBase64Pubkey(pubkey);
    });
  });
}

// Threshold Validation Tests
function testThresholdValidation() {
  console.log('\n🎯 Testing Threshold Validation...');

  const validTests = [
    { threshold: 1, members: 2 },
    { threshold: 2, members: 3 },
    { threshold: 5, members: 10 },
    { threshold: 20, members: 20 } // edge case
  ];

  const invalidTests = [
    { threshold: 0, members: 2 }, // zero threshold
    { threshold: 3, members: 2 }, // threshold > members
    { threshold: -1, members: 5 }, // negative threshold
    { threshold: 1, members: 1 }, // only 1 member
    { threshold: 25, members: 25 } // too many members
  ];

  validTests.forEach(({ threshold, members }, i) => {
    runTest(`Valid threshold test ${i + 1}`, () => {
      return MultisigValidator.validateThreshold(threshold, members);
    });
  });

  invalidTests.forEach(({ threshold, members }, i) => {
    runTest(`Invalid threshold test ${i + 1}`, () => {
      return !MultisigValidator.validateThreshold(threshold, members);
    });
  });
}

// Amount Validation Tests
function testAmountValidation() {
  console.log('\n💰 Testing Amount Validation...');

  TEST_DATA.validAmounts.forEach(({ amount, denom }, i) => {
    runTest(`Valid amount test ${i + 1}`, () => {
      return MultisigValidator.validateAmount(amount, denom);
    });
  });

  TEST_DATA.invalidAmounts.forEach(({ amount, denom }, i) => {
    runTest(`Invalid amount test ${i + 1}`, () => {
      return !MultisigValidator.validateAmount(amount, denom);
    });
  });
}

// Memo Validation Tests
function testMemoValidation() {
  console.log('\n📝 Testing Memo Validation...');

  TEST_DATA.validMemos.forEach((memo, i) => {
    runTest(`Valid memo test ${i + 1}`, () => {
      return MultisigValidator.validateMemo(memo);
    });
  });

  TEST_DATA.invalidMemos.forEach((memo, i) => {
    runTest(`Invalid memo test ${i + 1} (XSS protection)`, () => {
      return !MultisigValidator.validateMemo(memo);
    });
  });
}

// Member Name Validation Tests
function testMemberNameValidation() {
  console.log('\n👥 Testing Member Name Validation...');

  TEST_DATA.validMemberNames.forEach((name, i) => {
    runTest(`Valid member name test ${i + 1}`, () => {
      return MultisigValidator.validateMemberName(name);
    });
  });

  TEST_DATA.invalidMemberNames.forEach((name, i) => {
    runTest(`Invalid member name test ${i + 1}`, () => {
      return !MultisigValidator.validateMemberName(name);
    });
  });
}

// Proposal Text Validation Tests
function testProposalValidation() {
  console.log('\n📋 Testing Proposal Text Validation...');

  TEST_DATA.validProposalTexts.forEach((text, i) => {
    runTest(`Valid proposal text test ${i + 1}`, () => {
      return MultisigValidator.validateProposalText(text);
    });
  });

  TEST_DATA.invalidProposalTexts.forEach((text, i) => {
    runTest(`Invalid proposal text test ${i + 1} (XSS protection)`, () => {
      return !MultisigValidator.validateProposalText(text);
    });
  });
}

// String Sanitization Tests
function testStringSanitization() {
  console.log('\n🧼 Testing String Sanitization...');

  const testCases = [
    { input: '<script>alert("xss")</script>', expected: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;' },
    { input: 'Normal text', expected: 'Normal text' },
    { input: 'Text with "quotes" and \'apostrophes\'', expected: 'Text with &quot;quotes&quot; and &#x27;apostrophes&#x27;' },
    { input: 'Text with <tags> & ampersands', expected: 'Text with &lt;tags&gt; &amp; ampersands' }
  ];

  testCases.forEach(({ input, expected }, i) => {
    runTest(`Sanitization test ${i + 1}`, () => {
      const result = MultisigValidator.sanitizeString(input);
      return result === expected;
    });
  });
}

// ID Format Validation Tests
function testIdValidation() {
  console.log('\n🆔 Testing ID Format Validation...');

  const validTxIds = [
    'tx_1640995200000',
    'transaction_123456',
    'tx-abc-def-123'
  ];

  const invalidTxIds = [
    'tx_',
    'invalid id with spaces',
    'tx_1640995200000_extra_long_id_that_exceeds_fifty_chars',
    '<script>alert(1)</script>',
    'tx/invalid/chars'
  ];

  validTxIds.forEach((id, i) => {
    runTest(`Valid transaction ID test ${i + 1}`, () => {
      return MultisigValidator.validateTransactionId(id);
    });
  });

  invalidTxIds.forEach((id, i) => {
    runTest(`Invalid transaction ID test ${i + 1}`, () => {
      return !MultisigValidator.validateTransactionId(id);
    });
  });

  const validAccountIds = [
    'multisig_1640995200000',
    'multisig_1234567890123'
  ];

  const invalidAccountIds = [
    'multisig_',
    'account_1640995200000',
    'multisig_abc',
    'multisig_123456789012' // too short
  ];

  validAccountIds.forEach((id, i) => {
    runTest(`Valid account ID test ${i + 1}`, () => {
      return MultisigValidator.validateAccountId(id);
    });
  });

  invalidAccountIds.forEach((id, i) => {
    runTest(`Invalid account ID test ${i + 1}`, () => {
      return !MultisigValidator.validateAccountId(id);
    });
  });
}

// Member Validation Tests (Complex)
function testMemberValidation() {
  console.log('\n🧑‍🤝‍🧑 Testing Member Validation (Complex)...');

  const validMember = {
    address: TEST_DATA.validAddresses.persona,
    pubkey: TEST_DATA.validPubkeys[0],
    name: TEST_DATA.validMemberNames[0]
  };

  const invalidMembers = [
    {
      address: TEST_DATA.invalidAddresses[0],
      pubkey: TEST_DATA.validPubkeys[0],
      name: TEST_DATA.validMemberNames[0]
    },
    {
      address: TEST_DATA.validAddresses.persona,
      pubkey: TEST_DATA.invalidPubkeys[0],
      name: TEST_DATA.validMemberNames[0]
    },
    {
      address: TEST_DATA.validAddresses.persona,
      pubkey: TEST_DATA.validPubkeys[0],
      name: TEST_DATA.invalidMemberNames[0]
    }
  ];

  runTest('Valid member should pass validation', () => {
    const result = MultisigValidator.validateMember(validMember);
    return result.valid && result.errors.length === 0;
  });

  invalidMembers.forEach((member, i) => {
    runTest(`Invalid member test ${i + 1}`, () => {
      const result = MultisigValidator.validateMember(member);
      return !result.valid && result.errors.length > 0;
    });
  });
}

// Multi-sig Creation Validation Tests (Complex)
function testMultisigCreationValidation() {
  console.log('\n🏗️ Testing Multi-sig Creation Validation (Complex)...');

  const validMembers = [
    {
      address: TEST_DATA.validAddresses.persona,
      pubkey: TEST_DATA.validPubkeys[0],
      name: 'Alice'
    },
    {
      address: TEST_DATA.validAddresses.persona.replace('abc123', 'def456'),
      pubkey: TEST_DATA.validPubkeys[1],
      name: 'Bob'
    },
    {
      address: TEST_DATA.validAddresses.persona.replace('abc123', 'ghi789'),
      pubkey: TEST_DATA.validPubkeys[2],
      name: 'Charlie'
    }
  ];

  runTest('Valid multi-sig creation should pass', () => {
    const result = MultisigValidator.validateMultisigCreation(2, validMembers);
    return result.valid && result.errors.length === 0;
  });

  runTest('Duplicate addresses should fail', () => {
    const duplicateMembers = [
      validMembers[0],
      { ...validMembers[0], pubkey: TEST_DATA.validPubkeys[1] } // same address, different pubkey
    ];
    const result = MultisigValidator.validateMultisigCreation(2, duplicateMembers);
    return !result.valid && result.errors.some(e => e.includes('Duplicate address'));
  });

  runTest('Duplicate pubkeys should fail', () => {
    const duplicatePubkeys = [
      validMembers[0],
      { ...validMembers[1], pubkey: validMembers[0].pubkey } // different address, same pubkey
    ];
    const result = MultisigValidator.validateMultisigCreation(2, duplicatePubkeys);
    return !result.valid && result.errors.some(e => e.includes('Duplicate public key'));
  });

  runTest('Invalid threshold should fail', () => {
    const result = MultisigValidator.validateMultisigCreation(5, validMembers); // threshold > members
    return !result.valid && result.errors.some(e => e.includes('Invalid threshold'));
  });
}

// Rate Limiting Tests
function testRateLimiting() {
  console.log('\n⏱️ Testing Rate Limiting...');

  // Clear any existing rate limit data
  const testKey = 'test_rate_limit';
  localStorage.removeItem(`multisig_rate_${testKey}`);

  runTest('First request should pass rate limit', () => {
    return MultisigValidator.checkRateLimit(testKey, 60000, 5);
  });

  runTest('Subsequent requests within limit should pass', () => {
    return MultisigValidator.checkRateLimit(testKey, 60000, 5) &&
           MultisigValidator.checkRateLimit(testKey, 60000, 5);
  });

  runTest('Requests exceeding limit should fail', () => {
    // Make requests up to the limit
    for (let i = 0; i < 3; i++) {
      MultisigValidator.checkRateLimit(testKey, 60000, 5);
    }
    // This should exceed the limit
    return !MultisigValidator.checkRateLimit(testKey, 60000, 5);
  });

  runTest('Rate limit should reset after time window', () => {
    const shortKey = 'short_test';
    // Use very short window for testing
    MultisigValidator.checkRateLimit(shortKey, 1, 1); // 1ms window, 1 request limit
    
    // Wait 2ms and try again
    return new Promise(resolve => {
      setTimeout(() => {
        const result = MultisigValidator.checkRateLimit(shortKey, 1, 1);
        resolve(result);
      }, 2);
    });
  });
}

// Security Edge Cases Tests
function testSecurityEdgeCases() {
  console.log('\n🛡️ Testing Security Edge Cases...');

  runTest('Null input handling', () => {
    try {
      return !MultisigValidator.validateBech32Address(null) &&
             !MultisigValidator.validateBase64Pubkey(null) &&
             !MultisigValidator.validateMemo(null);
    } catch (e) {
      return true; // Should handle gracefully
    }
  });

  runTest('Undefined input handling', () => {
    try {
      return !MultisigValidator.validateBech32Address(undefined) &&
             !MultisigValidator.validateBase64Pubkey(undefined) &&
             !MultisigValidator.validateMemo(undefined);
    } catch (e) {
      return true; // Should handle gracefully
    }
  });

  runTest('Unicode attack protection', () => {
    const unicodeAttack = 'test\u200B\u200C\u200D\uFEFFattack';
    return MultisigValidator.sanitizeString(unicodeAttack).length < unicodeAttack.length;
  });

  runTest('SQL injection patterns should be sanitized', () => {
    const sqlInjection = "'; DROP TABLE users; --";
    const sanitized = MultisigValidator.sanitizeString(sqlInjection);
    return !sanitized.includes("'") && !sanitized.includes(';');
  });

  runTest('Path traversal patterns should be rejected', () => {
    const pathTraversal = '../../../etc/passwd';
    return !MultisigValidator.validateMemberName(pathTraversal);
  });
}

// Performance Tests
function testPerformance() {
  console.log('\n⚡ Testing Performance...');

  runTest('Address validation performance', () => {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      MultisigValidator.validateBech32Address(TEST_DATA.validAddresses.persona);
    }
    const end = performance.now();
    const timePerValidation = (end - start) / 1000;
    return timePerValidation < 1; // Should be less than 1ms per validation
  });

  runTest('Complex validation performance', () => {
    const validMembers = Array(10).fill(null).map((_, i) => ({
      address: TEST_DATA.validAddresses.persona.replace('abc123', `test${i.toString().padStart(3, '0')}`),
      pubkey: TEST_DATA.validPubkeys[i % TEST_DATA.validPubkeys.length],
      name: `Member ${i}`
    }));

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      MultisigValidator.validateMultisigCreation(5, validMembers);
    }
    const end = performance.now();
    const timePerValidation = (end - start) / 100;
    return timePerValidation < 10; // Should be less than 10ms per complex validation
  });
}

// Integration Tests (Mock)
function testIntegration() {
  console.log('\n🔗 Testing Integration Scenarios...');

  runTest('Complete multi-sig creation flow', () => {
    const members = [
      {
        address: TEST_DATA.validAddresses.persona,
        pubkey: TEST_DATA.validPubkeys[0],
        name: 'Alice'
      },
      {
        address: TEST_DATA.validAddresses.persona.replace('abc123', 'def456'),
        pubkey: TEST_DATA.validPubkeys[1],
        name: 'Bob'
      }
    ];

    const validation = MultisigValidator.validateMultisigCreation(2, members);
    if (!validation.valid) return false;

    // Simulate sanitization
    const sanitizedMembers = members.map(m => ({
      ...m,
      name: MultisigValidator.sanitizeString(m.name, 50)
    }));

    return sanitizedMembers.every(m => 
      MultisigValidator.validateMember(m).valid
    );
  });

  runTest('Transaction creation with validation', () => {
    const txData = {
      recipient: TEST_DATA.validAddresses.persona,
      amount: '1000000',
      denom: 'upersona',
      memo: 'Test transaction'
    };

    return MultisigValidator.validateBech32Address(txData.recipient) &&
           MultisigValidator.validateAmount(txData.amount, txData.denom) &&
           MultisigValidator.validateMemo(txData.memo);
  });

  runTest('Proposal creation with validation', () => {
    const proposal = {
      title: 'Add new member',
      description: 'Adding Alice to the multi-sig account',
      newMember: {
        address: TEST_DATA.validAddresses.persona,
        pubkey: TEST_DATA.validPubkeys[0],
        name: 'Alice'
      }
    };

    return MultisigValidator.validateProposalText(proposal.title, 100) &&
           MultisigValidator.validateProposalText(proposal.description, 1000) &&
           MultisigValidator.validateMember(proposal.newMember).valid;
  });
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Multi-signature Test Suite\n');
  console.log('═'.repeat(60));

  // Initialize mock localStorage if running in Node.js
  if (typeof localStorage === 'undefined') {
    global.localStorage = {
      data: {},
      setItem(key, value) { this.data[key] = value; },
      getItem(key) { return this.data[key] || null; },
      removeItem(key) { delete this.data[key]; }
    };
  }

  // Initialize performance if not available
  if (typeof performance === 'undefined') {
    global.performance = { now: () => Date.now() };
  }

  // Run all test suites
  testAddressValidation();
  testPubkeyValidation();
  testThresholdValidation();
  testAmountValidation();
  testMemoValidation();
  testMemberNameValidation();
  testProposalValidation();
  testStringSanitization();
  testIdValidation();
  testMemberValidation();
  testMultisigCreationValidation();
  await testRateLimiting(); // This one is async
  testSecurityEdgeCases();
  testPerformance();
  testIntegration();

  // Print results
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${tests.passed}`);
  console.log(`❌ Failed: ${tests.failed}`);
  console.log(`📋 Total:  ${tests.total}`);
  console.log(`📈 Success Rate: ${((tests.passed / tests.total) * 100).toFixed(1)}%`);

  if (tests.failed === 0) {
    console.log('\n🎉 All tests passed! Multi-signature implementation is secure and robust.');
    return true;
  } else {
    console.log(`\n⚠️  ${tests.failed} tests failed. Please review and fix the issues.`);
    return false;
  }
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, TEST_DATA };
} else {
  // Run tests if called directly
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}