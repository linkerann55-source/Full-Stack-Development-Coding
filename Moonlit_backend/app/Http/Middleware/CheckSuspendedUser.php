<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSuspendedUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->is_suspended) {
            $user->tokens()->delete();

            return response()->json([
                'success' => false,
                'message' => 'Your account has been suspended. Please contact the administrator.',
            ], 403);
        }

        return $next($request);
    }
}
