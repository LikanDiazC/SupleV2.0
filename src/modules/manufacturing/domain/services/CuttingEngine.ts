import { PlacedPiece, RemnantResult, SheetLayout } from '../entities/CuttingPlan';

// ─── Tipos de entrada ────────────────────────────────────────────────────────

export type GrainReq = 'FOLLOW' | 'CROSS' | 'ANY';

export interface PieceInput {
  label:            string;
  widthMm:          number;
  heightMm:         number;
  grainRequirement: GrainReq;
  quantity:         number; // cuántas piezas iguales necesitamos
}

export interface SheetSpec {
  widthMm:          number;
  heightMm:         number;
  grainDirection:   'HORIZONTAL' | 'VERTICAL' | 'NONE';
  kerfMm:           number;
  minRemnantAreaMm2: number;
}

export interface CuttingResult {
  sheetsUsed:   number;
  layouts:      SheetLayout[];
  remnants:     RemnantResult[];
  wastePercent: number;
}

// ─── Rectángulo libre dentro de una plancha ──────────────────────────────────

interface FreeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ─── Motor principal ─────────────────────────────────────────────────────────

export class CuttingEngine {
  /**
   * Algoritmo guillotina con Best-Area-Fit.
   *
   * Reglas de corte:
   * - Cada corte es recto y atraviesa todo el espacio disponible (guillotina real).
   * - El kerf se descuenta en cada corte horizontal y vertical.
   * - La dirección de veta se respeta: si grain=FOLLOW la pieza NO puede rotar 90°.
   *   Si grain=ANY se prueba la orientación que mejor encaje.
   *
   * Resultado:
   * - Planchas usadas, layouts de posiciones, retazos útiles, % de desperdicio.
   */
  static optimize(pieces: PieceInput[], sheet: SheetSpec): CuttingResult {
    // Expandir cada PieceInput en piezas individuales y ordenar por área desc
    const allPieces = CuttingEngine.expandAndSort(pieces);

    const layouts: SheetLayout[]  = [];
    const usedSheets: FreeRect[][] = []; // freeRects por plancha

    for (const piece of allPieces) {
      const placed = CuttingEngine.tryPlaceInExistingSheet(
        piece, usedSheets, layouts, sheet,
      );
      if (!placed) {
        // Abrir plancha nueva
        const newFreeRects: FreeRect[] = [
          { x: 0, y: 0, w: sheet.widthMm, h: sheet.heightMm },
        ];
        usedSheets.push(newFreeRects);
        layouts.push({ sheetIndex: usedSheets.length - 1, pieces: [] });

        CuttingEngine.placeInSheet(
          piece,
          usedSheets[usedSheets.length - 1],
          layouts[layouts.length - 1],
          sheet,
        );
      }
    }

    // Calcular retazos y desperdicio
    const remnants = CuttingEngine.collectRemnants(usedSheets, sheet);
    const wastePercent = CuttingEngine.calcWaste(allPieces, usedSheets.length, sheet);

    return {
      sheetsUsed:   usedSheets.length,
      layouts,
      remnants,
      wastePercent,
    };
  }

  // ─── Helpers privados ──────────────────────────────────────────────────────

  private static expandAndSort(
    inputs: PieceInput[],
  ): Array<{ label: string; w: number; h: number; grain: GrainReq }> {
    const result: Array<{ label: string; w: number; h: number; grain: GrainReq }> = [];
    for (const p of inputs) {
      for (let i = 0; i < p.quantity; i++) {
        result.push({ label: p.label, w: p.widthMm, h: p.heightMm, grain: p.grainRequirement });
      }
    }
    // Ordenar por área descendente para mejorar el aprovechamiento
    return result.sort((a, b) => b.w * b.h - a.w * a.h);
  }

  private static tryPlaceInExistingSheet(
    piece: { label: string; w: number; h: number; grain: GrainReq },
    usedSheets: FreeRect[][],
    layouts: SheetLayout[],
    sheet: SheetSpec,
  ): boolean {
    for (let i = 0; i < usedSheets.length; i++) {
      const placed = CuttingEngine.placeInSheet(piece, usedSheets[i], layouts[i], sheet);
      if (placed) return true;
    }
    return false;
  }

  private static placeInSheet(
    piece: { label: string; w: number; h: number; grain: GrainReq },
    freeRects: FreeRect[],
    layout: SheetLayout,
    sheet: SheetSpec,
  ): boolean {
    // Determinar orientaciones posibles según la veta
    const orientations = CuttingEngine.getOrientations(piece, sheet);

    let bestFit: { rectIdx: number; pw: number; ph: number; score: number } | null = null;

    for (const [pw, ph] of orientations) {
      for (let ri = 0; ri < freeRects.length; ri++) {
        const rect = freeRects[ri];
        if (pw <= rect.w && ph <= rect.h) {
          // Best-Area-Fit: preferimos el espacio más justo
          const score = rect.w * rect.h - pw * ph;
          if (!bestFit || score < bestFit.score) {
            bestFit = { rectIdx: ri, pw, ph, score };
          }
        }
      }
    }

    if (!bestFit) return false;

    const rect = freeRects[bestFit.rectIdx];
    const rotated = bestFit.pw !== piece.w;

    // Registrar posición en el layout
    layout.pieces.push({
      label:   piece.label,
      x:       rect.x,
      y:       rect.y,
      width:   bestFit.pw,
      height:  bestFit.ph,
      rotated,
    });

    // Corte guillotina: dividir el rectángulo libre en dos partes
    const newRects = CuttingEngine.guillotineSplit(
      rect, bestFit.pw, bestFit.ph, sheet.kerfMm,
    );

    // Reemplazar el rectángulo usado por los dos nuevos
    freeRects.splice(bestFit.rectIdx, 1, ...newRects);

    // Eliminar rectángulos inútiles (menores al kerf × 2 en cualquier dimensión)
    const minUsable = sheet.kerfMm * 2;
    for (let i = freeRects.length - 1; i >= 0; i--) {
      if (freeRects[i].w < minUsable || freeRects[i].h < minUsable) {
        freeRects.splice(i, 1);
      }
    }

    return true;
  }

  /**
   * Corte guillotina horizontal-first (Short-Axis split):
   *   - Derecha de la pieza: misma altura que la pieza
   *   - Abajo de toda la fila: ancho completo del rect original
   *
   *  ┌────────────────────┐
   *  │  pieza  │  RIGHT   │  ← altura de la pieza
   *  ├─────────┴──────────┤
   *  │       BOTTOM       │  ← resto de altura
   *  └────────────────────┘
   */
  private static guillotineSplit(
    rect: FreeRect,
    pw: number,
    ph: number,
    kerf: number,
  ): FreeRect[] {
    const result: FreeRect[] = [];

    const rightW = rect.w - pw - kerf;
    const rightH = ph;
    if (rightW > 0 && rightH > 0) {
      result.push({ x: rect.x + pw + kerf, y: rect.y, w: rightW, h: rightH });
    }

    const bottomW = rect.w;
    const bottomH = rect.h - ph - kerf;
    if (bottomW > 0 && bottomH > 0) {
      result.push({ x: rect.x, y: rect.y + ph + kerf, w: bottomW, h: bottomH });
    }

    return result;
  }

  /**
   * Retorna las orientaciones [w, h] permitidas para una pieza según la veta.
   *
   * FOLLOW: la veta de la plancha corre en la misma dirección que el alto de la pieza.
   *   - Si plancha tiene veta HORIZONTAL (corre a lo largo del ancho de la plancha):
   *     la pieza debe colocarse con su altura a lo ancho → intercambiar W y H.
   *   - Si veta VERTICAL: la pieza se coloca con su altura alineada → sin rotar.
   * CROSS: opuesto a FOLLOW.
   * ANY:  se prueban ambas orientaciones.
   * NONE en plancha: ambas orientaciones también.
   */
  private static getOrientations(
    piece: { w: number; h: number; grain: GrainReq },
    sheet: SheetSpec,
  ): [number, number][] {
    const normal:   [number, number] = [piece.w, piece.h];
    const rotated:  [number, number] = [piece.h, piece.w];
    const same = piece.w === piece.h; // pieza cuadrada: rotar no aporta

    if (sheet.grainDirection === 'NONE' || piece.grain === 'ANY') {
      return same ? [normal] : [normal, rotated];
    }

    // Con veta en plancha y restricción en pieza:
    // FOLLOW + VERTICAL  → pieza con su alto en dirección vertical → normal
    // FOLLOW + HORIZONTAL → pieza con su alto en dirección horizontal → rotated
    // CROSS es lo opuesto
    const sheetIsVertical = sheet.grainDirection === 'VERTICAL';
    const wantNormal =
      (piece.grain === 'FOLLOW' && sheetIsVertical) ||
      (piece.grain === 'CROSS' && !sheetIsVertical);

    return [wantNormal ? normal : rotated];
  }

  private static collectRemnants(
    usedSheets: FreeRect[][],
    sheet: SheetSpec,
  ): RemnantResult[] {
    const result: RemnantResult[] = [];
    for (let si = 0; si < usedSheets.length; si++) {
      for (const rect of usedSheets[si]) {
        if (rect.w * rect.h >= sheet.minRemnantAreaMm2) {
          result.push({
            sheetIndex: si,
            x:          Math.floor(rect.x),
            y:          Math.floor(rect.y),
            widthMm:    Math.floor(rect.w),
            heightMm:   Math.floor(rect.h),
          });
        }
      }
    }
    return result;
  }

  private static calcWaste(
    pieces: Array<{ w: number; h: number }>,
    sheetsUsed: number,
    sheet: SheetSpec,
  ): number {
    const totalSheetArea = sheetsUsed * sheet.widthMm * sheet.heightMm;
    const totalPieceArea = pieces.reduce((sum, p) => sum + p.w * p.h, 0);
    if (totalSheetArea === 0) return 0;
    return Math.round(((totalSheetArea - totalPieceArea) / totalSheetArea) * 10000) / 100;
  }
}
