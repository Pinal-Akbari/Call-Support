<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AgentPermission extends Model
{
    protected $table = 'agent_permissions';

    protected $fillable = [
        'agent_code',
        'allowed_modules',
    ];

    protected $casts = [
        'allowed_modules' => 'array',
    ];

    public static array $defaultModules = [
        'dashboard',
        'call',
        'agents',
        'recordings',
    ];

    public static array $allModules = [
        'dashboard'  => 'Dashboard Overview',
        'call'       => 'Click-to-Call',
        'agents'     => 'Agents Directory',
        'mapping'    => 'Universal DID Masking',
        'recordings' => 'Call Recordings',
        'reports'    => 'API Reports & Logs',
    ];

    /**
     * Get allowed modules for an agent.
     */
    public static function getPermissions(string $agentCode): array
    {
        if (strtolower($agentCode) === 'admin') {
            return array_keys(self::$allModules);
        }

        $record = self::where('agent_code', $agentCode)->first();
        if ($record && is_array($record->allowed_modules)) {
            return $record->allowed_modules;
        }

        return self::$defaultModules;
    }

    /**
     * Save allowed modules for an agent.
     */
    public static function setPermissions(string $agentCode, array $modules): self
    {
        return self::updateOrCreate(
            ['agent_code' => $agentCode],
            ['allowed_modules' => array_values(array_unique($modules))]
        );
    }
}