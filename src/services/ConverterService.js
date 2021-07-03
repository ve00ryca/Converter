import axios from 'axios'

const apiClient = axios.create({
  baseURL: `http://localhost:3000`,
  withCredentials: false, // default
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

export default {
  getUnits() {
    return apiClient.get('/units')
  },
  getUnit(unit_name) {
    return apiClient.get('/units/' + unit_name)
  },
}
