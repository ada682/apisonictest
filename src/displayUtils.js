require('colors');

function displayHeader() {
  process.stdout.write('\x1Bc');
  console.log('========================================'.rainbow);

  const leftLines = [
    'S',
    '    O',
    '        N',
    '            I',
    '                C',
    'B',
    '    E',
    '        L',
    '            U',
    '                G',
    '                    A'
  ];

  const rightLines = [
    'O',

    'D',
    'Y',
    'Y',

    'S',
    'E',
    'Y'
  ];

  const maxLength = Math.max(leftLines.length, rightLines.length);

  for (let i = 0; i < maxLength; i++) {
    const leftLine = leftLines[i] || ''; // Get the corresponding left line or an empty string if it doesn't exist
    const rightLine = rightLines[i] || ''; // Get the corresponding right line or an empty string if it doesn't exist
    const spacing = ' '.repeat(40 - leftLine.length);
    console.log(`${leftLine.brightMagenta}${spacing}${rightLine.cyan}`);
  }

  console.log('========================================'.rainbow);
  console.log();
}

module.exports = {
  displayHeader,
};
