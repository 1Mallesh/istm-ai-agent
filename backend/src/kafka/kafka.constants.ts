export const KAFKA_TOPICS = {
  EMPLOYEE_CREATED: 'employee.created',
  EMPLOYEE_UPDATED: 'employee.updated',
  EMPLOYEE_ROLE_UPDATED: 'employee.role.updated',
  EMPLOYEE_DELETED: 'employee.deleted',
  SYSTEM_ISSUE_DETECTED: 'system.issue.detected',
  PROVISIONING_STARTED: 'provisioning.started',
  PROVISIONING_COMPLETED: 'provisioning.completed',
  PROVISIONING_FAILED: 'provisioning.failed',
  TICKET_CREATED: 'ticket.created',
  TICKET_UPDATED: 'ticket.updated',
  ONBOARDING_COMPLETED: 'onboarding.completed',
  OFFBOARDING_COMPLETED: 'offboarding.completed',
} as const;

export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];
