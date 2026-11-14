<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

Route::get('/reset-password/{token}', function (Request $request, string $token) {
    return redirect()->away(
        'http://localhost:5173/reset-password?token='
        . urlencode($token)
        . '&email=' . urlencode($request->query('email', ''))
    );
})->name('password.reset');

Route::get('/', function () {
    return view('welcome');
});
