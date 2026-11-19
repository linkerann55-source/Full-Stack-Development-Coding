<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Crypt;

class AuthController extends Controller
{
    // Register
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:50|unique:users,username',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create($validated);

        $token = $user->createToken('moonlit-pages')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful!',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    // Login with attempt limit
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $key = Str::lower($request->email) . '|' . $request->ip();

        // Maximum 5 failed attempts within 15 minutes
        if (RateLimiter::tooManyAttempts($key, 5)) {
            return response()->json([
                'success' => false,
                'message' => 'Too many login attempts. Please try again in 15 minutes.',
                'retry_after' => RateLimiter::availableIn($key),
            ], 429);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            RateLimiter::hit($key, 900);

            throw ValidationException::withMessages([
                'email' => ['Invalid email or password.'],
            ]);
        }

        // Clear failed attempts after successful login
        RateLimiter::clear($key);

        $token = $user->createToken('moonlit-pages')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful!',
            'user' => $user,
            'token' => $token,
        ]);
    }


// Admin Login - Fixed credentials, no database account
public function adminLogin(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'password' => 'required|string',
    ]);

    $key = 'admin|' . Str::lower($request->email) . '|' . $request->ip();

    if (RateLimiter::tooManyAttempts($key, 5)) {
        return response()->json([
            'success' => false,
            'message' => 'Too many login attempts. Try again later.',
            'retry_after' => RateLimiter::availableIn($key),
        ], 429);
    }

    $adminEmail = config('app.admin_email');
    $adminPasswordHash = config('app.admin_password_hash');

    if (
        !$adminEmail ||
        !$adminPasswordHash ||
        Str::lower($request->email) !== Str::lower($adminEmail) ||
        !Hash::check($request->password, $adminPasswordHash)
    ) {
        RateLimiter::hit($key, 900);

        return response()->json([
            'success' => false,
            'message' => 'Access denied. Invalid admin credentials.',
        ], 401);
    }

    RateLimiter::clear($key);

    $token = Crypt::encryptString(json_encode([
        'type' => 'admin',
        'email' => $adminEmail,
        'expires_at' => now()->addHours(8)->timestamp,
    ]));

    return response()->json([
        'success' => true,
        'message' => 'Admin login successful!',
        'user' => [
            'email' => $adminEmail,
            'role' => 'admin',
        ],
        'token' => $token,
    ]);
}

    // Reset Password
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only(
                'email',
                'password',
                'password_confirmation',
                'token'
            ),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                // Revoke existing API tokens
                $user->tokens()->delete();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'success' => true,
                'message' => 'Password reset successfully!',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Invalid or expired password reset link.',
        ], 422);
    }

    // Logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully!',
        ]);
    }

    // Get authenticated user
    public function user(Request $request)
    {
        return response()->json([
            'success' => true,
            'user' => $request->user(),
        ]);
    }
}
