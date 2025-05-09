function compileCode() {
  const code = document.getElementById('codeInput').value;
  const language = document.getElementById('languageSelect').value;

  fetch('http://localhost:3000/execute', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          code: code,
          language: language
      })
  })
  .then(response => {
      if (!response.ok) {
          // If the response status is not OK, read the error message
          return response.json().then(err => {
              throw new Error(err.error || 'An unknown error occurred');
          });
      }
      return response.json();
  })
  .then(data => {
      // Display the output in the pre element
      document.getElementById('output').innerText = data.output;
  })
  .catch(error => {
      // Display the error in the pre element
      document.getElementById('output').innerText = `Error: ${error.message}`;
  });
}
