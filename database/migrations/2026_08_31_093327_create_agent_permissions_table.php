<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('agent_permissions')) {
            Schema::create('agent_permissions', function (Blueprint $table) {
                $table->id();
                $table->string('agent_code', 50)->unique();
                $table->json('allowed_modules');
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agent_permissions');
    }
};
