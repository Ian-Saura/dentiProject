#!/bin/bash
# Script para consolidar todas las migraciones en un solo archivo

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
OUTPUT_FILE="$SCRIPT_DIR/complete_migrations.sql"

echo "-- ============================================================================"
echo "-- COMPLETE DATABASE MIGRATIONS"
echo "-- Generated: $(date)"
echo "-- ============================================================================"
echo ""

# Lista de migraciones en orden
migrations=(
    "add_auth_and_audit.sql"
    "add_rbac_system.sql"
    "add_config_fields.sql"
    "add_unique_patient_constraint.sql"
    "add_dientes_to_consultas.sql"
    "add_turnos_system.sql"
    "update_turnos_config.sql"
    "fix_pacientes_fields.sql"
    "add_plan_fields.sql"
    "cleanup_duplicate_patients.sql"
    "add_import_hash.sql"
    "make_dni_mandatory.sql"
    "add_link_turnos_table.sql"
    "add_moneda_to_gastos_fijos.sql"
    "add_observaciones_to_prestaciones.sql"
    "add_payment_verification_fields.sql"
    "add_password_reset_fields.sql"
    "add_payment_audit_actions.sql"
    "make_password_hash_nullable.sql"
    "set_trial_dates_for_existing_users.sql"
)

# Crear archivo consolidado
{
    echo "-- ============================================================================"
    echo "-- COMPLETE DATABASE MIGRATIONS"
    echo "-- Generated: $(date)"
    echo "-- ============================================================================"
    echo ""
    
    for migration in "${migrations[@]}"; do
        if [ -f "$SCRIPT_DIR/$migration" ]; then
            echo "-- ============================================================================"
            echo "-- Migration: $migration"
            echo "-- ============================================================================"
            cat "$SCRIPT_DIR/$migration"
            echo ""
            echo ""
        else
            echo "-- WARNING: $migration not found"
            echo ""
        fi
    done
} > "$OUTPUT_FILE"

echo "✅ Migraciones consolidadas en: $OUTPUT_FILE"
echo "📊 Total de líneas: $(wc -l < $OUTPUT_FILE)"



