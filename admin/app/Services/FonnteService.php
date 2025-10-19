<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FonnteService
{
    protected ?string $token;
    protected string $endpoint = 'https://api.fonnte.com/send';
    protected bool $enabled;

    public function __construct()
    {
        $this->token = config('services.fonnte.token');
        $this->enabled = config('services.fonnte.enabled', false);
    }

    /**
     * Send WhatsApp message via Fonnte API
     * Documentation: https://docs.fonnte.com/
     */
    public function sendMessage(string $receiver, string $message): array
    {
        if (!$this->enabled) {
            Log::info('Fonnte disabled, skipping message send', [
                'receiver' => $receiver,
            ]);
            
            return [
                'success' => false,
                'message' => 'Fonnte API is disabled',
            ];
        }

        if (empty($this->token)) {
            Log::error('Fonnte token is not configured');
            
            return [
                'success' => false,
                'message' => 'Token not configured',
            ];
        }

        // Log the attempt
        Log::info('Attempting to send WhatsApp message', [
            'receiver' => $receiver,
            'message_length' => strlen($message),
        ]);

        try {
            // Fonnte API menggunakan form-data dengan Authorization header
            $response = Http::withHeaders([
                'Authorization' => $this->token,
            ])->asForm()->post($this->endpoint, [
                'target' => $receiver,
                'message' => $message,
                'countryCode' => '62', // Indonesia country code
            ]);

            $data = $response->json();

            // Fonnte mengembalikan status true jika berhasil
            if ($response->successful() && ($data['status'] ?? false)) {
                Log::info('Fonnte message sent successfully', [
                    'receiver' => $receiver,
                    'response' => $data,
                ]);

                return [
                    'success' => true,
                    'message' => 'Message sent successfully',
                    'data' => $data,
                ];
            }

            Log::error('Fonnte API returned error', [
                'receiver' => $receiver,
                'response' => $data,
                'status_code' => $response->status(),
            ]);

            return [
                'success' => false,
                'message' => $data['reason'] ?? $data['message'] ?? 'Unknown error',
                'data' => $data,
            ];
        } catch (\Exception $e) {
            Log::error('Fonnte API request failed', [
                'receiver' => $receiver,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check if Fonnte is enabled and configured
     */
    public function isConfigured(): bool
    {
        return $this->enabled && !empty($this->token);
    }

    /**
     * Get device status from Fonnte
     */
    public function getDeviceStatus(): array
    {
        if (empty($this->token)) {
            return [
                'success' => false,
                'message' => 'Token not configured',
            ];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => $this->token,
            ])->post('https://api.fonnte.com/device');

            $data = $response->json();

            return [
                'success' => $response->successful(),
                'data' => $data,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }
}
