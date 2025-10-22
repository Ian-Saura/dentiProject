import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { Upload, FileText, CheckCircle, AlertCircle, X, Download, Sparkles, Zap } from 'lucide-react';
import { importService } from '@/services';
import LoadingSpinner from '@/components/LoadingSpinner';
import AnimatedCard from '@/components/AnimatedCard';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface ColumnMapping {
  col_paciente: string;
  col_tratamiento: string;
  col_monto: string;
  col_fecha?: string;
  col_medio_pago?: string;
}

interface ImportResult {
  migrados: number;
  errores: number;
  total_ars: number;
  duplicados?: number;
  message?: string;
  error?: string; // Error message if import failed
}

const ImportPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    col_paciente: '',
    col_tratamiento: '',
    col_monto: '',
    col_fecha: '',
    col_medio_pago: ''
  });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const importMutation = useMutation(
    (data: { file: File; mapping: ColumnMapping }) => 
      importService.importCSV(data.file, data.mapping),
    {
      onSuccess: (result) => {
        setImportResult(result);
        if (result.error) {
          toast.error(result.error);
        } else {
          const msg = result.migrados > 0 
            ? `✅ Importación exitosa: ${result.migrados} consultas migradas` 
            : '⚠️ No se importaron nuevas consultas';
          toast.success(msg);
          // Invalidate ALL queries to refresh dashboard data
          queryClient.invalidateQueries('consultas');
          queryClient.invalidateQueries('analytics-resumen');
          queryClient.invalidateQueries('analytics-kpis');
          queryClient.invalidateQueries('costos-analisis');
          queryClient.invalidateQueries('punto-equilibrio');
          queryClient.invalidateQueries('pacientes');
        }
      },
      onError: (error: any) => {
        toast.error(`Error en la importación: ${error.message}`);
        setImportResult({
          migrados: 0,
          errores: 0,
          total_ars: 0,
          error: error.message
        });
      }
    }
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file extension
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      toast.error('❌ Archivo Excel detectado. Por favor convierte tu archivo a CSV primero.');
      toast('💡 En Excel: Archivo → Guardar como → CSV (delimitado por comas)', { duration: 5000 });
      return;
    }
    
    if (file.type === 'text/csv' || fileName.endsWith('.csv')) {
      setSelectedFile(file);
      setImportResult(null);
      
      // Read CSV to extract columns
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          if (lines.length > 0) {
            // Handle both comma and semicolon delimiters
            const firstLine = lines[0];
            const delimiter = firstLine.includes(';') ? ';' : ',';
            const headers = firstLine.split(delimiter).map(h => h.trim().replace(/"/g, ''));
            setCsvColumns(headers);
            
            // Set default mappings if columns match common patterns
            const mapping: ColumnMapping = {
              col_paciente: findColumn(headers, ['paciente', 'patient', 'nombre', 'name']),
              col_tratamiento: findColumn(headers, ['tratamiento', 'treatment', 'servicio', 'service', 'prestacion']),
              col_monto: findColumn(headers, ['monto', 'amount', 'precio', 'price', 'total', 'importe']),
              col_fecha: findColumn(headers, ['fecha', 'date']),
              col_medio_pago: findColumn(headers, ['medio', 'pago', 'payment', 'metodo', 'forma_pago'])
            };
            setColumnMapping(mapping);
            
            // Generate preview
            const previewLines = lines.slice(0, 6); // Header + 5 rows
            const preview = previewLines.map(line => 
              line.split(delimiter).map(cell => cell.trim().replace(/"/g, ''))
            );
            setCsvPreview(preview);
            
            toast.success(`✅ Archivo cargado: ${headers.length} columnas detectadas`);
          }
        } catch (error) {
          console.error('Error al leer CSV:', error);
          toast.error('Error al leer el archivo. Verifica que sea un CSV válido.');
        }
      };
      reader.onerror = () => {
        toast.error('Error al leer el archivo');
      };
      reader.readAsText(file, 'UTF-8');
    } else {
      toast.error('Por favor selecciona un archivo CSV válido (.csv)');
    }
  };

  const findColumn = (headers: string[], patterns: string[]): string => {
    for (const pattern of patterns) {
      const found = headers.find(h => h.toLowerCase().includes(pattern.toLowerCase()));
      if (found) return found;
    }
    return '';
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast.error('Selecciona un archivo CSV');
      return;
    }

    if (!columnMapping.col_paciente || !columnMapping.col_tratamiento || !columnMapping.col_monto) {
      toast.error('Los campos Paciente, Tratamiento y Monto son obligatorios');
      return;
    }

    importMutation.mutate({ file: selectedFile, mapping: columnMapping });
  };

  const resetImport = () => {
    setSelectedFile(null);
    setCsvColumns([]);
    setColumnMapping({
      col_paciente: '',
      col_tratamiento: '',
      col_monto: '',
      col_fecha: '',
      col_medio_pago: ''
    });
    setImportResult(null);
    setShowPreview(false);
    setCsvPreview([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = `Fecha,Paciente,Tratamiento,Monto Total,Medio de Pago
01-03-2025,"Pérez, Juan",Consulta,"$30,000",EFECTIVO
02-03-2025,"García, María",Limpieza,"$40,000",TRANSFERENCIA
03-03-2025,"López, Carlos",Operatoria,"$60,000",TARJETA DE CREDITO
04-03-2025,Ana Martínez,Endodoncia,"$80,000",TRANSFERENCIA`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_consultas.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-gradient-dental rounded-3xl p-8 text-white shadow-glow-dental"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
              <Upload className="h-8 w-8" />
            </div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl sm:text-4xl font-black flex items-center gap-2"
              >
                <Sparkles className="h-8 w-8 animate-pulse" />
                Importar Datos CSV
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/90 mt-1 text-lg"
              >
                Migra datos con normalización automática inteligente
              </motion.p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadTemplate}
            className="btn-premium flex items-center space-x-2 text-base"
          >
            <Download className="h-5 w-5" />
            <span>Descargar Plantilla</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Premium Instructions */}
      <AnimatedCard delay={0.1}>
        <div className="glass rounded-2xl shadow-soft p-8 bg-gradient-to-br from-blue-50 via-dental-50 to-purple-50 border-2 border-blue-200/50">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-gradient-dental rounded-2xl p-4 shadow-lg">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black gradient-text mb-2">
                🚀 ¡Importa tus consultas fácilmente!
              </h3>
              <p className="text-gray-600 text-lg">
                Subimos tu archivo CSV y lo procesamos automáticamente. Sin complicaciones.
              </p>
            </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-blue-200/50 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">✅</span>
              <h4 className="font-bold text-gray-900 text-lg">Formatos Aceptados</h4>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-dental-500 font-bold mt-0.5">•</span>
                <span><strong className="text-gray-900">Archivos:</strong> CSV (cualquier encoding)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-dental-500 font-bold mt-0.5">•</span>
                <span><strong className="text-gray-900">Nombres:</strong> "García, Juan" (usar comillas si tiene comas)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-dental-500 font-bold mt-0.5">•</span>
                <span><strong className="text-gray-900">Montos:</strong> $30,000 · 30000 · 30.000</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-dental-500 font-bold mt-0.5">•</span>
                <span><strong className="text-gray-900">Fechas:</strong> DD-MM-YYYY o DD/MM/YYYY</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-dental-500 font-bold mt-0.5">•</span>
                <span><strong className="text-gray-900">Pagos:</strong> Efectivo, Transferencia, etc.</span>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-purple-200/50 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">✨</span>
              <h4 className="font-bold text-gray-900 text-lg">Procesamiento Inteligente</h4>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-purple-500 font-bold mt-0.5">•</span>
                <span><strong className="text-gray-900">Nombres:</strong> Normalización automática</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 font-bold mt-0.5">•</span>
                <span><strong className="text-gray-900">Tratamientos:</strong> Capitalización inteligente</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 font-bold mt-0.5">•</span>
                <span><strong className="text-gray-900">Montos:</strong> Extracción numérica</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 font-bold mt-0.5">•</span>
                <span><strong className="text-gray-900">Fechas:</strong> Detección automática</span>
              </li>
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200/50 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">👍</span>
            <div>
              <p className="text-green-900 font-semibold text-base mb-1">
                ¡No te preocupes por el formato!
              </p>
              <p className="text-green-700">
                Nuestro sistema detecta y corrige automáticamente los datos. Solo sube tu archivo y listo.
              </p>
            </div>
          </div>
        </motion.div>
        </div>
      </AnimatedCard>

      {/* Premium File Upload */}
      <AnimatedCard delay={0.2}>
        <div className="glass rounded-2xl shadow-soft p-6 border border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold gradient-text">1️⃣ Seleccionar Archivo CSV</h3>
        </div>
        
        <div className="border-2 border-dashed border-dental-300 rounded-2xl p-8 text-center bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-all">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="cursor-pointer">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {selectedFile ? selectedFile.name : 'Seleccionar archivo CSV'}
            </p>
            <p className="text-gray-600">
              {selectedFile ? 
                `Archivo cargado (${(selectedFile.size / 1024).toFixed(1)} KB)` :
                'Arrastra y suelta tu archivo CSV aquí, o haz clic para seleccionar'
              }
            </p>
          </label>
        </div>

        {selectedFile && (
          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Archivo cargado correctamente</span>
            </div>
            <button
              onClick={resetImport}
              className="text-red-600 hover:text-red-800 flex items-center space-x-1"
            >
              <X className="h-4 w-4" />
              <span>Limpiar</span>
            </button>
          </div>
        )}
        </div>
      </AnimatedCard>

      {/* Column Mapping */}
      {csvColumns.length > 0 && (
        <AnimatedCard delay={0.3}>
          <div className="glass rounded-2xl shadow-soft p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-xl shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold gradient-text">2️⃣ Mapear Columnas</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paciente * <span className="text-red-500">obligatorio</span>
              </label>
              <select
                value={columnMapping.col_paciente}
                onChange={(e) => setColumnMapping({...columnMapping, col_paciente: e.target.value})}
                className="form-input"
                required
              >
                <option value="">Seleccionar columna...</option>
                {csvColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tratamiento * <span className="text-red-500">obligatorio</span>
              </label>
              <select
                value={columnMapping.col_tratamiento}
                onChange={(e) => setColumnMapping({...columnMapping, col_tratamiento: e.target.value})}
                className="form-input"
                required
              >
                <option value="">Seleccionar columna...</option>
                {csvColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto * <span className="text-red-500">obligatorio</span>
              </label>
              <select
                value={columnMapping.col_monto}
                onChange={(e) => setColumnMapping({...columnMapping, col_monto: e.target.value})}
                className="form-input"
                required
              >
                <option value="">Seleccionar columna...</option>
                {csvColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha <span className="text-gray-500">opcional</span>
              </label>
              <select
                value={columnMapping.col_fecha || ''}
                onChange={(e) => setColumnMapping({...columnMapping, col_fecha: e.target.value})}
                className="form-input"
              >
                <option value="">Seleccionar columna...</option>
                {csvColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medio de Pago <span className="text-gray-500">opcional</span>
              </label>
              <select
                value={columnMapping.col_medio_pago || ''}
                onChange={(e) => setColumnMapping({...columnMapping, col_medio_pago: e.target.value})}
                className="form-input"
              >
                <option value="">Seleccionar columna...</option>
                {csvColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview Toggle */}
          <div className="mt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowPreview(!showPreview)}
              className="btn-secondary"
            >
              {showPreview ? 'Ocultar' : 'Mostrar'} Vista Previa
            </motion.button>
          </div>
          </div>
        </AnimatedCard>
      )}

      {/* CSV Preview */}
      {showPreview && csvPreview.length > 0 && (
        <AnimatedCard delay={0.4}>
        <div className="glass rounded-2xl shadow-soft p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">👀</span>
            <h3 className="text-2xl font-bold gradient-text">Vista Previa del CSV</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table text-sm">
              <thead>
                <tr>
                  {csvPreview[0]?.map((header: string, index: number) => (
                    <th key={index} className="text-xs">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvPreview.slice(1).map((row: string[], rowIndex: number) => (
                  <tr key={rowIndex}>
                    {row.map((cell: string, cellIndex: number) => (
                      <td key={cellIndex} className="text-xs">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </AnimatedCard>
      )}

      {/* Premium Import Button */}
      {csvColumns.length > 0 && (
        <AnimatedCard delay={0.5}>
          <div className="glass rounded-2xl shadow-soft p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold gradient-text">3️⃣ Ejecutar Importación</h3>
            </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Se normalizarán automáticamente nombres, tratamientos y montos</p>
              <p>• Los datos se validarán antes de la importación</p>
              <p>• Se mostrarán estadísticas detalladas del proceso</p>
              <p className="text-blue-600 font-medium">💡 Los pacientes nuevos recibirán un DNI temporal (formato CSV-xxxxx) que puedes actualizar después</p>
            </div>
            <button
              onClick={handleImport}
              disabled={importMutation.isLoading || !columnMapping.col_paciente || !columnMapping.col_tratamiento || !columnMapping.col_monto}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              {importMutation.isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span>Importar Datos</span>
                </>
              )}
            </button>
          </div>
          </div>
        </AnimatedCard>
      )}

      {/* Import Results */}
      {importResult && (
        <AnimatedCard delay={0.6}>
        <div className={`glass rounded-2xl shadow-soft p-6 border-2 ${importResult.error ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
          <div className="flex items-center space-x-3 mb-4">
            {importResult.error ? (
              <AlertCircle className="h-8 w-8 text-red-600" />
            ) : (
              <CheckCircle className="h-8 w-8 text-green-600" />
            )}
            <div>
              <h3 className={`text-lg font-semibold ${importResult.error ? 'text-red-900' : 'text-green-900'}`}>
                {importResult.error ? '❌ Error en la Importación' : '✅ Importación Completada'}
              </h3>
              <p className={`${importResult.error ? 'text-red-700' : 'text-green-700'}`}>
                {importResult.message || importResult.error}
              </p>
            </div>
          </div>

          {!importResult.error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 text-white shadow-xl"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                <div className="relative z-10">
                  <div className="text-xs font-medium text-white/80 mb-1">Consultas Migradas</div>
                  <div className="text-4xl font-black">{importResult.migrados}</div>
                </div>
              </motion.div>
              
              {importResult.duplicados !== undefined && importResult.duplicados > 0 && (
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-purple-500 via-violet-600 to-fuchsia-600 text-white shadow-xl"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                  <div className="relative z-10">
                    <div className="text-xs font-medium text-white/80 mb-1">Duplicados Omitidos</div>
                    <div className="text-4xl font-black">{importResult.duplicados}</div>
                  </div>
                </motion.div>
              )}
              
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 text-white shadow-xl"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                <div className="relative z-10">
                  <div className="text-xs font-medium text-white/80 mb-1">Errores</div>
                  <div className="text-4xl font-black">{importResult.errores}</div>
                </div>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white shadow-xl"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                <div className="relative z-10">
                  <div className="text-xs font-medium text-white/80 mb-1">Total ARS Importado</div>
                  <div className="text-2xl font-black">${importResult.total_ars.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              </motion.div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetImport}
              className="btn-premium"
            >
              Nueva Importación
            </motion.button>
          </div>
        </div>
        </AnimatedCard>
      )}
    </div>
  );
};

export default ImportPage;
