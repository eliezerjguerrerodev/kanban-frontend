import Axios from 'axios';

let apiURL = import.meta.env.VITE_API_URL || 'http://localhost:8085';
if (apiURL && !apiURL.startsWith('http')) {
  apiURL = 'https://' + apiURL;
}

const axios = Axios.create({
  baseURL: apiURL,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
  withXSRFToken: true
});

export default axios;
