import axiosInstance from '@/lib/axios';
import type {
  Ticket,
  CreateTicketPayload,
  TicketStats,
  TicketStatus,
  PaginatedTickets,
} from '@/types/ticket';

export const ticketService = {
  async create(payload: CreateTicketPayload): Promise<Ticket> {
    return axiosInstance.post('/tickets', payload);
  },

  async list(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    category?: string;
  }): Promise<PaginatedTickets> {
    return axiosInstance.get('/tickets', { params });
  },

  async getById(id: string): Promise<Ticket> {
    return axiosInstance.get(`/tickets/${id}`);
  },

  async updateStatus(id: string, status: TicketStatus): Promise<Ticket> {
    return axiosInstance.put(`/tickets/${id}/status`, { status });
  },

  async addComment(id: string, author: string, content: string): Promise<Ticket> {
    return axiosInstance.post(`/tickets/${id}/comments`, { author, content });
  },

  async getStats(): Promise<TicketStats> {
    return axiosInstance.get('/tickets/stats');
  },
};
