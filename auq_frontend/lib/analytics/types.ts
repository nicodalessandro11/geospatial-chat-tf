export type BaseEvent = {
  user_id: string
  event_type: string
  event_details: Record<string, unknown>
}

export type UserEvent = {
  id: string
  user_id: string
  event_type: string
  event_details: Record<string, unknown>
  created_at: string
}

export type EventType = 
  | 'map.view'
  | 'area.select'
  | 'map.filter'
  | 'error.occurred'
  | 'user.login'
  | 'user.logout'
  | 'feature.toggle'
  | 'indicator.toggle' 