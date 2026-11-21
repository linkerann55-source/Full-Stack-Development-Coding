
import { useEffect, useState } from 'react'
import { getAdminActivityLogs } from '../../api/admin'

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true)
        const response = await getAdminActivityLogs()

        if (response.success) {
          setLogs(response.logs?.data || [])
        }
      } catch (err) {
        console.error('Unable to load activity logs:', err)
        setError(
          err.response?.data?.message ||
          'Unable to load activity logs.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#342442]">
          Activity Logs
        </h1>
        <p className="mt-1 text-sm text-[#9585a2]">
          Track important actions performed in the admin panel.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#eee5f4] bg-white">
        {loading ? (
          <p className="p-6 text-sm text-[#9585a2]">
            Loading activity logs...
          </p>
        ) : error ? (
          <p className="p-6 text-sm text-red-500">{error}</p>
        ) : logs.length === 0 ? (
          <p className="p-6 text-sm text-[#9585a2]">
            No activity logs found.
          </p>
        ) : (
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-[#f8f4fb] text-[#6f5b80]">
              <tr>
                <th className="px-5 py-4">Admin</th>
                <th className="px-5 py-4">Action</th>
                <th className="px-5 py-4">Description</th>
                <th className="px-5 py-4">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#f0eaf4]">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-5 py-4">
                    {log.admin_email}
                  </td>
                  <td className="px-5 py-4 font-medium">
                    {log.action}
                  </td>
                  <td className="px-5 py-4">
                    {log.description || '-'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}