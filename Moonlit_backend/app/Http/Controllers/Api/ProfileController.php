<?php

namespace App\Http\Controllers\Api;

use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\User;

class ProfileController extends Controller
{

    // Get logged-in user's profile
    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'bio' => $user->bio,
                'favorite_genre' => $user->favorite_genre,

                'avatar' => $user->avatar
                    ? (filter_var($user->avatar, FILTER_VALIDATE_URL)
                        ? $user->avatar
                        : url(Storage::url($user->avatar)))
                    : null,

                'cover_photo' => $user->cover_photo
                    ? (filter_var($user->cover_photo, FILTER_VALIDATE_URL)
                        ? $user->cover_photo
                        : url(Storage::url($user->cover_photo)))
                    : null,
            ],
        ]);
    }


    // Update logged-in user's profile
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'username' => [
                'required',
                'string',
                'max:50',
                Rule::unique('users', 'username')->ignore($user->id),
            ],
            'bio' => ['nullable', 'string', 'max:1000'],
            'favorite_genre' => ['nullable', 'string', 'max:100'],
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully!',
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'bio' => $user->bio,
                'favorite_genre' => $user->favorite_genre,
                'avatar' => $user->avatar
                    ? (filter_var($user->avatar, FILTER_VALIDATE_URL)
                        ? $user->avatar
                        : url(Storage::url($user->avatar)))
                    : null,

                'cover_photo' => $user->cover_photo
                    ? (filter_var($user->cover_photo, FILTER_VALIDATE_URL)
                        ? $user->cover_photo
                        : url(Storage::url($user->cover_photo)))
                    : null,
            ],
        ]);
    }


    // Search public users by username
public function search(Request $request)
{
    $request->validate([
        'query' => ['required', 'string', 'min:1', 'max:50'],
    ]);

    $query = trim($request->query('query'));

    $users = User::where('username', 'like', '%' . $query . '%')
        ->select([
            'id',
            'name',
            'username',
            'bio',
            'avatar',
        ])
        ->limit(10)
        ->get()
        ->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'bio' => $user->bio,
                'avatar' => $user->avatar
                    ? (filter_var($user->avatar, FILTER_VALIDATE_URL)
                        ? $user->avatar
                        : url(Storage::url($user->avatar)))
                    : null,
            ];
        });

    return response()->json([
        'success' => true,
        'users' => $users,
    ]);
}

   
// Get a public user's profile by username
public function publicShow($username)
{
    $user = User::where('username', $username)->firstOrFail();

    $user->loadCount(['followers', 'following']);

    return response()->json([
        'success' => true,
        'profile' => [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'bio' => $user->bio,
            'favorite_genre' => $user->favorite_genre,

            'avatar' => $user->avatar
                ? (filter_var($user->avatar, FILTER_VALIDATE_URL)
                    ? $user->avatar
                    : url(Storage::url($user->avatar)))
                : null,

            'cover_photo' => $user->cover_photo
                ? (filter_var($user->cover_photo, FILTER_VALIDATE_URL)
                    ? $user->cover_photo
                    : url(Storage::url($user->cover_photo)))
                : null,

            'followers_count' => $user->followers_count,
            'following_count' => $user->following_count,
        ],
    ]);
}


    public function uploadPhotos(Request $request)
    {
        $request->validate([
            'avatar' => ['nullable', 'image', 'max:2048'],
            'cover_photo' => ['nullable', 'image', 'max:2048'],
        ]);

        $user = $request->user();

        if ($request->hasFile('avatar')) {
            if ($user->avatar && !filter_var($user->avatar, FILTER_VALIDATE_URL)) {
                Storage::disk('public')->delete($user->avatar);
            }

            $user->avatar = $request->file('avatar')->store('avatars', 'public');
        }

        if ($request->hasFile('cover_photo')) {
            if ($user->cover_photo && !filter_var($user->cover_photo, FILTER_VALIDATE_URL)) {
                Storage::disk('public')->delete($user->cover_photo);
            }

            $user->cover_photo = $request->file('cover_photo')->store('covers', 'public');
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Photos uploaded successfully!',
            'profile' => [
                'avatar' => $user->avatar ? url(Storage::url($user->avatar)) : null,
                'cover_photo' => $user->cover_photo
                    ? url(Storage::url($user->cover_photo))
                    : null,
            ],
        ]);
    }
}