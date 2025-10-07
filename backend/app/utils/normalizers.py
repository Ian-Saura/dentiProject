import re
from datetime import datetime

import pandas as pd


def extraer_monto_numerico(monto_str):
    """Extrae valor numérico de string de monto"""
    try:
        if pd.isna(monto_str):
            return 0

        monto_clean = str(monto_str).strip()

        # Remover símbolos comunes de moneda
        monto_clean = re.sub(r'[$€£¥₹₽₩¢]', '', monto_clean)
        monto_clean = re.sub(r'[^\d.,\-]', '', monto_clean)

        if not monto_clean:
            return 0

        # Manejar números negativos
        es_negativo = monto_clean.startswith('-')
        monto_clean = monto_clean.lstrip('-')

        # Determinar si el último punto/coma son decimales
        if ',' in monto_clean and '.' in monto_clean:
            # Si hay ambos, el que está más a la derecha es el decimal
            if monto_clean.rfind(',') > monto_clean.rfind('.'):
                # Coma es decimal: 1.234,56 -> 1234.56
                monto_clean = monto_clean.replace('.', '').replace(',', '.')
            else:
                # Punto es decimal: 1,234.56 -> 1234.56
                monto_clean = monto_clean.replace(',', '')
        elif ',' in monto_clean:
            # Solo hay comas
            partes = monto_clean.split(',')
            # Si la última parte tiene 2 o menos dígitos y solo hay una coma, es decimal
            if monto_clean.count(',') == 1 and len(partes[-1]) <= 2:
                # Es decimal: 40,50 -> 40.50
                monto_clean = monto_clean.replace(',', '.')
            else:
                # Son separadores de miles: 40,000 -> 40000
                monto_clean = monto_clean.replace(',', '')
        elif '.' in monto_clean:
            # Solo hay puntos
            partes = monto_clean.split('.')
            # Si la última parte tiene 2 o menos dígitos y solo hay un punto, es decimal
            if monto_clean.count('.') == 1 and len(partes[-1]) <= 2:
                # Es decimal: 40.50 -> 40.50 (ya está bien)
                pass
            else:
                # Son separadores de miles: 40.000 -> 40000
                monto_clean = monto_clean.replace('.', '')

        resultado = float(monto_clean)
        return -resultado if es_negativo else resultado

    except Exception:
        return 0


def normalizar_fecha_flexible(fecha_valor):
    """Normaliza fechas de múltiples formatos"""
    try:
        if pd.isna(fecha_valor):
            return datetime.now().isoformat()

        fecha_str = str(fecha_valor).strip()

        formatos_fecha = [
            '%d/%m/%Y', '%d/%m/%y', '%d-%m-%Y', '%d-%m-%y', '%d.%m.%Y', '%d.%m.%y',
            '%m/%d/%Y', '%m/%d/%y', '%m-%d-%Y', '%m-%d-%y',
            '%Y-%m-%d', '%Y/%m/%d', '%Y.%m.%d', '%Y_%m_%d',
            '%d/%m/%Y %H:%M:%S', '%d/%m/%Y %H:%M', '%d-%m-%Y %H:%M:%S', '%d-%m-%Y %H:%M',
            '%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M',
            '%d de %B de %Y', '%d %B %Y', '%B %d, %Y', '%d %b %Y',
        ]

        for formato in formatos_fecha:
            try:
                fecha_parsed = datetime.strptime(fecha_str, formato)
                return fecha_parsed.isoformat()
            except ValueError:
                continue

        try:
            fecha_pandas = pd.to_datetime(fecha_str, dayfirst=True, errors='coerce')
            if not pd.isna(fecha_pandas):
                return fecha_pandas.isoformat()
        except:
            pass

        return datetime.now().isoformat()

    except Exception:
        return datetime.now().isoformat()


def normalizar_medio_pago(medio_pago):
    """Normaliza medios de pago para evitar duplicados por mayúsculas/minúsculas"""
    if pd.isna(medio_pago):
        return "efectivo"

    medio_clean = str(medio_pago).strip().lower()

    # Mapeo de normalizaciones
    normalizaciones = {
        'efectivo': 'efectivo',
        'cash': 'efectivo',
        'transferencia': 'transferencia',
        'transfer': 'transferencia',
        'débito': 'debito',
        'debito': 'debito',
        'debit': 'debito',
        'crédito': 'credito',
        'credito': 'credito',
        'credit': 'credito',
        'mercado pago': 'mercadopago',
        'mercadopago': 'mercadopago',
        'mp': 'mercadopago',
        'otros': 'otro',
        'other': 'otro'
    }

    return normalizaciones.get(medio_clean, medio_pago.strip().lower())
