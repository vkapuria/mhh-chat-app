// Quick test of display name generation
function generateDisplayName(fullName) {
    const parts = fullName.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'User';
    if (parts.length === 1) return parts[0];
    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1][0].toUpperCase();
    return `${firstName} ${lastInitial}.`;
  }
  
  console.log('Testing display name generation:');
  console.log('Prachi Singh →', generateDisplayName('Prachi Singh')); // Should be "Prachi S."
  console.log('John Doe →', generateDisplayName('John Doe')); // Should be "John D."
  console.log('Maria Garcia Lopez →', generateDisplayName('Maria Garcia Lopez')); // Should be "Maria L."
  console.log('Victor →', generateDisplayName('Victor')); // Should be "Victor"