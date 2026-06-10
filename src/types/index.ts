export type Cobertura = 'PARTICULAR' | 'OBRA SOCIAL' | 'MUTUAL' | 'PREPAGA'
export type Destino = 'CREMACIÓN' | 'INHUMACIÓN'
export type TipoVelatorio = 'DESPEDIDA 5 HORAS' | 'VELATORIO 12 HORAS' | 'VELATORIO 24 HORAS' | 'SIN VELATORIO'
export type EstadoCivil = 'SOLTERO/A' | 'CASADO/A' | 'VIUDO/A' | 'DIVORCIADO/A'
export type Parentesco = 'HIJO/A' | 'CÓNYUGE' | 'HERMANO/A' | 'PADRE/MADRE' | 'NIETO/A' | 'OTRO'
export type CategoriaStock = 'Ataúd' | 'Urna' | 'Mortaja'
export type EstadoServicio = 'PENDIENTE' | 'EN CURSO' | 'COMPLETADO' | 'CANCELADO'
export type MedioPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA DÉBITO' | 'TARJETA CRÉDITO' | 'CHEQUE'
export type UserRole = 'admin' | 'asesor'

export interface Servicio {
  id: string
  created_at?: string
  // Encabezado
  nro_orden: string
  fecha_servicio: string
  asesor: string
  cobertura: Cobertura
  estado: EstadoServicio
  // Cobertura OS
  titular?: string
  codigo_cobertura?: string
  legajo?: string
  seccion?: string
  beneficiario?: string
  // Extinto
  ext_nombre: string
  ext_apellido: string
  ext_documento: string
  ext_fallecio: string
  ext_nacimiento?: string
  ext_nacionalidad: string
  ext_estado_civil: EstadoCivil
  ext_profesion?: string
  ext_causa_fallecimiento?: string
  ext_religion?: string
  ext_contextura?: string
  ext_lugar_fallecimiento?: string
  ext_domicilio?: string
  ext_natural: boolean
  ext_interpol: boolean
  // Servicio
  tipo_velatorio: TipoVelatorio
  destino: Destino
  cementerio?: string
  sala?: string
  sera_velado: boolean
  registro_civil: boolean
  // Responsable
  resp_nombre: string
  resp_apellido: string
  resp_documento: string
  resp_parentesco: Parentesco
  resp_telefono?: string
  resp_celular?: string
  resp_nacimiento?: string
  resp_nacionalidad: string
  resp_estado_civil: EstadoCivil
  resp_domicilio?: string
  resp_email?: string
  // Componentes
  ataud_nro?: string
  tiene_urna: boolean
  tiene_mortaja: boolean
  tiene_metalica: boolean
  tiene_azafata: boolean
  tiene_cafeteria: boolean
  tiene_tanatoest: boolean
  tiene_tanatoprax: boolean
  tiene_responso: boolean
  tiene_ambulancia: boolean
  // Valores
  val_total?: number
  val_urna?: number
  val_impuestos?: number
  val_total_impuestos?: number
  val_abonado?: number
  val_saldo?: number
  // Logística
  log_ambulancia1?: string
  log_ambulancia2?: string
  log_fecha_funebre?: string
  log_hora_funebre?: string
  log_fecha_crematorio?: string
  log_hora_crematorio?: string
  log_observaciones?: string
}

export interface PagoServicio {
  id: string
  created_at?: string
  servicio_id: string
  fecha: string
  monto: number
  medio: MedioPago
  nota?: string
}

export interface StockItem {
  id: string
  created_at?: string
  categoria: CategoriaStock
  descripcion: string
  codigo: string
  cantidad: number
  minimo: number
  proveedor?: string
  precio_unitario?: number
}

export interface MovimientoStock {
  id: string
  created_at?: string
  stock_id: string
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE'
  cantidad: number
  motivo?: string
  servicio_id?: string
  usuario?: string
}

export interface Sala {
  id: string
  nombre: string
  capacidad?: number
  activa: boolean
}

export interface Vehiculo {
  id: string
  nombre: string
  patente?: string
  tipo: 'AMBULANCIA' | 'FÚNEBRE' | 'OTRO'
  activo: boolean
}

export interface Contacto {
  id: string
  created_at?: string
  tipo: 'RESPONSABLE' | 'OBRA_SOCIAL' | 'CREMATORIO' | 'CEMENTERIO' | 'PROVEEDOR'
  nombre: string
  apellido?: string
  razon_social?: string
  telefono?: string
  celular?: string
  email?: string
  direccion?: string
  localidad?: string
  notas?: string
  codigo_os?: string
}

export interface Profile {
  id: string
  email: string
  nombre: string
  apellido: string
  role: UserRole
  activo: boolean
}

// ── FINANZAS ─────────────────────────────────────────────────────────────────

export type TipoEgreso = 
  | 'STOCK'           // Compra de ataúdes, urnas, mortajas
  | 'CREMATORIO'      // Servicio de crematorio tercerizado
  | 'COMBUSTIBLE'     // Combustible vehículos
  | 'MANTENIMIENTO'   // Mantenimiento vehículos/local
  | 'PERSONAL'        // Sueldos, jornales, honorarios
  | 'ALQUILER'        // Alquiler sede/salas
  | 'SERVICIOS'       // Luz, gas, teléfono, internet
  | 'SEGUROS'         // Seguros vehículos/local
  | 'SUBCONTRATADO'   // Tanatopraxia, responso, azafata externos
  | 'IMPUESTOS'       // IIBB, sellos, municipales
  | 'BANCARIO'        // Comisiones, transferencias
  | 'OTRO'

export type EstadoCobro = 'PENDIENTE' | 'PRESENTADO' | 'COBRADO' | 'INCOBRABLE'

export interface Egreso {
  id: string
  created_at?: string
  fecha: string
  tipo: TipoEgreso
  descripcion: string
  proveedor?: string
  monto: number
  comprobante?: string
  servicio_id?: string  // Si está asociado a un servicio
  stock_id?: string     // Si es compra de stock
  notas?: string
}

export interface CobranzaOS {
  id: string
  created_at?: string
  servicio_id: string
  obra_social: string
  codigo_prestacion?: string
  arancel: number           // Lo que paga la OS
  monto_presentado: number  // Lo que se presentó
  fecha_presentacion?: string
  fecha_cobro_estimada?: string
  fecha_cobro_real?: string
  estado: EstadoCobro
  diferencia?: number       // arancel - costo real (margen OS)
  notas?: string
}

export interface GastoFijo {
  id: string
  nombre: string
  tipo: TipoEgreso
  monto_mensual: number
  activo: boolean
  notas?: string
}

export interface ResumenFinanciero {
  mes: string
  facturado: number
  cobrado: number
  pendiente_familias: number
  pendiente_os: number
  egresos: number
  resultado: number
  cantidad_servicios: number
}

// ── EMPLEADOS ────────────────────────────────────────────────────────────────
export type RolEmpleado = 'ASESOR' | 'CHOFER' | 'VELADOR' | 'ADMINISTRATIVO' | 'GERENCIA' | 'OTRO'
export type EstadoEmpleado = 'ACTIVO' | 'INACTIVO' | 'LICENCIA'

export interface Empleado {
  id: string
  created_at?: string
  // Datos personales
  nombre: string
  apellido: string
  documento: string
  fecha_nacimiento?: string
  nacionalidad: string
  estado_civil?: string
  domicilio?: string
  localidad?: string
  // Contacto
  telefono?: string
  celular?: string
  email?: string
  contacto_emergencia_nombre?: string
  contacto_emergencia_tel?: string
  // Laboral
  rol: RolEmpleado
  estado: EstadoEmpleado
  fecha_ingreso?: string
  legajo?: string
  notas?: string
}

// ── COSTOS POR SERVICIO ──────────────────────────────────────────────────────
export interface CostoServicio {
  id: string
  created_at?: string
  // Identificación
  nro_servicio?: string
  nro_mes?: number
  fecha: string
  fallecido?: string          // nombre libre para histórico
  tipo?: string               // campo TIPO del Excel
  servicio_id?: string        // FK a servicios si existe
  // Costos
  costo_ataud?: number
  costo_comedor?: number
  costo_azafata?: number
  costo_cafeteria?: number
  costo_tanatopraxia?: number
  costo_ambulancia?: number
  costo_mat_calle?: number
  costo_sellado?: number
  costo_soldado?: number
  costo_labor?: number
  costo_sueldos?: number
  costo_mortaja?: number
  costo_urna?: number
  costo_cementerio?: number
  costo_administrativo?: number
  iva_ganado?: number
  propina?: number
  // Totales
  costo_total?: number
  nro_facturacion?: string
  facturacion?: number
  valor_servicio?: number
  margen?: number
  margen_pct?: number
  notas?: string
}
