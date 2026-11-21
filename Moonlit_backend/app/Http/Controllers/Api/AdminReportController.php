<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserReport;
use Illuminate\Http\Request;
use App\Models\AdminActivityLog;

class AdminReportController extends Controller
{
    // Get all user reports for admin
    public function index()
    {
        $reports = UserReport::with([
            'reporter:id,name,username',
            'reportedUser:id,name,username',
        ])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'reports' => $reports,
        ]);
    }

    // Resolve a user report
    public function resolve(Request $request, $id)
    {
        $validated = $request->validate([
            'admin_note' => 'nullable|string|max:2000',
        ]);

        $report = UserReport::findOrFail($id);

        $report->update([
            'status' => 'resolved',
            'admin_note' => $validated['admin_note'] ?? null,
            'reviewed_at' => now(),
            'reviewed_by' => null,
        ]);

        AdminActivityLog::record(
            'Resolve Report',
            'Admin resolved a report about user ID: ' . $report->reported_user_id,
            $report->id,
            'UserReport'
        );

        return response()->json([
            'success' => true,
            'message' => 'Report resolved successfully.',
            'report' => $report->load([
                'reporter:id,name,username',
                'reportedUser:id,name,username',
            ]),
        ]);
    }


    public function destroy($id)
        {
            $report = UserReport::findOrFail($id);

            AdminActivityLog::record(
                'Delete Report',
                'Admin deleted a report about user ID: ' . $report->reported_user_id,
                $report->id,
                'UserReport'
            );

            $report->delete();

            return response()->json([
                'success' => true,
                'message' => 'Report deleted successfully.',
            ]);
        }

}
