<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use App\Models\AdminActivityLog;

class UserController extends Controller
{
    // Display all registered users
    public function adminIndex()
    {
        $users = User::query()
            ->select(
                'id',
                'name',
                'username',
                'email',
                'avatar',
                'bio',
                'is_suspended',
                'created_at'
            )
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'users' => $users,
        ]);
    }

    // Suspend a user
    public function adminSuspend($id)
    {
        $user = User::findOrFail($id);

        $user->is_suspended = true;
        $user->save();

        AdminActivityLog::record(
            'Suspend User',
            'Admin suspended user: ' . $user->username,
            $user->id,
            'User'
        );

        return response()->json([
            'success' => true,
            'message' => 'User suspended successfully.',
        ]);
    }

    // Activate a suspended user
    public function adminActivate($id)
    {
        $user = User::findOrFail($id);

        $user->is_suspended = false;
        $user->save();

        AdminActivityLog::record(
            'Activate User',
            'Admin activated user: ' . $user->username,
            $user->id,
            'User'
        );

        return response()->json([
            'success' => true,
            'message' => 'User activated successfully.',
        ]);
    }

    // Delete a user
    public function adminDestroy($id)
    {
        $user = User::findOrFail($id);

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully.',
        ]);
    }
}