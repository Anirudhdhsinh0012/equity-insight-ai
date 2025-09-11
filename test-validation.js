/**
 * Test script to validate our email and password validation logic
 */

// Test email validation
function isEmailValid(email) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return email.length > 0 && email.length <= 254 && emailRegex.test(email.toLowerCase().trim());
}

// Test password validation
function isPasswordValid(password, isLoginMode) {
  if (isLoginMode) {
    return password.length >= 6;
  } else {
    return password.length >= 8 && 
           /(?=.*[0-9])/.test(password) && 
           /(?=.*[!@#$%^&*])/.test(password);
  }
}

// Test cases
const testCases = [
  {
    email: 'demo@test.com',
    password: 'password123',
    label: 'Demo User (No 2FA)',
    expectedEmailValid: true,
    expectedPasswordValidLogin: true,
    expectedPasswordValidRegister: false
  },
  {
    email: 'demo2fa@test.com',
    password: 'password123',
    label: 'Demo User (With 2FA)',
    expectedEmailValid: true,
    expectedPasswordValidLogin: true,
    expectedPasswordValidRegister: false
  },
  {
    email: 'test@example.com',
    password: 'password123!',
    label: 'Strong Password Test',
    expectedEmailValid: true,
    expectedPasswordValidLogin: true,
    expectedPasswordValidRegister: true
  },
  {
    email: 'invalid-email',
    password: 'short',
    label: 'Invalid Credentials',
    expectedEmailValid: false,
    expectedPasswordValidLogin: false,
    expectedPasswordValidRegister: false
  }
];

console.log('🧪 Testing Validation Logic\n');

testCases.forEach((testCase, index) => {
  console.log(`\n📧 Test ${index + 1}: ${testCase.label}`);
  console.log(`Email: ${testCase.email}`);
  console.log(`Password: ${testCase.password}`);
  
  const emailValid = isEmailValid(testCase.email);
  const passwordValidLogin = isPasswordValid(testCase.password, true);
  const passwordValidRegister = isPasswordValid(testCase.password, false);
  
  console.log(`✅ Email validation: ${emailValid ? 'PASS' : 'FAIL'} (expected: ${testCase.expectedEmailValid ? 'PASS' : 'FAIL'})`);
  console.log(`✅ Password validation (Login): ${passwordValidLogin ? 'PASS' : 'FAIL'} (expected: ${testCase.expectedPasswordValidLogin ? 'PASS' : 'FAIL'})`);
  console.log(`✅ Password validation (Register): ${passwordValidRegister ? 'PASS' : 'FAIL'} (expected: ${testCase.expectedPasswordValidRegister ? 'PASS' : 'FAIL'})`);
  
  const emailTest = emailValid === testCase.expectedEmailValid ? '✅' : '❌';
  const loginTest = passwordValidLogin === testCase.expectedPasswordValidLogin ? '✅' : '❌';
  const registerTest = passwordValidRegister === testCase.expectedPasswordValidRegister ? '✅' : '❌';
  
  console.log(`🎯 Results: Email ${emailTest} | Login ${loginTest} | Register ${registerTest}`);
});

console.log('\n🔧 Validation test completed!');
