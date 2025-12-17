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
}

export const apiService = new ApiService();
