
/**
 * Fetches authentication tokens from the Microsoft Partner API.
 *
 * @async
 * @function getAuthTokens
 * @returns {Promise<Object>} A promise that resolves to the authentication tokens.
 * @throws {Error} If there is an error during the fetch operation.
 */
export async function getAuthTokens(){
  const result = fetch('https://partner.microsoft.com/en-us/api/user/AuthContext', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
 
      },
    })
    .then(response => response.json())
    .catch(error => console.error('Error:', error));
    
    const data = await result;
    return data;

}
