import axios, { AxiosInstance } from 'axios';
import type { AuthResponse, ApiResponse, DashboardStats, ChartData, KasTransaction } from '@/types';

// API Base URL - change this to your backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
if (!process.env.NEXT_PUBLIC_API_URL) {
    console.warn('[Warning] NEXT_PUBLIC_API_URL is not set. Using default:', API_BASE_URL);
}

class ApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add user info to requests for role-based access control
        this.api.interceptors.request.use((config) => {
            if (typeof window !== 'undefined') {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    config.headers['x-user-info'] = userStr;
                }
            }
            return config;
        });
    }

    // Auth
    async login(username: string, password: string): Promise<AuthResponse> {
        try {
            const { data } = await this.api.post<AuthResponse>('/auth/login', {
                username,
                password,
            });
            return data;
        } catch (error: any) {
            console.error('Login request failed:', error?.message || error);
            if (error?.config) {
                console.error('Request config:', error.config);
            }
            throw error;
        }
    }

    async logout(): Promise<void> {
        await this.api.post('/auth/logout');
    }

    async register(data: {
        username: string;
        password: string;
        full_name: string;
        no_hp?: string;
    }): Promise<ApiResponse<null>> {
        const { data: response } = await this.api.post('/auth/register', data);
        return response;
    }

    // Admin Reset Password
    async resetPassword(userId: number, newPassword: string): Promise<ApiResponse<null>> {
        const { data } = await this.api.post('/auth/reset-password', { userId, newPassword });
        return data;
    }

    // Dashboard
    async getDashboardStats(rw?: string): Promise<ApiResponse<{
        stats: DashboardStats;
        chart: ChartData[];
    }>> {
        const { data } = await this.api.get('/dashboard/stats', {
            params: { rw },
        });
        return data;
    }

    // Kas Masjid
    async getKasTransactions(params?: {
        start_date?: string;
        end_date?: string;
        type?: 'masuk' | 'keluar';
    }): Promise<ApiResponse<{
        data: KasTransaction[];
        summary: {
            total_masuk: number;
            total_keluar: number;
            saldo: number;
        };
    }>> {
        const { data } = await this.api.get('/kas', { params });
        return data;
    }

    async createKasTransaction(transaction: {
        type: 'masuk' | 'keluar';
        amount: number;
        description: string;
        category?: string;
        tanggal: string;
    }): Promise<ApiResponse<null>> {
        const { data } = await this.api.post('/kas', transaction);
        return data;
    }

    async deleteKasTransaction(id: number): Promise<ApiResponse<null>> {
        const { data } = await this.api.delete(`/kas/${id}`);
        return data;
    }

    async updateKasTransaction(id: number, transaction: {
        type: 'masuk' | 'keluar';
        amount: number;
        description: string;
        category?: string;
        tanggal: string;
    }): Promise<ApiResponse<null>> {
        const { data } = await this.api.put(`/kas/${id}`, transaction);
        return data;
    }

    // Family Management
    async getFamilies(rt?: string): Promise<ApiResponse<import('@/types').Family[]>> {
        const { data } = await this.api.get('/families', {
            params: { rt }
        });
        return data;
    }

    async getFamily(id: number): Promise<ApiResponse<{
        family: import('@/types').Family;
        members: import('@/types').FamilyMember[];
    }>> {
        const { data } = await this.api.get(`/families/${id}`);
        return data;
    }

    async getFamilyMembers(id: number): Promise<ApiResponse<import('@/types').FamilyMember[]>> {
        const { data } = await this.api.get(`/families/${id}/members`);
        return data;
    }

    async createFamily(family: {
        no_kk: string;
        kepala_keluarga: string;
        rt: string;
        alamat?: string;
        no_hp?: string;
        nik_kepala: string;
        jenis_kelamin_kepala: string;
        tanggal_lahir_kepala?: string;
    }): Promise<ApiResponse<{ id: number }>> {
        const { data } = await this.api.post('/families', family);
        return data;
    }

    async updateFamily(id: number, family: {
        no_kk: string;
        kepala_keluarga: string;
        rt: string;
        alamat?: string;
        no_hp?: string;
    }): Promise<ApiResponse<null>> {
        const { data } = await this.api.put(`/families/${id}`, family);
        return data;
    }

    async deleteFamily(id: number): Promise<ApiResponse<null>> {
        const { data } = await this.api.delete(`/families/${id}`);
        return data;
    }

    async addFamilyMember(familyId: number, member: {
        nik: string;
        nama: string;
        hubungan: string;
        jenis_kelamin: string;
        tanggal_lahir?: string;
    }): Promise<ApiResponse<null>> {
        const { data } = await this.api.post(`/families/${familyId}/members`, member);
        return data;
    }

    async updateFamilyMember(familyId: number, memberId: number, member: {
        nik: string;
        nama: string;
        hubungan: string;
        jenis_kelamin: string;
        tanggal_lahir?: string;
    }): Promise<ApiResponse<null>> {
        const { data } = await this.api.put(`/families/${familyId}/members/${memberId}`, member);
        return data;
    }

    async deleteFamilyMember(familyId: number, memberId: number): Promise<ApiResponse<null>> {
        const { data } = await this.api.delete(`/families/${familyId}/members/${memberId}`);
        return data;
    }

    // Info Publik Management
    async getInfoPublik(): Promise<ApiResponse<import('@/types').InfoPublik[]>> {
        const { data } = await this.api.get('/info');
        return data;
    }

    async createInfoPublik(info: {
        title: string;
        content: string;
        category: string;
        tanggal: string;
    }): Promise<ApiResponse<null>> {
        const { data } = await this.api.post('/info', info);
        return data;
    }

    async updateInfoPublik(id: number, info: {
        title: string;
        content: string;
        category: string;
        tanggal: string;
    }): Promise<ApiResponse<null>> {
        const { data } = await this.api.put(`/info/${id}`, info);
        return data;
    }

    async deleteInfoPublik(id: number): Promise<ApiResponse<null>> {
        const { data } = await this.api.delete(`/info/${id}`);
        return data;
    }

    // User Management (Admin only)
    async getUsers(): Promise<ApiResponse<any[]>> {
        const { data } = await this.api.get('/users');
        return data;
    }

    async createUser(user: {
        username: string;
        password: string;
        full_name: string;
        role: 'admin' | 'jamaah';
        rt?: string;
    }): Promise<ApiResponse<null>> {
        const { data } = await this.api.post('/users', user);
        return data;
    }

    async deleteUser(id: number): Promise<ApiResponse<null>> {
        const { data } = await this.api.delete(`/users/${id}`);
        return data;
    }

    // Audit Logs (Admin only)
    async getAuditLogs(): Promise<ApiResponse<any[]>> {
        const { data } = await this.api.get('/audit');
        return data;
    }

    // Penduduk Khusus Management
    async getPendudukKhusus(label?: string): Promise<ApiResponse<{
        data: import('@/types').PendudukKhusus[];
        total: number;
        labelCounts: {
            kontrak: number;
            pedagang: number;
            warga_dusun_lain: number;
        };
    }>> {
        const { data } = await this.api.get('/penduduk-khusus', { params: { label } });
        return data;
    }

    async createPendudukKhusus(penduduk: {
        nik: string;
        nama: string;
        jenis_kelamin: string;
        alamat?: string;
        no_hp?: string;
        label: 'kontrak' | 'pedagang' | 'warga_dusun_lain';
        keterangan?: string;
    }): Promise<ApiResponse<{ id: number }>> {
        const { data } = await this.api.post('/penduduk-khusus', penduduk);
        return data;
    }

    async updatePendudukKhusus(id: number, penduduk: {
        nik: string;
        nama: string;
        jenis_kelamin: string;
        alamat?: string;
        no_hp?: string;
        label: 'kontrak' | 'pedagang' | 'warga_dusun_lain';
        keterangan?: string;
    }): Promise<ApiResponse<null>> {
        const { data } = await this.api.put(`/penduduk-khusus/${id}`, penduduk);
        return data;
    }

    async deletePendudukKhusus(id: number): Promise<ApiResponse<null>> {
        const { data } = await this.api.delete(`/penduduk-khusus/${id}`);
        return data;
    }

    // Event Management
    async getEvents(status?: 'aktif' | 'selesai'): Promise<ApiResponse<import('@/types').Event[]>> {
        const { data } = await this.api.get('/events', { params: { status } });
        return data;
    }

    async getEvent(id: number): Promise<ApiResponse<{
        event: import('@/types').Event;
        transactions: import('@/types').EventTransaction[];
        summary: {
            total_masuk: number;
            total_keluar: number;
            saldo: number;
        };
    }>> {
        const { data } = await this.api.get(`/events/${id}`);
        return data;
    }

    async createEvent(event: {
        nama: string;
        deskripsi?: string;
        tipe: 'penggalangan_dana' | 'distribusi';
        tanggal_mulai: string;
    }): Promise<ApiResponse<{ id: number }>> {
        const { data } = await this.api.post('/events', event);
        return data;
    }

    async updateEvent(id: number, event: {
        nama: string;
        deskripsi?: string;
        tipe: 'penggalangan_dana' | 'distribusi';
        tanggal_mulai: string;
    }): Promise<ApiResponse<null>> {
        const { data } = await this.api.put(`/events/${id}`, event);
        return data;
    }

    async deleteEvent(id: number): Promise<ApiResponse<null>> {
        const { data } = await this.api.delete(`/events/${id}`);
        return data;
    }

    async completeEvent(id: number): Promise<ApiResponse<{ transferred_amount: number }>> {
        const { data } = await this.api.post(`/events/${id}/complete`);
        return data;
    }

    async createEventTransaction(eventId: number, transaction: {
        type: 'masuk' | 'keluar';
        amount: number;
        description: string;
        tanggal: string;
    }): Promise<ApiResponse<{ id: number }>> {
        const { data } = await this.api.post(`/events/${eventId}/transactions`, transaction);
        return data;
    }

    async updateEventTransaction(eventId: number, transId: number, transaction: {
        type: 'masuk' | 'keluar';
        amount: number;
        description: string;
        tanggal: string;
    }): Promise<ApiResponse<null>> {
        const { data } = await this.api.put(`/events/${eventId}/transactions/${transId}`, transaction);
        return data;
    }

    async deleteEventTransaction(eventId: number, transId: number): Promise<ApiResponse<null>> {
        const { data } = await this.api.delete(`/events/${eventId}/transactions/${transId}`);
        return data;
    }

    // Event Recipients Management
    async getEventRecipients(eventId: number): Promise<ApiResponse<{
        data: import('@/types').EventRecipient[];
        total: number;
    }>> {
        const { data } = await this.api.get(`/events/${eventId}/recipients`);
        return data;
    }

    async createEventRecipient(eventId: number, recipient: {
        nama: string;
        alamat?: string;
        no_hp?: string;
        jenis_bantuan?: string;
        jumlah?: string;
        keterangan?: string;
    }): Promise<ApiResponse<{ id: number }>> {
        const { data } = await this.api.post(`/events/${eventId}/recipients`, recipient);
        return data;
    }

    async updateEventRecipient(eventId: number, recipientId: number, recipient: {
        nama: string;
        alamat?: string;
        no_hp?: string;
        jenis_bantuan?: string;
        jumlah?: string;
        keterangan?: string;
    }): Promise<ApiResponse<null>> {
        const { data } = await this.api.put(`/events/${eventId}/recipients/${recipientId}`, recipient);
        return data;
    }

    async deleteEventRecipient(eventId: number, recipientId: number): Promise<ApiResponse<null>> {
        const { data } = await this.api.delete(`/events/${eventId}/recipients/${recipientId}`);
        return data;
    }

    // Event Panitia Management
    async getEventPanitia(eventId: number): Promise<ApiResponse<import('@/types').EventPanitia[]>> {
        const { data } = await this.api.get(`/events/${eventId}/panitia`);
        return data;
    }

    async createEventPanitia(eventId: number, panitia: {
        source_type?: 'penduduk_tetap' | 'penduduk_khusus' | 'manual';
        source_id?: number;
        nama: string;
        role: string;
        no_hp?: string;
    }): Promise<ApiResponse<{ id: number }>> {
        const { data } = await this.api.post(`/events/${eventId}/panitia`, panitia);
        return data;
    }

    async updateEventPanitia(eventId: number, panitiaId: number, panitia: {
        nama: string;
        role: string;
        no_hp?: string;
    }): Promise<ApiResponse<null>> {
        const { data } = await this.api.put(`/events/${eventId}/panitia/${panitiaId}`, panitia);
        return data;
    }

    async deleteEventPanitia(eventId: number, panitiaId: number): Promise<ApiResponse<null>> {
        const { data } = await this.api.delete(`/events/${eventId}/panitia/${panitiaId}`);
        return data;
    }

    // Penduduk Search (for panitia selector)
    async searchPenduduk(query: string): Promise<ApiResponse<import('@/types').PendudukSearchResult[]>> {
        const { data } = await this.api.get('/penduduk/search', { params: { q: query } });
        return data;
    }
}

export const apiService = new ApiService();


