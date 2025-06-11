// Tipos de eventos que podemos registrar
export type EventType = 
  | 'auth.login'
  | 'auth.logout'
  | 'auth.signup'
  | 'map.view'
  | 'map.compare'
  | 'map.filter'
  | 'area.select'
  | 'area.compare'
  | 'indicator.view'
  | 'indicator.compare'
  | 'profile.update'
  | 'error.occurred';

// Interfaz base para todos los eventos
export interface BaseEvent {
  user_id: string;
  event_type: EventType;
  event_details?: Record<string, any>;
}

// Interfaces específicas para cada tipo de evento
export interface AuthEvent extends BaseEvent {
  event_type: 'auth.login' | 'auth.logout' | 'auth.signup';
  event_details?: {
    method?: 'email' | 'google' | 'github';
    success?: boolean;
    error?: string;
  };
}

export interface MapEvent extends BaseEvent {
  event_type: 'map.view' | 'map.compare' | 'map.filter';
  event_details?: {
    city?: string;
    district?: string;
    neighborhood?: string;
    filters?: Record<string, any>;
    comparison_type?: string;
  };
}

export interface AreaEvent extends BaseEvent {
  event_type: 'area.select' | 'area.compare';
  event_details?: {
    area_id?: string;
    area_name?: string;
    comparison_type?: string;
    indicators?: string[];
  };
}

export interface IndicatorEvent extends BaseEvent {
  event_type: 'indicator.view' | 'indicator.compare';
  event_details?: {
    indicator_id?: string;
    indicator_name?: string;
    value?: number;
    comparison_type?: string;
  };
}

export interface ProfileEvent extends BaseEvent {
  event_type: 'profile.update';
  event_details?: {
    updated_fields?: string[];
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
  };
}

export interface ErrorEvent extends BaseEvent {
  event_type: 'error.occurred';
  event_details: {
    error_type: string;
    error_message: string;
    component?: string;
    stack_trace?: string;
  };
} 