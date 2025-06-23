const GENOBANK_API_URL = process.env.GENOBANK_API_URL || 'https://genobank.app';

class GenoBankAPI {
  async getUserDetails(address) {
    try {
      const response = await fetch(`${GENOBANK_API_URL}/get_owner_details?owner_address=${address}`);
      
      if (!response.ok) {
        console.error('Failed to get user details from GenoBank API');
        return null;
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('GenoBank API error:', error);
      return null;
    }
  }

  async validatePermittee(address) {
    try {
      const response = await fetch(`${GENOBANK_API_URL}/get_validate_permittee?owner_wallet=${address}`);
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.status === 'Success';
    } catch (error) {
      console.error('GenoBank API error:', error);
      return false;
    }
  }

  async recoverAddress(signature) {
    try {
      const response = await fetch(`${GENOBANK_API_URL}/recover?signature=${signature}`);
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.status === 'Success' ? data.recovered_address : null;
    } catch (error) {
      console.error('GenoBank API error:', error);
      return null;
    }
  }
}

module.exports = new GenoBankAPI();