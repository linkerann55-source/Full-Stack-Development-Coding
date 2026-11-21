<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;

class AdminActivityLogController extends Controller
{
    // Get all admin activity logs
    public function index()
    {
        $logs = AdminActivityLog::latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'logs' => $logs,
        ]);
    }
}