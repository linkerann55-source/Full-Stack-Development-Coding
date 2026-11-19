<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class AdminAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Admin authentication required.',
            ], 401);
        }

        try {
            $payload = json_decode(
                Crypt::decryptString($token),
                true
            );

            if (
                !is_array($payload) ||
                ($payload['type'] ?? null) !== 'admin' ||
                ($payload['email'] ?? null) !== config('app.admin_email') ||
                !isset($payload['expires_at']) ||
                $payload['expires_at'] < now()->timestamp
            ) {
                throw new \RuntimeException('Invalid admin token.');
            }
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired admin session.',
            ], 401);
        }

        return $next($request);
    }
}
