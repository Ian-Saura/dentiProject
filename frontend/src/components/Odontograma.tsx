import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Treatment {
  id: number;
  fecha_consulta: string;
  prestacion_usuario?: {
    nombre_personalizado?: string;
  };
  monto_ars: number;
}

interface OdontogramaProps {
  highlightedTeeth?: number[];
  treatedTeeth?: number[]; // Dientes con tratamientos (verde)
  selectedTeeth?: number[]; // Dientes seleccionados (azul)
  consultations?: any[]; // Consultas completas para mostrar historial
  onToothClick?: (toothNumber: number) => void;
  selectable?: boolean;
  showTooltip?: boolean;
}

const Odontograma: React.FC<OdontogramaProps> = ({ 
  highlightedTeeth = [], 
  treatedTeeth = [],
  selectedTeeth = [],
  consultations = [],
  onToothClick,
  selectable = false,
  showTooltip = true
}) => {
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const toothRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  
  // Obtener tratamientos de un diente específico
  const getToothTreatments = (toothNumber: number) => {
    return consultations
      .filter(c => c.dientes_tratados?.includes(toothNumber))
      .sort((a, b) => new Date(b.fecha_consulta).getTime() - new Date(a.fecha_consulta).getTime());
  };

  const handleToothHover = (toothNumber: number, event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setHoveredTooth(toothNumber);
  };

  const handleToothLeave = () => {
    setHoveredTooth(null);
    setTooltipPosition(null);
  };
  // Numeración dental universal (18 al 48)
  const teethTop = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const teethBottom = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

  const renderTooth = (number: number, isTopRow: boolean = false) => {
    const isHighlighted = highlightedTeeth.includes(number);
    const isTreated = treatedTeeth.includes(number);
    const isSelected = selectedTeeth.includes(number);
    
    // Determinar color según estado
    let colorClass = 'bg-gradient-to-b from-white to-gray-100 border-2 border-gray-300';
    let textClass = 'text-gray-600';
    let shadowClass = '';
    
    if (isSelected) {
      colorClass = 'bg-gradient-to-b from-blue-400 to-blue-600 border-2 border-blue-700';
      textClass = 'text-white';
      shadowClass = 'shadow-lg shadow-blue-500/50';
    } else if (isTreated) {
      colorClass = 'bg-gradient-to-b from-green-400 to-green-600 border-2 border-green-700';
      textClass = 'text-white';
      shadowClass = 'shadow-lg shadow-green-500/50';
    } else if (isHighlighted) {
      colorClass = 'bg-gradient-to-b from-cyan-400 to-cyan-600 border-2 border-cyan-700';
      textClass = 'text-white';
      shadowClass = 'shadow-lg shadow-cyan-500/50';
    }
    
    return (
      <motion.div
        key={number}
        ref={(el) => { toothRefs.current[number] = el; }}
        whileHover={{ scale: 1.2, y: -5 }}
        whileTap={selectable ? { scale: 0.9 } : {}}
        onClick={() => selectable && onToothClick?.(number)}
        className={`relative group ${selectable ? 'cursor-pointer' : 'cursor-default'}`}
        style={{ zIndex: hoveredTooth === number ? 10000 : 10 }}
        onMouseEnter={(e) => showTooltip && handleToothHover(number, e)}
        onMouseLeave={handleToothLeave}
      >
        <motion.div
          whileHover={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.3 }}
          className={`w-8 h-10 rounded-b-full ${colorClass} ${shadowClass} flex items-center justify-center transition-all duration-300`}
        >
          <span className={`text-[10px] font-bold ${textClass}`}>
            {number}
          </span>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Superior */}
      <div>
        <div className="text-center mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Superior</span>
        </div>
        <div className="flex justify-center gap-0.5 sm:gap-1 px-2 sm:px-4 overflow-x-auto">
          {teethTop.map(tooth => renderTooth(tooth, true))}
        </div>
      </div>

      {/* Línea divisoria */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-dashed border-gray-300"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-1 rounded-full text-xs font-bold text-gray-600 border border-gray-200">
            LÍNEA MEDIA
          </span>
        </div>
      </div>

      {/* Inferior */}
      <div>
        <div className="flex justify-center gap-0.5 sm:gap-1 px-2 sm:px-4 overflow-x-auto">
          {teethBottom.map(tooth => renderTooth(tooth, false))}
        </div>
        <div className="text-center mt-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Inferior</span>
        </div>
      </div>

      {/* Tooltip using Portal - renders outside modal */}
      {showTooltip && hoveredTooth !== null && tooltipPosition && createPortal(
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)',
            zIndex: 999999,
            pointerEvents: 'none'
          }}
        >
          <div className="bg-gray-900 text-white text-xs rounded-xl py-3 px-4 shadow-2xl min-w-[220px] max-w-[300px]">
            <div className="font-bold text-sm mb-2 border-b border-gray-700 pb-2">
              🦷 Diente #{hoveredTooth}
            </div>
            
            {(() => {
              const treatments = getToothTreatments(hoveredTooth);
              const isSelected = selectedTeeth.includes(hoveredTooth);
              const isTreated = treatedTeeth.includes(hoveredTooth);
              
              if (treatments.length > 0) {
                return (
                  <div className="space-y-2">
                    <div className="text-green-300 font-semibold text-[10px] uppercase">
                      ✓ {treatments.length} Tratamiento{treatments.length > 1 ? 's' : ''}
                    </div>
                    {treatments.slice(0, 3).map((treatment) => (
                      <div key={treatment.id} className="border-l-2 border-green-500 pl-2 py-1">
                        <div className="text-[10px] text-gray-400">
                          {new Date(treatment.fecha_consulta).toLocaleDateString('es-ES', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </div>
                        <div className="font-medium text-white">
                          {treatment.prestacion_usuario?.nombre_personalizado || 'Tratamiento'}
                        </div>
                        <div className="text-[10px] text-green-400">
                          ${treatment.monto_ars.toLocaleString('es-AR')}
                        </div>
                      </div>
                    ))}
                    {treatments.length > 3 && (
                      <div className="text-[10px] text-gray-500 italic">
                        +{treatments.length - 3} más...
                      </div>
                    )}
                  </div>
                );
              } else if (isSelected) {
                return <div className="text-blue-300">⦿ Seleccionado para tratamiento</div>;
              } else if (isTreated) {
                return <div className="text-green-300">✓ Con tratamientos</div>;
              } else {
                return <div className="text-gray-400">Sin tratamientos registrados</div>;
              }
            })()}
          </div>
        </motion.div>,
        document.body
      )}
    </div>
  );
};

export default Odontograma;
