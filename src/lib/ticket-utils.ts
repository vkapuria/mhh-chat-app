/**
 * Format ticket ID as TKT-XXXXXXXX (first 8 chars of UUID)
 */
export function formatTicketNumber(ticketId: string): string {
    return `TKT-${ticketId.substring(0, 8).toUpperCase()}`;
  }
  
  /**
   * Extract UUID from ticket number (TKT-XXXXXXXX -> full UUID)
   * Note: This returns the short form. For database queries, use the full UUID.
   */
  export function parseTicketNumber(ticketNumber: string): string {
    return ticketNumber.replace('TKT-', '').toLowerCase();
  }