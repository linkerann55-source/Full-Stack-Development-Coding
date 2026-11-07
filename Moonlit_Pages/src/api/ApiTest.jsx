
import { useState } from 'react'
import api from './axios'

function ApiTest() {
  const [message, setMessage] = useState('')

  const testConnection = async () => {
    try {
      const response = await api.get('/test')
      setMessage(response.data.message)
    } catch (error) {
      console.error(error)
      setMessage('Connection failed. Check Laravel server and CORS.')
    }
  }

  return (
    <div>
      <button onClick={testConnection}>
        Test Laravel Connection
      </button>

      <p>{message}</p>
    </div>
  )
}

export default ApiTest
